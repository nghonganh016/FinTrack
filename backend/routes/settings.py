"""
routes/settings.py — /api/settings
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from db import DBContext, get_connection
from middleware.auth import verify_token

router = APIRouter()

class ProfileUpdate(BaseModel):
    userName: str = Field(min_length=3, max_length=100, pattern=r"^[a-zA-Z0-9_ ]+$")
    phoneNumber: Optional[str] = Field(default=None, pattern=r"^0\d{9,10}$")

class DeleteAccount(BaseModel):
    email: EmailStr

@router.get("/profile")
def get_profile(user=Depends(verify_token)):
    with DBContext() as db:
        db.execute("SELECT UserID, UserName, Email, PhoneNumber FROM Users WHERE UserID=%s", (user["userID"],))
        row = db.fetchone()
    if not row:
        raise HTTPException(404, "User not found")
    return row

@router.patch("/profile")
def update_profile(body: ProfileUpdate, user=Depends(verify_token)):
    if not body.userName.strip():
        raise HTTPException(400, "Full name is required")
    with DBContext() as db:
        db.execute("UPDATE Users SET UserName=%s, PhoneNumber=%s WHERE UserID=%s",
                   (body.userName, body.phoneNumber or None, user["userID"]))
    return {"message": "Profile updated successfully"}

@router.delete("/account")
def delete_account(body: DeleteAccount, user=Depends(verify_token)):
    uid = user["userID"]
    with DBContext() as db:
        db.execute("SELECT Email FROM Users WHERE UserID=%s", (uid,))
        row = db.fetchone()
    if not row:
        raise HTTPException(404, "User not found")
    if row["Email"] != body.email:
        raise HTTPException(400, "Email does not match — deletion cancelled")

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.callproc("sp_DeleteUser", (uid,))
        conn.commit()
        cursor.close()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
