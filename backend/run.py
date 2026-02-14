#!/usr/bin/env python3
"""
Helper script for common development tasks
"""
import sys
import subprocess
import os


def run_server():
    """Run development server"""
    print("Starting development server...")
    subprocess.run([
        "uvicorn", "app.main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ])


def load_data():
    """Load MovieLens data"""
    print("Loading MovieLens data...")
    subprocess.run(["python", "load_data.py"])


def create_db():
    """Create database tables"""
    print("Creating database tables...")
    from app.database import create_tables
    create_tables()
    print("Tables created successfully!")


def drop_db():
    """Drop all database tables"""
    print("WARNING: This will delete all data!")
    confirm = input("Type 'yes' to confirm: ")
    
    if confirm.lower() == 'yes':
        from app.database import drop_tables
        drop_tables()
        print("Tables dropped successfully!")
    else:
        print("Cancelled.")


def test_api():
    """Run simple API tests"""
    print("Testing API...")
    import requests
    
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✓ Health check passed")
        else:
            print("✗ Health check failed")
    except Exception as e:
        print(f"✗ Could not connect to server: {e}")
        return
    
    # Test register
    try:
        response = requests.post(
            f"{base_url}/api/auth/register",
            json={
                "email": "test@test.com",
                "username": "testuser",
                "password": "testpass123"
            }
        )
        if response.status_code in [200, 201, 400]:  # 400 if user exists
            print("✓ Registration endpoint working")
        else:
            print(f"✗ Registration failed: {response.status_code}")
    except Exception as e:
        print(f"✗ Registration test failed: {e}")
    
    print("\nAPI is running! Visit http://localhost:8000/docs for documentation")


def show_help():
    """Show help message"""
    print("""
Movie Recommender Backend - Helper Script

Usage: python run.py [command]

Commands:
    server      Start development server
    load-data   Load MovieLens dataset
    create-db   Create database tables
    drop-db     Drop all database tables (WARNING: deletes data!)
    test        Test API endpoints
    help        Show this help message

Examples:
    python run.py server
    python run.py load-data
    """)


def main():
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1]
    
    commands = {
        'server': run_server,
        'load-data': load_data,
        'create-db': create_db,
        'drop-db': drop_db,
        'test': test_api,
        'help': show_help
    }
    
    if command in commands:
        commands[command]()
    else:
        print(f"Unknown command: {command}")
        show_help()


if __name__ == "__main__":
    main()
