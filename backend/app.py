from flask import Flask
from flask_cors import CORS
from config import Config
from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.users import users_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=app.config["ALLOWED_ORIGINS"], supports_credentials=True)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(users_bp, url_prefix="/api/users")

    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "TaskFlow API is running"}

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
