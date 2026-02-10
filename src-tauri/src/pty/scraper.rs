use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use once_cell::sync::Lazy;
use regex::Regex;
use rusqlite::{params, Connection};

static COST_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Total cost:\s*\$(\d+\.\d{2})").expect("valid COST_RE"));
static TOKENS_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Total tokens:\s*([\d,]+)\s*\(in:\s*([\d.,KM]+),\s*out:\s*([\d.,KM]+)\)")
        .expect("valid TOKENS_RE")
});
static DURATION_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"Duration:\s*(?:(\d+)m)?\s*(\d+)s").expect("valid DURATION_RE"));

#[derive(Default, Clone)]
struct ParseState {
    cost_usd: Option<f64>,
    tokens_in: Option<i64>,
    tokens_out: Option<i64>,
    tokens_total: Option<i64>,
    duration_s: Option<i64>,
    raw_lines: Vec<String>,
}

#[derive(Default)]
pub struct TokenScraper {
    db_path: PathBuf,
    line_buffers: Mutex<HashMap<String, String>>,
    parse_states: Mutex<HashMap<String, ParseState>>,
}

impl TokenScraper {
    pub fn new(db_path: PathBuf) -> Self {
        Self {
            db_path,
            line_buffers: Mutex::new(HashMap::new()),
            parse_states: Mutex::new(HashMap::new()),
        }
    }

    pub fn ingest(&self, session_id: &str, data: &[u8]) -> usize {
        let stripped = strip_ansi_escapes::strip(data);
        let text = String::from_utf8_lossy(&stripped);

        let mut emitted_lines = Vec::<String>::new();

        {
            let mut buffers = match self.line_buffers.lock() {
                Ok(guard) => guard,
                Err(_) => return 0,
            };

            let buf = buffers.entry(session_id.to_string()).or_default();
            buf.push_str(&text);

            while let Some(pos) = buf.find('\n') {
                let line = buf[..pos].trim_end_matches('\r').to_string();
                emitted_lines.push(line);
                *buf = buf[pos + 1..].to_string();
            }
        }

        let mut inserts = 0;
        for line in emitted_lines {
            if self.parse_line(session_id, &line) {
                inserts += 1;
            }
        }

        inserts
    }

    fn parse_line(&self, session_id: &str, line: &str) -> bool {
        let mut states = match self.parse_states.lock() {
            Ok(guard) => guard,
            Err(_) => return false,
        };

        let state = states.entry(session_id.to_string()).or_default();

        if line.contains("Total cost:") || line.contains("Total tokens:") || line.contains("Duration:") {
            state.raw_lines.push(line.to_string());
        }

        if let Some(captures) = COST_RE.captures(line) {
            state.cost_usd = captures.get(1).and_then(|m| m.as_str().parse::<f64>().ok());
        }

        if let Some(captures) = TOKENS_RE.captures(line) {
            let tokens_total = captures
                .get(1)
                .and_then(|m| parse_int_with_commas(m.as_str()));
            let tokens_in = captures.get(2).and_then(|m| parse_compact_int(m.as_str()));
            let tokens_out = captures.get(3).and_then(|m| parse_compact_int(m.as_str()));

            state.tokens_total = tokens_total;
            state.tokens_in = tokens_in;
            state.tokens_out = tokens_out;
        }

        if let Some(captures) = DURATION_RE.captures(line) {
            let mins = captures
                .get(1)
                .and_then(|m| m.as_str().parse::<i64>().ok())
                .unwrap_or(0);
            let secs = captures
                .get(2)
                .and_then(|m| m.as_str().parse::<i64>().ok())
                .unwrap_or(0);
            state.duration_s = Some(mins * 60 + secs);
        }

        let is_complete = state.cost_usd.is_some()
            && state.tokens_total.is_some()
            && state.tokens_in.is_some()
            && state.tokens_out.is_some()
            && (state.duration_s.is_some() || line.trim().is_empty());

        if is_complete {
            let raw = state.raw_lines.join("\n");
            let persisted = self.persist_usage(
                session_id,
                state.cost_usd.unwrap_or_default(),
                state.tokens_in.unwrap_or_default(),
                state.tokens_out.unwrap_or_default(),
                state.tokens_total.unwrap_or_default(),
                state.duration_s,
                &raw,
            );

            *state = ParseState::default();

            return persisted.is_ok();
        }

        false
    }

    fn persist_usage(
        &self,
        session_id: &str,
        cost_usd: f64,
        tokens_in: i64,
        tokens_out: i64,
        tokens_total: i64,
        duration_s: Option<i64>,
        raw_output: &str,
    ) -> Result<(), String> {
        let conn = Connection::open(&self.db_path)
            .map_err(|err| format!("failed to open db for scraper insert: {err}"))?;

        conn.execute(
            "INSERT INTO token_usage (session_id, agent, cost_usd, tokens_in, tokens_out, tokens_total, duration_s, raw_output) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                session_id,
                "claude-code",
                cost_usd,
                tokens_in,
                tokens_out,
                tokens_total,
                duration_s,
                raw_output,
            ],
        )
        .map_err(|err| format!("failed to insert token usage: {err}"))?;

        Ok(())
    }
}

fn parse_int_with_commas(input: &str) -> Option<i64> {
    input.replace(',', "").parse::<i64>().ok()
}

fn parse_compact_int(input: &str) -> Option<i64> {
    let normalized = input.replace(',', "").trim().to_ascii_uppercase();

    if let Some(number) = normalized.strip_suffix('K') {
        let parsed = number.parse::<f64>().ok()?;
        return Some((parsed * 1_000.0).round() as i64);
    }

    if let Some(number) = normalized.strip_suffix('M') {
        let parsed = number.parse::<f64>().ok()?;
        return Some((parsed * 1_000_000.0).round() as i64);
    }

    normalized.parse::<i64>().ok()
}
