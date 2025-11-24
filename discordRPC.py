from time import sleep, time
from pypresence import Presence
from pypresence.types import ActivityType, StatusDisplayType

class DiscordRPC:
    def __init__(self, client_id: str):
        self.rpc = Presence(client_id)
        self.default_image = "icon.png"
        self.state = False
        self.music_info = {
            "start": int(),
            "end": int(),
            "music_name": str(),
            "artist": str(),
            "image_url": str() or self.default_image,
            "current_time": int()
        }

    def update_state(self, music_name: str, artist: str, image_url: str, music_time: int, current_time: int):
        if self.music_info["music_name"] == music_name and self.music_info["artist"] == artist and self.state == True:
            return

        self.music_info["start"] = int(time())
        self.music_info["end"] = self.music_info["start"] + music_time
        self.music_info["music_name"] = music_name
        self.music_info["artist"] = artist
        self.music_info["image_url"] = image_url or self.default_image
        self.music_info["current_time"] = current_time

        if not self.state:
            self.state = True
            self.music_info["start"] = int(time()) - self.music_info["current_time"]
            self.music_info["end"] = self.music_info["start"] + music_time
            self.update_call()

    def update_call(self, name="Youtube Music", status_display=StatusDisplayType.STATE, activity_type=ActivityType.LISTENING):
        while self.state:
            try:
                self.rpc.update(
                    name=name,
                    status_display_type=status_display,
                    state=self.music_info["artist"],
                    details=self.music_info["music_name"],
                    large_image=self.music_info["image_url"],
                    activity_type=activity_type,
                    start=self.music_info["start"],
                    end=self.music_info["end"]
                )
            except Exception as e:
                print(f"Error updating RPC: {e}")

            sleep(1)


    def connect(self):
        self.rpc.connect()

    def stop(self):
        if self.state:
            self.state = False
            self.rpc.clear()
