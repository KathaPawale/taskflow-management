from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from services.supabase_client import get_supabase
from utils.auth import generate_token, require_auth
import uuid

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/google-access", methods=["POST"])
def google_access_login():
    """Exchange Google access token for app JWT (frontend implicit flow)."""
    import requests as req
    data = request.get_json()
    access_token = data.get("access_token")

    if not access_token:
        return jsonify({"error": "Access token is required"}), 400

    # Verify and get user info from Google
    r = req.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if r.status_code != 200:
        return jsonify({"error": "Invalid access token"}), 401

    idinfo = r.json()
    return _handle_google_user(idinfo)


@auth_bp.route("/google", methods=["POST"])
def google_login():
    """Exchange Google ID token for app JWT."""
    data = request.get_json()
    google_token = data.get("token")

    if not google_token:
        return jsonify({"error": "Google token is required"}), 400

    try:
        idinfo = id_token.verify_oauth2_token(
            google_token,
            google_requests.Request(),
            current_app.config["GOOGLE_CLIENT_ID"]
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid Google token: {str(e)}"}), 401

    return _handle_google_user(idinfo)


def _handle_google_user(idinfo: dict):
    """Upsert user from Google info and return JWT."""
    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    name = idinfo.get("name", email.split("@")[0] if email else "User")
    avatar_url = idinfo.get("picture", "")

    if not google_id or not email:
        return jsonify({"error": "Invalid Google account data"}), 400

    supabase = get_supabase()
    existing = supabase.table("users").select("*").eq("google_id", google_id).execute()

    if existing.data:
        user = existing.data[0]
        supabase.table("users").update({
            "name": name,
            "avatar_url": avatar_url,
        }).eq("id", user["id"]).execute()
    else:
        user_id = str(uuid.uuid4())
        result = supabase.table("users").insert({
            "id": user_id,
            "google_id": google_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
        }).execute()
        user = result.data[0]

    token = generate_token(user["id"], user["email"])
    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user.get("avatar_url", ""),
        }
    })


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """Get current authenticated user."""
    supabase = get_supabase()
    result = supabase.table("users").select("*").eq("id", request.user_id).execute()

    if not result.data:
        return jsonify({"error": "User not found"}), 404

    user = result.data[0]
    return jsonify({
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "avatar_url": user.get("avatar_url", ""),
        "created_at": user.get("created_at"),
    })
