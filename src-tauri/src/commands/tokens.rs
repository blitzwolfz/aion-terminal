use rusqlite::{params, params_from_iter, types::Value, Connection};
use serde::Serialize;
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct UsageRecord {
    pub id: i64,
    pub session_id: String,
    pub agent: String,
    pub cost_usd: f64,
    pub tokens_in: i64,
    pub tokens_out: i64,
    pub tokens_total: i64,
    pub duration_s: Option<i64>,
    pub captured_at: String,
    pub raw_output: String,
}

#[derive(Debug, Serialize)]
pub struct BudgetSummary {
    pub month: String,
    pub limit_usd: f64,
    pub spent_usd: f64,
    pub remaining_usd: f64,
    pub pct_used: f64,
}

#[tauri::command]
pub async fn query_usage(
    state: State<'_, AppState>,
    from: Option<String>,
    to: Option<String>,
    agent: Option<String>,
    session_id: Option<String>,
) -> Result<Vec<UsageRecord>, String> {
    let conn = open_conn(&state)?;

    let mut query = String::from(
        "SELECT id, session_id, agent, cost_usd, tokens_in, tokens_out, tokens_total, duration_s, captured_at, COALESCE(raw_output, '') FROM token_usage WHERE 1=1",
    );
    let mut params = Vec::<Value>::new();

    if let Some(from) = from {
        query.push_str(" AND captured_at >= ?");
        params.push(Value::Text(from));
    }

    if let Some(to) = to {
        query.push_str(" AND captured_at <= ?");
        params.push(Value::Text(to));
    }

    if let Some(agent) = agent {
        query.push_str(" AND agent = ?");
        params.push(Value::Text(agent));
    }

    if let Some(session_id) = session_id {
        query.push_str(" AND session_id = ?");
        params.push(Value::Text(session_id));
    }

    query.push_str(" ORDER BY captured_at DESC LIMIT 5000");

    let mut statement = conn
        .prepare(&query)
        .map_err(|err| format!("failed to prepare usage query: {err}"))?;

    let records = statement
        .query_map(params_from_iter(params.iter()), |row| {
            Ok(UsageRecord {
                id: row.get(0)?,
                session_id: row.get(1)?,
                agent: row.get(2)?,
                cost_usd: row.get(3)?,
                tokens_in: row.get(4)?,
                tokens_out: row.get(5)?,
                tokens_total: row.get(6)?,
                duration_s: row.get(7)?,
                captured_at: row.get(8)?,
                raw_output: row.get(9)?,
            })
        })
        .map_err(|err| format!("failed to execute usage query: {err}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| format!("failed to map usage rows: {err}"))?;

    Ok(records)
}

#[tauri::command]
pub async fn query_budget(state: State<'_, AppState>, month: String) -> Result<BudgetSummary, String> {
    let conn = open_conn(&state)?;

    let limit_usd = conn
        .query_row(
            "SELECT limit_usd FROM budgets WHERE month = ?1 ORDER BY created_at DESC LIMIT 1",
            params![month.clone()],
            |row| row.get::<_, f64>(0),
        )
        .unwrap_or(0.0);

    let spent_usd = conn
        .query_row(
            "SELECT COALESCE(SUM(cost_usd), 0) FROM token_usage WHERE strftime('%Y-%m', captured_at) = ?1",
            params![month.clone()],
            |row| row.get::<_, f64>(0),
        )
        .unwrap_or(0.0);

    let remaining_usd = (limit_usd - spent_usd).max(0.0);
    let pct_used = if limit_usd > 0.0 {
        (spent_usd / limit_usd) * 100.0
    } else {
        0.0
    };

    Ok(BudgetSummary {
        month,
        limit_usd,
        spent_usd,
        remaining_usd,
        pct_used,
    })
}

#[tauri::command]
pub async fn set_budget(state: State<'_, AppState>, month: String, limit_usd: f64) -> Result<(), String> {
    let conn = open_conn(&state)?;

    conn.execute(
        "INSERT INTO budgets (month, limit_usd) VALUES (?1, ?2)",
        params![month, limit_usd],
    )
    .map_err(|err| format!("failed to set budget: {err}"))?;

    Ok(())
}

fn open_conn(state: &State<'_, AppState>) -> Result<Connection, String> {
    Connection::open(state.db_path.as_ref()).map_err(|err| format!("failed to open db: {err}"))
}
