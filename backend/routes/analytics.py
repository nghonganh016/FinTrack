"""
routes/analytics.py — /api/analytics
"""
from fastapi import APIRouter, Depends, Query
from db import DBContext
from middleware.auth import verify_token

router = APIRouter()

@router.get("/trend")
def get_trend(months: int = Query(12, ge=1, le=36), user=Depends(verify_token)):
    uid = user["userID"]
    with DBContext() as db:
        db.execute(
            """SELECT CONCAT(Year,'-',LPAD(Month,2,'0')) AS ym,
                       CAST(TotalIncome AS DOUBLE) AS totalIncome
                FROM MonthlyIncomeSummary WHERE UserID=%s
                ORDER BY Year DESC, Month DESC LIMIT %s""",
            (uid, months)
        )
        inc_rows = db.fetchall()

        db.execute(
            """SELECT CONCAT(Year,'-',LPAD(Month,2,'0')) AS ym,
                       CAST(TotalExpense AS DOUBLE) AS totalExpense
                FROM MonthlyExpenseSummary WHERE UserID=%s
                ORDER BY Year DESC, Month DESC LIMIT %s""",
            (uid, months)
        )
        exp_rows = db.fetchall()

    all_months = sorted(set([r["ym"] for r in inc_rows] + [r["ym"] for r in exp_rows]))[-months:]
    inc_map = {r["ym"]: r["totalIncome"] for r in inc_rows}
    exp_map = {r["ym"]: r["totalExpense"] for r in exp_rows}

    data = []
    for ym in all_months:
        inc = inc_map.get(ym, 0)
        exp = exp_map.get(ym, 0)
        data.append({"month": ym, "income": inc, "expense": exp, "savings": max(inc - exp, 0)})

    avg = lambda lst: sum(lst) / len(lst) if lst else 0
    summary = {
        "avgIncome":  avg([d["income"]  for d in data]),
        "avgExpense": avg([d["expense"] for d in data]),
        "avgSavings": avg([d["savings"] for d in data]),
        "months": len(data),
    }
    return {"data": data, "summary": summary}

@router.get("/categories")
def get_categories(user=Depends(verify_token)):
    with DBContext() as db:
        db.execute(
            """SELECT CategoryName, CAST(TotalSpent AS DOUBLE) AS totalSpent
               FROM CategorySpendingSummary WHERE UserID=%s ORDER BY TotalSpent DESC""",
            (user["userID"],)
        )
        rows = db.fetchall()
    total = sum(r["totalSpent"] for r in rows)
    data = [{**r, "rank": i+1, "pct": r["totalSpent"]/total*100 if total > 0 else 0}
            for i, r in enumerate(rows)]
    return {"total": total, "categories": data}

@router.get("/monthly-categories")
def monthly_categories(months: int = Query(12, le=36), user=Depends(verify_token)):
    limit = months * 8
    with DBContext() as db:
        db.execute(
            """SELECT CategoryName,
                       CONCAT(Year,'-',LPAD(Month,2,'0')) AS ym,
                       CAST(TotalSpent AS DOUBLE) AS totalSpent
                FROM MonthlyCategoryExpense WHERE UserID=%s
                ORDER BY Year DESC, Month DESC LIMIT %s""",
            (user["userID"], limit)
        )
        return db.fetchall()
