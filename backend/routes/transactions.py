"""
routes/transactions.py — /api/transactions
Mirrors: page_transactions.py + routes/transactions.js
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from db import DBContext, get_connection
from middleware.auth import verify_token

router = APIRouter()

class TransactionCreate(BaseModel):
    type: str           # "Expense" | "Income"
    amount: float = Field(ge=0, le=999_999_999_999)
    date: str           # YYYY-MM-DD
    accountID: int
    description: Optional[str] = Field(default=None, max_length=255, pattern=r"^[a-zA-Z0-9_ ]+$")
    categoryID: Optional[int] = None

def _call_sp(conn, sp_name: str, in_params: list) -> str:
    """Call a stored procedure with an OUT error param, return error string."""
    cursor = conn.cursor(dictionary=True)
    var_name = "@sp_err"
    placeholders = ", ".join(["%s"] * len(in_params))
    cursor.execute(f"CALL {sp_name}({placeholders}, {var_name})", in_params)
    cursor.execute(f"SELECT {var_name} AS err")
    result = cursor.fetchone()
    cursor.close()
    return result["err"] or "" if result else ""

@router.get("/")
def list_transactions(
    search: str = Query(""),
    type: str = Query("All"),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    user=Depends(verify_token)
):
    uid = user["userID"]
    with DBContext() as db:
        db.execute(
            """SELECT e.ExpenseID AS id, e.ExpenseDate AS txdate, e.Description AS descr,
                      c.CategoryName AS category, e.CategoryID, b.AccountName,
                      e.AccountID, 'completed' AS status,
                      CAST(-e.Amount AS DOUBLE) AS amount, 'Expense' AS type
               FROM Expenses e
               JOIN ExpenseCategories c ON e.CategoryID=c.CategoryID
               LEFT JOIN BankAccounts b ON e.AccountID=b.AccountID
               WHERE e.UserID=%s""",
            (uid,)
        )
        expenses = db.fetchall()

        db.execute(
            """SELECT i.IncomeID AS id, i.IncomeDate AS txdate, i.Description AS descr,
                      'Income' AS category, NULL AS CategoryID, b.AccountName,
                      i.AccountID, 'completed' AS status,
                      CAST(i.Amount AS DOUBLE) AS amount, 'Income' AS type
               FROM Income i
               LEFT JOIN BankAccounts b ON i.AccountID=b.AccountID
               WHERE i.UserID=%s""",
            (uid,)
        )
        incomes = db.fetchall()

    rows = sorted(expenses + incomes, key=lambda r: str(r["txdate"]), reverse=True)

    if type != "All":
        rows = [r for r in rows if r["type"] == type]
    if search:
        s = search.lower()
        rows = [r for r in rows if s in (r["descr"] or "").lower() or s in r["category"].lower()]

    total = len(rows)
    return {"total": total, "rows": rows[offset: offset + limit]}

@router.get("/categories")
def get_categories(user=Depends(verify_token)):
    with DBContext() as db:
        db.execute("SELECT CategoryID, CategoryName FROM ExpenseCategories ORDER BY CategoryName")
        return db.fetchall()

@router.post("/", status_code=201)
def add_transaction(body: TransactionCreate, user=Depends(verify_token)):
    if body.type not in ("Expense", "Income"):
        raise HTTPException(400, "Type must be Expense or Income")
    if body.type == "Expense" and not body.categoryID:
        raise HTTPException(400, "Category required for expenses")
    if body.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    conn = get_connection()
    try:
        if body.type == "Expense":
            err = _call_sp(conn, "sp_AddExpense", [
                user["userID"], body.categoryID, body.accountID,
                body.amount, body.date, body.description
            ])
        else:
            err = _call_sp(conn, "sp_AddIncome", [
                user["userID"], body.accountID,
                body.amount, body.date, body.description
            ])
        conn.commit()
        if err:
            raise HTTPException(400, err)
        return {"message": "Transaction added successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, type: str = Query(...), user=Depends(verify_token)):
    if type not in ("Expense", "Income"):
        raise HTTPException(400, 'type must be Expense or Income')

    conn = get_connection()
    try:
        sp = "sp_DeleteExpense" if type == "Expense" else "sp_DeleteIncome"
        err = _call_sp(conn, sp, [tx_id, user["userID"]])
        conn.commit()
        if err:
            raise HTTPException(400, err)
        return {"message": f"{type} deleted successfully"}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(500, str(e))
    finally:
        conn.close()
