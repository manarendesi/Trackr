from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    position = Column(String, nullable=False) 
    link = Column(String, default="")
    status = Column(String, default="Must Apply")
    date_applied = Column(String, default="")
    location = Column(String, default="")
    cv_filename = Column(String, nullable=True)
    cv_title = Column(String, nullable=True)  # CV title column