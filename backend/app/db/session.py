"""
Configuración de la sesión de base de datos
Maneja la conexión con PostgreSQL
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging

from app.config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================================
# CREAR ENGINE DE SQLALCHEMY
# ==================================
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexión antes de usar
    pool_size=10,        # Número de conexiones en el pool
    max_overflow=20,     # Conexiones adicionales si se necesitan
    echo=settings.DEBUG, # Mostrar SQL en consola si DEBUG=True
)

# ==================================
# CREAR SESSION FACTORY
# ==================================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ==================================
# DEPENDENCY PARA FASTAPI
# ==================================
def get_db() -> Generator[Session, None, None]:
    """
    Generador de sesiones de base de datos
    Se usa como dependencia en los endpoints de FastAPI
    
    Uso:
        @app.get("/facturas")
        def get_facturas(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================================
# FUNCIÓN PARA VERIFICAR CONEXIÓN
# ==================================
def verify_db_connection() -> bool:
    """
    Verifica que la conexión a la base de datos funcione
    """
    try:
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("✅ Conexión a la base de datos exitosa")
        return True
    except Exception as e:
        logger.error(f"❌ Error conectando a la base de datos: {e}")
        return False


# ==================================
# FUNCIÓN PARA CREAR TODAS LAS TABLAS
# ==================================
def create_tables():
    """
    Crea todas las tablas en la base de datos
    SOLO para desarrollo - en producción usar Alembic
    """
    from app.db.base import Base
    from app.db.models import factura, proveedor, item  # Importar modelos
    
    logger.info("🔨 Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Tablas creadas correctamente")