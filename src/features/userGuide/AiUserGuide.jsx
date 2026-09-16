/**
 * REMOVABLE — aimantra agent
 * Delete <AiUserGuide /> from Layout.jsx + this folder to remove.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Loader2,
  Minimize2,
  Maximize2,
  Expand,
  Shrink,
  EyeOff,
  RotateCcw,
  FileBarChart2,
  UserRound,
  FolderKanban,
  CalendarRange,
  CalendarDays,
  ClipboardList,
  Wrench,
  MapPin,
  PanelRightOpen,
  ArrowUp,
  Sparkles,
  Command,
} from "lucide-react";
import {
  GUIDE_STORAGE_DISABLED,
  resolvePageGuide,
} from "./pageGuides";
import {
  parseUserMessage,
  runAgent,
  rangeLastWeek,
  rangeThisWeek,
  rangeThisMonth,
  rangeLastMonth,
  rangeLast7Days,
  toYmd,
} from "./guideAgent";
import ReportDoc from "./ReportDoc";
import "./aimantra.css";
import {
  PROJECT_TYPE_FILTER_OPTIONS,
  PROJECT_TYPE_SOURCE_IDS,
} from "../../constants/projectSources";

const LOADING_LINES = [
  "Thinking",
  "Reading project data",
  "Analyzing worklogs",
  "Drafting report",
  "Almost done",
];

function readDisabled() {
  try {
    return localStorage.getItem(GUIDE_STORAGE_DISABLED) === "1";
  } catch {
    return false;
  }
}

function TextBubble({ lines, large }) {
  return (
    <div className={`aimantra-assistant space-y-2 ${large ? "text-[15px]" : "text-[13.5px]"}`}>
      {(lines || []).map((line, i) => {
        if (!line) return <div key={i} className="h-2" />;
        const parts = String(line).split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-[1.65] text-zinc-300">
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={j} className="font-semibold text-zinc-50">
                  {p.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{p}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

function AgentMark({ size = 36, spin = false }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className={`absolute inset-0 rounded-full p-[1.5px] ${spin ? "aimantra-mark" : ""}`}
        style={
          spin
            ? undefined
            : {
                background: "linear-gradient(135deg, #2dd4bf, #38bdf8 50%, #818cf8)",
              }
        }
      >
        <span className="aimantra-mark-inner flex h-full w-full items-center justify-center rounded-full">
          <Sparkles size={size * 0.38} className="text-teal-300" strokeWidth={2.2} />
        </span>
      </span>
    </span>
  );
}

function IconBtn({ title, onClick, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        active ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function buildActions(customRange) {
  const fallback = customRange || rangeLastWeek();
  return [
    {
      id: "weekly",
      label: "Weekly report",
      hint: "All projects · last week",
      icon: FileBarChart2,
      group: "reports",
      intent: () => ({ type: "all_projects_report", dateRange: rangeLastWeek() }),
      userText: "Generate weekly all-projects time log report (last week)",
    },
    {
      id: "thisweek",
      label: "This week",
      hint: "All projects to date",
      icon: CalendarDays,
      group: "reports",
      intent: () => ({ type: "all_projects_report", dateRange: rangeThisWeek() }),
      userText: "Generate all-projects report for this week",
    },
    {
      id: "month",
      label: "This month",
      hint: "Month-to-date summary",
      icon: CalendarRange,
      group: "reports",
      intent: () => ({ type: "all_projects_report", dateRange: rangeThisMonth() }),
      userText: "Generate all-projects report for this month",
    },
    {
      id: "lastmonth",
      label: "Last month",
      hint: "Full previous month",
      icon: CalendarRange,
      group: "reports",
      intent: () => ({ type: "all_projects_report", dateRange: rangeLastMonth() }),
      userText: "Generate all-projects report for last month",
    },
    {
      id: "7days",
      label: "Last 7 days",
      hint: "Rolling window",
      icon: CalendarDays,
      group: "reports",
      intent: () => ({ type: "all_projects_report", dateRange: rangeLast7Days() }),
      userText: "Generate all-projects report for last 7 days",
    },
    {
      id: "custom",
      label: "Custom dates",
      hint: "Uses range below",
      icon: CalendarRange,
      group: "reports",
      intent: () => ({
        type: "all_projects_report",
        dateRange: {
          start_date: fallback.start_date,
          end_date: fallback.end_date,
          label: `${fallback.start_date} → ${fallback.end_date}`,
        },
      }),
      userText: `Generate all-projects report from ${fallback.start_date} to ${fallback.end_date}`,
    },
    {
      id: "one",
      label: "One project",
      hint: "Needs project code",
      icon: FolderKanban,
      group: "lookup",
      ask: {
        type: "await_project_code",
        resume: "project_report",
        dateRange: fallback,
        prompt: `Type the project code (e.g. D1342). Period: ${fallback.start_date} → ${fallback.end_date}.`,
      },
      userText: "I want a single project report",
    },
    {
      id: "emp",
      label: "Employee log",
      hint: "Needs emp code",
      icon: UserRound,
      group: "lookup",
      ask: {
        type: "await_employee_code",
        resume: "employee",
        dateRange: fallback,
        prompt: `Type the employee code (e.g. EMP001), or say me. Period: ${fallback.start_date} → ${fallback.end_date}.`,
      },
      userText: "I want an employee worklog",
    },
    {
      id: "planner",
      label: "Task planner",
      hint: "Today’s plan",
      icon: ClipboardList,
      group: "lookup",
      intent: () => ({ type: "planner", range: "day" }),
      userText: "Show my task planner for today",
    },
    {
      id: "rework",
      label: "Rework history",
      hint: "Needs project",
      icon: Wrench,
      group: "lookup",
      ask: {
        type: "await_project_code",
        resume: "rework",
        dateRange: null,
        prompt: "Type the project code for rework history (e.g. D1342).",
      },
      userText: "I want rework history",
    },
  ];
}

export default function AiUserGuide() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const pageGuide = resolvePageGuide(location.pathname, user?.role || "USER");

  const [disabled, setDisabled] = useState(readDisabled);
  const [open, setOpen] = useState(false);
  const [fullPage, setFullPage] = useState(false);
  const [tall, setTall] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);
  const [customStart, setCustomStart] = useState(() => rangeLastWeek().start_date);
  const [customEnd, setCustomEnd] = useState(() => rangeLastWeek().end_date);
  const [filterProjectType, setFilterProjectType] = useState("all");
  const [showTools, setShowTools] = useState(true);
  const [rangeError, setRangeError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const msgId = useRef(0);

  const customRangeValid = Boolean(
    customStart && customEnd && customStart <= customEnd
  );

  const onCustomStartChange = (value) => {
    setCustomStart(value);
    if (value && customEnd && value > customEnd) {
      setRangeError("From date must be on or before To date.");
      return;
    }
    setRangeError("");
  };

  const onCustomEndChange = (value) => {
    setCustomEnd(value);
    if (value && customStart && value < customStart) {
      setRangeError("To date must be on or after From date.");
      return;
    }
    setRangeError("");
  };

  const customRange = useMemo(
    () => ({
      start_date: customStart || toYmd(new Date()),
      end_date: customEnd || toYmd(new Date()),
      label: "Custom range",
    }),
    [customStart, customEnd]
  );

  const selectedSourceId = PROJECT_TYPE_SOURCE_IDS[filterProjectType] || null;

  const withSource = (intent) =>
    selectedSourceId ? { ...intent, source_id: selectedSourceId } : intent;

  const ACTIONS = useMemo(() => buildActions(customRange), [customRange]);
  const firstName = user?.name ? String(user.name).split(" ")[0] : "";
  const isFresh = messages.length <= 1 && !loading;

  const docs = useMemo(
    () =>
      messages.filter(
        (m) => m.role === "assistant" && (m.kind === "weekly_timelog" || m.kind === "document")
      ),
    [messages]
  );

  const activeDoc = useMemo(() => {
    if (!docs.length) return null;
    if (activeDocId != null) {
      const hit = docs.find((d) => d.id === activeDocId);
      if (hit) return hit;
    }
    return docs[docs.length - 1];
  }, [docs, activeDocId]);

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });
  };

  const seedWelcome = useCallback(() => {
    setPending(null);
    setActiveDocId(null);
    setMessages([
      {
        id: `m-${++msgId.current}`,
        role: "assistant",
        kind: "welcome",
        title: firstName ? `Hi ${firstName}` : "Hello",
        lines: [
          "I’m **aimantra** — an AI agent for project reports, worklogs, and planning.",
          "Ask anything, or start with a skill.",
        ],
        showActions: true,
      },
    ]);
  }, [firstName]);

  useEffect(() => {
    if (!disabled && messages.length === 0) seedWelcome();
  }, [disabled, messages.length, seedWelcome]);

  useEffect(() => {
    if (disabled) return undefined;
    const t = window.setTimeout(() => setOpen(true), 8000);
    return () => window.clearTimeout(t);
  }, [disabled]);

  useEffect(() => {
    scrollBottom();
  }, [messages, loading, open, fullPage, loadingStep]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return undefined;
    }
    const t = window.setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_LINES.length);
    }, 1200);
    return () => window.clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!open || disabled) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && fullPage) {
        e.preventDefault();
        setFullPage(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setFullPage((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, disabled, fullPage]);

  useEffect(() => {
    if (!fullPage || !open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullPage, open]);

  const openPanel = () => {
    if (disabled) {
      try {
        localStorage.removeItem(GUIDE_STORAGE_DISABLED);
      } catch {
        /* ignore */
      }
      setDisabled(false);
      seedWelcome();
    }
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const closePanel = () => {
    setOpen(false);
    setFullPage(false);
  };

  const disableForever = () => {
    try {
      localStorage.setItem(GUIDE_STORAGE_DISABLED, "1");
    } catch {
      /* ignore */
    }
    setDisabled(true);
    setOpen(false);
    setFullPage(false);
  };

  const executeIntent = async (intent, userText) => {
    if (loading) return;
    setOpen(true);
    setLoading(true);
    if (userText) {
      setMessages((prev) => [
        ...prev,
        { id: `m-${++msgId.current}`, role: "user", text: userText },
      ]);
    }

    try {
      const result = await runAgent(user, intent);
      if (result.navigateTo) navigate(result.navigateTo);
      if (result.pending) setPending(result.pending);
      else setPending(null);

      const entryId = `m-${++msgId.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id: entryId,
          role: "assistant",
          ...result,
          showActions:
            result.kind === "text" &&
            /help|how can|welcome|hi /i.test(String(result.title || "")),
        },
      ]);

      if (result.kind === "weekly_timelog" || result.kind === "document") {
        setActiveDocId(entryId);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        (typeof err === "string" ? err : "Something went wrong while fetching data.");
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${++msgId.current}`,
          role: "assistant",
          kind: "text",
          title: "Couldn't complete that",
          lines: [String(msg), "Try again, or pick another skill."],
          showActions: true,
        },
      ]);
      setPending(null);
    } finally {
      setLoading(false);
    }
  };

  const onAction = async (action) => {
    if (action.ask) {
      setMessages((prev) => [
        ...prev,
        { id: `m-${++msgId.current}`, role: "user", text: action.userText },
        {
          id: `m-${++msgId.current}`,
          role: "assistant",
          kind: "text",
          title: "Need one more detail",
          lines: [action.ask.prompt],
        },
      ]);
      setPending({
        type: action.ask.type,
        resume: action.ask.resume,
        dateRange: action.ask.dateRange,
        source_id: selectedSourceId,
      });
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 80);
      return;
    }
    const intent = action.intent();
    const next =
      intent.type === "all_projects_report" ? withSource(intent) : intent;
    await executeIntent(next, action.userText);
  };

  const onSend = async (raw) => {
    const text = (raw ?? query).trim();
    if (!text || loading) return;
    setQuery("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    const intent = parseUserMessage(text, user, pending);
    await executeIntent(intent, text);
  };

  const goPage = (path) => {
    navigate(path);
    if (!fullPage) setOpen(false);
  };

  const SkillCard = ({ action }) => {
    const Icon = action.icon;
    return (
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        disabled={loading}
        onClick={() => onAction(action)}
        className="aimantra-card group flex items-start gap-3 rounded-2xl px-3.5 py-3 text-left disabled:opacity-50"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300 ring-1 ring-teal-400/15 transition group-hover:bg-teal-400/15">
          <Icon size={16} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-zinc-100">{action.label}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{action.hint}</span>
        </span>
      </motion.button>
    );
  };

  const shellClass = `aimantra-shell ${
    fullPage
      ? "fixed inset-0 z-[80] flex flex-col overflow-hidden"
      : `fixed bottom-[5.25rem] right-5 z-[60] flex w-[min(96vw,440px)] flex-col overflow-hidden rounded-[1.5rem] border border-white/[0.08] shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${
          tall ? "h-[min(86vh,740px)]" : "h-[min(70vh,540px)]"
        }`
  }`;

  const Header = (
    <header className={`relative shrink-0 ${fullPage ? "px-5 py-3.5" : "px-4 py-3"}`}>
      <div className="aimantra-noise" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/[0.06]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <AgentMark size={fullPage ? 38 : 34} spin={loading} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="aimantra-brand truncate text-[15px] font-semibold text-white">
                aimantra
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-white/[0.06]">
                <span className="aimantra-live-dot h-1.5 w-1.5 rounded-full bg-teal-400" />
                {loading ? "Thinking" : "Online"}
              </span>
            </div>
            <p className="truncate text-[11px] text-zinc-500">
              AI agent · {pageGuide.title}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <IconBtn title="New chat" onClick={seedWelcome}>
            <RotateCcw size={15} />
          </IconBtn>
          {fullPage && (
            <IconBtn
              title={showTools ? "Hide tools" : "Show tools"}
              onClick={() => setShowTools((v) => !v)}
              active={showTools}
            >
              <PanelRightOpen size={15} />
            </IconBtn>
          )}
          {!fullPage && (
            <IconBtn title={tall ? "Compact" : "Taller"} onClick={() => setTall((v) => !v)}>
              {tall ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </IconBtn>
          )}
          <button
            type="button"
            onClick={() => setFullPage((v) => !v)}
            className="mx-1 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.07]"
            title={fullPage ? "Exit full page" : "Full page"}
          >
            {fullPage ? <Shrink size={13} /> : <Expand size={13} />}
            <span className="hidden sm:inline">{fullPage ? "Exit" : "Expand"}</span>
          </button>
          <IconBtn title="Close" onClick={closePanel}>
            <X size={15} />
          </IconBtn>
        </div>
      </div>
    </header>
  );

  const ToolsPanel = (
    <div className="flex flex-col gap-4 overflow-y-auto p-4">
      <div className="aimantra-card rounded-2xl p-3.5">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Project type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_TYPE_FILTER_OPTIONS.map((opt) => {
            const active = filterProjectType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterProjectType(opt.value)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-teal-400 text-teal-950"
                    : "bg-white/[0.04] text-zinc-400 ring-1 ring-white/[0.08] hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="aimantra-card rounded-2xl p-3.5">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Custom range
        </p>
        <div className="grid grid-cols-1 gap-2">
          <label className="block text-[11px] text-zinc-500">
            From
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => onCustomStartChange(e.target.value)}
              className={`mt-1 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-zinc-100 focus:outline-none [color-scheme:dark] ${
                rangeError
                  ? "border-rose-400/50 focus:border-rose-400/60"
                  : "border-white/[0.08] focus:border-teal-400/40"
              }`}
            />
          </label>
          <label className="block text-[11px] text-zinc-500">
            To
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => onCustomEndChange(e.target.value)}
              className={`mt-1 w-full rounded-xl border bg-black/30 px-3 py-2 text-[12px] text-zinc-100 focus:outline-none [color-scheme:dark] ${
                rangeError
                  ? "border-rose-400/50 focus:border-rose-400/60"
                  : "border-white/[0.08] focus:border-teal-400/40"
              }`}
            />
          </label>
        </div>
        {rangeError && (
          <p className="mt-2 text-[11px] font-medium text-rose-300">{rangeError}</p>
        )}
        <button
          type="button"
          disabled={loading || !customRangeValid || Boolean(rangeError)}
          onClick={() => {
            if (!customRangeValid) {
              setRangeError("From date must be on or before To date.");
              return;
            }
            onAction(ACTIONS.find((a) => a.id === "custom"));
          }}
          className="aimantra-send mt-3 w-full rounded-xl px-3 py-2.5 text-[12.5px] font-semibold disabled:opacity-40"
        >
          Run report
        </button>
      </div>

      <div>
        <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Skills
        </p>
        <div className="grid gap-2">
          {ACTIONS.filter((a) => a.id !== "custom").map((action) => (
            <SkillCard key={action.id} action={action} />
          ))}
        </div>
      </div>

      <div className="aimantra-card rounded-2xl p-3.5">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          <MapPin size={11} />
          Page context
        </p>
        <p className="text-[13px] font-medium text-zinc-100">{pageGuide.title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{pageGuide.intro}</p>
        {(pageGuide.quickAsks || []).slice(0, 3).map((q) => (
          <button
            key={q.label}
            type="button"
            disabled={loading}
            onClick={() => onSend(q.query)}
            className="mt-2 block w-full rounded-xl bg-white/[0.03] px-3 py-2 text-left text-[12px] text-zinc-400 ring-1 ring-white/[0.05] transition hover:bg-white/[0.06] hover:text-zinc-200"
          >
            {q.label}
          </button>
        ))}
        {pageGuide.path && (
          <button
            type="button"
            onClick={() => goPage(pageGuide.path)}
            className="mt-2.5 text-[12px] font-medium text-teal-300 hover:underline"
          >
            Open {pageGuide.title} →
          </button>
        )}
      </div>
    </div>
  );

  const WelcomeHero = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto flex w-full flex-col items-center text-center ${
        fullPage ? "max-w-xl py-10" : "py-6"
      }`}
    >
      <div className="aimantra-float mb-5">
        <AgentMark size={fullPage ? 72 : 56} spin />
      </div>
      <h3 className="aimantra-brand text-[22px] font-semibold tracking-tight text-white sm:text-[26px]">
        {message.title}
      </h3>
      <div className="mt-2 max-w-md">
        <TextBubble lines={message.lines} large={fullPage} />
      </div>
      <button
        type="button"
        onClick={() => setFullPage(true)}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[12px] font-medium text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.07] hover:text-white"
      >
        <Expand size={13} />
        Open workspace
      </button>
      <div className={`mt-6 grid w-full gap-2 ${fullPage ? "grid-cols-2" : "grid-cols-1"}`}>
        {ACTIONS.slice(0, fullPage ? 6 : 4).map((action) => (
          <SkillCard key={action.id} action={action} />
        ))}
      </div>
    </motion.div>
  );

  const ChatStream = (
    <div
      ref={listRef}
      className={`relative flex-1 overflow-y-auto ${fullPage ? "px-6 py-4" : "px-3.5 py-3"}`}
    >
      <div className={`mx-auto space-y-5 ${fullPage ? "max-w-2xl" : ""}`}>
        {isFresh && messages[0]?.kind === "welcome" ? (
          <WelcomeHero message={messages[0]} />
        ) : (
          messages.map((m) =>
            m.role === "user" ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div
                  className={`aimantra-user-bubble max-w-[88%] rounded-3xl rounded-br-lg px-4 py-2.5 text-zinc-100 ${
                    fullPage ? "text-[14.5px]" : "text-[13.5px]"
                  }`}
                >
                  {m.text}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="mt-1 shrink-0">
                  <AgentMark size={28} />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  {m.kind === "weekly_timelog" || m.kind === "document" ? (
                    fullPage ? (
                      <button
                        type="button"
                        onClick={() => setActiveDocId(m.id)}
                        className={`aimantra-card w-full rounded-2xl px-4 py-3.5 text-left ${
                          activeDoc?.id === m.id ? "border-teal-400/35 bg-teal-400/5" : ""
                        }`}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-300/90">
                          {m.kind === "weekly_timelog" ? "Report ready" : "Document ready"}
                        </p>
                        <p className="mt-1 text-[14px] font-medium text-white">{m.title}</p>
                        <p className="mt-0.5 text-[12px] text-zinc-500">
                          {m.periodLabel || m.subtitle || "Open in canvas →"}
                        </p>
                      </button>
                    ) : (
                      <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
                        <ReportDoc
                          doc={m}
                          compact
                          onOpenProject={(id) => {
                            navigate(`/projects/${id}`);
                            setOpen(false);
                          }}
                        />
                      </div>
                    )
                  ) : m.kind === "welcome" ? (
                    <div>
                      <p className="aimantra-brand mb-1 text-[15px] font-semibold text-white">
                        {m.title}
                      </p>
                      <TextBubble lines={m.lines} large={fullPage} />
                    </div>
                  ) : (
                    <div>
                      {m.title && (
                        <p className="mb-1.5 text-[12px] font-medium text-zinc-400">{m.title}</p>
                      )}
                      <TextBubble lines={m.lines} large={fullPage} />
                    </div>
                  )}

                  {m.showActions && !loading && m.kind !== "welcome" && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {ACTIONS.slice(0, 4).map((action) => (
                        <SkillCard key={`${m.id}-${action.id}`} action={action} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          )
        )}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <AgentMark size={28} spin />
              <div className="aimantra-thinking min-w-[200px] rounded-2xl px-4 py-3 ring-1 ring-white/[0.06]">
                <div className="flex items-center gap-2 text-[13px] text-zinc-300">
                  <Loader2 size={14} className="animate-spin text-teal-300" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={loadingStep}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      className="font-medium"
                    >
                      {LOADING_LINES[loadingStep]}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-zinc-500">…</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const Composer = (
    <div className={`shrink-0 ${fullPage ? "px-6 pb-6 pt-2" : "px-3.5 pb-3.5 pt-1"}`}>
      <div className={`mx-auto ${fullPage ? "max-w-2xl" : ""}`}>
        {!fullPage && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PROJECT_TYPE_FILTER_OPTIONS.map((opt) => {
              const active = filterProjectType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterProjectType(opt.value)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                    active
                      ? "bg-teal-400 text-teal-950"
                      : "bg-white/[0.04] text-zinc-500 ring-1 ring-white/[0.08]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {pending && (
          <p className="mb-2 rounded-xl bg-teal-400/10 px-3 py-2 text-[12px] text-teal-200 ring-1 ring-teal-400/20">
            Waiting for{" "}
            <strong>
              {pending.type === "await_employee_code" ? "employee code" : "project code"}
            </strong>
          </p>
        )}

        <form
          className="aimantra-composer flex items-end gap-2 rounded-[1.4rem] p-2 pl-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder={
              pending?.type === "await_project_code"
                ? "Project code e.g. D1342"
                : pending?.type === "await_employee_code"
                  ? "Emp code or me"
                  : "Message aimantra…"
            }
            disabled={loading}
            className={`max-h-[120px] min-h-[44px] min-w-0 flex-1 resize-none bg-transparent py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none ${
              fullPage ? "text-[15px]" : "text-[14px]"
            }`}
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.94 }}
            disabled={loading || !query.trim()}
            className="aimantra-send mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:cursor-not-allowed"
            aria-label="Send"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={17} strokeWidth={2.4} />}
          </motion.button>
        </form>

        <div className="mt-2.5 flex items-center justify-between px-1">
          <p className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
            <Command size={10} />
            {fullPage ? "Esc to exit" : "Enter to send"}
          </p>
          <button
            type="button"
            onClick={disableForever}
            className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-rose-300"
          >
            <EyeOff size={10} />
            Hide
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {(!open || fullPage) && (
        <motion.button
          type="button"
          onClick={openPanel}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className={`aimantra-fab fixed bottom-5 right-5 z-[60] flex items-center gap-2.5 rounded-full pl-2 pr-4 py-2 ${
            open && fullPage ? "pointer-events-none opacity-0" : ""
          }`}
          title={disabled ? "Re-enable aimantra" : "aimantra"}
        >
          <AgentMark size={32} spin={!disabled} />
          <span className="aimantra-brand text-sm font-semibold text-white">
            {disabled ? "AI off" : "aimantra"}
          </span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && !disabled && (
          <>
            {fullPage && (
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[79] bg-black/60 backdrop-blur-sm"
                onClick={() => setFullPage(false)}
              />
            )}
            <motion.div
              key="shell"
              initial={fullPage ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={fullPage ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className={shellClass}
              role="dialog"
              aria-modal={fullPage}
              aria-label="aimantra agent"
            >
              <div className="aimantra-noise" />
              {Header}

              {fullPage ? (
                <div className="flex min-h-0 flex-1">
                  {showTools && (
                    <aside className="flex w-[300px] shrink-0 flex-col border-r border-white/[0.06] bg-black/20">
                      <div className="border-b border-white/[0.06] px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Tools
                        </p>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto">{ToolsPanel}</div>
                    </aside>
                  )}

                  <section className="flex min-w-0 flex-1 flex-col border-r border-white/[0.06]">
                    {ChatStream}
                    {Composer}
                  </section>

                  <section className="flex min-w-0 flex-[1.15] flex-col bg-black/30">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Canvas
                      </p>
                      {docs.length > 1 && (
                        <div className="flex max-w-[65%] gap-1.5 overflow-x-auto">
                          {docs.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setActiveDocId(d.id)}
                              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium ${
                                activeDoc?.id === d.id
                                  ? "bg-teal-400 text-teal-950"
                                  : "bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08]"
                              }`}
                            >
                              {(d.title || "Report").slice(0, 20)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                      <AnimatePresence mode="wait">
                        {activeDoc ? (
                          <motion.div
                            key={activeDoc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="overflow-hidden rounded-2xl ring-1 ring-white/[0.08]"
                          >
                            <ReportDoc
                              doc={activeDoc}
                              fullPage
                              onOpenProject={(id) => {
                                navigate(`/projects/${id}`);
                                setFullPage(false);
                                setOpen(false);
                              }}
                            />
                          </motion.div>
                        ) : (
                          <div className="aimantra-card flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl px-8 text-center">
                            <AgentMark size={56} spin />
                            <p className="aimantra-brand mt-5 text-[18px] font-semibold text-white">
                              Report canvas
                            </p>
                            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500">
                              Generated reports appear here so you can keep chatting while you
                              review.
                            </p>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => onAction(ACTIONS[0])}
                              className="aimantra-send mt-5 rounded-xl px-5 py-2.5 text-[13px] font-semibold"
                            >
                              Generate weekly report
                            </button>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>
                </div>
              ) : (
                <>
                  {ChatStream}
                  {Composer}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
