import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Eye, FileUp, Loader2, X } from "lucide-react";
import { hrProjectService } from "../../services/hrProjectService";
import { showSnackbar } from "../notifications/notificationSlice";
import { currentEmpCode } from "./hrUtils";
import { hrInputClass } from "./hrUi";

export function HrStageProofActions({ projectId, stage, lineName }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ document_name: "", document: null, remarks: "" });
  const [fileKey, setFileKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const stageId = stage?.id;
  const stageName = stage?.name || stage?.stage_name || "Stage";

  const openModal = (event) => {
    event.stopPropagation();
    setForm({ document_name: "", document: null, remarks: "" });
    setFileKey((key) => key + 1);
    setOpen(true);
  };

  const viewDocuments = (event) => {
    event.stopPropagation();
    const query = stageId ? `?stage=${stageId}` : "";
    navigate(`/timesheet/hr/${projectId}/proofs${query}`);
  };

  const saveProof = async () => {
    const documentName = form.document_name.trim();
    if (!stageId || !documentName || !(form.document instanceof File)) {
      dispatch(showSnackbar({
        message: "Enter a document name and choose a file",
        type: "error",
      }));
      return;
    }
    setSaving(true);
    try {
      await hrProjectService.createStageProof({
        stage: stageId,
        project: projectId,
        document_name: documentName,
        document: form.document,
        remarks: form.remarks.trim(),
        created_by: currentEmpCode(),
      });
      dispatch(showSnackbar({ message: "Proof submitted", type: "success" }));
      setOpen(false);
    } catch (err) {
      dispatch(showSnackbar({
        message: err?.message || "Failed to submit proof",
        type: "error",
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full hover:bg-violet-200 inline-flex items-center gap-1"
        onClick={openModal}
      >
        <FileUp size={14} />
        Proof
      </button>
      <button
        type="button"
        className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 inline-flex items-center gap-1"
        onClick={viewDocuments}
      >
        <Eye size={14} />
        View
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Submit stage proof</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            {lineName && <p className="text-sm text-gray-600 mb-1">{lineName}</p>}
            <p className="text-sm font-medium text-violet-700 mb-4">{stageName}</p>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Document name
                <input
                  className={`${hrInputClass} mt-1`}
                  value={form.document_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, document_name: e.target.value }))}
                  placeholder="Offer letter, attendance sheet..."
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                File
                <input
                  key={fileKey}
                  type="file"
                  className={`${hrInputClass} mt-1`}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    document: e.target.files?.[0] || null,
                  }))}
                />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Remarks
                <textarea
                  className={`${hrInputClass} mt-1`}
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm border rounded-xl">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveProof}
                className="px-4 py-2 text-sm rounded-xl bg-violet-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Submit proof
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
