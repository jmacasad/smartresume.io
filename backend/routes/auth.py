from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from backend.models import User
from backend import db

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    print("📥 Register payload:", data)
    
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name')
    last_name = data.get('last_name') 

    if User.query.filter_by(email=email).first():
        print("⚠️ Email already exists:", email)
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = generate_password_hash(password)
    user = User()
    user.email=email
    user.password_hash=hashed_pw
    user.first_name=first_name
    user.last_name=last_name
    
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    print("LOGIN REQUEST:", email, password)

    user = User.query.filter_by(email=email).first()
    print("USER FOUND:", user)

    if user:
        print("CHECK RESULT:", check_password_hash(user.password_hash, password))
        
    if user and check_password_hash(user.password_hash, password):
        token = create_access_token(identity=str(user.id))
        return jsonify({"access_token": token}), 200

    return jsonify({"error": "Invalid credentials"}), 401
