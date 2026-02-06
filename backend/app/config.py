"""
Configuración central de la aplicación
Carga variables de entorno desde .env
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """
    Configuración de la aplicación usando Pydantic Settings
    Lee automáticamente las variables del archivo .env
    """
    
    # ==================================
    # INFORMACIÓN DEL PROYECTO
    # ==================================
    PROJECT_NAME: str = "Sistema de Facturas SUPERVAN"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    
    # ==================================
    # BASE DE DATOS POSTGRESQL
    # ==================================
    DATABASE_URL: str
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "facturas_db"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "1234"
    
    # ==================================
    # GOOGLE VISION API
    # ==================================
    GOOGLE_APPLICATION_CREDENTIALS: str
    
    @property
    def google_credentials_path(self) -> Path:
        """Retorna la ruta completa al archivo de credenciales"""
        base_dir = Path(__file__).resolve().parent.parent
        return base_dir / self.GOOGLE_APPLICATION_CREDENTIALS
    
    # ==================================
    # ARCHIVOS Y UPLOADS
    # ==================================
    UPLOAD_DIR: str = "uploads/facturas"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg"
    
    @property
    def upload_path(self) -> Path:
        """Retorna la ruta completa de uploads"""
        base_dir = Path(__file__).resolve().parent.parent
        upload_path = base_dir / self.UPLOAD_DIR
        upload_path.mkdir(parents=True, exist_ok=True)
        return upload_path
    
    @property
    def allowed_extensions_list(self) -> list[str]:
        """Retorna las extensiones permitidas como lista"""
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    # ==================================
    # OCR CONFIGURACIÓN
    # ==================================
    OCR_LANGUAGE: str = "spa"
    OCR_CONFIDENCE_THRESHOLD: float = 80.0
    AUTO_APPROVE_CONFIDENCE: float = 98.0
    
    # ==================================
    # DATOS DE LA EMPRESA (SUPERVAN)
    # ==================================
    EMPRESA_RUC: str = "20516185211"
    EMPRESA_RAZON_SOCIAL: str = "SUPERVAN S.A.C."
    EMPRESA_DIRECCION: str = "AV. ELMER FAUCETT 5104 URB. LAS FRESAS CALLAO"
    
    # ==================================
    # SEGURIDAD (PARA FUTURO)
    # ==================================
    SECRET_KEY: str = "tu-clave-secreta-super-segura-cambiala-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # ==================================
    # CORS (para frontend React)
    # ==================================
    @property
    def backend_cors_origins(self) -> list[str]:
        """Retorna los orígenes CORS permitidos"""
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ]
    
    class Config:
        """Configuración de Pydantic"""
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


# ==================================
# INSTANCIA GLOBAL DE CONFIGURACIÓN
# ==================================
settings = Settings()


# ==================================
# FUNCIÓN PARA VALIDAR CONFIGURACIÓN
# ==================================
def validate_settings():
    """
    Valida que todas las configuraciones críticas estén correctas
    """
    errors = []
    
    # Validar que existe el archivo de credenciales de Google
    if not settings.google_credentials_path.exists():
        errors.append(
            f"❌ No se encuentra el archivo de credenciales de Google Vision: "
            f"{settings.google_credentials_path}"
        )
    
    # Validar DATABASE_URL
    if not settings.DATABASE_URL:
        errors.append("❌ DATABASE_URL no está configurada en .env")
    
    # Validar directorio de uploads
    try:
        settings.upload_path.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        errors.append(f"❌ No se puede crear directorio de uploads: {e}")
    
    # Si hay errores, mostrarlos
    if errors:
        print("\n" + "="*60)
        print("⚠️  ERRORES DE CONFIGURACIÓN:")
        print("="*60)
        for error in errors:
            print(error)
        print("="*60 + "\n")
        raise ValueError("La configuración tiene errores. Revisa el archivo .env")
    
    # Si todo OK, mostrar resumen
    print("\n" + "="*60)
    print("✅ CONFIGURACIÓN CARGADA CORRECTAMENTE")
    print("="*60)
    print(f"📦 Proyecto: {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}")
    print(f"🗄️  Base de datos: {settings.DB_NAME}@{settings.DB_HOST}:{settings.DB_PORT}")
    print(f"🔑 Google Vision: {settings.google_credentials_path.name}")
    print(f"📁 Uploads: {settings.upload_path}")
    print(f"📎 Extensiones: {settings.allowed_extensions_list}")
    print(f"🌐 CORS Origins: {len(settings.backend_cors_origins)} permitidos")
    print("="*60 + "\n")


# ==================================
# VALIDAR AL IMPORTAR EL MÓDULO
# ==================================
if __name__ != "__main__":
    validate_settings()