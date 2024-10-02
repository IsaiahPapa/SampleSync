use tauri::Manager;
use tauri::{AppHandle, Wry};
use notify::RecursiveMode;
use notify_debouncer_mini::new_debouncer;
use std::sync::mpsc::channel;
use std::time::Duration;
use std::thread;
use std::path::Path;

#[tauri::command]
pub fn start_watcher(app_handle: AppHandle<Wry>, path: String) {
    thread::spawn(move || {
        let (tx, rx) = channel();

        // Set up the debouncer with a 1-second debounce time
        let mut debouncer = new_debouncer(Duration::from_secs(1), tx).unwrap();
        debouncer.watcher().watch(Path::new(&path), RecursiveMode::Recursive).unwrap();

        // Listen for file system events
        for result in rx {
            match result {
                Ok(events) => {
                    for event in events {
                        println!("{:?}", event);
                        app_handle.emit_all("directory-changed", {}).unwrap();
                    }
                }
                Err(error) => {
                    println!("{:?}", error);
                }
            }
        }
    });
}