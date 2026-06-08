"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { tasksApi, usersApi } from "@/lib/api";
import { Task, User, Status, Priority } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";
import TaskCard from "@/components/TaskCard";
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskDetailModal from "@/components/TaskDetailModal";
import { Plus, LogOut, LayoutGrid, List, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";

const STATUS_COLUMNS: { id: Status; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "todo", label: "To Do", icon: <Circle size={14} />, color: "#6366f1" },
  { id: "in_progress", label: "In Progress", icon: <Clock size={14} />, color: "#f59e0b" },
  { id: "done", label: "Done", icon: <CheckCircle2 size={14} />, color: "#10b981" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, initAuth, logout } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login");
    }
  }, [token, isLoading, router]);

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchUsers();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const data = await tasksApi.getAll();
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {}
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [task, ...prev]);
    toast.success("Task created!");
  };

  const handleTaskUpdated = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTask?.id === updated.id) setSelectedTask(updated);
  };

  const handleTaskDeleted = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
    toast.success("Task deleted");
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = (status: Status) => filteredTasks.filter((t) => t.status === status);

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
              <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" fill="#6366f1" />
                <rect x="15" y="3" width="10" height="10" rx="2" fill="#6366f1" opacity="0.5" />
                <rect x="3" y="15" width="10" height="10" rx="2" fill="#6366f1" opacity="0.5" />
                <rect x="15" y="15" width="10" height="10" rx="2" fill="#6366f1" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">TaskFlow</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus size={16} />
              New Task
            </button>
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 text-sm font-medium">
                    {user.name[0]}
                  </div>
                )}
                <span className="text-zinc-300 text-sm hidden sm:block">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Tasks", value: stats.total, color: "#6366f1" },
            { label: "To Do", value: stats.todo, color: "#6366f1" },
            { label: "In Progress", value: stats.inProgress, color: "#f59e0b" },
            { label: "Completed", value: stats.done, color: "#10b981" },
          ].map((stat) => (
            <div key={stat.label} className="card px-4 py-4">
              <p className="text-zinc-500 text-xs mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input py-1.5 text-xs w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="input py-1.5 text-xs w-auto"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setView("board")}
              className={`p-1.5 rounded-md transition-colors ${view === "board" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Board / List */}
        {loadingTasks ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.id);
              return (
                <div key={col.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <span style={{ color: col.color }}>{col.icon}</span>
                    <h3 className="text-sm font-semibold text-zinc-300">{col.label}</h3>
                    <span className="ml-auto text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="card p-6 text-center text-zinc-600 text-sm border-dashed">
                        No tasks here
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          currentUserId={user?.id || ""}
                          onClick={() => setSelectedTask(task)}
                          onStatusChange={async (status) => {
                            try {
                              const updated = await tasksApi.update(task.id, { status });
                              handleTaskUpdated(updated);
                            } catch {
                              toast.error("Failed to update task");
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-zinc-600">No tasks found</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Task</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden sm:table-cell">Assignee</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden md:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium hidden lg:table-cell">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="border-b border-zinc-900 hover:bg-zinc-900/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-200">{task.title}</div>
                        {task.description && (
                          <div className="text-zinc-500 text-xs mt-0.5 truncate max-w-xs">{task.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            {task.assignee.avatar_url ? (
                              <Image src={task.assignee.avatar_url} alt={task.assignee.name} width={22} height={22} className="rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 text-xs">
                                {task.assignee.name[0]}
                              </div>
                            )}
                            <span className="text-zinc-400 text-xs">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-zinc-500 text-xs">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {createOpen && (
        <CreateTaskModal
          users={users}
          currentUserId={user?.id || ""}
          onClose={() => setCreateOpen(false)}
          onCreated={handleTaskCreated}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          currentUserId={user?.id || ""}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const map = {
    low: "bg-emerald-500/10 text-emerald-400",
    medium: "bg-amber-500/10 text-amber-400",
    high: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`badge ${map[priority]} capitalize`}>{priority}</span>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    todo: "bg-indigo-500/10 text-indigo-400",
    in_progress: "bg-amber-500/10 text-amber-400",
    done: "bg-emerald-500/10 text-emerald-400",
  };
  const labels = { todo: "To Do", in_progress: "In Progress", done: "Done" };
  return (
    <span className={`badge ${map[status]}`}>{labels[status]}</span>
  );
}
