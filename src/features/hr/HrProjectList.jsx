import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, Loader2 } from "lucide-react";
import { PROJECT_SOURCE_IDS } from "../../constants/projectSources";
import { hrProjectService } from "../../services/hrProjectService";
import { formatAssignedTo, formatWhen, recordId } from "./hrUtils";
import { HrEmptyState, HrPageHeader, ProjectKindBadge } from "./hrUi";

const HrProjectList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const canCreate = user?.role === "ADMIN" || user?.role === "ACCOUNT";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    hrProjectService
      .listProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load HR projects");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <HrPageHeader
        title="HR Projects"
        subtitle="KRA timesheets. Civil jobs stay on the project list."
        actions={
          canCreate && (
            <button
              type="button"
              onClick={() => navigate("/project/create", { state: { sourceId: PROJECT_SOURCE_IDS.HR } })}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Create HR project
            </button>
          )
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading HR projects
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <HrEmptyState
          title="No HR projects"
          body="HR projects created here are separate from civil jobs."
          action={
            canCreate && (
              <button
                type="button"
                onClick={() => navigate("/project/create", { state: { sourceId: PROJECT_SOURCE_IDS.HR } })}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Create HR project
              </button>
            )
          }
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Project code</th>
                  <th className="px-4 py-3">Project name</th>
                  <th className="px-4 py-3">Short name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Kind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((project) => {
                  const id = recordId(project);
                  return (
                    <tr
                      key={id || project.project_code}
                      onClick={() => id && navigate(`/timesheet/hr/${id}/proofs`)}
                      className="hover:bg-blue-50/60 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {project.project_code || "—"}
                      </td>
                      <td className="px-4 py-3">{project.project_name || "—"}</td>
                      <td className="px-4 py-3">{project.short_name || "—"}</td>
                      <td className="px-4 py-3">{project.location || "—"}</td>
                      <td className="px-4 py-3">{formatAssignedTo(project.assigned_to)}</td>
                      <td className="px-4 py-3">{formatWhen(project.created_at)}</td>
                      <td className="px-4 py-3">
                        <ProjectKindBadge label="HR" />
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

export default HrProjectList;
