from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json
import os

CONFIG_FILE = "config.json"

app = FastAPI(title="aofaof.online API")

# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConfigData(BaseModel):
    # Amazon SP API
    amazon_sp_client_id: str = ""
    amazon_sp_client_secret: str = ""
    amazon_sp_refresh_token: str = ""
    amazon_sp_aws_access_key: str = ""
    amazon_sp_aws_secret_key: str = ""
    amazon_sp_role_arn: str = ""
    
    # Amazon Ads API
    amazon_ads_client_id: str = ""
    amazon_ads_client_secret: str = ""
    amazon_ads_refresh_token: str = ""
    amazon_ads_profile_id: str = ""
    
    # Google & Others
    google_sheet_api: str = ""
    google_drive_api: str = ""
    google_sheet_link: str = ""
    google_drive_link: str = ""
    slack_api: str = ""
    telegram_api: str = ""
    whatsapp_api: str = ""
    walmart_api: str = ""
    tiktok_store_api: str = ""
    tiktok_posting_api: str = ""
    gmail_api: str = ""
    
    # Automation Settings
    slack_channel_id: str = ""
    notification_preference: str = "telegram" # telegram or email


@app.get("/")
def read_root():
    return {"status": "online"}

@app.get("/api/load-config")
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return {}

@app.post("/api/save-config")
def save_config(config: ConfigData):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return {"message": "Configuration saved successfully"}

@app.post("/api/run-task/{task_name}")
def run_task(task_name: str):
    # Standardize names as requested (ALL CAPS)
    task_key = task_name.upper()
    
    if task_key == "ACCOUNTING":
        # logic: 
        # 1. Create Google Drive Folder (with Date/Name)
        # 2. Create Google Sheet inside folder
        # 3. Fetch Amazon SP + Ads Data (with refresh token handling)
        # 4. Populate Sheet
        return {"message": "ACCOUNTING task started: Creating sheet and syncing Amazon data..."}
        
    elif task_key == "SLACK_REPORT":
        # logic:
        # 1. Open Google Sheet
        # 2. Capture Screenshot
        # 3. Send to Slack Channel
        return {"message": "SLACK_REPORT task started: Sending sheet screenshot to Slack..."}
        
    elif task_key == "AUTOMATION":
        # logic:
        # 1. Run ACCOUNTING
        # 2. Run SLACK_REPORT
        # 3. Send notification (every hour)
        return {"message": "AUTOMATION task started: Running full hourly sync and notification..."}
    
    return {"message": f"Task {task_name} received"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
