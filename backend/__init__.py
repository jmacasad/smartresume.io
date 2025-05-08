from flask import Flask
from flask_cors import CORS
from backend.routes.analyze import analyze_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(analyze_bp)
    return app

