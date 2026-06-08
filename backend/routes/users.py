from flask import Blueprint, request, jsonify
from services.supabase_client import get_supabase
from utils.auth import require_auth

users_bp = Blueprint("users", __name__)


@users_bp.route("/", methods=["GET"])
@require_auth
def get_users():
    """Get all users (for task assignment)."""
    supabase = get_supabase()
    result = supabase.table("users").select("id, name, email, avatar_url").order("name").execute()
    return jsonify(result.data)


@users_bp.route("/<user_id>", methods=["GET"])
@require_auth
def get_user(user_id):
    supabase = get_supabase()
    result = supabase.table("users").select("id, name, email, avatar_url, created_at").eq("id", user_id).execute()

    if not result.data:
        return jsonify({"error": "User not found"}), 404

    return jsonify(result.data[0])
