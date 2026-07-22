import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Calendar, 
  ClipboardList, 
  ChevronDown, 
  ChevronUp,
  Clock,
  MapPin,
  Building2,
  IndianRupee,
  Ruler,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  Briefcase,
  User,
  Layers,
  Target,
  Info,
  Loader2,
  Users,
  TrendingUp,
  BarChart3,
  Timer
} from "lucide-react";
import { showSnackbar } from "../notifications/notificationSlice";
import { fetchProjects, fetchCompanies, fetchSubCompanies, fetchSectors, fetchClients } from "../api/apiSlice";
import { fetchUserTasks } from "../tasks/taskSlice";


const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const mapStatusToFrontend = (backendStatus) => {
  const map = {
    "Pending": "PENDING",
    "Inprogress": "ONGOING",
    "Complete": "COMPLETED",
    "OnHold": "HOLD"
  };
  return map[backendStatus] || "PENDING";
};

const mapUnitToFrontend = (backendUnit) => {
  const map = {
    'Kilometer': 'Km',
    'Numbers': 'Nos.',
    'Percentage': 'Percentage'
  };
  return map[backendUnit] || backendUnit;
};

const UserPickedProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { projects = [], loading: apiLoading, companies = [], subCompanies = [], sectors = [], clients = [] } = useSelector((state) => state.api);
  const { userTasks = [], loading: tasksLoading } = useSelector((state) => state.tasks || {});
  
  const [project, setProject] = useState(null);
  const [userProjectTasks, setUserProjectTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState({});

  // Create lookup maps
  const companyMap = useMemo(() => {
    const map = {};
    companies.forEach(company => { map[company.id] = company.name; });
    return map;
  }, [companies]);

  const subCompanyMap = useMemo(() => {
    const map = {};
    subCompanies.forEach(sub => { map[sub.id] = sub.name; });
    return map;
  }, [subCompanies]);

  const sectorMap = useMemo(() => {
    const map = {};
    sectors.forEach(sector => { map[sector.id] = sector.name; });
    return map;
  }, [sectors]);

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach(client => { map[client.id] = client.name; });
    return map;
  }, [clients]);

  // Fetch data if not loaded
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (projects.length === 0) {
          await Promise.all([
            dispatch(fetchProjects()),
            dispatch(fetchCompanies()),
            dispatch(fetchSubCompanies()),
            dispatch(fetchSectors()),
            dispatch(fetchClients())
          ]);
        }
        // Always fetch user tasks to ensure we have latest data
        if (user?.id) {
          await dispatch(fetchUserTasks(user.id));
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, projects.length, user?.id]);

  // Find the project and filter user's tasks
  useEffect(() => {
    if (!id || !userTasks.length) {
      return;
    }
    
    // Find the project in projects list
    let foundProject = projects.find(p => p.id === id || p.project_id === id);
    
    if (foundProject) {
      setProject(foundProject);
      
      // Filter tasks that belong to this project - CRITICAL: Match by project_id
      const projectTasks = userTasks.filter(task => {
        // Check if task's project_id matches the current project ID
        const matches = task.project_id === id;
        if (matches) {
        }
        return matches;
      });
      
      setUserProjectTasks(projectTasks);
    } else {
      // Try to find from tasks directly
      const tasksInProject = userTasks.filter(task => task.project_id === id);
      if (tasksInProject.length > 0) {
        // Create project object from task data
        const firstTask = tasksInProject[0];
        setProject({
          id: id,
          project_name: firstTask.project_name,
          project_code: firstTask.project_code,
          progress: tasksInProject.reduce((sum, t) => sum + (t.progress || 0), 0) / tasksInProject.length,
          status: tasksInProject.every(t => t.status === 'COMPLETED') ? 'Complete' : 'Inprogress',
          location: '—',
          total_length: 0,
          workorder_cost: 0
        });
        setUserProjectTasks(tasksInProject);
      } else {
        dispatch(showSnackbar({
          message: `No tasks found for this project`,
          type: "warning"
        }));
      }
    }
  }, [id, projects, userTasks, dispatch]);

  const toggleTask = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getCompanyName = useCallback(() => {
    const companyId = project?.company || project?.company_id;
    if (companyMap[companyId]) return companyMap[companyId];
    if (project?.company_detail?.name) return project.company_detail.name;
    return companyId || "—";
  }, [project, companyMap]);

  const getSubCompanyName = useCallback(() => {
    const subCompanyId = project?.sub_company || project?.sub_company_id;
    if (subCompanyMap[subCompanyId]) return subCompanyMap[subCompanyId];
    if (project?.sub_company_detail?.name) return project.sub_company_detail.name;
    return subCompanyId || "—";
  }, [project, subCompanyMap]);

  const getSectorName = useCallback(() => {
    const sectorId = project?.sector || project?.sector_id;
    if (sectorMap[sectorId]) return sectorMap[sectorId];
    if (project?.sector_detail?.name) return project.sector_detail.name;
    return sectorId || "—";
  }, [project, sectorMap]);

  const getClientName = useCallback(() => {
    const clientId = project?.client || project?.client_id;
    if (clientMap[clientId]) return clientMap[clientId];
    if (project?.client_detail?.name) return project.client_detail.name;
    return clientId || project?.department || "—";
  }, [project, clientMap]);

  const getProjectName = useCallback(() => project?.project_name || project?.name || "Unnamed Project", [project]);
  const getProjectCode = useCallback(() => project?.project_code || project?.code || "N/A", [project]);
  const getProjectStatus = useCallback(() => mapStatusToFrontend(project?.status), [project]);
  const getProjectProgress = useCallback(() => project?.progress || 0, [project]);
  const getProjectLocation = useCallback(() => project?.location || "—", [project]);
  const getProjectTotalLength = useCallback(() => `${project?.total_length || project?.totalLength || 0} km`, [project]);
  const getProjectCost = useCallback(() => `₹ ${project?.cost || project?.workorder_cost || 0} Lakhs`, [project]);

  const getProjectLoaDate = useCallback(() => {
    const date = project?.loa_date || project?.loaDate;
    return date ? formatDate(date) : "Not set";
  }, [project]);

  const getProjectDirectorProposalDate = useCallback(() => {
    const date = project?.director_proposal_date || project?.directorProposalDate;
    return date ? formatDate(date) : "Not set";
  }, [project]);

  const getProjectConfirmationDate = useCallback(() => {
    const date = project?.project_confirmation_date || project?.projectConfirmationDate;
    return date ? formatDate(date) : "Not set";
  }, [project]);

  const getProjectCompletionDate = useCallback(() => project?.completion_date || project?.completionDate, [project]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const getDeadlineBadge = (endDate, isCompleted = false) => {
    if (isCompleted) return null;
    const days = calculateDaysLeft(endDate);
    if (days === null) return null;
    if (days < 0) return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Overdue</span>;
    if (days === 0) return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Due Today</span>;
    if (days <= 2) return <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">{days} days left</span>;
    if (days <= 7) return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">{days} days left</span>;
    return <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">{days} days left</span>;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "COMPLETED": return "bg-green-100 text-green-600";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-600";
      case "ONGOING": return "bg-blue-100 text-blue-600";
      case "DELAYED": return "bg-red-100 text-red-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatTime = (hours) => {
    if (!hours) return '0h';
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Calculate project stats from user's tasks
  const projectStats = useMemo(() => {
    const totalTasks = userProjectTasks.length;
    const completedTasks = userProjectTasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = userProjectTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ONGOING').length;
    const pendingTasks = userProjectTasks.filter(t => t.status === 'PENDING').length;
    const totalTimeSpent = userProjectTasks.reduce((sum, t) => sum + (t.total_time_spent || 0), 0);
    const avgProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalTimeSpent,
      avgProgress
    };
  }, [userProjectTasks]);

  if (loading || apiLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl p-8 shadow-xl flex items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <div>
            <p className="text-lg font-semibold text-gray-800">Loading Project</p>
            <p className="text-sm text-gray-500">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project && userProjectTasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-4">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Tasks Found</h2>
          <p className="text-gray-600 mb-4">You haven't picked any tasks from this project.</p>
          <button
            onClick={() => navigate("/all-projects")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/my-tasks")} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{getProjectName()}</h1>
              <p className="text-sm text-gray-500">Code: {getProjectCode()}</p>
            </div>
          </div>
          <button onClick={() => navigate(`/projects/${id}/logs`)} className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2">
            <FileText size={18} /> View Logs
          </button>
        </div>

        {/* Status Banner */}
        <div className={`rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
          getProjectStatus() === "DELAYED" ? "bg-red-50 border border-red-200" :
          getProjectStatus() === "COMPLETED" ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"
        }`}>
          <div className="flex items-center gap-3">
            {getProjectStatus() === "DELAYED" ? <AlertCircle className="text-red-600" size={24} /> :
             getProjectStatus() === "COMPLETED" ? <CheckCircle2 className="text-green-600" size={24} /> :
             <Clock className="text-blue-600" size={24} />}
            <div>
              <p className="font-semibold">Project Status: <span className={getProjectStatus() === "DELAYED" ? "text-red-600" : getProjectStatus() === "COMPLETED" ? "text-green-600" : "text-blue-600"}>{getProjectStatus()}</span></p>
              <p className="text-sm text-gray-600">{getProjectProgress() === 100 ? `Completed on ${formatDate(getProjectCompletionDate())}` : "Project is on track"}</p>
            </div>
          </div>
          <div className="text-right w-full md:w-auto">
            <p className="text-sm text-gray-600">{getProjectProgress() === 100 ? "Completion Date" : "Deadline"}</p>
            <p className="font-semibold">{formatDate(getProjectCompletionDate())}</p>
            {getProjectProgress() !== 100 && getDeadlineBadge(getProjectCompletionDate())}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"><Building2 size={20} className="text-blue-600" /> Project Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Company" value={getCompanyName()} />
                <DetailItem label="Sub Company" value={getSubCompanyName()} />
                <DetailItem label="Location" value={getProjectLocation()} icon={<MapPin size={12} />} />
                <DetailItem label="Sector" value={getSectorName()} />
                <DetailItem label="Client/Dept" value={getClientName()} />
                <DetailItem label="Total Length" value={getProjectTotalLength()} icon={<Ruler size={12} />} />
                <DetailItem label="Workorder Cost" value={getProjectCost()} icon={<IndianRupee size={12} />} />
                <DetailItem label="LOA Date" value={getProjectLoaDate()} icon={<Calendar size={12} />} />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-700 mb-3">Key Milestones</h4>
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Director Proposal" value={getProjectDirectorProposalDate()} />
                  <DetailItem label="Project Confirmation" value={getProjectConfirmationDate()} />
                </div>
              </div>
            </div>
            <div className="border-l border-gray-100 pl-8">
              <h4 className="text-xl font-semibold text-gray-800 mb-6">My Progress Overview</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2"><span className="font-medium">My Overall Progress</span><span className="text-blue-600 font-bold">{projectStats.avgProgress}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${projectStats.avgProgress}%` }} transition={{ duration: 1 }} className={`h-4 rounded-full ${getProgressColor(projectStats.avgProgress)}`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="My Tasks" value={projectStats.totalTasks} />
                  <StatCard label="Completed" value={projectStats.completedTasks} />
                  <StatCard label="In Progress" value={projectStats.inProgressTasks} />
                  <StatCard label="Pending" value={projectStats.pendingTasks} />
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-2 mb-1"><Timer size={16} className="text-purple-600" /><span className="text-sm font-semibold text-purple-700">Total Time Spent</span></div>
                  <p className="text-2xl font-bold text-purple-700">{formatTime(projectStats.totalTimeSpent)}</p>
                  <p className="text-xs text-purple-600 mt-1">Across all your tasks in this project</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2"><ClipboardList size={24} className="text-blue-600" /> My Tasks in This Project ({userProjectTasks.length})</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500"><User size={16} /><span>{user?.name}</span></div>
          </div>

          {userProjectTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
              <Briefcase size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tasks Picked</h3>
              <p className="text-gray-500">You haven't picked any tasks from this project yet.</p>
              <button onClick={() => navigate("/all-projects")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Browse Projects</button>
            </div>
          ) : (
            <div className="space-y-4">
              {userProjectTasks.map((task) => {
                const isExpanded = expandedTasks[task.id];
                const taskProgress = task.progress || 0;
                const isCompleted = task.status === 'COMPLETED';
                const latestWorkLog = task.work_logs?.[task.work_logs.length - 1];
                
                return (
                  <div key={task.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold text-gray-800">{task.subactivity_name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>{task.status}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{task.activity_name}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> Picked: {formatDate(task.picked_at)}</span>
                            {task.unit !== 'status' && task.unit !== null && (
                              <span>Progress: {task.completed_quantity || 0}/{task.total_quantity || 0} {task.unit_display || task.unit}</span>
                            )}
                            {task.total_time_spent > 0 && <span className="flex items-center gap-1"><Timer size={12} /> Total: {formatTime(task.total_time_spent)}</span>}
                          </div>
                        </div>
                        <button onClick={() => toggleTask(task.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      {task.unit !== 'status' && task.unit !== null && !isCompleted && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">Progress</span><span className="font-semibold text-blue-600">{taskProgress}%</span></div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${taskProgress}%` }} className={`h-2 rounded-full ${getProgressColor(taskProgress)}`} /></div>
                        </div>
                      )}

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-gray-100">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div><h4 className="font-medium text-gray-700 mb-2 text-sm">Task Details</h4>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                                  <p><span className="text-gray-500">Unit:</span> {task.unit_display || task.unit || 'status'}</p>
                                  {task.unit !== 'status' && task.unit !== null && (
                                    <>
                                      <p><span className="text-gray-500">Planned Quantity:</span> {task.total_quantity}</p>
                                      <p><span className="text-gray-500">Completed Quantity:</span> {task.completed_quantity || 0}</p>
                                    </>
                                  )}
                                  <p><span className="text-gray-500">Total Time Spent:</span> {formatTime(task.total_time_spent || 0)}</p>
                                  <p><span className="text-gray-500">Deadline:</span> {formatDate(task.end_date)}</p>
                                </div>
                              </div>
                              <div><h4 className="font-medium text-gray-700 mb-2 text-sm">Work History</h4>
                                <div className="bg-gray-50 p-3 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                                  {task.work_logs && task.work_logs.length > 0 ? task.work_logs.slice().reverse().map((log, idx) => (
                                    <div key={idx} className="text-xs border-b border-gray-200 pb-2 last:border-0">
                                      <div className="font-medium text-gray-700">{log.date}</div>
                                      {log.status === 'WORKED' ? (
                                        <>
                                          <div className="text-gray-600">{log.start_time?.split('T')[1]?.substring(0, 5)} - {log.end_time?.split('T')[1]?.substring(0, 5)}<span className="ml-2 text-blue-600">{log.hours_worked?.toFixed(2)}h</span></div>
                                          {log.completed_quantity > 0 && <div className="text-green-600">Completed: {log.completed_quantity}</div>}
                                        </>
                                      ) : (
                                        <div className="text-red-600 flex items-center gap-1"><AlertCircle size={12} /> Not Worked: {log.note}</div>
                                      )}
                                      {log.note && log.status === 'WORKED' && <div className="text-gray-500 italic">"{log.note.substring(0, 60)}"</div>}
                                    </div>
                                  )) : <p className="text-gray-500 text-center py-2">No work logs yet</p>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5" />
          <div><h4 className="font-semibold text-blue-800 mb-1">About This Project</h4><p className="text-sm text-blue-700">You have picked {userProjectTasks.length} task(s) from this project. Track your progress and log daily work hours in the <span className="font-bold">"My Tasks"</span> section.</p></div>
        </div>
      </div>
    </motion.div>
  );
};

const DetailItem = ({ label, value, icon }) => (
  <div className="space-y-1"><p className="text-xs text-gray-500 flex items-center gap-1">{icon && icon}{label}</p><p className="font-medium text-sm text-gray-800 break-words">{value}</p></div>
);

const StatCard = ({ label, value }) => (
  <div className="bg-gray-50 p-4 rounded-xl"><p className="text-xs text-gray-500">{label}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
);

export default UserPickedProjectDetails;