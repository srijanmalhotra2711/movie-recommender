import sys
print("Python version:", sys.version)
print("Starting imports...")

try:
    print("Importing FastAPI...")
    from fastapi import FastAPI
    print("✓ FastAPI imported")
    
    print("Importing database...")
    from app.database import engine, Base
    print("✓ Database imported")
    
    print("Importing models...")
    from app.models import db_models
    print("✓ Models imported")
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")
    
    print("Importing main app...")
    from app.main import app
    print("✓ App imported successfully!")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ All imports successful! Server should start normally.")
