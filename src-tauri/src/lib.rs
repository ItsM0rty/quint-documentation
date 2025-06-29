use std::path::Path;
use std::fs;
use walkdir::WalkDir;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![get_folder_files])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn get_folder_files(folder_path: String) -> Result<Vec<String>, String> {
  let path = Path::new(&folder_path);
  
  if !path.exists() {
    return Err("Folder does not exist".to_string());
  }
  
  if !path.is_dir() {
    return Err("Path is not a directory".to_string());
  }
  
  let mut files = Vec::new();
  
  for entry in WalkDir::new(path)
    .into_iter()
    .filter_map(|e| e.ok())
    .filter(|e| e.file_type().is_file())
  {
    if let Some(path_str) = entry.path().to_str() {
      files.push(path_str.to_string());
    }
  }
  
  Ok(files)
}
