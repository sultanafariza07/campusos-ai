import { useEffect, useState } from "react";
import { api, clearToken } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";

import {
  HiSparkles,                                      
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineAcademicCap,
  HiOutlineCalendar,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineFire,
  HiCheckCircle,
  HiOutlineBookOpen,
} from "react-icons/hi";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  branch?: string;
  year?: string;
  avatar?: string | null;
}

interface Task {
  id: number;
  title: string;
  due: string;
  done: boolean;
}

interface Activity {
  id: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  text: string;
  time: string;
}

const USER_FALLBACK = {
  name: "Student",
  branch: "Not set",
  year: "Not set",
  streak: 7,
  tasksCompleted: 0,
  notesCreated: 0,
  aiChats: 0,
};



const ACTIVITIES: Activity[] = [];

type TaskWithCreatedAt = Task & { createdAt?: string | null };



function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function isAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("token") || m.includes("authorization") || m.includes("unauthorized") || m.includes("401");
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-widest">{title}</h2>
      {action && (
        <button
          type="button"
          className="flex items-center gap-0.5 text-xs text-[#6C63FF] hover:text-[#A5A0FF] transition-colors focus-visible:outline-none focus-visible:underline"
        >
          {action} <HiOutlineChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  label,
  sub,
  accent,
  glow,
  to,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  accent: string;
  glow: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col items-start gap-3 rounded-2xl border border-white/[0.07] bg-[#111118] p-4 text-left shadow-lg transition-all hover:border-white/[0.12] hover:bg-[#16161F] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] overflow-hidden"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: glow }}
      />
      <span
        className="relative flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: accent + "18" }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </span>
      <div className="relative">
        <p className="text-sm font-semibold text-[#E2E8F0] leading-tight">{label}</p>
        <p className="text-xs text-[#4B5563] mt-0.5">{sub}</p>
      </div>
    </Link>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] rounded-full"
      >
        {task.done ? (
          <HiCheckCircle className="w-5 h-5 text-[#6C63FF]" />
        ) : (
          <HiOutlineCheckCircle className="w-5 h-5 text-[#3B4558] hover:text-[#6C63FF] transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium leading-snug ${
            task.done ? "line-through text-[#3B4558]" : "text-[#E2E8F0]"
          }`}
        >
          {task.title}
        </p>

        {!task.done && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[#2D3748]">·</span>
            <span className="flex items-center gap-1 text-xs text-[#4B5563]">
              <HiOutlineClock className="w-3 h-3" /> {task.due}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithCreatedAt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksPending: 0,
    notesCreated: 0,
    aiChats: 0,
    studySessionsCompleted: 0,
    studySessionsPending: 0,
    productivityScore: 0,
  });


  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, tasksRes] = await Promise.all([
          api.auth.profile(),
          api.tasks.list(),
        ]);

        if (mounted) {
          setProfile(profileRes.user);
          const mappedTasks: TaskWithCreatedAt[] = (tasksRes.tasks ?? []).map((t: any) => ({
            id: Number(t.id),
            title: String(t.title ?? ""),
            due: String(t.dueDate ?? t.due_date ?? ""),
            done: Boolean(t.completed),
            createdAt: t.createdAt ?? t.created_at ?? null,
          }));
          setTasks(mappedTasks);
          // Since /analytics is not implemented, we derive stats from the tasks list.
          const pending = mappedTasks.filter(t => !t.done).length;
          const completed = mappedTasks.filter(t => t.done).length;
          setStats(prev => ({
            ...prev,
            tasksPending: pending,
            tasksCompleted: completed,
            // notesCreated and other stats would come from other API calls if needed.
          }));
        }
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        if (mounted) {
          if (isAuthError(msg)) {
            clearToken();
            navigate("/", { replace: true });
            return;
          }
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }

    })();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const toggleTask = async (id: number) => {
    const current = tasks.find((t) => t.id === id);
    const nextCompleted = !current?.done;

    // optimistic UI
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: nextCompleted } : t)));

    try {
      await api.tasks.update(id, { completed: nextCompleted });
    } catch (e: any) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !nextCompleted } : t)));

      const msg = String(e?.message ?? e);
      if (isAuthError(msg)) {
        clearToken();
        navigate("/", { replace: true });
        return;
      }
    }
  };


  const pendingCount = stats.tasksPending;
  const completedCount = stats.tasksCompleted;
  const recentTasks = [...tasks]
    .sort((a, b) => String((b.createdAt ?? b.created_at) ?? "").localeCompare(String((a.createdAt ?? a.created_at) ?? "")))
    .slice(0, 4);


  return (
    <div className="relative min-h-screen bg-[#0A0A0F] px-4 pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-100px] left-1/2 -translate-x-1/2 w-[480px] h-[340px] rounded-full"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.16) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative mx-auto max-w-sm space-y-5">
        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] px-5 py-5 shadow-xl overflow-hidden relative">
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(108,99,255,0.5), transparent)" }}
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#4B5563] font-medium mb-1">{getGreeting()} 👋</p>
              <h1 className="text-xl font-bold text-white leading-tight" style={{ letterSpacing: "-0.03em" }}>
                {(profile?.name ?? USER_FALLBACK.name).split(" ")[0]},
              </h1>
              <p className="text-sm text-[#64748B] mt-0.5">Ready to crush today?</p>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center ring-2 ring-[#6C63FF]/30 ring-offset-2 ring-offset-[#111118]">
                <span className="text-base font-bold text-white">{getInitials(profile?.name ?? USER_FALLBACK.name)}</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-400">
                <HiOutlineFire className="w-3 h-3" /> {USER_FALLBACK.streak}d
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { value: pendingCount, label: "Pending" },
              { value: completedCount, label: "Completed" },
              { value: stats.notesCreated, label: "Notes" },
            ].map(({ value, label }) => (

              <div
                key={label}
                className="rounded-xl bg-white/[0.04] border border-white/[0.05] py-2 text-center"
              >
                <p className="text-base font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
                  {value}
                </p>
                <p className="text-[10px] text-[#4B5563] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#111118] px-5 py-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineBookOpen className="w-4 h-4 text-[#6C63FF]" />
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest">Student</p>
          </div>
          <div className="space-y-2">
            {[
              { Icon: HiOutlineLightningBolt, label: "Name", value: profile?.name ?? USER_FALLBACK.name },
              { Icon: HiOutlineAcademicCap, label: "Branch", value: profile?.branch ?? USER_FALLBACK.branch },
              { Icon: HiOutlineCalendar, label: "Year", value: profile?.year ?? USER_FALLBACK.year },
            ].map(({ Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2.5"
              >
                <Icon className="w-4 h-4 text-[#6C63FF] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-[#4B5563] uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-[#E2E8F0] font-medium truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            <QuickActionCard
              icon={HiOutlineDocumentText}
              label="Notes"
              sub={`${stats.notesCreated} notes saved`}
              accent="#6C63FF"
              glow="radial-gradient(ellipse at top left, rgba(108,99,255,0.12), transparent 70%)"
              to="/notes"
            />
            <QuickActionCard
              icon={HiOutlineClipboardList}
              label="Assignments"
              sub={`${pendingCount} pending`}
              accent="#F59E0B"
              glow="radial-gradient(ellipse at top left, rgba(245,158,11,0.10), transparent 70%)"
              to="/tasks"
            />
            <div className="col-span-2">
              <QuickActionCard
                icon={HiSparkles}
                label="AI Assistant"
                sub="Ask anything — summaries, explanations, quizzes"
                accent="#A78BFA"
                glow="radial-gradient(ellipse at top left, rgba(167,139,250,0.12), transparent 70%)"
                to="/ai"
              />
            </div>
          </div>
        </div>

        <div>
          <SectionHeader title="Recent Tasks" action="" />
          <div className="rounded-2xl border border-white/[0.07] bg-[#111118] shadow-xl overflow-hidden">
            {recentTasks.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-[#64748B]">No recent tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {recentTasks.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-medium truncate ${
                        t.done ? "line-through text-[#3B4558]" : "text-[#E2E8F0]"
                      }`}
                    >
                      {t.title}
                    </p>
                    <span className="text-[10px] text-[#64748B]">
                      {t.due ? t.due : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        <div>
          <SectionHeader title="Upcoming Tasks" action="Add task" />
          <div className="rounded-2xl border border-white/[0.07] bg-[#111118] px-4 shadow-xl">
            {tasks.length === 0 ? (
              <div className="px-1 py-5">
                <p className="text-center text-xs text-[#64748B]">No tasks yet</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} />
              ))
            )}
          </div>
          {pendingCount === 0 && tasks.length > 0 && (
            <p className="mt-3 text-center text-xs text-green-400 font-medium">🎉 All tasks done!</p>
          )}
        </div>


        {loading && <div className="text-center text-xs text-[#64748B] pt-2">Loading…</div>}
        {error && !isAuthError(error) && <div className="text-center text-xs text-red-400 pt-2">{error}</div>}
      </div>

    </div>
  );
}
