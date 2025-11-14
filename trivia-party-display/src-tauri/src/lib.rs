// Monitor commands only available on desktop platforms
#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
fn get_available_monitors(window: tauri::Window) -> Result<Vec<MonitorInfo>, String> {
    let monitors = window
        .available_monitors()
        .map_err(|e| e.to_string())?;

    Ok(monitors
        .into_iter()
        .enumerate()
        .map(|(idx, m)| MonitorInfo {
            name: m.name().map(|s| s.to_string()).unwrap_or_else(|| format!("Display {}", idx + 1)),
            width: m.size().width,
            height: m.size().height,
        })
        .collect())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
fn move_to_monitor(window: tauri::Window, monitor_name: String) -> Result<(), String> {
    let monitors = window
        .available_monitors()
        .map_err(|e| e.to_string())?;

    let target_monitor = monitors
        .into_iter()
        .find(|m| m.name().map(|s| s.as_str()) == Some(monitor_name.as_str()))
        .ok_or_else(|| "Monitor not found".to_string())?;

    let position = target_monitor.position();
    window
        .set_position(tauri::PhysicalPosition::new(position.x, position.y))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[derive(serde::Serialize)]
struct MonitorInfo {
    name: String,
    width: u32,
    height: u32,
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
fn setup_desktop_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
  use tauri::menu::{Menu, MenuItem, Submenu};

  // Create menu
  let quit = MenuItem::with_id(
    app,
    "quit",
    "Quit",
    true,
    Some("CmdOrCtrl+Q"),
  )?;

  let file_menu = Submenu::with_items(
    app,
    "File",
    true,
    &[&quit],
  )?;

  let toggle_fullscreen = MenuItem::with_id(
    app,
    "toggle_fullscreen",
    "Toggle Fullscreen",
    true,
    Some("CmdOrCtrl+F"),
  )?;

  // Get available monitors and create menu items for each
  let window = app.get_webview_window("main").expect("main window not found");
  let monitors = window.available_monitors().unwrap_or_default();

  let mut display_items: Vec<Box<dyn tauri::menu::IsMenuItem<tauri::Wry>>> = Vec::new();
  for (idx, monitor) in monitors.iter().enumerate() {
    let display_name = monitor.name()
      .map(|s| s.to_string())
      .unwrap_or_else(|| format!("Display {}", idx + 1));
    let display_id = format!("display_{}", idx);
    let menu_item = MenuItem::with_id(
      app,
      &display_id,
      &format!("{} ({}x{})", display_name, monitor.size().width, monitor.size().height),
      true,
      None::<&str>,
    )?;
    display_items.push(Box::new(menu_item));
  }

  let display_refs: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = display_items
    .iter()
    .map(|item| item.as_ref() as &dyn tauri::menu::IsMenuItem<tauri::Wry>)
    .collect();

  let move_to_display = if !display_refs.is_empty() {
    Some(Submenu::with_items(
      app,
      "Move to Display",
      true,
      &display_refs,
    )?)
  } else {
    None
  };

  let mut view_items: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> = vec![&toggle_fullscreen];
  if let Some(ref submenu) = move_to_display {
    view_items.push(submenu);
  }

  let view_menu = Submenu::with_items(
    app,
    "View",
    true,
    &view_items,
  )?;

  let menu = Menu::with_items(app, &[&file_menu, &view_menu])?;

  // Set menu for all windows
  app.set_menu(menu)?;

  // Handle menu events
  let monitors_clone = monitors.clone();
  app.on_menu_event(move |app, event| {
    if event.id() == "quit" {
      app.exit(0);
    } else if event.id() == "toggle_fullscreen" {
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.is_fullscreen().and_then(|is_fs| {
          window.set_fullscreen(!is_fs)
        });
      }
    } else if event.id().as_ref().starts_with("display_") {
      if let Some(window) = app.get_webview_window("main") {
        if let Some(idx_str) = event.id().as_ref().strip_prefix("display_") {
          if let Ok(idx) = idx_str.parse::<usize>() {
            if let Some(monitor) = monitors_clone.get(idx) {
              // Get monitor dimensions
              let monitor_pos = monitor.position();
              let monitor_size = monitor.size();

              // Get window size
              if let Ok(window_size) = window.outer_size() {
                // Center the window on the target monitor
                let x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
                let y = monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;

                let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
              }
            }
          }
        }
      }
    }
  });

  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let mut builder = tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init());

  // Register monitor commands only on desktop platforms
  #[cfg(not(any(target_os = "android", target_os = "ios")))]
  {
    builder = builder.invoke_handler(tauri::generate_handler![get_available_monitors, move_to_monitor]);
  }

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Desktop platforms: Create native menu bar
      // Android/iOS: Skip menu (no native menu bar on mobile)
      #[cfg(not(any(target_os = "android", target_os = "ios")))]
      {
        setup_desktop_menu(app)?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
