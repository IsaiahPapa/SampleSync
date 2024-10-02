use std::fs;
use tauri::command;

#[command]
pub fn is_dir(path: String) -> Result<bool, String> {
    if let Ok(metadata) = fs::metadata(&path) {
        Ok(metadata.is_dir())
    } else {
        Err("Failed to get metadata".to_string())
    }
}