import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
import os

load_dotenv()

connection_string = os.getenv("DATABASE_URL")

# Connect to PostgreSQL server
try:
    conn = psycopg2.connect(connection_string)
    cursor = conn.cursor()

    # Drop all tables in the public schema
    drop_tables_query = """
    DO $$ DECLARE
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END $$;
    """
    cursor.execute(drop_tables_query)

    # Commit changes and close cursor and connection
    conn.commit()
    cursor.close()
    conn.close()

    print("All tables dropped successfully!")

except Exception as err:
    print(f"Error: {err}")
