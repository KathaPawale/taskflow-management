"use client";
import { Task, Priority, Status } from "@/types";
import Image from "next/image";
import { Calendar, ChevronRight } from "lucide-react";

interface Props {
  task: Task;
  currentUserId: string;
  onClick: () => void;
  onStatusChange: (status: Status) => void;
}

const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  low: { label: "Low", cls: "bg-emerald-500/10 text-emerald-400" },
  medium: { label: "Medium", cls: "bg-amber-500/10 text-amber-400" },
  high: { label: "High", cls: "bg-red-500/10 text-red-400" },
};

const nextStatus: Record<Status, Status> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

const statusLabel: Record<Status, string> = {
  todo: "Start →",
  in_progress: "Complete →",
  done: "Reopen",
};

export default function TaskCard({ task, currentUserId, onClick, onStatusChange }: Props) {
  const p = priorityConfig[task.priority];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:border-zinc-700 hover:bg-[#181818] transition-all duration-150 group"
    >
      {/* Priority */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`badge ${p.cls} text-xs`}>{p.label}</span>
        <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {/* Title */}
      <h4 className="text-zinc-200 font-medium text-sm leading-snug mb-1 line-clamp-2">{task.title}</h4>
      {task.description && (
        <p className="text-zinc-500 text-xs leading-relaxed mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          {/* Assignee */}
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              {task.assignee.avatar_url ? (
                <Image src={task.assignee.avatar_url} alt={task.assignee.name} width={18} height={18} className="rounded-full" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 text-[10px]">
                  {task.assignee.name[0]}
                </div>
              )}
              <span className="text-zinc-500 text-xs">{task.assignee.name.split(" ")[0]}</span>
            </div>
          ) : (
            <span className="text-zinc-600 text-xs">Unassigned</span>
          )}

          {/* Due date */}
          {task.due_date && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-zinc-600"}`}>
              <Calendar size={10} />
              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          )}
        </div>

        {/* Quick action */}
        {(task.creator_id === currentUserId || task.assignee_id === currentUserId) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(nextStatus[task.status]);
            }}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {statusLabel[task.status]}
          </button>
        )}
      </div>
    </div>
  );
}
