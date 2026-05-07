"""
routes/auth.py — /api/auth (register + login)
"""
import os, bcrypt, jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from db import DBContext
from limiter import limiter

router = APIRouter()

class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_ ]+$")
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: str | None = Field(default=None, pattern=r"^0\d{9,10}$")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def sign_token(user_id: int, email: str) -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not config in .env")
    expires = os.getenv("JWT_EXPIRES_IN", "7d")
    days = int(expires.replace("d", "")) if "d" in expires else 7
    payload = {
        "userID": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=days),
    }
    return jwt.encode(payload, secret, algorithm="HS256")

@router.post("/register", status_code=201)
def register(request: Request, body: RegisterRequest):
    if len(body.password) < 6:
        raise HTTPException(400, "Password min 6 characters")

    with DBContext() as db:
        db.execute("SELECT UserID FROM Users WHERE Email = %s", (body.email,))
        if db.fetchone():
            raise HTTPException(409, "Email already registered")

        hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(rounds=12)).decode()
        db.execute(
            "INSERT INTO Users (UserName, Email, PhoneNumber, PasswordHash) VALUES (%s,%s,%s,%s)",
            (body.username, body.email, body.phone or None, hashed)
        )
        user_id = db.lastrowid

    user = {"UserID": user_id, "UserName": body.username,
            "Email": body.email, "PhoneNumber": body.phone}
    return {"message": "Account created successfully", "token": sign_token(user_id, body.email), "user": user}

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest):
    with DBContext() as db:
        db.execute(
            "SELECT UserID, UserName, Email, PhoneNumber, PasswordHash FROM Users WHERE Email = %s",
            (body.email,)
        )
        user = db.fetchone()

    if not user or not bcrypt.checkpw(body.password.encode(), user["PasswordHash"].encode()):
        raise HTTPException(401, "Email or incorrect password")

    safe_user = {k: v for k, v in user.items() if k != "PasswordHash"}
    return {"message": "Login successful", "token": sign_token(user["UserID"], user["Email"]), "user": safe_user}