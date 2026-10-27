import sqlite3
from datetime import datetime
from sqlalchemy import inspect, text
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.core.config import settings
from backend.app.core.security import hash_password
from backend.app.models.entities import User

def run_migrations():
    """
    Safe migration runner.
    1. Creates any new tables defined in SQLAlchemy models.
    2. Inspects existing tables and safely adds new columns if missing.
    3. Seeds initial admin and demo user accounts.
    4. Preserves all existing database records.
    """
    print("[MIGRATION] Checking database schema & running safe migrations...")
    
    # 1. Create missing tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Schema inspection for column migrations (SQLite / PostgreSQL)
    inspector = inspect(engine)
    
    new_columns_spec = {
        "regions": [
            ("state_code", "VARCHAR(16)"),
            ("district", "VARCHAR(64)"),
            ("subdistrict", "VARCHAR(64)"),
            ("admin_level", "VARCHAR(32) DEFAULT 'basin'"),
            ("lgd_code", "VARCHAR(32)"),
            ("area_sqkm", "FLOAT"),
            ("parent_id", "VARCHAR(64)"),
            ("boundary_geojson", "JSON"),
        ],
        "uploaded_images": [
            ("user_id", "VARCHAR(64)"),
            ("project_id", "VARCHAR(64)"),
        ],
        "analysis_runs": [
            ("user_id", "VARCHAR(64)"),
            ("project_id", "VARCHAR(64)"),
            ("parameters_json", "JSON"),
            ("model_version", "VARCHAR(64) DEFAULT 'v1.0-cv-spectral'"),
        ],
        "rainfall_observations": [
            ("measurement_type", "VARCHAR(32) DEFAULT 'ACCUMULATION_24H'"),
            ("baseline_normal_mm", "FLOAT"),
            ("anomaly_percent", "FLOAT"),
            ("quality_flag", "VARCHAR(32) DEFAULT 'MEASURED'"),
            ("is_missing", "BOOLEAN DEFAULT 0"),
        ],
        "digital_twin_states": [
            ("user_id", "VARCHAR(64)"),
            ("project_id", "VARCHAR(64)"),
        ],
        "reports": [
            ("user_id", "VARCHAR(64)"),
            ("project_id", "VARCHAR(64)"),
            ("event_id", "VARCHAR(64)"),
            ("parameters_json", "JSON"),
        ],
        "chatbot_sessions": [
            ("user_id", "VARCHAR(64)"),
            ("project_id", "VARCHAR(64)"),
            ("is_archived", "BOOLEAN DEFAULT 0"),
        ]
    }
    
    with engine.connect() as conn:
        for table_name, columns in new_columns_spec.items():
            if inspector.has_table(table_name):
                existing_cols = {col["name"] for col in inspector.get_columns(table_name)}
                for col_name, col_type in columns:
                    if col_name not in existing_cols:
                        try:
                            alter_stmt = text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                            conn.execute(alter_stmt)
                            conn.commit()
                            print(f"[MIGRATION] Added column '{col_name}' to table '{table_name}'.")
                        except Exception as e:
                            print(f"[MIGRATION] Warning adding column '{col_name}' to '{table_name}': {e}")
                            
    # 3. Seed default system users if missing
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == settings.ADMIN_USER_EMAIL).first()
        if not admin_user:
            admin_user = User(
                id="user_admin_default",
                email=settings.ADMIN_USER_EMAIL,
                username="admin",
                hashed_password=hash_password("DisasterTwinAdmin2026!"),
                full_name="National Geospatial Administrator",
                role="admin",
                organization="National Disaster Management Authority (NDMA) / Digital Twin Lab",
                preferences={"theme": "dark", "preferred_language": "ta", "auto_refresh_sec": 30}
            )
            db.add(admin_user)
            
        demo_user = db.query(User).filter(User.username == "demo_analyst").first()
        if not demo_user:
            demo_user = User(
                id="user_demo_analyst",
                email="analyst@disastertwin.gov.in",
                username="demo_analyst",
                hashed_password=hash_password("AnalystPass2026!"),
                full_name="Dr. K. Anbarasan (Senior GIS Analyst)",
                role="analyst",
                organization="State Disaster Emergency Operations Centre (SDMA)",
                preferences={"theme": "light", "preferred_language": "ta", "auto_refresh_sec": 60}
            )
            db.add(demo_user)
            
        db.commit()
        print("[MIGRATION] Default user accounts verified.")
    except Exception as e:
        db.rollback()
        print(f"[MIGRATION] User seeding notice: {e}")
    finally:
        db.close()
        
    print("[MIGRATION] Safe migration completed successfully.")

if __name__ == "__main__":
    run_migrations()
