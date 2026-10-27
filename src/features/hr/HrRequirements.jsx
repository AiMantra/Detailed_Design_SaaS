import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { hrProjectService } from "../../services/hrProjectService";
import { showSnackbar } from "../notifications/notificationSlice";
import {
  REQUIREMENT_APPROVAL,
  REQUIREMENT_STATUS,
  currentEmpCode,
  emptyRequirement,
  recordId,
} from "./hrUtils";
import { Field, HrEmptyState, HrPageHeader, hrInputClass } from "./hrUi";

const HrRequirements = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedProjectId, setLoadedProjectId] = useState(projectId);
  if (loadedProjectId !== projectId) {
    setLoadedProjectId(projectId);
    setLoading(true);
    setError("");
    setRows([]);
  }
  const [form, setForm] = useState(emptyRequirement());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    return hrProjectService
      .listRequirements(projectId)
      .then(setRows)
      .catch((err) => setError(err.message || "Failed to load requirements"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    hrProjectService
      .listRequirements(projectId)
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load requirements");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = (row, event) => {
    event.stopPropagation();
    setEditingId(recordId(row));
    setForm({
      department: row.department || "",
      designation: row.designation || "",
      vacancies: row.vacancies ?? 1,
      qualification: row.qualification || "",
      experience: row.experience || "",
      location: row.location || "",
      approval: row.approval || "pending",
      status: row.status || "open",
      remarks: row.remarks || "",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyRequirement());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const emp = currentEmpCode();
    if (!emp) {
      dispatch(showSnackbar({ message: "Logged-in employee code is missing", type: "error" }));
      return;
    }
    if (!form.designation.trim() || !form.department.trim()) {
      dispatch(showSnackbar({ message: "Department and designation are required", type: "error" }));
      return;
    }
    const payload = {
      department: form.department.trim(),
      designation: form.designation.trim(),
      vacancies: Number(form.vacancies) || 0,
      qualification: form.qualification.trim(),
      experience: form.experience.trim(),
      location: form.location.trim(),
      approval: form.approval,
      status: form.status,
      remarks: form.remarks || "",
    };
    setSaving(true);
    try {
      if (editingId) {
        await hrProjectService.updateRequirement(editingId, { ...payload, updated_by: emp });
        dispatch(showSnackbar({ message: "Requirement updated", type: "success" }));
      } else {
        await hrProjectService.createRequirement({
          ...payload,
          project: projectId,
          created_by: emp,
        });
        dispatch(showSnackbar({ message: "Requirement created", type: "success" }));
      }
      resetForm();
      load();
    } catch (err) {
      dispatch(showSnackbar({ message: err.message || "Failed to save requirement", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row, event) => {
    event.stopPropagation();
    const emp = currentEmpCode();
    const id = recordId(row);
    if (!emp || !id) return;
    if (!window.confirm(`Delete ${row.designation || "this requirement"}?`)) return;
    try {
      await hrProjectService.deleteRequirement(id, emp);
      setRows((prev) => prev.filter((item) => recordId(item) !== id));
      if (editingId === id) resetForm();
      dispatch(showSnackbar({ message: "Requirement deleted", type: "success" }));
    } catch (err) {
      dispatch(showSnackbar({ message: err.message || "Failed to delete requirement", type: "error" }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <HrPageHeader
        title="Requirements"
        subtitle="Job openings under this HR project. Open a row to add candidates."
        onBack={() => navigate("/all-projects")}
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {editingId ? "Edit requirement" : "New requirement"}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Department" required>
            <input className={hrInputClass} value={form.department} onChange={(e) => setField("department", e.target.value)} />
          </Field>
          <Field label="Designation" required>
            <input className={hrInputClass} value={form.designation} onChange={(e) => setField("designation", e.target.value)} />
          </Field>
          <Field label="Vacancies">
            <input type="number" min="1" className={hrInputClass} value={form.vacancies} onChange={(e) => setField("vacancies", e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={hrInputClass} value={form.location} onChange={(e) => setField("location", e.target.value)} />
          </Field>
          <Field label="Qualification">
            <input className={hrInputClass} value={form.qualification} onChange={(e) => setField("qualification", e.target.value)} />
          </Field>
          <Field label="Experience">
            <input className={hrInputClass} value={form.experience} onChange={(e) => setField("experience", e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={hrInputClass} value={form.status} onChange={(e) => setField("status", e.target.value)}>
              {REQUIREMENT_STATUS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Approval">
            <select className={hrInputClass} value={form.approval} onChange={(e) => setField("approval", e.target.value)}>
              {REQUIREMENT_APPROVAL.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
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
            disabled={saving}
            className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {editingId ? "Save changes" : "Add requirement"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading requirements
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      {!loading && !error && rows.length === 0 && (
        <HrEmptyState title="No requirements" body="Add an opening to start recruitment for this project." />
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Vacancies</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Approval</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const id = recordId(row);
                  return (
                    <tr
                      key={id}
                      className="hover:bg-blue-50/60 cursor-pointer"
                      onClick={() => navigate(`/timesheet/hr/${projectId}/requirements/${id}`)}
                    >
                      <td className="px-4 py-3 font-medium">{row.designation || "—"}</td>
                      <td className="px-4 py-3">{row.department || "—"}</td>
                      <td className="px-4 py-3">{row.vacancies ?? "—"}</td>
                      <td className="px-4 py-3">{row.location || "—"}</td>
                      <td className="px-4 py-3">{row.status || "—"}</td>
                      <td className="px-4 py-3">{row.approval || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" title="Edit" onClick={(event) => startEdit(row, event)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                            <Pencil size={14} />
                          </button>
                          <button type="button" title="Delete" onClick={(event) => handleDelete(row, event)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">
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

export default HrRequirements;
