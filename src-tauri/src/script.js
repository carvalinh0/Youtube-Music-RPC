console.log("Script loaded");

(function () {
    "use strict";

    const STORAGE_KEY = "ytmusic_widget_settings";

    const DEFAULTS = {
        discordRpc: false,
        serverPort: 8765,
        overlayBg: "#0d0d14",
        overlayAccent: "#6441a5",
        overlayText: "#ffffff",
        overlaySubtext: "#9a9ab0",
        customWidgetEnabled: false,
        customWidgetCode: "",
    };

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
        } catch (_) {}
        return Object.assign({}, DEFAULTS);
    }

    function saveSettings(s) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    let cfg = loadSettings();
    window.ytmusicSettings = cfg;

    // DOM helpers
    const SVG_NS = "http://www.w3.org/2000/svg";
    const SVG_TAGS = new Set([
        "svg",
        "path",
        "circle",
        "rect",
        "g",
        "polygon",
        "polyline",
        "line",
    ]);

    function h(tag, props = {}, ...children) {
        const el = SVG_TAGS.has(tag)
            ? document.createElementNS(SVG_NS, tag)
            : document.createElement(tag);

        for (const [k, v] of Object.entries(props)) {
            if (v === false || v === null || v === undefined) continue;
            if (k === "class") {
                el.className = v;
            } else if (k === "style" && typeof v === "object") {
                Object.assign(el.style, v);
            } else if (k === "checked" && tag === "input") {
                el.checked = !!v;
            } else {
                el.setAttribute(k, v === true ? "" : String(v));
            }
        }

        for (const child of children.flat(Infinity)) {
            if (child == null || child === false) continue;
            el.appendChild(
                child instanceof Node
                    ? child
                    : document.createTextNode(String(child)),
            );
        }

        return el;
    }

    // Music data
    function get_music_data() {
        try {
            const metadata = navigator.mediaSession.metadata;
            if (!metadata) return null;

            let imageUrl = "";
            if (metadata.artwork && metadata.artwork.length > 0) {
                const largestArt =
                    metadata.artwork[metadata.artwork.length - 1];
                imageUrl = largestArt.src;
            }

            const title = metadata.title;
            const artist = metadata.artist;
            const bar = document.getElementById("progress-bar");
            const totalTimeInSeconds = bar?.max;
            const currentTimeInSeconds = bar?.value;
            const isPlaying =
                navigator.mediaSession.playbackState === "playing";

            return {
                title,
                artist,
                imageUrl,
                totalTimeInSeconds,
                currentTimeInSeconds,
                isPlaying,
            };
        } catch (_) {
            return null;
        }
    }

    function invokeUpdate(musicData) {
        if (!window.__TAURI__?.core) return;

        window.__TAURI__.core
            .invoke("update_music_data", {
                data: {
                    title: musicData.title,
                    artist: musicData.artist,
                    image_url: musicData.imageUrl,
                    total_time_length_in_seconds: Number(
                        musicData.totalTimeInSeconds,
                    ),
                    current_time_in_seconds: Number(
                        musicData.currentTimeInSeconds,
                    ),
                    is_playing: Boolean(musicData.isPlaying),
                    discord_rpc_enabled: cfg.discordRpc,
                    overlay_config: {
                        bg: cfg.overlayBg,
                        accent: cfg.overlayAccent,
                        text: cfg.overlayText,
                        subtext: cfg.overlaySubtext,
                        port: cfg.serverPort,
                    },
                },
            })
            .catch((err) => console.warn("[ytmusic] invoke error:", err));
    }

    function invokeSetCustomWidget(code) {
        if (!window.__TAURI__?.core) return;
        window.__TAURI__.core
            .invoke("set_custom_widget", { code })
            .catch((err) =>
                console.warn("[ytmusic] set_custom_widget error:", err),
            );
    }

    // Progress bar observer
    let lastCurrentTime = 0;

    const observer = new MutationObserver(() => {
        const data = get_music_data();
        if (
            data?.title &&
            data?.artist &&
            data?.imageUrl &&
            data?.totalTimeInSeconds &&
            lastCurrentTime !== data.currentTimeInSeconds
        ) {
            invokeUpdate(data);
            lastCurrentTime = data.currentTimeInSeconds;
        }
    });

    function verifyBarExistence(obs, intervalId) {
        const bar = document.querySelector("#progress-bar");
        if (bar) {
            console.log("Element found! Starting the observer...");
            obs.observe(bar, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
            });
            clearInterval(intervalId);
            return true;
        }
        return false;
    }

    const checkInterval = setInterval(() => {
        verifyBarExistence(observer, checkInterval);
    }, 1000);

    function bindVideoEvents() {
        const video = document.querySelector("video");
        if (video) {
            video.addEventListener("play", () => {
                const data = get_music_data();
                if (data) invokeUpdate(data);
            });

            video.addEventListener("pause", () => {
                const data = get_music_data();
                if (data) invokeUpdate(data);
            });
            return true;
        }
        return false;
    }

    // Sometimes the play/pause events aren't triggered by the MutationObserver, so we bind them directly to the video element as well for better sync.
    const videoInterval = setInterval(() => {
        if (bindVideoEvents()) {
            clearInterval(videoInterval);
            console.log("Eventos de Play/Pause sincronizados!");
        }
    }, 1000);

    // Example widget code (shown as placeholder)
    const EXAMPLE_WIDGET_CODE = `function renderWidget({ title, artist, image_url, current_time_in_seconds, total_time_in_seconds, is_playing, formatTime }) {
  const root = document.getElementById('widget-root');
  if (!title) { root.innerHTML = ''; return; }

  const pct = total_time_in_seconds > 0
    ? (current_time_in_seconds / total_time_in_seconds * 100).toFixed(2)
    : 0;

  root.innerHTML = \`
    <div style="
      display:inline-flex; align-items:center; gap:14px;
      background:rgba(13,13,20,0.92); border-radius:16px;
      padding:14px 18px; backdrop-filter:blur(12px);
      border:1px solid rgba(255,255,255,0.07);
      font-family:sans-serif; color:#fff; max-width:380px;
      box-shadow:0 8px 32px rgba(0,0,0,0.5);
    ">
      <img src="\${image_url}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0" />
      <div style="flex:1;overflow:hidden;min-width:0">
        <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${title}</div>
        <div style="color:#9a9ab0;font-size:12px;margin-top:3px">\${artist}</div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:3px;background:rgba(255,255,255,0.1);border-radius:3px">
            <div style="width:\${pct}%;height:100%;background:#6441a5;border-radius:3px;transition:width 0.5s linear"></div>
          </div>
          <span style="font-size:10px;color:#9a9ab0;white-space:nowrap">\${formatTime(current_time_in_seconds)}</span>
        </div>
      </div>
    </div>
  \`;
}`;

    // Styles
    const styleEl = document.createElement("style");
    styleEl.textContent = `
    #ytm-widget-root {
      position: fixed; bottom: 88px; right: 20px; z-index: 99999;
      display: flex; flex-direction: column; gap: 10px; align-items: flex-end;
    }
    .ytm-fab-wrap { position: relative; }
    .ytm-fab {
      width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,.5);
      transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
    }
    .ytm-fab:hover { transform: scale(1.12); box-shadow: 0 6px 24px rgba(0,0,0,.6); filter: brightness(1.15); }
    .ytm-fab svg { width: 21px; height: 21px; display: block; }
    #ytm-fab-discord { background: #5865F2; }
    #ytm-fab-twitch  { background: #6441a5; }
    .ytm-popup {
      position: absolute; right: 54px; bottom: 0; background: #16161e;
      border: 1px solid rgba(255,255,255,.08); border-radius: 14px;
      padding: 16px 18px; box-shadow: 0 12px 40px rgba(0,0,0,.65);
      display: none; color: #fff;
      font-family: 'YouTube Sans','Google Sans',Roboto,sans-serif;
      font-size: 13px; min-width: 210px;
      animation: ytm-pop-in .18s ease;
      max-height: 90vh; overflow-y: auto;
    }
    @keyframes ytm-pop-in {
      from { opacity:0; transform:scale(.95) translateX(4px); }
      to   { opacity:1; transform:scale(1) translateX(0); }
    }
    .ytm-popup.open { display: block; }
    .ytm-popup-header {
      font-size: 11px; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: #666; margin-bottom: 14px;
    }
    .ytm-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .ytm-row:last-child { margin-bottom: 0; }
    .ytm-label { color: #e0e0e0; font-size: 13.5px; line-height: 1.3; flex: 1; }
    .ytm-hint  { color: #666; font-size: 11.5px; margin-top: 2px; }
    .ytm-toggle { position: relative; width: 42px; height: 23px; flex-shrink: 0; }
    .ytm-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .ytm-track { position: absolute; inset: 0; border-radius: 23px; background: #333; cursor: pointer; transition: background .2s; }
    .ytm-toggle input:checked ~ .ytm-track { background: #5865F2; }
    .ytm-thumb { position: absolute; top: 3px; left: 3px; width: 17px; height: 17px; border-radius: 50%; background: #fff; transition: left .18s ease; pointer-events: none; }
    .ytm-toggle input:checked ~ .ytm-track .ytm-thumb { left: 22px; }
    .ytm-hr { height: 1px; background: rgba(255,255,255,.07); margin: 13px 0; }
    .ytm-color-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
    .ytm-color-row-label { color: #ccc; font-size: 13px; flex: 1; }
    .ytm-swatch { width: 34px; height: 26px; border-radius: 6px; border: 1px solid rgba(255,255,255,.15); cursor: pointer; padding: 2px; background: transparent; }
    .ytm-port { width: 68px; background: #202030; border: 1px solid #3a3a50; border-radius: 7px; color: #fff; padding: 5px 8px; font-size: 13px; text-align: center; outline: none; }
    .ytm-port:focus { border-color: #6441a5; }
    .ytm-save { width: 100%; margin-top: 13px; padding: 9px; border-radius: 9px; border: none; background: #6441a5; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; letter-spacing: .02em; transition: background .15s; }
    .ytm-save:hover  { background: #7c55c0; }
    .ytm-save:active { background: #4f3380; }
    .ytm-copy-box {
      margin-top: 11px; padding: 9px; background: rgba(0,0,0,0.3);
      border: 1px dashed rgba(167,139,250,.4); border-radius: 8px;
      color: #a78bfa; font-family: monospace; font-size: 11.5px;
      text-align: center; cursor: pointer; word-break: break-all;
      transition: all .2s; user-select: none;
    }
    .ytm-copy-box:hover {
      background: rgba(167,139,250,.1); border-color: #a78bfa; color: #fff;
    }

    /* ── Custom widget editor ── */
    .ytm-cw-section { margin-top: 2px; }
    .ytm-toggle input:checked ~ .ytm-cw-toggle-track { background: #6441a5 !important; }
    .ytm-code-wrap {
      margin-top: 10px;
      animation: ytm-slide-down .2s ease;
    }
    @keyframes ytm-slide-down {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ytm-code-label {
      font-size: 11px; color: #666; margin-bottom: 6px; letter-spacing: .04em;
    }
    .ytm-code-label a {
      color: #a78bfa; text-decoration: none;
    }
    .ytm-code-editor {
      width: 100%; height: 190px;
      background: #0d0d16;
      border: 1px solid #2e2e42;
      border-radius: 8px;
      color: #e0e0e0;
      font-family: 'Consolas', 'Fira Code', 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      line-height: 1.6;
      padding: 10px;
      resize: vertical;
      outline: none;
      tab-size: 2;
      white-space: pre;
      overflow: auto;
      display: block;
    }
    .ytm-code-editor:focus { border-color: #6441a5; box-shadow: 0 0 0 2px rgba(100,65,165,0.25); }
    .ytm-cw-actions { display: flex; gap: 8px; margin-top: 8px; }
    .ytm-cw-apply {
      flex: 1; padding: 8px; border-radius: 8px; border: none;
      background: #6441a5; color: #fff; font-weight: 700;
      font-size: 12px; cursor: pointer; transition: background .15s;
    }
    .ytm-cw-apply:hover  { background: #7c55c0; }
    .ytm-cw-apply:active { background: #4f3380; }
    .ytm-cw-reset {
      padding: 8px 12px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,.1); background: transparent;
      color: #888; font-size: 12px; cursor: pointer; transition: all .15s;
      white-space: nowrap;
    }
    .ytm-cw-reset:hover { background: rgba(255,255,255,.06); color: #ccc; border-color: rgba(255,255,255,.2); }
    .ytm-cw-api-note {
      margin-top: 10px; padding: 9px 10px;
      background: rgba(100,65,165,0.1);
      border: 1px solid rgba(100,65,165,0.3);
      border-radius: 7px;
      font-size: 11px; color: #a78bfa; line-height: 1.5;
    }
    .ytm-cw-api-note code {
      display: block; margin-top: 5px;
      font-family: monospace; font-size: 10.5px; color: #d4b9ff;
      white-space: pre-wrap; word-break: break-all;
    }
  `;
    document.head.appendChild(styleEl);

    // Icon paths
    const DISCORD_D =
        "M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z";

    const TWITCH_D =
        "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z";

    function makeIcon(pathD) {
        return h(
            "svg",
            { viewBox: "0 0 24 24", fill: "white" },
            h("path", { d: pathD }),
        );
    }

    function makeToggle(id, checked, trackClass) {
        return h(
            "label",
            { class: "ytm-toggle" },
            h("input", { type: "checkbox", id, checked }),
            h(
                "div",
                { class: "ytm-track" + (trackClass ? " " + trackClass : "") },
                h("div", { class: "ytm-thumb" }),
            ),
        );
    }

    function makeColorRow(labelText, inputId, value) {
        return h(
            "div",
            { class: "ytm-color-row" },
            h("span", { class: "ytm-color-row-label" }, labelText),
            h("input", {
                type: "color",
                class: "ytm-swatch",
                id: inputId,
                value,
            }),
        );
    }

    // Discord popup
    const discordPopup = h(
        "div",
        { class: "ytm-popup", id: "ytm-popup-discord" },
        h("div", { class: "ytm-popup-header" }, "Discord"),
        h(
            "div",
            { class: "ytm-row" },
            h(
                "div",
                {},
                h("div", { class: "ytm-label" }, "Discord RPC"),
                h(
                    "div",
                    { class: "ytm-hint" },
                    "Show the music in your profile",
                ),
            ),
            makeToggle("ytm-discord-toggle", cfg.discordRpc),
        ),
    );

    const discordFab = h(
        "button",
        { class: "ytm-fab", id: "ytm-fab-discord", title: "Discord RPC" },
        makeIcon(DISCORD_D),
    );

    const discordWrap = h(
        "div",
        { class: "ytm-fab-wrap" },
        discordPopup,
        discordFab,
    );

    // Overlay popup
    const saveBtn = h(
        "button",
        { class: "ytm-save", id: "ytm-save-btn" },
        "Save changes",
    );
    const overlayUrlBox = h(
        "div",
        {
            class: "ytm-copy-box",
            id: "ytm-overlay-url",
            title: "Click to copy",
        },
        `http://localhost:${cfg.serverPort}/overlay`,
    );

    // Custom widget editor elements (kept as refs for event binding)
    const cwCodeTextarea = h(
        "textarea",
        {
            class: "ytm-code-editor",
            id: "ytm-cw-code",
            spellcheck: "false",
            placeholder: EXAMPLE_WIDGET_CODE,
        },
        cfg.customWidgetCode || "",
    );

    const cwApplyBtn = h(
        "button",
        { class: "ytm-cw-apply", id: "ytm-cw-apply" },
        "Apply Widget",
    );
    const cwResetBtn = h(
        "button",
        { class: "ytm-cw-reset", id: "ytm-cw-reset" },
        "Reset to default",
    );

    const cwCodeWrap = h(
        "div",
        {
            class: "ytm-code-wrap",
            id: "ytm-cw-code-wrap",
            style: { display: cfg.customWidgetEnabled ? "block" : "none" },
        },
        h(
            "div",
            { class: "ytm-code-label" },
            "Define a ",
            h("code", {}, "renderWidget(data)"),
            " function:",
        ),
        cwCodeTextarea,
        h("div", { class: "ytm-cw-actions" }, cwApplyBtn, cwResetBtn),
        h(
            "div",
            { class: "ytm-cw-api-note" },
            "Available in ",
            h("strong", {}, "data"),
            ":",
            h(
                "code",
                {},
                "{ title, artist, image_url,\n  current_time_in_seconds,\n  total_time_in_seconds,\n  is_playing, formatTime }",
            ),
        ),
    );

    const cwToggleInput = h("input", {
        type: "checkbox",
        id: "ytm-cw-toggle",
        checked: cfg.customWidgetEnabled,
    });
    const cwToggle = h(
        "label",
        { class: "ytm-toggle" },
        cwToggleInput,
        h(
            "div",
            { class: "ytm-track ytm-cw-toggle-track" },
            h("div", { class: "ytm-thumb" }),
        ),
    );

    const twitchPopup = h(
        "div",
        {
            class: "ytm-popup",
            id: "ytm-popup-twitch",
            style: { minWidth: "260px" },
        },
        // Overlay colors + port
        h("div", { class: "ytm-popup-header" }, "Overlay / Stream"),
        makeColorRow("Background", "ytm-c-bg", cfg.overlayBg),
        makeColorRow("Highlight", "ytm-c-accent", cfg.overlayAccent),
        makeColorRow("Main text", "ytm-c-text", cfg.overlayText),
        makeColorRow("Secondary text", "ytm-c-sub", cfg.overlaySubtext),
        h("div", { class: "ytm-hr" }),
        h(
            "div",
            { class: "ytm-row" },
            h(
                "div",
                { class: "ytm-label" },
                "Server port",
                h("div", { class: "ytm-hint" }, "For OBS / overlay"),
            ),
            h("input", {
                type: "number",
                class: "ytm-port",
                id: "ytm-port",
                value: String(cfg.serverPort),
                min: "1024",
                max: "65535",
            }),
        ),
        saveBtn,
        overlayUrlBox,

        // Custom widget
        h("div", { class: "ytm-hr" }),
        h("div", { class: "ytm-popup-header" }, "Custom Widget"),
        h(
            "div",
            { class: "ytm-row" },
            h(
                "div",
                {},
                h("div", { class: "ytm-label" }, "Use custom widget"),
                h(
                    "div",
                    { class: "ytm-hint" },
                    "Replace default overlay with your code",
                ),
            ),
            cwToggle,
        ),
        cwCodeWrap,
    );

    const twitchFab = h(
        "button",
        { class: "ytm-fab", id: "ytm-fab-twitch", title: "Overlay for OBS" },
        makeIcon(TWITCH_D),
    );

    const twitchWrap = h(
        "div",
        { class: "ytm-fab-wrap" },
        twitchPopup,
        twitchFab,
    );
    const widgetRoot = h(
        "div",
        { id: "ytm-widget-root" },
        twitchWrap,
        discordWrap,
    );

    // Popup open / close
    function closeAll() {
        discordPopup.classList.remove("open");
        twitchPopup.classList.remove("open");
    }

    discordFab.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = discordPopup.classList.contains("open");
        closeAll();
        if (!wasOpen) discordPopup.classList.add("open");
    });

    twitchFab.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasOpen = twitchPopup.classList.contains("open");
        closeAll();
        if (!wasOpen) {
            twitchPopup.classList.add("open");
            syncUrl();
        }
    });

    discordPopup.addEventListener("click", (e) => e.stopPropagation());
    twitchPopup.addEventListener("click", (e) => e.stopPropagation());

    // Discord toggle
    discordPopup
        .querySelector("#ytm-discord-toggle")
        .addEventListener("change", (e) => {
            cfg.discordRpc = e.target.checked;
            saveSettings(cfg);
            window.ytmusicSettings = cfg;
            const data = get_music_data();
            if (data) invokeUpdate(data);
        });

    // Overlay save (colors + port)
    saveBtn.addEventListener("click", () => {
        cfg.overlayBg = document.getElementById("ytm-c-bg").value;
        cfg.overlayAccent = document.getElementById("ytm-c-accent").value;
        cfg.overlayText = document.getElementById("ytm-c-text").value;
        cfg.overlaySubtext = document.getElementById("ytm-c-sub").value;
        cfg.serverPort =
            parseInt(document.getElementById("ytm-port").value, 10) || 8765;
        saveSettings(cfg);
        window.ytmusicSettings = cfg;
        syncUrl();

        const data = get_music_data();
        if (data) invokeUpdate(data);

        saveBtn.textContent = "✓ Saved!";
        setTimeout(() => {
            saveBtn.textContent = "Save changes";
        }, 1800);
    });

    function syncUrl() {
        overlayUrlBox.textContent = `http://localhost:${cfg.serverPort}/overlay`;
    }

    overlayUrlBox.addEventListener("click", () => {
        navigator.clipboard
            .writeText(`http://localhost:${cfg.serverPort}/overlay`)
            .then(() => {
                overlayUrlBox.textContent = "✓ Copied!";
                overlayUrlBox.style.color = "#4ade80";
                overlayUrlBox.style.borderColor = "#4ade80";
                setTimeout(() => {
                    syncUrl();
                    overlayUrlBox.style.color = "";
                    overlayUrlBox.style.borderColor = "";
                }, 2000);
            })
            .catch((err) => {
                console.error("Error on URL copy:", err);
            });
    });

    // Custom widget toggle
    cwToggleInput.addEventListener("change", (e) => {
        cfg.customWidgetEnabled = e.target.checked;
        cwCodeWrap.style.display = e.target.checked ? "block" : "none";
        saveSettings(cfg);
        window.ytmusicSettings = cfg;

        if (!e.target.checked) {
            // Revert to default overlay
            invokeSetCustomWidget("");
        } else if (cfg.customWidgetCode.trim()) {
            // Re-apply saved code
            invokeSetCustomWidget(cfg.customWidgetCode);
        }
    });

    // Apply custom widget code
    cwApplyBtn.addEventListener("click", () => {
        const code = cwCodeTextarea.value.trim();
        if (!code) {
            cwApplyBtn.textContent = "⚠ Code is empty";
            setTimeout(() => {
                cwApplyBtn.textContent = "Apply Widget";
            }, 1800);
            return;
        }
        cfg.customWidgetCode = code;
        cfg.customWidgetEnabled = true;
        cwToggleInput.checked = true;
        cwCodeWrap.style.display = "block";
        saveSettings(cfg);
        window.ytmusicSettings = cfg;
        invokeSetCustomWidget(code);

        cwApplyBtn.textContent = "✓ Applied!";
        setTimeout(() => {
            cwApplyBtn.textContent = "Apply Widget";
        }, 1800);
    });

    // Reset to default overlay
    cwResetBtn.addEventListener("click", () => {
        cfg.customWidgetEnabled = false;
        cfg.customWidgetCode = "";
        cwToggleInput.checked = false;
        cwCodeTextarea.value = "";
        cwCodeWrap.style.display = "none";
        saveSettings(cfg);
        window.ytmusicSettings = cfg;
        invokeSetCustomWidget("");

        cwResetBtn.textContent = "✓ Reset";
        setTimeout(() => {
            cwResetBtn.textContent = "Reset to default";
        }, 1800);
    });

    // Keyboard shortcuts in textarea
    cwCodeTextarea.addEventListener("keydown", (e) => {
        // Tab -> insert 2 spaces instead of losing focus
        if (e.key === "Tab") {
            e.preventDefault();
            const start = cwCodeTextarea.selectionStart;
            const end = cwCodeTextarea.selectionEnd;
            cwCodeTextarea.value =
                cwCodeTextarea.value.substring(0, start) +
                "  " +
                cwCodeTextarea.value.substring(end);
            cwCodeTextarea.selectionStart = cwCodeTextarea.selectionEnd =
                start + 2;
        }
        // Ctrl/Cmd+Enter -> apply
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            cwApplyBtn.click();
        }
    });

    // Mount
    function insertUI() {
        if (!document.body || !document.head) {
            setTimeout(insertUI, 50);
            return;
        }
        document.head.appendChild(styleEl);
        document.body.appendChild(widgetRoot);
        document.addEventListener("click", closeAll);
        syncUrl();
    }

    insertUI();

    // Sync custom widget to backend on startup
    setTimeout(() => {
        if (cfg.customWidgetEnabled && cfg.customWidgetCode.trim()) {
            invokeSetCustomWidget(cfg.customWidgetCode);
        }
    }, 600);
})();
