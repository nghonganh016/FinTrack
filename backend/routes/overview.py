"""
routes/overview.py — /api/overview
"""
from fastapi import APIRouter, Depends, Query
from datetime import date as _date
import calendar
from db import DBContext
from middleware.auth import verify_token

router = APIRouter()

@router.get("/summary")
def summary(user=Depends(verify_token)):
    uid = user["userID"]
    with DBContext() as db:
        db.execute(
            """SELECT GetTotalIncome(%s) AS totalIncome,
                      GetTotalExpense(%s) AS totalExpense,
                      GetBudgetStatus(%s) AS budgetStatus,
                      CAST(COALESCE(
                        (SELECT SUM(Balance) FROM BankAccounts WHERE UserID=%s),0
                      ) AS DOUBLE) AS totalBalance""",
            (uid, uid, uid, uid)
        )
        kpi = db.fetchone()
    inc = float(kpi["totalIncome"])
    exp = float(kpi["totalExpense"])
    return {
        "totalIncome":  inc,
        "totalExpense": exp,
        "netSavings":   max(inc - exp, 0),
        "budgetStatus": kpi["budgetStatus"],
        "totalBalance": kpi["totalBalance"],
    }

@router.get("/monthly")
def monthly(year: int = None, accountID: int = None, user=Depends(verify_token)):
    uid  = user["userID"]
    year = year or _date.today().year
    with DBContext() as db:
        if accountID:
            db.execute("SELECT Month, CAST(TotalIncome AS DOUBLE) AS v FROM MonthlyIncomeByAccount WHERE UserID=%s AND AccountID=%s AND Year=%s", (uid, accountID, year))
            inc_map = {r["Month"]: r["v"] for r in db.fetchall()}
            db.execute("SELECT Month, CAST(TotalExpense AS DOUBLE) AS v FROM MonthlyExpenseByAccount WHERE UserID=%s AND AccountID=%s AND Year=%s", (uid, accountID, year))
            exp_map = {r["Month"]: r["v"] for r in db.fetchall()}
        else:
            db.execute("SELECT Month, CAST(TotalIncome AS DOUBLE) AS v FROM MonthlyIncomeSummary WHERE UserID=%s AND Year=%s", (uid, year))
            inc_map = {r["Month"]: r["v"] for r in db.fetchall()}
            db.execute("SELECT Month, CAST(TotalExpense AS DOUBLE) AS v FROM MonthlyExpenseSummary WHERE UserID=%s AND Year=%s", (uid, year))
            exp_map = {r["Month"]: r["v"] for r in db.fetchall()}

    MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [{"month": MONTHS[i], "monthNo": i+1, "income": inc_map.get(i+1,0), "expense": exp_map.get(i+1,0)}
            for i in range(12)]

@router.get("/yearly")
def yearly(accountID: int = None, user=Depends(verify_token)):
    uid = user["userID"]
    cur = _date.today().year
    years = [cur-2, cur-1, cur]
    with DBContext() as db:
        if accountID:
            db.execute(f"SELECT Year, CAST(SUM(TotalIncome) AS DOUBLE) AS v FROM MonthlyIncomeByAccount WHERE UserID=%s AND AccountID=%s AND Year IN ({','.join(['%s']*3)}) GROUP BY Year", (uid, accountID, *years))
        else:
            db.execute(f"SELECT Year, CAST(SUM(TotalIncome) AS DOUBLE) AS v FROM MonthlyIncomeSummary WHERE UserID=%s AND Year IN ({','.join(['%s']*3)}) GROUP BY Year", (uid, *years))
        inc_map = {r["Year"]: r["v"] for r in db.fetchall()}
        if accountID:
            db.execute(f"SELECT Year, CAST(SUM(TotalExpense) AS DOUBLE) AS v FROM MonthlyExpenseByAccount WHERE UserID=%s AND AccountID=%s AND Year IN ({','.join(['%s']*3)}) GROUP BY Year", (uid, accountID, *years))
        else:
            db.execute(f"SELECT Year, CAST(SUM(TotalExpense) AS DOUBLE) AS v FROM MonthlyExpenseSummary WHERE UserID=%s AND Year IN ({','.join(['%s']*3)}) GROUP BY Year", (uid, *years))
        exp_map = {r["Year"]: r["v"] for r in db.fetchall()}
    return [{"year": y, "income": inc_map.get(y,0), "expense": exp_map.get(y,0)} for y in years]

@router.get("/daily")
def daily(year: int = None, month: int = None, accountID: int = None, user=Depends(verify_token)):
    uid   = user["userID"]
    today = _date.today()
    year  = year  or today.year
    month = month or today.month
    days  = calendar.monthrange(year, month)[1]
    acc   = "AND AccountID=%s" if accountID else ""
    params_base = (uid, year, month) + ((accountID,) if accountID else ())
    with DBContext() as db:
        db.execute(f"SELECT DAY(IncomeDate) AS d, CAST(SUM(Amount) AS DOUBLE) AS v FROM Income WHERE UserID=%s AND YEAR(IncomeDate)=%s AND MONTH(IncomeDate)=%s {acc} GROUP BY DAY(IncomeDate)", params_base)
        inc_map = {r["d"]: r["v"] for r in db.fetchall()}
        db.execute(f"SELECT DAY(ExpenseDate) AS d, CAST(SUM(Amount) AS DOUBLE) AS v FROM Expenses WHERE UserID=%s AND YEAR(ExpenseDate)=%s AND MONTH(ExpenseDate)=%s {acc} GROUP BY DAY(ExpenseDate)", params_base)
        exp_map = {r["d"]: r["v"] for r in db.fetchall()}
    return [{"day": d, "income": inc_map.get(d,0), "expense": exp_map.get(d,0)} for d in range(1, days+1)]

@router.get("/expense-breakdown")
def expense_breakdown(
    period: str = Query("all", regex="^(daily|monthly|yearly|all)$"),
    user=Depends(verify_token)
):
    """
    Return expense breakdown by category, filtered by period:
      - daily:   today only
      - monthly: current calendar month
      - yearly:  current calendar year
      - all:     all-time (default)
    """
    uid   = user["userID"]
    today = _date.today()

    if period == "daily":
        date_filter = "AND DATE(ExpenseDate) = %s"
        params = (uid, today.isoformat())
    elif period == "monthly":
        date_filter = "AND YEAR(ExpenseDate) = %s AND MONTH(ExpenseDate) = %s"
        params = (uid, today.year, today.month)
    elif period == "yearly":
        date_filter = "AND YEAR(ExpenseDate) = %s"
        params = (uid, today.year)
    else:  # all-time
        date_filter = ""
        params = (uid,)

    with DBContext() as db:
        db.execute(
            f"""SELECT c.CategoryName,
                       CAST(SUM(e.Amount) AS DOUBLE) AS totalSpent
                FROM Expenses e
                JOIN ExpenseCategories c ON e.CategoryID = c.CategoryID
                WHERE e.UserID = %s {date_filter}
                GROUP BY c.CategoryName
                ORDER BY totalSpent DESC""",
            params
        )
        rows = db.fetchall()

    total = sum(r["totalSpent"] for r in rows)
    return {
        "total": total,
        "period": period,
        "categories": [
            {**r, "pct": r["totalSpent"] / total * 100 if total > 0 else 0}
            for r in rows
        ]
    }

@router.get("/export")
def export(user=Depends(verify_token)):
    uid = user["userID"]
    with DBContext() as db:
        db.execute("SELECT 'Expense' AS type, e.ExpenseDate AS date, e.Description AS description, c.CategoryName AS category, CAST(e.Amount AS DOUBLE) AS amount FROM Expenses e JOIN ExpenseCategories c ON e.CategoryID=c.CategoryID WHERE e.UserID=%s", (uid,))
        expenses = db.fetchall()
        db.execute("SELECT 'Income' AS type, IncomeDate AS date, Description, 'Income' AS category, CAST(Amount AS DOUBLE) AS amount FROM Income WHERE UserID=%s", (uid,))
        incomes = db.fetchall()
    rows = sorted(expenses + incomes, key=lambda r: str(r["date"]), reverse=True)
    return rows