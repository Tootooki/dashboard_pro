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
    # Depending on task_name, run the specific python automation script
    if task_name == "download_accounting_sheet":
        # Here we would call the existing python scripts
        pass
    
    return {"message": f"Task {task_name} started"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
