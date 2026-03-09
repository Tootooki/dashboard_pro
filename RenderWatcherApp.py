import tkinter as tk
from tkinter import ttk, messagebox
import requests
import webbrowser
import threading
import time

# === CONFIGURATION ===
RENDER_API_KEY = "rnd_kT5nXyFriC1OhfEAM0zcHOFCWIKV"
BACKEND_SERVICE_ID = "srv-d6n5qup4tr6s738qvsf0"
FRONTEND_SERVICE_ID = "srv-d6n687h4tr6s738r96h0"
# CORRECTED BACKEND URL
FRONTEND_URL = "https://dashboard-1-hirr.onrender.com/"
BACKEND_URL = "https://dashboard-pro-2464.onrender.com/"

HEADERS = {
    "Authorization": f"Bearer {RENDER_API_KEY}",
    "Accept": "application/json"
}

class RenderWatcherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("✅ PRO_API Monitor")
        self.root.geometry("400x350")
        self.root.configure(bg="#000000")
        self.root.attributes("-topmost", True) # Keep on top for visibility

        # Dark Theme Styles
        style = ttk.Style()
        style.theme_use('default')
        style.configure("TLabel", background="#000000", foreground="#ffffff", font=("Inter", 12))
        style.configure("TButton", background="#f0f0f0", font=("Inter", 10, "bold"))
        
        self.setup_ui()
        self.check_now()

    def setup_ui(self):
        # Header
        self.header = tk.Label(self.root, text="PRO_API MONITOR", bg="#000000", fg="#ffffff", font=("Inter", 16, "bold"), pady=20)
        self.header.pack()

        # Backend Status
        self.be_frame = tk.Frame(self.root, bg="#000000", pady=10)
        self.be_frame.pack(fill="x", padx=40)
        self.be_label = tk.Label(self.be_frame, text="Backend Status:", bg="#000000", fg="#aaaaaa", font=("Inter", 10))
        self.be_label.pack(side="left")
        self.be_status = tk.Label(self.be_frame, text="Checking...", bg="#000000", fg="#ffffff", font=("Inter", 10, "bold"))
        self.be_status.pack(side="right")

        # Frontend Status
        self.fe_frame = tk.Frame(self.root, bg="#000000", pady=10)
        self.fe_frame.pack(fill="x", padx=40)
        self.fe_label = tk.Label(self.fe_frame, text="Frontend Status:", bg="#000000", fg="#aaaaaa", font=("Inter", 10))
        self.fe_label.pack(side="left")
        self.fe_status = tk.Label(self.fe_frame, text="Checking...", bg="#000000", fg="#ffffff", font=("Inter", 10, "bold"))
        self.fe_status.pack(side="right")

        # Action Buttons
        self.btn_open_fe = tk.Button(self.root, text="OPEN DASHBOARD", bg="#ffffff", fg="#000000", font=("Inter", 10, "bold"), relief="flat", command=self.open_frontend, pady=8)
        self.btn_open_fe.pack(fill="x", padx=40, pady=(20, 10))
        
        self.btn_refresh = tk.Button(self.root, text="REFRESH STATUS", bg="#333333", fg="#ffffff", font=("Inter", 10), relief="flat", command=self.check_now, pady=5)
        self.btn_refresh.pack(fill="x", padx=40)

        self.last_updated = tk.Label(self.root, text="Last check: ---", bg="#000000", fg="#555555", font=("Inter", 8), pady=10)
        self.last_updated.pack()

    def update_status_label(self, label, status):
        color = "#00ff00" if status == "live" else ("#ff0000" if status == "failed" else "#ffff00")
        label.config(text=status.upper() if status else "UNKNOWN", fg=color)

    def fetch_status(self, service_id):
        try:
            url = f"https://api.render.com/v1/services/{service_id}"
            res = requests.get(url, headers=HEADERS, timeout=10)
            if res.status_code == 200:
                return res.json().get("service", {}).get("status")
        except:
            return "error"
        return "unknown"

    def check_now(self):
        def task():
            be_status = self.fetch_status(BACKEND_SERVICE_ID)
            fe_status = self.fetch_status(FRONTEND_SERVICE_ID)
            
            self.root.after(0, lambda: self.update_status_label(self.be_status, be_status))
            self.root.after(0, lambda: self.update_status_label(self.fe_status, fe_status))
            
            now = time.strftime("%H:%M:%S")
            self.root.after(0, lambda: self.last_updated.config(text=f"Last check: {now}"))

        threading.Thread(target=task).start()
        # Auto-refresh every 60 seconds
        self.root.after(60000, self.check_now)

    def open_frontend(self):
        webbrowser.open(FRONTEND_URL)

if __name__ == "__main__":
    root = tk.Tk()
    app = RenderWatcherApp(root)
    root.mainloop()
