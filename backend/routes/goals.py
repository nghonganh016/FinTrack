"""
routes/goals.py — /api/goals
Mirrors: page_goals.py + routes/goals.js
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from db import DBContext
from middleware.auth import verify_token

router = APIRouter()

class GoalCreate(BaseModel):
    goalName: str
    targetAmount: float
    savedAmount: float = 0.0
    icon: str = "🎯"
    targetDate: Optional[str] = None  # YYYY-MM-DD

class DepositBody(BaseModel):
    amount: float

@router.get("/")
def get_goals(user=Depends(verify_token)):
    with DBContext() as db:
        db.execute(
            """SELECT GoalID, GoalName, Icon,
                      CAST(TargetAmount AS DOUBLE) AS targetAmount,
                      CAST(SavedAmount AS DOUBLE) AS savedAmount, TargetDate
               FROM Goals WHERE UserID=%s ORDER BY GoalID""",
            (user["userID"],)
        )
        return db.fetchall()

@router.post("/", status_code=201)
def create_goal(body: GoalCreate, user=Depends(verify_token)):
    if body.targetAmount <= 0:
        raise HTTPException(400, "Target amount must be > 0")
    with DBContext() as db:
        db.execute(
            """INSERT INTO Goals (UserID, GoalName, Icon, TargetAmount, SavedAmount, TargetDate)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (user["userID"], body.goalName, body.icon,
             body.targetAmount, body.savedAmount, body.targetDate or None)
        )
        return {"goalID": db.lastrowid, "message": "Goal created"}

@router.patch("/{goal_id}/deposit")
def deposit(goal_id: int, body: DepositBody, user=Depends(verify_token)):
    if body.amount <= 0:
        raise HTTPException(400, "Amount must be > 0")
    with DBContext() as db:
        db.execute("SELECT GoalID FROM Goals WHERE GoalID=%s AND UserID=%s",
                   (goal_id, user["userID"]))
        if not db.fetchone():
            raise HTTPException(404, "Goal not found")
        db.execute(
            "UPDATE Goals SET SavedAmount=LEAST(SavedAmount+%s,TargetAmount) WHERE GoalID=%s AND UserID=%s",
            (body.amount, goal_id, user["userID"])
        )
        db.execute("SELECT CAST(SavedAmount AS DOUBLE) AS savedAmount FROM Goals WHERE GoalID=%s", (goal_id,))
        updated = db.fetchone()
    return {"message": "Deposit successful", "savedAmount": updated["savedAmount"]}

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, user=Depends(verify_token)):
    with DBContext() as db:
        db.execute("SELECT GoalID FROM Goals WHERE GoalID=%s AND UserID=%s",
                   (goal_id, user["userID"]))
        if not db.fetchone():
            raise HTTPException(404, "Goal not found")
        db.execute("DELETE FROM Goals WHERE GoalID=%s", (goal_id,))
    return {"message": "Goal deleted"}
