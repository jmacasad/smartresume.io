from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from backend.routes.profile_routes import profile_bp
from backend.extensions import db, migrate
from backend.routes.home import home_bp
from backend.routes.auth import auth_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.analyze import analyze_bp
from backend.routes.generate import generate_bp
from backend.routes.sessions import sessions_bp
from backend.routes.download import download_bp
from backend.routes.billing import billing_bp
from backend import models as _models
from pathlib import Path
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
import os

print("Looking for .env at:", Path(".env").resolve())
load_dotenv(override=True)
print("DATABASE_URL from env:", os.getenv("DATABASE_URL"))



def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "default-dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-jwt-key")

    db.init_app(app)
    migrate.init_app(app, db)
    jwt = JWTManager(app)

    from backend.models import (
        User as _User,
        UserProfile as _UserProfile,
        Resume as _Resume,
        JobDescription as _JobDescription
    )

    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        print("❌ JWT missing or invalid")
        return jsonify({'error': 'Missing or invalid token'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        print("❌ JWT invalid:", error)
        return jsonify({'error': 'Invalid token'}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print("❌ JWT expired")
        return jsonify({'error': 'Token expired'}), 401

    
    app.register_blueprint(profile_bp, url_prefix="/profile")
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(analyze_bp)
    app.register_blueprint(generate_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(download_bp)
    app.register_blueprint(home_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(billing_bp)

    print("\n📍 Final Registered Routes:")
    for rule in app.url_map.iter_rules():
        print(f"➡️ {list(rule.methods)} {rule.rule}")

    with app.app_context():
        db.create_all()

    return app
