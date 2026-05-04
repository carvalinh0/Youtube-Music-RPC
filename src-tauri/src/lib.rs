use discord_rich_presence::{DiscordIpc, DiscordIpcClient, activity};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Manager, State};
use tiny_http::{Header, Response, Server};

#[derive(serde::Serialize, Clone, Default)]
struct MusicState {
    title: String,
    artist: String,
    image_url: String,
    total_time_length_in_seconds: i64,
    current_time_in_seconds: i64,
    is_playing: bool,

    discord_rpc_enabled: bool,

    #[serde(rename = "config")]
    overlay_config: OverlayConfig,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct OverlayConfig {
    #[serde(rename = "overlayBg", alias = "bg")]
    bg: String,
    #[serde(rename = "overlayAccent", alias = "accent")]
    accent: String,
    #[serde(rename = "overlayText", alias = "text")]
    text: String,
    #[serde(rename = "overlaySubtext", alias = "subtext")]
    subtext: String,
    port: u16,
}

impl Default for OverlayConfig {
    fn default() -> Self {
        Self {
            bg: "#0d0d14".into(),
            accent: "#6441a5".into(),
            text: "#ffffff".into(),
            subtext: "#9a9ab0".into(),
            port: 8765,
        }
    }
}

#[derive(serde::Deserialize, Clone)]
struct MusicPayload {
    title: String,
    artist: String,
    image_url: String,
    total_time_length_in_seconds: i64,
    current_time_in_seconds: i64,
    is_playing: bool,
    discord_rpc_enabled: bool,
    overlay_config: OverlayConfig,
}

struct AppState {
    discord: Mutex<Option<DiscordIpcClient>>,
    music: Arc<Mutex<MusicState>>,
    custom_widget: Arc<Mutex<Option<String>>>,
}

// Tauri commands

#[tauri::command]
fn update_music_data(state: State<'_, AppState>, data: MusicPayload) {
    {
        let mut music = state.music.lock().unwrap();
        music.title = data.title.clone();
        music.artist = data.artist.clone();
        music.image_url = data.image_url.clone();
        music.total_time_length_in_seconds = data.total_time_length_in_seconds;
        music.current_time_in_seconds = data.current_time_in_seconds;
        music.is_playing = data.is_playing;
        music.discord_rpc_enabled = data.discord_rpc_enabled;
        music.overlay_config = data.overlay_config.clone();
    }

    // Discord RPC
    let mut discord = state.discord.lock().unwrap();

    if !data.discord_rpc_enabled {
        if let Some(client) = discord.as_mut() {
            if let Err(e) = client.clear_activity() {
                println!(
                    "[discord] clear_activity error (reconnects on next enable): {}",
                    e
                );
                *discord = None;
            }
        }
        return;
    }

    if discord.is_none() {
        let mut client = DiscordIpcClient::new("1437232956065190095");
        match client.connect() {
            Ok(_) => {
                println!("[discord] Connected");
                *discord = Some(client);
            }
            Err(e) => {
                println!("[discord] Connection error: {}", e);
                return;
            }
        }
    }

    if let Some(client) = discord.as_mut() {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let start = now - data.current_time_in_seconds;
        let end = start + data.total_time_length_in_seconds;

        let payload = activity::Activity::new()
            .details(&data.title)
            .state(&data.artist)
            .assets(activity::Assets::new().large_image(&data.image_url))
            .timestamps(activity::Timestamps::new().start(start).end(end))
            .activity_type(activity::ActivityType::Listening)
            .status_display_type(activity::StatusDisplayType::State);

        if let Err(e) = client.set_activity(payload) {
            println!("[discord] Activity error: {}", e);
            *discord = None;
        }
    }
}

/// Save (or clear) the user's custom widget JS code.
/// Passing an empty string removes the custom widget and reverts to the default overlay.
#[tauri::command]
fn set_custom_widget(state: State<'_, AppState>, code: String) {
    let mut widget = state.custom_widget.lock().unwrap();
    if code.trim().is_empty() {
        *widget = None;
        println!("[overlay] Custom widget cleared — using default overlay");
    } else {
        println!(
            "[overlay] Custom widget code updated ({} bytes)",
            code.len()
        );
        *widget = Some(code);
    }
}

// HTTP server
const OVERLAY_HTML: &str = include_str!("overlay.html");
const WIDGET_HOST_HTML: &str = include_str!("widget_host.html");

fn make_header(name: &str, value: &str) -> Header {
    Header::from_bytes(name.as_bytes(), value.as_bytes()).unwrap()
}

fn start_http_server(
    music: Arc<Mutex<MusicState>>,
    custom_widget: Arc<Mutex<Option<String>>>,
    port: u16,
) {
    thread::spawn(move || {
        let addr = format!("0.0.0.0:{}", port);
        let server = match Server::http(&addr) {
            Ok(s) => {
                println!(
                    "[overlay] HTTP server listening on http://localhost:{}",
                    port
                );
                s
            }
            Err(e) => {
                println!("[overlay] Failed to start server on port {}: {}", port, e);
                return;
            }
        };

        for request in server.incoming_requests() {
            let url = request.url().to_string();
            let method = request.method().as_str().to_uppercase();

            if method == "OPTIONS" {
                let _ = request.respond(
                    Response::empty(200)
                        .with_header(make_header("Access-Control-Allow-Origin", "*"))
                        .with_header(make_header("Access-Control-Allow-Methods", "GET, OPTIONS"))
                        .with_header(make_header("Access-Control-Allow-Headers", "Content-Type")),
                );
                continue;
            }

            let path = url.split('?').next().unwrap_or("").trim_end_matches('/');

            match path {
                "/state" => {
                    let body = {
                        let m = music.lock().unwrap();
                        serde_json::to_string(&*m).unwrap_or_else(|_| "{}".to_string())
                    };
                    let _ = request.respond(
                        Response::from_string(body)
                            .with_header(make_header("Content-Type", "application/json"))
                            .with_header(make_header("Access-Control-Allow-Origin", "*"))
                            .with_header(make_header("Cache-Control", "no-store")),
                    );
                }

                // Overlay HTML
                // Serves the default built-in overlay, OR the custom widget host
                // shell (which then fetches /widget-code) when a custom widget is set.
                "/overlay" => {
                    let has_custom = custom_widget.lock().unwrap().is_some();
                    let html = if has_custom {
                        WIDGET_HOST_HTML
                    } else {
                        OVERLAY_HTML
                    };
                    let _ = request.respond(
                        Response::from_string(html)
                            .with_header(make_header("Content-Type", "text/html; charset=utf-8"))
                            .with_header(make_header("Access-Control-Allow-Origin", "*")),
                    );
                }

                // Custom widget JS code
                // Returns the raw JS that defines `renderWidget`. Returns 404
                // when no custom widget is set (host page won't call this anyway).
                "/widget-code" => {
                    let code = custom_widget.lock().unwrap().clone();
                    match code {
                        Some(c) => {
                            let _ = request.respond(
                                Response::from_string(c)
                                    .with_header(make_header(
                                        "Content-Type",
                                        "application/javascript; charset=utf-8",
                                    ))
                                    .with_header(make_header("Access-Control-Allow-Origin", "*"))
                                    .with_header(make_header("Cache-Control", "no-store")),
                            );
                        }
                        None => {
                            let _ = request.respond(Response::empty(404));
                        }
                    }
                }

                _ => {
                    let _ = request.respond(Response::empty(404));
                }
            }
        }
    });
}

// App entry point

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let music_state = Arc::new(Mutex::new(MusicState::default()));
    let custom_widget = Arc::new(Mutex::new(None::<String>));

    let default_port = music_state.lock().unwrap().overlay_config.port;

    tauri::Builder::default()
        .manage(AppState {
            discord: Mutex::new(None),
            music: music_state.clone(),
            custom_widget: custom_widget.clone(),
        })
        .invoke_handler(tauri::generate_handler![
            update_music_data,
            set_custom_widget
        ])
        .setup(move |app| {
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

            window.eval(script).unwrap();

            start_http_server(music_state.clone(), custom_widget.clone(), default_port);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
