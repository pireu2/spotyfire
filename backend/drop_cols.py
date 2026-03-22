import asyncio
from sqlalchemy import text
from app.database import engine

async def drop_columns():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE insured_users DROP COLUMN IF EXISTS policy_code CASCADE;"))
            await conn.execute(text("ALTER TABLE insured_users DROP COLUMN IF EXISTS insured_hectares CASCADE;"))
            print("Successfully dropped policy_code and insured_hectares")
        except Exception as e:
            print(f"Error dropping columns: {e}")

if __name__ == "__main__":
    asyncio.run(drop_columns())
