from pydantic import BaseModel
from typing import Optional

# Data structure for creating new applications
class ApplicationCreate(BaseModel):
    company: str
    position: str
    link: Optional[str] = ""
    status: str = "Must Apply"
    date_applied: Optional[str] = ""
    location: Optional[str] = ""
    cv_filename: Optional[str] = None
    cv_title: Optional[str] = None  # CV title field

# Data structure for response
class ApplicationResponse(BaseModel):
    id: int
    company: str
    position: str
    link: str
    status: str
    date_applied: str
    location: str
    cv_filename: Optional[str] = None
    cv_title: Optional[str] = None  # CV title field

    class Config:
        from_attributes = True  # This replaces orm_mode = True