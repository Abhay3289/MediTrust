"""
Run this once to create all database tables defined by the SQLAlchemy
models (currently just `users`).

Safe to re-run: create_all() only creates tables that do not already
exist. It never deletes or modifies existing tables or data.
"""

from app import models  # noqa: F401 (import so models register with Base.metadata)
from app.database import Base, engine

if __name__ == "__main__":
    print("Creating tables (if they do not already exist)...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables now known to SQLAlchemy:", list(Base.metadata.tables.keys()))
