import uvicorn
import json
import os
import re
import time
import asyncio
import gspread
import requests
from datetime import datetime
from typing import Dict, List, Optional
from bs4 import BeautifulSoup
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

CONFIG_FILE = "config.json"
# Global store for task status polling
tasks_status: Dict[str, Dict] = {}

app = FastAPI(title="PRO_API Backend")

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

def update_task(task_id: str, status: str, progress: int, message: str):
    tasks_status[task_id] = {
        "status": status,
        "progress": progress,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/save-config")
def save_config(config: ConfigData):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return {"message": "Configuration saved successfully"}

@app.get("/api/task-status/{task_id}")
def get_task_status(task_id: str):
    if task_id in tasks_status:
        return tasks_status[task_id]
    return {"status": "not_found", "message": "Task ID not found"}

# --- HELPER FUNCTIONS ---

def get_amazon_access_token(client_id: str, client_secret: str, refresh_token: str):
    url = "https://api.amazon.com/auth/o2/token"
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret
    }
    response = requests.post(url, data=payload)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        raise Exception(f"Failed to refresh Amazon token: {response.text}")

def get_amazon_images(asin: str):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    }
    url = f"https://www.amazon.com/dp/{asin}"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200: return []
        soup = BeautifulSoup(response.text, 'html.parser')
        scripts = soup.find_all('script')
        images = []
        for script in scripts:
            if script.string and 'ImageBlockATF' in script.string:
                matches = re.finditer(r'"hiRes":"([^"]+)"', script.string)
                for m in matches: images.append(m.group(1))
                if not images:
                    matches = re.finditer(r'"large":"([^"]+)"', script.string)
                    for m in matches: images.append(m.group(1))
        # Unique and ordered
        seen = set()
        return [x for x in images if not (x in seen or seen.add(x))]
    except:
        return []

def get_google_creds(json_str: str):
    try:
        info = json.loads(json_str)
        return Credentials.from_service_account_info(info, scopes=[
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ])
    except Exception as e:
        raise Exception(f"Failed to parse Google API JSON: {str(e)}")

def create_drive_folder(drive_service, folder_name: str, parent_id: Optional[str] = None):
    file_metadata = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    if parent_id:
        file_metadata['parents'] = [parent_id]
    
    file = drive_service.files().create(body=file_metadata, fields='id').execute()
    folder_id = file.get('id')
    
    # Set permission to anyone with link
    permission = {'type': 'anyone', 'role': 'reader'}
    drive_service.permissions().create(fileId=folder_id, body=permission).execute()
    
    return folder_id

async def run_accounting_logic(task_id: str, config: ConfigData):
    try:
        update_task(task_id, "running", 5, "Authenticating with Google...")
        creds = get_google_creds(config.google_sheet_api)
        drive_service = build('drive', 'v3', credentials=creds)
        sheets_service = build('sheets', 'v4', credentials=creds)
        
        # 1. Create Folder
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"PRO_API_ACCOUNTING_{timestamp}"
        update_task(task_id, "running", 15, f"Creating Drive folder: {folder_name}...")
        
        # Extract parent folder ID from link if provided
        parent_id = None
        if "folders/" in config.google_drive_link:
            parent_id = config.google_drive_link.split("folders/")[1].split("?")[0].split("/")[0]
            
        folder_id = create_drive_folder(drive_service, folder_name, parent_id)
        
        # 2. Create Spreadsheet
        update_task(task_id, "running", 25, "Creating new Google Sheet...")
        spreadsheet_metadata = {
            'properties': {'title': f"Accounting_Report_{timestamp}"},
            'parents': [folder_id] # This doesn't work in create, need to move after or use drive service
        }
        # Actually create via Drive API to specify folder
        file_metadata = {
            'name': f"Accounting_Report_{timestamp}",
            'mimeType': 'application/vnd.google-apps.spreadsheet',
            'parents': [folder_id]
        }
        ss_file = drive_service.files().create(body=file_metadata, fields='id').execute()
        ss_id = ss_file.get('id')
        
        # 3. Amazon Data Fetching (Placeholder for real API calls)
        update_task(task_id, "running", 40, "Fetching detailed Amazon Sales & PPC metrics...")
        sp_token = get_amazon_access_token(config.amazon_sp_client_id, config.amazon_sp_client_secret, config.amazon_sp_refresh_token)
        ads_token = get_amazon_access_token(config.amazon_ads_client_id, config.amazon_ads_client_secret, config.amazon_ads_refresh_token)
        
        # 4. Image Processing & Sheet Population
        update_task(task_id, "running", 60, "Processing ASIN images and populating data...")
        # For simplicity, we assume a list of ASINs or fetch them from the account.
        # This is where we'd loop through SKUs, scrape images, upload to Drive, and write to Sheet.
        
        # --- SAMPLE DATA POPULATION ---
        gc = gspread.authorize(creds)
        sh = gc.open_by_key(ss_id)
        worksheet = sh.get_worksheet(0)
        worksheet.update_title("MAIN_SKU")
        
        headers = ["SKU", "ASIN", "IMAGE_PREVIEW", "SALES_DAY", "SALES_WEEK", "SALES_MONTH", "SALES_YEAR", "PPC_SPEND", "AD_CLICKS", "CR"]
        worksheet.append_row(headers)
        
        # Example Row
        # worksheet.append_row(["SAMPLE-SKU", "B0SAMPLE", '=IMAGE("...")', "$100", "$700", "$3000", "$35000", "$50", "200", "5%"], value_input_option='USER_ENTERED')
        
        # 5. Finalizing
        update_task(task_id, "running", 95, "Cleaning up and finalizing report...")
        
        link = f"https://docs.google.com/spreadsheets/d/{ss_id}/edit"
        update_task(task_id, "completed", 100, f"✅ ACCOUNTING finished! View Report: {link}")
        
    except Exception as e:
        update_task(task_id, "failed", 0, f"Task failed: {str(e)}")

@app.post("/api/run-task/{task_name}")
async def run_task(task_name: str, background_tasks: BackgroundTasks):
    task_key = task_name.upper()
    task_id = f"{task_key}_{int(time.time())}"
    
    # Load fresh config
    config_dict = load_config()
    current_config = ConfigData(**config_dict)
    
    tasks_status[task_id] = {"status": "starting", "progress": 0, "message": f"Initializing {task_key}..."}
    
    if task_key == "ACCOUNTING":
        background_tasks.add_task(run_accounting_logic, task_id, current_config)
        return {"task_id": task_id, "message": "ACCOUNTING task started in background"}
        
    elif task_key == "SLACK_REPORT":
        return {"task_id": task_id, "message": "SLACK_REPORT task logic pending..."}
        
    elif task_key == "AUTOMATION":
        return {"task_id": task_id, "message": "AUTOMATION task logic pending..."}
    
    return {"message": f"Task {task_name} received"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
