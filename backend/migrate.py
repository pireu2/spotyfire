import asyncio
from sqlalchemy import text
from app.database import engine, Base
import app.db_models  # Ensure models are registered

async def migrate():
    if not engine:
        print("Database engine not configured.")
        return

    print("Connecting to database...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE properties ADD COLUMN assigned_user_id VARCHAR(255);"))
            print("Successfully added assigned_user_id to properties table.")
        except Exception as e:
            if "already exists" in str(e) or "Duplicate column" in str(e):
                print("Column already exists.")
            else:
                print(f"Error altering properties table: {e}")
                
        try:
            await conn.run_sync(Base.metadata.create_all)
            print("Successfully created missing tables via SQLAlchemy ORM.")
        except Exception as e:
            print(f"Error creating tables: {e}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
