from backend.extensions import db
from werkzeug.security import check_password_hash
from datetime import datetime, timezone

created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
usage_count = db.Column(db.Integer, default=0)
plan_tier = db.Column(db.String(20), default='free')

class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True, nullable=False)
    summary = db.Column(db.Text)
    experience = db.Column(db.Text)
    skills = db.Column(db.Text)
    education = db.Column(db.Text)

    user = db.relationship("User", backref=db.backref("profile", uselist=False))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    resumes = db.relationship('Resume', backref='user', lazy=True)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    is_admin = db.Column(db.Boolean, default=False)
    bio = db.Column(db.Text)

    created_at = db.Column(db.DateTime)
    
    resumes = db.relationship('Resume', backref='user', lazy=True, cascade="all, delete-orphan")
    job_descriptions = db.relationship('JobDescription', backref='user', lazy=True, cascade="all, delete-orphan")

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

class Resume(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=True)  # 👈 Add this line
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    content = db.Column(db.Text)

    
class JobDescription(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    match_results = db.relationship('MatchResult', backref='job_description', lazy=True, cascade="all, delete-orphan")

class MatchResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    resume_id = db.Column(db.Integer, db.ForeignKey('resume.id'), nullable=False)
    job_description_id = db.Column(db.Integer, db.ForeignKey('job_description.id'), nullable=False)
    match_score = db.Column(db.Float)
    summary = db.Column(db.Text) 
    created_at = db.Column(db.DateTime, server_default=db.func.now())