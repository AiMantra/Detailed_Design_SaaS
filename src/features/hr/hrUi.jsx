import { useNavigate } from "react-router-dom";
import { projectKindBadge, kraShortcutKind } from "./hrUtils";

export const hrInputClass =
  "w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500";

export function ProjectKindBadge({ project, label }) {
  const text = label || projectKindBadge(project);
  if (!text) return null;
  const hr = text === "HR";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        hr ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {text}
    </span>
  );
}

export function HrPageHeader({ title, subtitle, onBack, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back
          </button>
        )}
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function HrEmptyState({ title, body, action }) {
  return (
    <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-gray-100">
      <p className="text-xl font-semibold text-gray-700 mb-2">{title}</p>
      {body && <p className="text-gray-500 mb-4">{body}</p>}
      {action}
    </div>
  );
}

export function KraShortcut({ name, projectId, compact = false }) {
  const navigate = useNavigate();
  const kind = kraShortcutKind(name);
  if (!kind || !projectId) return null;
  const toRequirements = () => navigate(`/timesheet/hr/${projectId}/requirements`);
  const label = kind === "requirement" ? "Add requirement" : "Add candidate";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        toRequirements();
      }}
      className={
        compact
          ? "mt-1 text-[10px] font-semibold text-violet-700 hover:underline"
          : "text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100"
      }
    >
      {label}
    </button>
  );
}

export function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
