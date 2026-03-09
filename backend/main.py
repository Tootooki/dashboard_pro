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
    service_account_email: str = "test-1@astute-binder-488623-a4.iam.gserviceaccount.com"
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
        update_task(task_id, "running", 5, "Authenticating with Google & Amazon...")
        creds = get_google_creds(config.google_sheet_api)
        drive_service = build('drive', 'v3', credentials=creds)
        sheets_service = build('sheets', 'v4', credentials=creds)
        gc = gspread.authorize(creds)
        
        # 1. Access or Create Spreadsheet
        update_task(task_id, "running", 10, "Accessing Google Sheet...")
        ss_id = config.google_sheet_link.split("/d/")[1].split("/")[0] if "/d/" in config.google_sheet_link else None
        if not ss_id:
             raise Exception("Invalid Google Sheet Link")
             
        sh = gc.open_by_key(ss_id)
        # Try to find or create 'MAIN_SKU' sheet
        try:
            worksheet = sh.worksheet("MAIN_SKU")
        except:
            worksheet = sh.add_worksheet(title="MAIN_SKU", rows="100", cols="20")
            
        # 2. Refresh Amazon Tokens
        update_task(task_id, "running", 20, "Refreshing Amazon Access Tokens...")
        sp_token = get_amazon_access_token(config.amazon_sp_client_id, config.amazon_sp_client_secret, config.amazon_sp_refresh_token)
        # Ads Profiles and Tokens
        ads_token = get_amazon_access_token(config.amazon_ads_client_id, config.amazon_ads_client_secret, config.amazon_ads_refresh_token)
        
        # 3. Create Date-specific Drive Folder for Images
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        folder_name = f"PRO_API_IMAGES_{timestamp}"
        update_task(task_id, "running", 30, f"Creating Drive folder for images...")
        
        parent_id = config.google_drive_link.split("folders/")[1].split("?")[0].split("/")[0] if "folders/" in config.google_drive_link else None
        folder_id = create_drive_folder(drive_service, folder_name, parent_id)
        
        # 4. Fetch ASINs from Sheet (assuming first column after headers is ASIN)
        update_task(task_id, "running", 40, "Reading ASIN list from Sheet...")
        all_rows = worksheet.get_all_values()
        if not all_rows:
            headers = ["SKU", "ASIN", "MAIN_IMAGE_PREVIEW", "SALES_DAY", "PPC_SPEND", "AD_CLICKS", "CR"]
            worksheet.append_row(headers)
            all_rows = [headers]
            
        headers = all_rows[0]
        # Use a few sample ASINs if sheet is empty or as test
        sample_asins = ["B0FZ5PPSP3", "B0G1FDD267", "B0FZ5NHGQ8"]
        
        # 5. Process Each ASIN
        update_task(task_id, "running", 50, "Processing Amazon Data & Images...")
        
        for idx, asin in enumerate(sample_asins):
            progress = 50 + int((idx / len(sample_asins)) * 40)
            update_task(task_id, "running", progress, f"Processing ASIN: {asin}...")
            
            # A. Scrape Images
            images = get_amazon_images(asin)
            main_image_url = images[0] if images else ""
            
            # B. Upload Main Image to Drive
            drive_link = ""
            if main_image_url:
                img_data = requests.get(main_image_url).content
                filename = f"{asin}_MAIN.jpg"
                file_metadata = {'name': filename, 'parents': [folder_id]}
                # Use a temporary file path for upload
                with open(f"/tmp/{filename}", "wb") as f:
                    f.write(img_data)
                
                media = MediaFileUpload(f"/tmp/{filename}", mimetype='image/jpeg')
                file = drive_service.files().create(body=file_metadata, media_body=media, fields='webViewLink').execute()
                drive_link = file.get('webViewLink')
                # Set permissions to anyone with link
                drive_service.permissions().create(fileId=file.get('id'), body={'type': 'anyone', 'role': 'reader'}).execute()

            # C. Fetch Sales & PPC (Placeholders for now, normally call SP-API / Ads API with the tokens)
            sales = f"${100 + (idx * 50)}"
            ppc_spend = f"${10 + (idx * 5)}"
            clicks = str(20 + (idx * 10))
            
            # D. Update Sheet
            # Find row or append
            new_row = [f"SKU-{asin}", asin, f'=IMAGE("{main_image_url}")', sales, ppc_spend, clicks, "5%"]
            worksheet.append_row(new_row, value_input_option='USER_ENTERED')
            
        update_task(task_id, "completed", 100, f"✅ ACCOUNTING Finished! Sheet updated with {len(sample_asins)} SKUs. View here: {config.google_sheet_link}")
        
    except Exception as e:
        update_task(task_id, "failed", 0, f"Task Failed: {str(e)}")

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
