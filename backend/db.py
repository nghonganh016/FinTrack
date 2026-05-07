"""
db.py — MySQL connection using mysql-connector-python
"""
import os
import mysql.connector
from mysql.connector import pooling
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", "3306")),
    "user":     os.getenv("DB_USER", "finance_app"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME", "PersonalFinance"),
    "charset":  "utf8mb4",
    "autocommit": False,
}

# Connection pool
_pool = None

def get_pool():
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="fintrack",
            pool_size=10,
            **DB_CONFIG
        )
    return _pool

def get_connection():
    """Get a connection from the pool."""
    return get_pool().get_connection()

class DBContext:
    """Context manager for DB connections with auto-commit/rollback."""
    def __init__(self):
        self.conn = None
        self.cursor = None

    def __enter__(self):
        self.conn = get_connection()
        self.cursor = self.conn.cursor(dictionary=True)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()
        self.cursor.close()
        self.conn.close()
        return False

    def execute(self, query, params=None):
        self.cursor.execute(query, params or ())
        return self.cursor

    def fetchall(self):
        return self.cursor.fetchall()

    def fetchone(self):
        return self.cursor.fetchone()

    def callproc(self, procname, args):
        self.cursor.callproc(procname, args)
        return self.cursor

    @property
    def lastrowid(self):
        return self.cursor.lastrowid

# Verify connection on startup
try:
    conn = get_connection()
    conn.close()
    print("✅  MySQL connected")
except Exception as e:
    print(f"❌  MySQL connection failed: {e}")
    raise SystemExit(1)

# Expose engine alias for compatibility
engine = get_pool
