import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from dotenv import load_dotenv
from jose import jwt

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

if not JWT_SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY is not set. Make sure a .env file exists in the "
        "backend/ folder and contains a JWT_SECRET_KEY value."
    )


def hash_password(password: str) -> str:
    """
    Turns a plain-text password into a secure, irreversible hash.
    A random "salt" is baked into every hash, so hashing the same
    password twice produces two different results. This is what
    gets stored in the database (password_hash column) — never
    the real password.
    """
    password_bytes = password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Checks a plain-text password attempt (e.g. from a login form)
    against the hash stored in the database.
    Returns True if they match, False otherwise.
    """
    password_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token.

    `data` should contain non-sensitive identifying info (e.g. user id,
    email, role) — never the password or password_hash.

    The token is signed with JWT_SECRET_KEY, so the server can later
    verify it wasn't tampered with, and it carries its own expiration
    time ("exp") so it automatically stops being valid.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Verifies a JWT's signature and expiration, and returns its payload
    (the data that was stored in it at creation time).

    Raises jose.exceptions.JWTError if the token is invalid, was
    tampered with, or has expired. The caller is responsible for
    turning that into an appropriate HTTP error response.
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
