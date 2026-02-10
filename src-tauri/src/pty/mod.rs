pub mod scraper;
pub mod session;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use scraper::TokenScraper;
use session::PtySession;

#[derive(Clone)]
pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
    scraper: Arc<TokenScraper>,
}

impl PtyManager {
    pub fn new(db_path: PathBuf) -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            scraper: Arc::new(TokenScraper::new(db_path)),
        }
    }

    pub fn sessions(&self) -> Arc<Mutex<HashMap<String, PtySession>>> {
        Arc::clone(&self.sessions)
    }

    pub fn scraper(&self) -> Arc<TokenScraper> {
        Arc::clone(&self.scraper)
    }
}
