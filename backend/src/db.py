import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_USER = os.getenv("POSTGRES_USER","app")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD","")
pw_file = os.getenv("POSTGRES_PASSWORD_FILE")
if pw_file and os.path.exists(pw_file):
    DB_PASSWORD = open(pw_file).read().strip()

DB_HOST = os.getenv("POSTGRES_HOST","db")
DB_PORT = os.getenv("POSTGRES_PORT","5432")
DB_NAME = os.getenv("POSTGRES_DB","appdb")

DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL,pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine,autocommit=False,autoflush=False)

def ping_db():
    try:
        with engine.connect() as c:
            c.execute(text("SELECT 1"))
        return True
    except:
        return False
