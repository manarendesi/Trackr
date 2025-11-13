from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
from . import models, schemas, database

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Allow frontend to talk to backend (CORS = Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains (change in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Folder to store uploaded CV files
UPLOAD_DIR = "static/cv_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve CV files to frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

# Get database connection
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Application Tracker API is running 🚀"}

# Upload CV file
@app.post("/upload-cv/")
async def upload_cv(file: UploadFile = File(...)):
    try:
        # Create unique filename
        filename = f"cv_{len(os.listdir(UPLOAD_DIR)) + 1}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"filename": filename}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

# Get all unique CV filenames and titles for dropdown
@app.get("/previous-cvs/")
def get_previous_cvs(db: Session = Depends(get_db)):
    # Get applications that have CVs
    apps_with_cvs = db.query(models.Application).filter(
        models.Application.cv_filename.isnot(None)
    ).all()
    
    # Create list of unique CVs with their titles
    cvs = {}
    for app in apps_with_cvs:
        if app.cv_filename:
            cvs[app.cv_filename] = app.cv_title or app.cv_filename
    
    # Convert to list for frontend
    cv_list = [{"filename": filename, "title": title} for filename, title in cvs.items()]
    return cv_list

# Create new job application
@app.post("/applications/", response_model=schemas.ApplicationResponse)
def create_application(app_data: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    try:
        print("Received data:", app_data.dict())  # Debug: see what we're getting
        
        new_app = models.Application(**app_data.dict())
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        
        print("Created application:", new_app.id)  # Debug: confirm creation
        return new_app
        
    except Exception as e:
        print("Error creating application:", str(e))  # Debug: see the error
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error creating application: {str(e)}")

# Get all job applications
@app.get("/applications/", response_model=list[schemas.ApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    return db.query(models.Application).all()

# Get one job application by ID
@app.get("/applications/{app_id}", response_model=schemas.ApplicationResponse)
def get_application(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj

# Update job application
@app.put("/applications/{app_id}", response_model=schemas.ApplicationResponse)
def update_application(app_id: int, updated_data: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    app_obj = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    # Update all fields
    for key, value in updated_data.dict().items():
        setattr(app_obj, key, value)
    db.commit()
    db.refresh(app_obj)
    return app_obj

# Delete job application
@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_obj = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_obj)
    db.commit()
    return {"message": f"Application {app_id} deleted successfully ✅"}

# Debug route to see database table structure
@app.get("/debug-table")
def debug_table(db: Session = Depends(get_db)):
    # This will show the current table columns
    result = db.execute("PRAGMA table_info(applications)")
    columns = result.fetchall()
    return {"table_columns": columns}