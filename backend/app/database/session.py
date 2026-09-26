"""
AEGIS UNIFIED DATA CORE - Database Session & Connection Management
Supports async SQLAlchemy 2.0 sessions with PostgreSQL / PostGIS and SQLite fallback for local testing.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash
from backend.app.database.base import Base
from backend.app.database.models import User
from backend.app.utils.logger import logger

# Build async connection URL
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

def create_engine_and_factory(url: str):
    engine_kwargs = {}
    if "sqlite" in url:
        engine_kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
    else:
        engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
        engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    eng = create_async_engine(url, echo=settings.DEBUG, **engine_kwargs)
    factory = async_sessionmaker(
        bind=eng,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    return eng, factory

engine, async_session_factory = create_engine_and_factory(db_url)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session management."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initializes database tables and bootstraps initial admin user.
    In production mode, schema creation is strictly managed via Alembic versioned migrations."""
    global engine, async_session_factory
    try:
        async with engine.begin() as conn:
            if settings.ENVIRONMENT != "production":
                await conn.run_sync(Base.metadata.create_all)
            else:
                logger.info("Production mode: schema creation handled exclusively via Alembic migrations.")
    except Exception as e:
        logger.warning(
            f"Database connection to '{db_url}' failed ({e}). "
            "Falling back to local SQLite ('sqlite+aiosqlite:///./aegis_local.db') for offline development."
        )
        sqlite_url = "sqlite+aiosqlite:///./aegis_local.db"
        engine, async_session_factory = create_engine_and_factory(sqlite_url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # Bootstrap default operations user if table is empty
    async with async_session_factory() as session:
        result = await session.execute(select(User).limit(1))
        if not result.scalars().first():
            default_admin = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                full_name="Emergency Operations Commander",
                role="ADMIN",
                phone_number="+919876543210",
                organization="Aegis National Command Center",
                is_active=True,
                is_verified=True,
            )
            session.add(default_admin)
            await session.commit()
            logger.info(f"Bootstrapped default operations user: {settings.DEFAULT_ADMIN_EMAIL}")

    from backend.app.database.seeds import seed_database
    await seed_database()
