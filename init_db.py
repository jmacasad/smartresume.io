# init_db.py
from backend import create_app
from backend.extensions import db

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    print("✅ Database reset: all tables dropped and recreated.")
