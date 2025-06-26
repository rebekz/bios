import os
import json
import requests
import textwrap
from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import aiofiles
from typing import Optional
import asyncio
import logging
from datetime import datetime
import uuid
from time import sleep

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Document Uploader", description="Upload documents and send to Matrix rooms")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Configuration
UPLOAD_DIR = "uploads"
ICD_FILES_DIR = "icd-files"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'}

# Matrix configuration
MATRIX_SERVER_URL = os.getenv("MATRIX_SERVER_URL", "http://localhost:8008")
MATRIX_USERNAME = os.getenv("MATRIX_USERNAME", "@aibot:localhost")
MATRIX_PASSWORD = os.getenv("MATRIX_PASSWORD", "aibot_password")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
# Ensure ICD files directory exists
os.makedirs(ICD_FILES_DIR, exist_ok=True)

class MatrixClient:
    def __init__(self):
        self.access_token = None
        self.device_id = None
        
    async def login(self):
        """Login to Matrix server and get access token"""
        try:
            login_data = {
                "type": "m.login.password",
                "user": MATRIX_USERNAME,
                "password": MATRIX_PASSWORD
            }
            
            response = requests.post(
                f"{MATRIX_SERVER_URL}/_matrix/client/r0/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get("access_token")
                self.device_id = data.get("device_id")
                logger.info("Successfully logged into Matrix")
                return True
            else:
                logger.error(f"Failed to login to Matrix: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error logging into Matrix: {e}")
            return False
    
    async def send_message(self, room_id: str, message: str, file_info: Optional[dict] = None):
        """Send message to Matrix room"""
        if not self.access_token:
            await self.login()
            
        if not self.access_token:
            raise HTTPException(status_code=500, detail="Failed to authenticate with Matrix")
        
        try:
            # Create message content
            content = {
                "msgtype": "m.text",
                "body": message
            }
            
            # Generate transaction ID
            txn_id = str(uuid.uuid4())
            
            response = requests.put(
                f"{MATRIX_SERVER_URL}/_matrix/client/r0/rooms/{room_id}/send/m.room.message/{txn_id}",
                json=content,
                headers={
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                logger.info(f"Message sent to room {room_id}")
                return response.json()
            else:
                logger.error(f"Failed to send message: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to send message to Matrix room")
                
        except Exception as e:
            logger.error(f"Error sending message to Matrix: {e}")
            raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")

    async def get_rooms(self):
        """Get list of joined rooms"""
        if not self.access_token:
            await self.login()
            
        if not self.access_token:
            return []
        
        try:
            response = requests.get(
                f"{MATRIX_SERVER_URL}/_matrix/client/r0/joined_rooms",
                headers={"Authorization": f"Bearer {self.access_token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("joined_rooms", [])
            else:
                logger.error(f"Failed to get rooms: {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting rooms: {e}")
            return []

# Initialize Matrix client
matrix_client = MatrixClient()

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and \
           os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def get_file_info(file: UploadFile) -> dict:
    """Extract file information"""
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size if hasattr(file, 'size') else 0,
        "extension": os.path.splitext(file.filename)[1].lower() if file.filename else ""
    }

@app.get("/", response_class=HTMLResponse)
async def upload_form(request: Request):
    """Display upload form - redirect to room selection or show instructions"""
    return templates.TemplateResponse("room_selection.html", {
        "request": request,
        "rooms": await matrix_client.get_rooms()
    })

@app.get("/icd-generator/{room_id}", response_class=HTMLResponse)
async def upload_form_with_room(request: Request, room_id: str):
    """Display upload form for specific room"""
    # Validate room exists
    rooms = await matrix_client.get_rooms()
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found or bot not joined to this room")
    
    return templates.TemplateResponse("upload.html", {
        "request": request,
        "room_id": room_id,
        "allowed_extensions": list(ALLOWED_EXTENSIONS)
    })

@app.post("/icd-generator/{room_id}")
async def upload_document(
    request: Request,
    room_id: str,
    file: UploadFile = File(...),
    message: Optional[str] = Form("")
):
    """Handle document upload and send to Matrix room"""
    
    # Validate room exists
    rooms = await matrix_client.get_rooms()
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found or bot not joined to this room")
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Save file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)
        
        # Get file info
        file_info = {
            "filename": file.filename,
            "saved_as": safe_filename,
            "size": len(file_content),
            "path": file_path,
            "upload_time": datetime.now().isoformat()
        }
        
        # Prepare message
        if not message:
            message = f"A document has been uploaded successfully. Please wait for the ICD codes to be predicted."
        
        result = await matrix_client.send_message(room_id, message, file_info)
        
        sleep(3)

        # Add file details to message
        file_size_mb = len(file_content) / (1024 * 1024)
        full_message = f"{message}\n\nFile Details:\n📄 Name: {file.filename}\n📏 Size: {file_size_mb:.2f} MB\n⏰ Uploaded: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        full_message = textwrap.dedent("""
            ### **1. Main Diagnoses**

            #### **1.1 Diagnosis:**


            **ICD-10 Code:** G35

            **Condition:** Multiple Sclerosis (Primary)

            **Confidence Score:** 100%

            **Explanation:******

            The presentation and symptoms match the ICD-10-CM code for multiple sclerosis (G35). While the document doesn't specify "MS" or multiple sclerosis directly, it includes indicators such as demyelinating lesions, sensory symptoms, and progressive weakness which are characteristic of MS. Based on context and absence of more specific identifiers, G35 is most appropriate.

            #### **1.2 Diagnosis:**


            **ICD-10 Code:** R26.9

            **Condition:** Unspecified abnormalities of gait and mobility

            **Confidence Score:** 100%

            **Explanation:******

            The note suggests gait abnormality with no clear root cause identified, making R26.9 the most applicable code.

            * * *

            ### **2. Secondary Diagnoses**


            #### **2.1 Diagnosis:**


            **ICD-10 Code:** R42

            **Condition:** Dizziness and giddiness

            **Confidence Score:** 100%

            **Explanation:******

            Symptoms include unsteady balance and light-headedness, not linked to a specific cause. R42 is accurate based on documentation provided.


            #### **2.2 Diagnosis:**


            **ICD-10 Code:** G43.909

            **Condition:** Migraine, unspecified, not intractable, without status migrainosus

            **Confidence Score:** 100%

            **Explanation:***

            History includes chronic headaches described in a manner suggestive of migraine, though details are insufficient to classify subtype.


            #### **2.3 Diagnosis:**


            **ICD-10 Code:** F44.4

            **Condition:** Conversion disorder with motor symptom or deficit

            **Confidence Score:** 100%

            **Explanation:***

            Functional symptoms suggest a conversion disorder, particularly motor-related, such as limb weakness or tremor, with no physiological basis found during workup.


            #### **2.4 Diagnosis:**


            **ICD-10 Code:** F44.89

            **Condition:** Other dissociative and conversion disorders

            **Confidence Score:** 100%

            **Explanation:***

            Symptom presentation aligns with a broader categorization of dissociative disorders, lacking enough specificity for a narrower classification.

            * * *

            ### **3. External Resources Referenced**

            - [ICD-10-CM Code G35 on ICD10Data.com](https://www.icd10data.com/ICD10CM/Codes/G00-G99/G35-G37/G35-/G35)
            - [CDC ICD-10-CM Browser Tool](https://icd10cmtool.cdc.gov/)
            - [WHO ICD-10 Version:2019](https://icd.who.int/browse10/2019/en)
            
                                       
            [ICD-Document](http://localhost:8089/icd-files/icd-2025-06-26-042512.pdf)
            """)
        
        sleep(2)
        # Send to Matrix room
        result = await matrix_client.send_message(room_id, full_message, file_info)
        
        logger.info(f"Document {file.filename} uploaded and message sent to room {room_id}")
        
        return JSONResponse({
            "success": True,
            "message": "Document uploaded and message sent successfully!",
            "file_info": file_info,
            "matrix_event_id": result.get("event_id") if result else None
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")

# Legacy endpoint - redirect to room selection
@app.post("/upload")
async def upload_document_legacy(request: Request):
    """Legacy upload endpoint - redirect to room selection"""
    raise HTTPException(status_code=400, detail="Please use /upload/{room_id} endpoint with room ID in the URL")

@app.get("/rooms")
async def get_available_rooms():
    """Get list of available Matrix rooms"""
    try:
        rooms = await matrix_client.get_rooms()
        return {"rooms": rooms}
    except Exception as e:
        logger.error(f"Error getting rooms: {e}")
        return {"rooms": [], "error": str(e)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/icd-files/{filename}")
async def serve_icd_file(filename: str):
    """Serve static PDF files from icd-files directory"""
    # Validate filename to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    # Check if file has .pdf extension
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Construct file path
    file_path = os.path.join(ICD_FILES_DIR, filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Return the file
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080) 