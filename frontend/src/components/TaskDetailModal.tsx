"use client";
import { useState } from "react";
import { tasksApi } from "@/lib/api";
import { Task, User, Priority, Status } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";
import { X, Trash2, Save, Calendar, User as UserIcon } from "lucide-react";

interface Props {
  task: Task;
  users: User[];
  currentUserId: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (id: string) => void;
}

const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high"];
const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export default function TaskDetailModal({ task, users, currentUserId, onClose, onUpdated, onDeleted }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [status, setStatus] = useState<Status>(task.status);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id || "");
  const [dueDate, setDueDate] = useState(task.due_date?.split("T")[0] || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = task.creator_id === currentUserId || task.assignee_id === currentUserId;
  const canDelete = task.creator_id === currentUserId;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await tasksApi.update(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
      });
      onUpdated(updated);
      toast.success("Task updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await tasksApi.delete(task.id);
      onDeleted(task.id);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const priorityColors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-[#141414] border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: priorityColors[priority] }}
            />
            <span className="text-xs text-zinc-500 capitalize">{priority} priority</span>
          </div>
          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger py-1.5 text-xs"
              >
                <Trash2 size={13} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
            <input
              className="input text-base font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              className="input resize-none"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                disabled={!canEdit}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                className="input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                disabled={!canEdit}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Assignee</label>
            {canEdit ? (
              <select
                className="input"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === currentUserId ? "(You)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                {task.assignee ? (
                  <>
                    {task.assignee.avatar_url ? (
                      <Image src={task.assignee.avatar_url} alt={task.assignee.name} width={24} height={24} className="rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 text-xs">
                        {task.assignee.name[0]}
                      </div>
                    )}
                    <span className="text-sm text-zinc-300">{task.assignee.name}</span>
                    <span className="text-xs text-zinc-500">{task.assignee.email}</span>
                  </>
                ) : (
                  <span className="text-zinc-600 text-sm">Unassigned</span>
                )}
              </div>
            )}
          </div>

          {/* Creator */}
          <div className="pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500">
              Created by{" "}
              <span className="text-zinc-300">{task.creator?.name || "Unknown"}</span>
              {" · "}
              {new Date(task.created_at).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric"
              })}
            </p>
          </div>

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
