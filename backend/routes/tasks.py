from flask import Blueprint, request, jsonify
from services.supabase_client import get_supabase
from services.email_service import send_task_created_email, send_task_completed_email
from utils.auth import require_auth
import uuid

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/", methods=["GET"])
@require_auth
def get_tasks():
    """Get all tasks visible to the current user."""
    supabase = get_supabase()
    result = supabase.table("tasks").select(
        "*, creator:creator_id(id,name,email,avatar_url), assignee:assignee_id(id,name,email,avatar_url)"
    ).or_(
        f"creator_id.eq.{request.user_id},assignee_id.eq.{request.user_id}"
    ).order("created_at", desc=True).execute()

    return jsonify(result.data)


@tasks_bp.route("/", methods=["POST"])
@require_auth
def create_task():
    """Create a new task."""
    data = request.get_json()
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    supabase = get_supabase()
    task_id = str(uuid.uuid4())

    task_data = {
        "id": task_id,
        "title": title,
        "description": data.get("description", ""),
        "priority": data.get("priority", "medium"),
        "status": "todo",
        "creator_id": request.user_id,
        "assignee_id": data.get("assignee_id"),
        "due_date": data.get("due_date"),
    }

    result = supabase.table("tasks").insert(task_data).execute()
    task = result.data[0]

    # Fetch enriched task with user info
    enriched = supabase.table("tasks").select(
        "*, creator:creator_id(id,name,email,avatar_url), assignee:assignee_id(id,name,email,avatar_url)"
    ).eq("id", task_id).execute()
    enriched_task = enriched.data[0] if enriched.data else task

    # Send email notification to assignee
    if task_data.get("assignee_id") and task_data["assignee_id"] != request.user_id:
        assignee_data = supabase.table("users").select("*").eq("id", task_data["assignee_id"]).execute()
        creator_data = supabase.table("users").select("*").eq("id", request.user_id).execute()

        if assignee_data.data and creator_data.data:
            assignee = assignee_data.data[0]
            creator = creator_data.data[0]
            send_task_created_email(
                assignee_email=assignee["email"],
                assignee_name=assignee["name"],
                task=enriched_task,
                creator_name=creator["name"]
            )

    return jsonify(enriched_task), 201


@tasks_bp.route("/<task_id>", methods=["GET"])
@require_auth
def get_task(task_id):
    supabase = get_supabase()
    result = supabase.table("tasks").select(
        "*, creator:creator_id(id,name,email,avatar_url), assignee:assignee_id(id,name,email,avatar_url)"
    ).eq("id", task_id).execute()

    if not result.data:
        return jsonify({"error": "Task not found"}), 404

    task = result.data[0]
    if task["creator_id"] != request.user_id and (task.get("assignee_id") != request.user_id):
        return jsonify({"error": "Access denied"}), 403

    return jsonify(task)


@tasks_bp.route("/<task_id>", methods=["PATCH"])
@require_auth
def update_task(task_id):
    supabase = get_supabase()

    existing = supabase.table("tasks").select("*").eq("id", task_id).execute()
    if not existing.data:
        return jsonify({"error": "Task not found"}), 404

    task = existing.data[0]
    if task["creator_id"] != request.user_id and task.get("assignee_id") != request.user_id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    allowed = ["title", "description", "priority", "status", "assignee_id", "due_date"]
    updates = {k: v for k, v in data.items() if k in allowed}

    was_completed = task["status"] == "done"
    result = supabase.table("tasks").update(updates).eq("id", task_id).execute()
    updated_task = result.data[0]

    # Notify on completion
    now_completed = updates.get("status") == "done" and not was_completed
    if now_completed:
        # Notify creator if different from completer
        if task["creator_id"] != request.user_id:
            creator_data = supabase.table("users").select("*").eq("id", task["creator_id"]).execute()
            completer_data = supabase.table("users").select("*").eq("id", request.user_id).execute()
            if creator_data.data and completer_data.data:
                send_task_completed_email(
                    assignee_email=creator_data.data[0]["email"],
                    assignee_name=creator_data.data[0]["name"],
                    task=updated_task,
                    completer_name=completer_data.data[0]["name"]
                )
        # Notify assignee if different from completer
        if task.get("assignee_id") and task["assignee_id"] != request.user_id and task["assignee_id"] != task["creator_id"]:
            assignee_data = supabase.table("users").select("*").eq("id", task["assignee_id"]).execute()
            completer_data = supabase.table("users").select("*").eq("id", request.user_id).execute()
            if assignee_data.data and completer_data.data:
                send_task_completed_email(
                    assignee_email=assignee_data.data[0]["email"],
                    assignee_name=assignee_data.data[0]["name"],
                    task=updated_task,
                    completer_name=completer_data.data[0]["name"]
                )

    enriched = supabase.table("tasks").select(
        "*, creator:creator_id(id,name,email,avatar_url), assignee:assignee_id(id,name,email,avatar_url)"
    ).eq("id", task_id).execute()

    return jsonify(enriched.data[0] if enriched.data else updated_task)


@tasks_bp.route("/<task_id>", methods=["DELETE"])
@require_auth
def delete_task(task_id):
    supabase = get_supabase()

    existing = supabase.table("tasks").select("*").eq("id", task_id).execute()
    if not existing.data:
        return jsonify({"error": "Task not found"}), 404

    task = existing.data[0]
    if task["creator_id"] != request.user_id:
        return jsonify({"error": "Only the creator can delete this task"}), 403

    supabase.table("tasks").delete().eq("id", task_id).execute()
    return jsonify({"message": "Task deleted successfully"})
