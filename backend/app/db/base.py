"""
Base declarativa de SQLAlchemy
Todos los modelos heredan de esta clase
"""

from sqlalchemy.orm import declarative_base

# Crear la clase base para todos los modelos
Base = declarative_base()

# Metadata para Alembic
metadata = Base.metadata