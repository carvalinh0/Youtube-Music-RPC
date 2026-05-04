// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

fn main() {
    // Prevent WebKit from using DMABUF on Wayland, which can cause rendering issues in some environments.
    unsafe {
        if env::var_os("WAYLAND_DISPLAY").is_some() {
            env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            println!("Wayland detected: DMABUF disabled.");
        }
    }

    youtube_music_rpc_lib::run()
}
