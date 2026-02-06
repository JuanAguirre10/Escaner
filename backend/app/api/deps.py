"""
Dependencias reutilizables para FastAPI
"""

from typing import Generator
from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Generador de sesiones de base de datos
    Se usa como dependencia en los endpoints
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()