import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { hrProjectService } from "../../services/hrProjectService";
import { showSnackbar } from "../notifications/notificationSlice";
import {
  CANDIDATE_SOURCES,
  CANDIDATE_STAGES,
  CV_STATUS,
  currentEmpCode,
  emptyCandidate,
  recordId,
} from "./hrUtils";
import { Field, HrEmptyState, HrPageHeader, hrInputClass } from "./hrUi";

const HrRequirementDetail = () => {
  const { projectId, requirementId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [requirement, setRequirement] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState(`${projectId}:${requirementId}`);
  if (loadedKey !== `${projectId}:${requirementId}`) {
    setLoadedKey(`${projectId}:${requirementId}`);
    setLoading(true);
    setError("");
    setRequirement(null);
    setCandidates([]);
  }
  const [form, setForm] = useState({ ...emptyCandidate(), requirement: requirementId });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [requirements, people] = await Promise.all([
        hrProjectService.listRequirements(projectId),
        hrProjectService.listCandidates({ requirementId }),
      ]);
      setRequirement(requirements.find((row) => recordId(row) === requirementId) || null);
      setCandidates(people);
    } catch (err) {
      setError(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      hrProjectService.listRequirements(projectId),
      hrProjectService.listCandidates({ requirementId }),
    ])
      .then(([requirements, people]) => {
        if (cancelled) return;
        setRequirement(requirements.find((row) => recordId(row) === requirementId) || null);
        setCandidates(people);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load candidates");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, requirementId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyCandidate(), requirement: requirementId });
  };

  const startEdit = (row) => {
    setEditingId(recordId(row));
    setForm({
      requirement: row.requirement || requirementId,
      candidate_name: row.candidate_name || "",
      position: row.position || "",
      source: row.source || "",
      contact: row.contact || "",
      cv: null,
      cv_status: row.cv_status || "shortlisted",
      stage: row.stage || "cv_shortlist",
      remarks: row.remarks || "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const emp = currentEmpCode();
    if (!emp) {
      dispatch(showSnackbar({ message: "Logged-in employee code is missing", type: "error" }));
      return;
    }
    if (!form.requirement) {
      dispatch(showSnackbar({ message: "Select a requirement before adding a candidate", type: "error" }));
      return;
    }
    if (!form.candidate_name.trim()) {
      dispatch(showSnackbar({ message: "Candidate name is required", type: "error" }));
      return;
    }
    const payload = {
      requirement: form.requirement,
      candidate_name: form.candidate_name.trim(),
      position: form.position.trim(),
      source: form.source,
      contact: form.contact.trim(),
      cv_status: form.cv_status,
      stage: form.stage,
      remarks: form.remarks || "",
      cv: form.cv,
      project: projectId,
    };
    setSaving(true);
    try {
      if (editingId) {
        await hrProjectService.updateCandidate(editingId, { ...payload, updated_by: emp });
        dispatch(showSnackbar({ message: "Candidate updated", type: "success" }));
      } else {
        await hrProjectService.createCandidate({ ...payload, created_by: emp });
        dispatch(showSnackbar({ message: "Candidate added", type: "success" }));
      }
      resetForm();
      await load();
    } catch (err) {
      dispatch(showSnackbar({ message: err.message || "Failed to save candidate", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const emp = currentEmpCode();
    const id = recordId(row);
    if (!emp || !id) return;
    if (!window.confirm(`Delete ${row.candidate_name || "this candidate"}?`)) return;
    try {
      await hrProjectService.deleteCandidate(id, emp);
      setCandidates((prev) => prev.filter((item) => recordId(item) !== id));
      if (editingId === id) resetForm();
      dispatch(showSnackbar({ message: "Candidate deleted", type: "success" }));
    } catch (err) {
      dispatch(showSnackbar({ message: err.message || "Failed to delete candidate", type: "error" }));
    }
  };

  const cvHref = (row) => (typeof row?.cv === "string" && row.cv.trim() ? row.cv : "");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <HrPageHeader
        title={requirement?.designation || "Requirement"}
        subtitle={
          requirement
            ? `${requirement.department || "Department"} · ${requirement.vacancies ?? "—"} vacancies · ${requirement.location || "Location not set"}`
            : "Candidates for this opening"
        }
        onBack={() => navigate(`/timesheet/hr/${projectId}/requirements`)}
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingId ? "Edit candidate" : "Add candidate"}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name" required>
            <input className={hrInputClass} value={form.candidate_name} onChange={(e) => setField("candidate_name", e.target.value)} />
          </Field>
          <Field label="Position">
            <input
              className={hrInputClass}
              placeholder={requirement?.designation || "Defaults to designation"}
              value={form.position}
              onChange={(e) => setField("position", e.target.value)}
            />
          </Field>
          <Field label="Source">
            <select className={hrInputClass} value={form.source} onChange={(e) => setField("source", e.target.value)}>
              <option value="">Select source</option>
              {CANDIDATE_SOURCES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Contact">
            <input className={hrInputClass} value={form.contact} onChange={(e) => setField("contact", e.target.value)} />
          </Field>
          <Field label="CV status">
            <select className={hrInputClass} value={form.cv_status} onChange={(e) => setField("cv_status", e.target.value)}>
              {CV_STATUS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Stage">
            <select className={hrInputClass} value={form.stage} onChange={(e) => setField("stage", e.target.value)}>
              {CANDIDATE_STAGES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="CV">
            <input
              key={editingId || "new-cv"}
              type="file"
              className={hrInputClass}
              onChange={(e) => setField("cv", e.target.files?.[0] || null)}
            />
          </Field>
        </div>
        <Field label="Remarks">
          <textarea className={`${hrInputClass} mt-1`} rows={2} value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm border rounded-xl">
              Cancel edit
            </button>
          )}
          <button
            type="submit"
            disabled={saving || !requirementId}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingId ? "Save candidate" : "Add candidate"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading candidates
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      {!loading && !error && candidates.length === 0 && (
        <HrEmptyState title="No candidates" body="Add a person and CV for this opening." />
      )}
      {!loading && !error && candidates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">CV status</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">CV</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {candidates.map((row) => {
                  const href = cvHref(row);
                  return (
                    <tr key={recordId(row)}>
                      <td className="px-4 py-3 font-medium">{row.candidate_name || "—"}</td>
                      <td className="px-4 py-3">{row.position || "—"}</td>
                      <td className="px-4 py-3">{row.source || "—"}</td>
                      <td className="px-4 py-3">{row.contact || "—"}</td>
                      <td className="px-4 py-3">{row.cv_status || "—"}</td>
                      <td className="px-4 py-3">{row.stage || "—"}</td>
                      <td className="px-4 py-3">
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline">
                            View CV
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" title="Edit" onClick={() => startEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                            <Pencil size={14} />
                          </button>
                          <button type="button" title="Delete" onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrRequirementDetail;
