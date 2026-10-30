from sqlalchemy import create_engine, text

# 1. Paste your pooler URI below
# 2. Add '+psycopg' right after 'postgresql' -> 'postgresql+psycopg://...'
# 3. Put your real database password in place of [YOUR-PASSWORD]
DATABASE_URL = "postgresql://postgres.sqyeyjtfkzuuisibqmhe:GeoPulse_ai@aws-0-eu-north-1.pooler.supabase.com:5432/postgres"

print("Connecting to Supabase PostGIS via IPv4 Pooler...")
try:
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"sslmode": "require"}
    )
    with engine.connect() as conn:
        result = conn.execute(text("SELECT PostGIS_Version();")).fetchone()
        print(f"✅ Success! Connected to PostGIS version: {result[0]}")
        
        tables = conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';")
        ).fetchall()
        print(f"✅ Tables found in DB: {[t[0] for t in tables]}")
except Exception as e:
    print(f"❌ Connection failed: {e}")