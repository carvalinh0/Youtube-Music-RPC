console.log("Script loaded");

function get_music_data() {
    const metadata = navigator.mediaSession.metadata;
    const title = metadata.title
    const artist = metadata.artist
    const imageUrl = metadata.artwork[0].src
    const totalTimeInSeconds = document.getElementById("progress-bar").max
    const currentTimeInSeconds = document.getElementById("progress-bar").value

    return {title, artist, imageUrl, totalTimeInSeconds, currentTimeInSeconds}
}

// Store the last current time of the music to avoid duplicate or massive requests
let lastCurrentTime = 0

// Inicialize the observer to get the music info and return it to rust code when the playing bar appears
const observer = new MutationObserver((mutations) => {
    const data = get_music_data();

    if (data && data.title && data.artist && data.imageUrl && data.totalTimeInSeconds && lastCurrentTime !== data.currentTimeInSeconds) {
        if (window.__TAURI__ && window.__TAURI__.core) {
            window.__TAURI__.core.invoke('update_music_data', {
                data: {
                    title: data.title,
                    artist: data.artist,
                    image_url: data.imageUrl,
                    total_time_length_in_seconds: data.totalTimeInSeconds,
                    current_time_in_seconds: data.currentTimeInSeconds
                }
            });
        }

        lastCurrentTime = data.currentTimeInSeconds
    }

    //console.debug(JSON.stringify(data, null, 2));
});

function verifyBarExistence(obs, intervalId) {
    const timer = document.querySelector("#progress-bar")

    if (timer) {
        console.log("Element found! Starting the observer...");

        obs.observe(timer, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        clearInterval(intervalId);
        return true;
    }

    return false;
}

const checkInterval = setInterval(() => {
    verifyBarExistence(observer, checkInterval);
}, 1000);
