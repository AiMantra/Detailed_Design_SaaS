import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { hrProjectService } from "../../services/hrProjectService";
import { projectService } from "../../services/projectService";
import { showSnackbar } from "../notifications/notificationSlice";
import {
  activitiesOf,
  currentEmpCode,
  recordId,
  stagesOf,
  subactivitiesOf,
  unwrapProjectRecord,
} from "./hrUtils";
import { HrEmptyState, HrPageHeader } from "./hrUi";

function proofTime(proof) {
  const raw = proof?.created_at || proof?.created_on || proof?.updated_at;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return { key: "undated", label: "Undated", time: "" };
  const key = date.toISOString().slice(0, 10);
  return {
    key,
    label: date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function documentHref(proof) {
  const value = proof?.document;
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

const HrStageProofs = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const stageFilter = searchParams.get("stage") || "";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [stageLabels, setStageLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedProjectId, setLoadedProjectId] = useState(projectId);
  if (loadedProjectId !== projectId) {
    setLoadedProjectId(projectId);
    setLoading(true);
    setError("");
    setRows([]);
    setStageLabels({});
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      hrProjectService.listStageProofs({ projectId }),
      projectService.getProjectDetails(projectId).catch(() => null),
    ])
      .then(([proofs, details]) => {
        if (cancelled) return;
        setRows(proofs || []);
        const labels = {};
        const record = unwrapProjectRecord(details);
        activitiesOf(record).forEach((activity) => {
          subactivitiesOf(activity).forEach((sub) => {
            const line = sub.subactivity_name || sub.name || "";
            stagesOf(sub).forEach((stage) => {
              if (!stage?.id) return;
              labels[stage.id] = {
                stage: stage.name || stage.stage_name || "Stage",
                line,
              };
            });
          });
        });
        setStageLabels(labels);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load submitted documents");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const visibleRows = useMemo(() => {
    if (!stageFilter) return rows;
    return rows.filter((proof) => {
      const stageId = proof.stage?.id || proof.stage || proof.stage_id;
      return String(stageId) === String(stageFilter);
    });
  }, [rows, stageFilter]);

  const groups = useMemo(() => {
    const order = [];
    const map = new Map();
    visibleRows.forEach((proof) => {
      const when = proofTime(proof);
      if (!map.has(when.key)) {
        map.set(when.key, { key: when.key, label: when.label, items: [] });
        order.push(when.key);
      }
      map.get(when.key).items.push({ proof, time: when.time });
    });
    return order.map((key) => map.get(key));
  }, [visibleRows]);

  const removeProof = async (proof) => {
    const id = recordId(proof);
    const emp = currentEmpCode();
    if (!id) return;
    if (!window.confirm(`Delete ${proof.document_name || "this document"}?`)) return;
    try {
      await hrProjectService.deleteStageProof(id, emp);
      setRows((prev) => prev.filter((item) => recordId(item) !== id));
      dispatch(showSnackbar({ message: "Document deleted", type: "success" }));
    } catch (err) {
      dispatch(showSnackbar({ message: err.message || "Failed to delete document", type: "error" }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <HrPageHeader
        title="Submitted documents"
        subtitle={
          stageFilter
            ? `Documents for ${stageLabels[stageFilter]?.stage || "this stage"}${stageLabels[stageFilter]?.line ? ` · ${stageLabels[stageFilter].line}` : ""}, newest date first.`
            : "Stage proofs for this HR project, newest date first."
        }
        onBack={() => navigate("/all-projects")}
      />

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading documents
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <HrEmptyState
          title="No documents yet"
          body={
            stageFilter
              ? "No proof has been submitted for this stage yet."
              : "Submit a proof from a work stage on the HR project. Uploaded files show here by date."
          }
        />
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="text-sm font-semibold text-gray-500 mb-3">{group.label}</h2>
            <div className="space-y-3">
              {group.items.map(({ proof, time }) => {
                const href = documentHref(proof);
                const stageId = proof.stage || proof.stage_id;
                const known = stageLabels[stageId] || {};
                const stageName = proof.stage_name || known.stage || "Stage";
                const line = known.line;
                return (
                  <div
                    key={recordId(proof) || `${stageId}-${proof.document_name}`}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{proof.document_name || "Document"}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stageName}
                        {line ? ` · ${line}` : ""}
                        {time ? ` · ${time}` : ""}
                      </p>
                      {proof.remarks && (
                        <p className="text-sm text-gray-600 mt-2">{proof.remarks}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"
                        >
                          <ExternalLink size={14} />
                          View
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => removeProof(proof)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default HrStageProofs;
