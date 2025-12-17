console.log("Script loaded");

function get_music_data() {
    const title = document.getElementsByClassName("title style-scope ytmusic-player-bar")[0].textContent
    const artist = document.getElementsByClassName("byline style-scope ytmusic-player-bar complex-string")[0].textContent.split(" • ")[0]
    const imageUrl = document.querySelector("#thumbnail > img:nth-child(1)").src || document.getElementsByClassName("image style-scope ytmusic-player-bar")[0].src
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

    //console.log(JSON.stringify(data, null, 2));
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
