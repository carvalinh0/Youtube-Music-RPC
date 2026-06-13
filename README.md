<div align="center" style="padding: 20px">
    <img src="https://music.youtube.com/img/on_platform_logo_dark.svg" alt="Youtube Music logo" width="128" style="border-radius: 100%">
</div>

# YouTube Music Client (Unofficial)

A simple, lightweight desktop application of YouTube Music with Discord Rich Presence integration.

## ✨ Features

- **Super lightweight app**: Tauri provides a really lightweight application that runs as a standalone application with a minimal footprint, wrapping the official YouTube Music website.
- **Real-time Status:** Automatically updates your Discord status when a new song starts.
- **Overlay for your preferred stream application:** You can customize and set up your own music overlay for your livestream; check [WIDGET_STYLES](https://github.com/carvalinh0/youtube-music/blob/main/WIDGET_STYLES.md) to see some examples.

---

## 🚀 Installation & Usage

1. **Set up the Discord app to your account (if you want the Discord RPC, otherwise you can skip this step):** First, you should [**click here**](https://discord.com/oauth2/authorize?client_id=1437232956065190095&response_type=code&redirect_uri=https%3A%2F%2Fdiscord.com%2Foauth2%2Fauthorize%3Fclient_id%3D1437232956065190095&scope=rpc) and add the Discord app to your account.
2. **Download:** Go to the [**Releases Page**](https://github.com/carvalinh0/youtube-music/releases) on the right side of the repository page.
3. **Get the app and install:** Download the file that corresponds to your OS from the latest release and install.
   - Windows: Use the .msi file to install the app.
   - Linux: Download the .rpm or .deb file and install it using your package manager.
   - MacOS: Download the .dmg file and drag it to the Applications folder.
4. **Log In:** A window with the YouTube Music website will open. You can log in with your Google account.
5. **Play Music:** Start playing any song. Your Discord status will automatically update to show what you're listening to (you can disable it if you want), and the overlay server will be set up automatically.

---

## 🛠️ For Developers

If you want to run the application from the source code or contribute to its development, follow these steps.

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) for your specific OS.

### Running from Source

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/carvalinh0/youtube-music.git
    cd ./youtube-music
    ```

2.  **Run the application in development mode:**
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

- **System Tray Icon:** Instead of just closing, the application could be minimized to the system tray for a more seamless background experience. This would allow users to easily show/hide the window.
- **Configuration:** Add a simple script on the site to allow users to set preferences, such as whether the app should start minimized or if the debug console should be enabled.

---

## ❗​Known Issues

You can see the issues that were detected/reported on [Repository Issues Page](https://github.com/carvalinh0/youtube-music/issues).

---

Contributions are welcome! Feel free to open an issue or submit a pull request.
