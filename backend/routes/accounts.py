"""
routes/accounts.py — /api/accounts
Mirrors: page_accounts.py + routes/accounts.js
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import DBContext
from middleware.auth import verify_token

router = APIRouter()

ACCOUNT_TYPES = ["Cash", "Bank Account", "Credit Card", "Investment", "E-Wallet", "Other"]

class AccountCreate(BaseModel):
    accountName: str
    accountType: str
    bankName: Optional[str] = None
    provider: Optional[str] = None
    balance: float = 0.0

@router.get("/")
def get_accounts(user=Depends(verify_token)):
    with DBContext() as db:
        db.execute(
            """SELECT AccountID, AccountName, AccountType, BankName, Provider,
                      CAST(Balance AS DOUBLE) AS Balance
               FROM BankAccounts WHERE UserID = %s ORDER BY AccountID""",
            (user["userID"],)
        )
        return db.fetchall()

@router.get("/summary")
def get_summary(user=Depends(verify_token)):
    with DBContext() as db:
        db.execute(
            """SELECT CAST(COALESCE(SUM(Balance),0) AS DOUBLE) AS netWorth,
                      CAST(COALESCE(SUM(CASE WHEN Balance>0 THEN Balance END),0) AS DOUBLE) AS totalAssets,
                      CAST(COALESCE(ABS(SUM(CASE WHEN Balance<0 THEN Balance END)),0) AS DOUBLE) AS totalLiabilities,
                      COUNT(*) AS accountCount
               FROM BankAccounts WHERE UserID = %s""",
            (user["userID"],)
        )
        return db.fetchone()

@router.post("/", status_code=201)
def create_account(body: AccountCreate, user=Depends(verify_token)):
    if body.accountType not in ACCOUNT_TYPES:
        raise HTTPException(400, "Invalid account type")
    if body.accountType in ("Bank Account", "Credit Card") and not body.bankName:
        raise HTTPException(400, "Bank name required")
    if body.accountType == "E-Wallet" and not body.provider:
        raise HTTPException(400, "Provider required for E-Wallet")

    bank = body.bankName if body.accountType in ("Bank Account", "Credit Card") else None
    prov = body.provider if body.accountType == "E-Wallet" else None

    with DBContext() as db:
        db.execute(
            """INSERT INTO BankAccounts (UserID, AccountName, AccountType, BankName, Provider, Balance)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (user["userID"], body.accountName, body.accountType, bank, prov, body.balance)
        )
        return {"accountID": db.lastrowid, "message": "Account created"}

@router.delete("/{account_id}")
def delete_account(account_id: int, user=Depends(verify_token)):
    with DBContext() as db:
        db.execute("SELECT AccountID FROM BankAccounts WHERE AccountID=%s AND UserID=%s",
                   (account_id, user["userID"]))
        if not db.fetchone():
            raise HTTPException(404, "Account not found")

        # Check for existing transactions linked to this account
        db.execute("SELECT COUNT(*) AS cnt FROM Income WHERE AccountID=%s AND UserID=%s",
                   (account_id, user["userID"]))
        income_count = db.fetchone()["cnt"]

        db.execute("SELECT COUNT(*) AS cnt FROM Expenses WHERE AccountID=%s AND UserID=%s",
                   (account_id, user["userID"]))
        expense_count = db.fetchone()["cnt"]

        total = income_count + expense_count
        if total > 0:
            raise HTTPException(
                400,
                f"Cannot delete this account because it has {total} linked transaction(s). "
                f"Please delete all transactions from this account first."
            )

        db.execute("DELETE FROM BankAccounts WHERE AccountID=%s", (account_id,))
    return {"message": "Account deleted"}