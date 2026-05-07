"""
routes/budgets.py — /api/budgets
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from db import DBContext
from middleware.auth import verify_token

router = APIRouter()

class BudgetItem(BaseModel):
    categoryID: int
    limitAmount: float

class BudgetBatch(BaseModel):
    budgets: List[BudgetItem]

@router.get("/")
def get_budgets(user=Depends(verify_token)):
    uid = user["userID"]
    with DBContext() as db:
        db.execute(
            """SELECT c.CategoryID, c.CategoryName,
                      CAST(COALESCE(b.LimitAmount,0) AS DOUBLE) AS limitAmount,
                      CAST(COALESCE(cs.TotalSpent,0) AS DOUBLE) AS spent
               FROM ExpenseCategories c
               LEFT JOIN Budgets b ON b.CategoryID=c.CategoryID AND b.UserID=%s
               LEFT JOIN CategorySpendingSummary cs ON cs.CategoryName=c.CategoryName AND cs.UserID=%s
               ORDER BY c.CategoryName""",
            (uid, uid)
        )
        rows = db.fetchall()
    total_budget = sum(r["limitAmount"] for r in rows)
    total_spent  = sum(r["spent"] for r in rows)
    return {"summary": {"totalBudget": total_budget, "totalSpent": total_spent,
                        "remaining": total_budget - total_spent}, "categories": rows}

@router.put("/")
def save_budgets(body: BudgetBatch, user=Depends(verify_token)):
    uid = user["userID"]
    with DBContext() as db:
        for item in body.budgets:
            db.execute(
                """INSERT INTO Budgets (UserID, CategoryID, LimitAmount) VALUES (%s,%s,%s)
                   ON DUPLICATE KEY UPDATE LimitAmount=VALUES(LimitAmount)""",
                (uid, item.categoryID, item.limitAmount)
            )
    return {"message": "Budgets saved successfully"}

@router.put("/{category_id}")
def update_budget(category_id: int, body: BudgetItem, user=Depends(verify_token)):
    with DBContext() as db:
        db.execute(
            """INSERT INTO Budgets (UserID, CategoryID, LimitAmount) VALUES (%s,%s,%s)
               ON DUPLICATE KEY UPDATE LimitAmount=VALUES(LimitAmount)""",
            (user["userID"], category_id, body.limitAmount)
        )
    return {"message": "Budget updated"}
