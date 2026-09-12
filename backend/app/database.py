import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load variables from the .env file into the environment
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. Make sure a .env file exists in the "
        "backend/ folder and contains a DATABASE_URL value."
    )

# The engine manages the actual connection(s) to PostgreSQL
engine = create_engine(DATABASE_URL)

# SessionLocal is a factory that creates a new database session
# whenever we need to talk to the database (e.g. for one API request)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class that every SQLAlchemy model (table) will
# inherit from. It lets SQLAlchemy know which Python classes represent
# database tables.
Base = declarative_base()


def get_db():
    """
    Provides a database session to a route, and guarantees it is
    closed afterwards, even if an error occurs.

    FastAPI will call this automatically for any route that declares
    a dependency like: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
