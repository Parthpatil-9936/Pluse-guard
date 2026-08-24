import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Use local SQLite DB for standalone local run if Postgres host is unavailable
DB_URL = settings.async_database_url
if os.getenv("USE_SQLITE", "true").lower() == "true":
    DB_URL = "sqlite+aiosqlite:///./pulseguard.db"

engine = create_async_engine(
    DB_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print(f"[Database] Initialized DB schema using {DB_URL}")
    except Exception as e:
        print(f"[Database Warning] DB init fallback warning: {e}")
