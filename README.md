# YouTube Music - Discord Rich Presence

A simple, lightweight desktop application that displays your currently playing song on YouTube Music as your Discord Rich Presence status.

 <!-- TODO: Replace with an actual screenshot of the app and Discord status -->

## ✨ Features

- **Real-time Status:** Automatically updates your Discord status when a new song starts.
- **Detailed Information:** Shows the song title, artist, and album cover.
- **Time Tracking:** Displays the elapsed time and remaining time for the current track.
- **Lightweight:** Runs as a standalone application with a minimal footprint, wrapping the official YouTube Music website.
- **Easy to Use:** Just run the executable, log in to YouTube Music, and play your music!

---

## 🚀 Installation & Usage

1. **Set up the Discord app to your account:** First, you should [click here](https://discord.com/oauth2/authorize?client_id=1437232956065190095&response_type=code&redirect_uri=https%3A%2F%2Fdiscord.com%2Foauth2%2Fauthorize%3Fclient_id%3D1437232956065190095&scope=rpc) and add the Discord app to your account.
2. **Download:** Go to the [**Releases Page**](https://github.com/carvalinh0/Youtube-Music-RPC/releases) on the right side of the repository page.
3. **Get the Executable:** Download the `Youtube Music.exe` file from the latest release.
4. **Run:** Double-click the executable to launch the application.
5. **Log In:** A window with the YouTube Music website will open. Log in with your Google account if prompted.
6. **Play Music:** Start playing any song. Your Discord status will automatically update to show what you're listening to.

---

## 🛠️ For Developers

If you want to run the application from the source code or contribute to its development, follow these steps.

### Prerequisites

- Python 3.11+
- Git

### Running from Source

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/carvalinh0/Youtube-Music-RPC.git
    cd Youtube-Music-RPC
    ```

2.  **Create a virtual environment (recommended):**
    ```sh
    python -m venv .venv
    # On Windows
    .\.venv\Scripts\activate
    # On macOS/Linux
    source .venv/bin/activate
    ```

3.  **Install dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Run the application:**
    ```sh
    python main.py
    ```

### Building the Executable

This project uses `PyInstaller` to create a single-file executable for Windows. The build configuration is already set up in the GitHub Actions workflow.

To build it locally (with debug console), run the following command from the project root:

```sh
pyinstaller --onefile --icon=icon.ico --add-data "script.js;." --add-data "window.py;." --add-data "discordRPC.py;." --add-data "icon.png;." --add-data "icon.ico;." main.py -n "Youtube Music"
```

The final executable will be located in the `dist/` directory.

---

## 🔮 Potential Improvements

This project is fully functional, but there are always opportunities for enhancement. Here are a few known ideas:

- **Cross-Platform Builds:** The current build process is configured only for Windows. GitHub Actions could be expanded to build versions for macOS and Linux.
- **System Tray Icon:** Instead of just closing, the application could be minimized to the system tray for a more seamless background experience. This would allow users to show/hide the window easily.
- **Pause/Play State:** The Rich Presence could be enhanced to show a "Paused" icon or state when the music is paused in the player, rather than just clearing the status.
- **Better Error Handling:** Implement more robust error handling for cases where the Discord client is not running or the connection is lost, with options to reconnect automatically.
- **Configuration File:** Add a simple script in the site to allow users to set preferences, such as whether the app should start minimized or if the debug console should be enabled.
- **Optimizations:** The actual code has some known issues that could be optimized for better performance and user experience.
- **Listen to my actual music support:** Add a button to listen to the song that other users are listening to.
- **Listen with me support:** Add support to listen the same songs as your friend (hard one).
- **Use raw discord RPC instead of a library:** The current implementation uses a third-party library to interact with the Discord client. This could be replaced with the official Discord RPC API, which would allow for better performance and better integration.

---

## Known Issues
You can see the issues that were detected/reported on [Repository Issues Page](https://github.com/carvalinh0/Youtube-Music-RPC/issues).

---

Contributions are welcome! Feel free to open an issue or submit a pull request.
