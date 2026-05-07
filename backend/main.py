from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from limiter import limiter

load_dotenv()

from routes import auth, accounts, transactions, budgets, goals, analytics, overview, settings
from db import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅  FinTrack FastAPI Backend starting...")
    yield
    print("Server shutting down")

app = FastAPI(title="FinTrack API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.64.1:5173",
    "http://192.168.1.237:5173",
    f"http://{os.getenv('LOCAL_IP', '')}:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o != "http://:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(accounts.router,     prefix="/api/accounts",     tags=["Accounts"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(budgets.router,      prefix="/api/budgets",      tags=["Budgets"])
app.include_router(goals.router,        prefix="/api/goals",        tags=["Goals"])
app.include_router(analytics.router,    prefix="/api/analytics",    tags=["Analytics"])
app.include_router(overview.router,     prefix="/api/overview",     tags=["Overview"])
app.include_router(settings.router,     prefix="/api/settings",     tags=["Settings"])

@app.get("/health")
async def health():
    from datetime import datetime
    return {"status": "ok", "time": datetime.utcnow().isoformat(), "env": os.getenv("NODE_ENV", "development")}