import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { fetchProjectLetters } from "../../services/letterService";

const letterLabel = (letter) => {
  if (!letter) return "";
  const type = letter.letterType || letter.subject;
  return type ? `${letter.number} (${type})` : letter.number;
};

const LetterNumberSelect = ({
  projectId,
  value = "",
  onChange,
  required = false,
  compact = false,
  error = false,
}) => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState(value || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selected = useMemo(
    () =>
      letters.find(
        (letter) =>
          letter.number === value ||
          String(letter.number).trim() === String(value || "").trim()
      ) || null,
    [letters, value]
  );

  useEffect(() => {
    if (!projectId) {
      setLetters([]);
      setLoadError("");
      setSearch("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetchProjectLetters(projectId)
      .then((list) => {
        if (cancelled) return;
        setLetters(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setLetters([]);
        setLoadError(err.message || "Could not load letter numbers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setSearch(selected ? letterLabel(selected) : value || "");
  }, [selected, value]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch(selected ? letterLabel(selected) : value || "");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected, value]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term || (selected && search === letterLabel(selected))) return letters;
    return letters.filter((letter) =>
      `${letter.number} ${letter.letterType || ""} ${letter.subject || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [letters, search, selected]);

  const inputClass = compact
    ? `w-full bg-white border rounded-lg px-2 py-1.5 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-400 bg-red-50" : "border-gray-200"
      }`
    : `w-full px-4 py-2 pr-14 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-400" : "border-gray-200"
      }`;

  const handleSelect = (letter) => {
    setSearch(letterLabel(letter));
    setOpen(false);
    onChange(letter.number);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearch("");
    setOpen(true);
    onChange("");
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={loading && !value ? "Letter number loading..." : search}
        onChange={(e) => {
          if (loading) return;
          const next = e.target.value;
          setSearch(next);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => {
          if (!loading) setOpen(true);
        }}
        placeholder={!projectId ? "Select a project first" : "Search letter number"}
        disabled={(loading && !value) || !projectId}
        required={required && !value}
        className={`${inputClass} ${loading && !value ? "text-gray-500 italic bg-gray-50 cursor-wait" : ""}`}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {loading ? (
          <Loader2 size={compact ? 11 : 14} className="animate-spin text-blue-400" />
        ) : (
          <>
            {value && (
              <button
                type="button"
                onMouseDown={handleClear}
                className="text-gray-400 hover:text-red-500"
                title="Clear"
              >
                <X size={compact ? 10 : 14} />
              </button>
            )}
            <ChevronDown size={compact ? 11 : 14} className="text-gray-400 pointer-events-none" />
          </>
        )}
      </div>

      {open && !loading && (
        <div
          className={`absolute z-[9999] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-y-auto ${
            compact ? "max-h-40" : "max-h-52"
          }`}
        >
          {filtered.length === 0 ? (
            <div className={`px-3 py-3 text-center text-gray-400 ${compact ? "text-[11px]" : "text-sm"}`}>
              {loadError || "No letter numbers found"}
            </div>
          ) : (
            filtered.map((letter) => {
              const isActive = letter.number === value;
              return (
                <button
                  type="button"
                  key={letter.id}
                  onMouseDown={() => handleSelect(letter)}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    compact ? "text-xs" : "text-sm"
                  } ${isActive ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50/60 text-gray-700"}`}
                >
                  <div className="font-medium leading-tight">{letter.number}</div>
                  {(letter.letterType || letter.subject) && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {letter.letterType || letter.subject}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {loadError && !open && (
        <p className={`${compact ? "text-[9px]" : "text-xs"} text-red-500 mt-1`}>{loadError}</p>
      )}
    </div>
  );
};

export default LetterNumberSelect;
