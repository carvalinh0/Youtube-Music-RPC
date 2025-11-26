import webview
from time import sleep
import sys
import os

class API:
    def __init__(self, rpc):
        self.rpc = rpc

    def stop(self):
        self.rpc.stop()

    def debug(self, string: str):
        print(string)

    def receive_data(self, data):
        self.rpc.update_state(data.get("music_name"), data.get("music_artists"), data.get("image_url"), data.get("time_lenght_in_seconds"), data.get("current_time"))

    def resource_path(self, relative_path): # this function is used get the path in case of running the app as exe (after build)
        if hasattr(sys, '_MEIPASS'):
            return os.path.join(sys._MEIPASS, relative_path)
        return os.path.join(os.path.abspath("."), relative_path)

    def load_script(self, window):
        js_path = self.resource_path("script.js")

        try:
            with open(js_path, "r", encoding="utf-8") as f:
                script = f.read()

            sleep(5)
            print(f"Injecting script from: {js_path}")
            window.evaluate_js(script)
            print("Script injected successfully")

        except FileNotFoundError:
            print(f"JS file not found at {js_path}")
        except Exception as e:
            print(f"Unexpected error\n{e}")

class Window:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.icon = "icon.png" # it only works on linux
        self.window = None

    def initialize(self, url, debug=False, rpc=None):
        api = API(rpc)
        self.window = webview.create_window(
            'Youtube Music',
            url,
            width=self.width,
            height=self.height,
            js_api=api
        )

        webview.start(func=api.load_script, args=(self.window, ), icon=self.icon, debug=debug, private_mode=False)
