use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::Mutex;
use tauri::{Manager, State};

#[derive(serde::Deserialize, Clone)]
struct MusicPayload {
    title: String,
    artist: String,
    image_url: String,
    total_time_length_in_seconds: i64,
    current_time_in_seconds: i64,
}

struct DiscordState {
    client: Mutex<Option<DiscordIpcClient>>,
}

#[tauri::command]
fn update_music_data(state: State<'_, DiscordState>, data: MusicPayload) {
    let mut client_guard = state.client.lock().unwrap();

    if client_guard.is_none() {
        let mut client = DiscordIpcClient::new("1437232956065190095");

        match client.connect() {
            Ok(_) => {
                println!("Connected to discord");
                *client_guard = Some(client);
            },
            Err(e) => {
                println!("Error connecting to discord: {}", e);
                return;
            }
        }
    }

    if let Some(client) = client_guard.as_mut() {
        let details = format!("{}", data.artist);
        let state_text = format!("{}", data.title);
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        let start_timestamp = now - data.current_time_in_seconds;
        let end_timestamp = start_timestamp + data.total_time_length_in_seconds;

        let payload = activity::Activity::new()
            .details(&details)
            .state(&state_text)
            .assets(activity::Assets::new()
                .large_image(&*data.image_url)
                .large_text("YouTube Music"))
            .timestamps(activity::Timestamps::new()
                .start(start_timestamp)
                .end(end_timestamp))
            .activity_type(activity::ActivityType::Listening)
            .status_display_type(activity::StatusDisplayType::Details);

        if let Err(e) = client.set_activity(payload) {
            println!("Error uploading to discord: {}", e);
            *client_guard = None;
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DiscordState { client: Mutex::new(None) })
        .invoke_handler(tauri::generate_handler![update_music_data])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(debug_assertions)]
            let script = {
                use std::fs;
                use std::path::PathBuf;
                let path = PathBuf::from("src/script.js");
                fs::read_to_string(path).unwrap_or_default()
            };

            #[cfg(not(debug_assertions))]
            let script = include_str!("script.js");

            window.eval(&script).unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
