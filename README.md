<div align="center" style="padding: 20px">
    <img src="https://play-lh.googleusercontent.com/0oO5sAneb9lJP6l8c6DH4aj6f85qNpplQVHmPmbbBxAukDnlO7DarDW0b-kEIHa8SQ" alt="Discord logo" width="128" style="border-radius: 100%; margin-right: 20px">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Youtube_Music_icon.svg/2048px-Youtube_Music_icon.svg.png" alt="Youtube Music logo" width="128" style="border-radius: 100%; margin-left: 20px">
</div>

# YouTube Music - Discord Rich Presence

A simple, lightweight desktop application that displays your currently playing song on YouTube Music as your Discord Rich Presence status.

## ✨ Features

- **Real-time Status:** Automatically updates your Discord status when a new song starts.
- **Detailed Information:** Shows the song title, artist, and album cover.
- **Time Tracking:** Displays the elapsed time and remaining time for the current track.
- **Lightweight:** Runs as a standalone application with a minimal footprint, wrapping the official YouTube Music website.
- **Easy to Use:** Just run the executable, log in to YouTube Music, and play your music!

---

## 🚀 Installation & Usage

1. **Set up the Discord app to your account:** First, you should [**click here**](https://discord.com/oauth2/authorize?client_id=1437232956065190095&response_type=code&redirect_uri=https%3A%2F%2Fdiscord.com%2Foauth2%2Fauthorize%3Fclient_id%3D1437232956065190095&scope=rpc) and add the Discord app to your account.
2. **Download:** Go to the [**Releases Page**](https://github.com/carvalinh0/Youtube-Music-RPC/releases) on the right side of the repository page.
3. **Get the app:** Download the file that corresponds to your OS from the latest release.
4. **Run:**<br/> 
On Windows: Double-click the executable file to run the application.<br/>
On macOS/Linux: Open a terminal in the same directory as the executable file and run `chmod +x "./Youtube Music"` to make it executable, then run `"./Youtube Music"`
5. **Log In:** A window with the YouTube Music website will open. Log in with your Google account.
6. **Play Music:** Start playing any song. Your Discord status will automatically update to show what you're listening to.

---

## 🛠️ For Developers

If you want to run the application from the source code or contribute to its development, follow these steps.

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your specific OS.

### Running from Source

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/carvalinh0/youtube-music-rpc.git
    cd youtube-music-rpc
    ```

2. **Run the application in development mode:**
    ```sh
    cargo tauri dev
    ```

### Building the Executable

The build configuration is already set up in the GitHub Actions workflow. To build it locally, run the following command from the project root:

```sh
cargo tauri build
```

The final executable will be located in the `src-tauri/target/release/bundle/` directory.

---

## 🔮 Potential Improvements

This project is fully functional, but there are always opportunities for enhancement. Here are a few known ideas:

- **System Tray Icon:** Instead of just closing, the application could be minimized to the system tray for a more seamless background experience. This would allow users to show/hide the window easily.
- **Pause/Play State:** The Rich Presence could be enhanced to show a "Paused" icon or state when the music is paused in the player, rather than just clearing the status.
- **Better Error Handling:** Implement more robust error handling for cases where the Discord client is not running or the connection is lost, with options to reconnect automatically.
- **Configuration:** Add a simple script in the site to allow users to set preferences, such as whether the app should start minimized or if the debug console should be enabled.
- **Listen to my actual music support:** Add a button to listen to the song that other users are listening to.
- **Listen with me support:** Add support to listen the same songs as your friend (hard one).

---

## Known Issues
You can see the issues that were detected/reported on [Repository Issues Page](https://github.com/carvalinh0/youtube-music-rpc/issues).

---

Contributions are welcome! Feel free to open an issue or submit a pull request.
