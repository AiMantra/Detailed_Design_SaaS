import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  Timer,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  BarChart3,
  FolderOpen,
  Activity,
  Layers,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import { fetchUserWorkSummary, calculateWorkLogStats } from './taskSlice';
import { useNavigate } from 'react-router-dom';
import LoadingModal from '../../components/modals/LoadingModal';

const MyTasks = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { userWorkSummary = null, loading = false } = useSelector((state) => state.tasks || {});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [viewMode, setViewMode] = useState('projects'); // 'projects' or 'timeline'

  useEffect(() => {
    if (user?.id) {
      fetchWorkSummary();
    }
  }, [dispatch, user?.id]);

  const fetchWorkSummary = async () => {
    await dispatch(fetchUserWorkSummary(user?.id));
  };

  const toggleProjectExpand = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const toggleActivityExpand = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const formatDuration = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '0h';
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatDurationDetailed = (timeString) => {
    if (!timeString || timeString === '00:00:00') return '0 hours';
    const parts = timeString.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);

    const parts_array = [];
    if (hours > 0) parts_array.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts_array.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 && hours === 0) parts_array.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    return parts_array.join(' ') || '0 hours';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleViewProjectDetails = (projectId, e) => {
    e.stopPropagation();
    navigate(`/my-projects/${projectId}`);
  };

  const handleViewProject = (projectId, e) => {
    e.stopPropagation();

    navigate(`/all-projects`, {
      state: { showProjectDetailsID: projectId }
    });
  };

  const handleProjectContinueWork = (projectId, activityId, subActivityId, e) => {
    e.stopPropagation();

    navigate(`/all-projects`, {
      state: { showProjectDetailsID: projectId, showActivityDetailsID: activityId, showSubAcivityDetailsID: subActivityId }
    });
  };

  const handleContinueWork = (projectId, activityId, subactivityId, e) => {
    e.stopPropagation();
    // Navigate to the specific task for time logging
    navigate(`/my-projects/${projectId}?activity=${activityId}&task=${subactivityId}`);
  };

  let filteredProjects = userWorkSummary?.projects || [];

  if (searchTerm) {
    filteredProjects = filteredProjects.filter(project =>
      project.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filterProject !== 'all') {
    filteredProjects = filteredProjects.filter(project =>
      project.project_name === filterProject
    );
  }

  const uniqueProjects = [...new Set((userWorkSummary?.projects || []).map(p => p.project_name))];

  // Calculate comprehensive stats
  const calculateStats = () => {
    let totalHours = 0;
    let totalActivities = 0;
    let totalTasks = 0;
    let projectStats = [];

    (userWorkSummary?.projects || []).forEach(project => {
      let projectHours = 0;
      let projectActivities = 0;
      let projectTasks = 0;

      (project.activities || []).forEach(activity => {
        const parts = activity.total_time_spent?.split(':') || ['0', '0', '0'];
        const hours = parseInt(parts[0]);
        projectHours += hours;
        projectActivities++;
        projectTasks += (activity.subactivities?.length || 0);
      });

      totalHours += projectHours;
      totalActivities += projectActivities;
      totalTasks += projectTasks;

      projectStats.push({
        name: project.project_name,
        hours: projectHours,
        activities: projectActivities,
        tasks: projectTasks
      });
    });

    return { totalHours, totalActivities, totalTasks, projectStats };
  };

  const { totalHours, totalActivities, totalTasks, projectStats } = calculateStats();

  if (loading && !userWorkSummary) {
    return <LoadingModal isVisible={true} />;
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Welcome Header */}
        <div className="mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {getGreeting()}, {userWorkSummary?.name || user?.name || 'User'}! 👋
                </h1>
                <p className="text-blue-100 text-sm md:text-base">
                  Employee Code: {userWorkSummary?.emp_code || user?.emp_code || 'N/A'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                    🎯 Track your progress
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                    ⏱️ Log your hours
                  </span>
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                    📊 View analytics
                  </span>
                </div>
              </div>
              <button
                onClick={fetchWorkSummary}
                disabled={loading}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh Data
              </button>
            </div>
          </motion.div>
        </div>

        {/* Stats Dashboard */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{filteredProjects.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Projects</p>
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((filteredProjects.length / Math.max(uniqueProjects.length, 1)) * 100, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Timer size={20} className="text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">{totalHours} hrs total</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{totalHours}</p>
            <p className="text-xs text-green-600 mt-1">Total Hours Worked</p>
            <div className="mt-2 text-xs text-green-500">
              ≈ {Math.round(totalHours / 8)} work days
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Activity size={20} className="text-purple-600" />
              </div>
              <span className="text-xs text-purple-600 font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{totalActivities}</p>
            <p className="text-xs text-purple-600 mt-1">Activities Worked</p>
            <div className="mt-2 text-xs text-purple-500">
              Avg {totalActivities > 0 ? Math.round(totalHours / totalActivities) : 0}h per activity
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Layers size={20} className="text-orange-600" />
              </div>
              <span className="text-xs text-orange-600 font-medium">Tracked</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">{totalTasks}</p>
            <p className="text-xs text-orange-600 mt-1">Total Tasks</p>
            <div className="mt-2 text-xs text-orange-500">
              {totalTasks > 0 ? `${Math.round(totalHours / totalTasks * 10) / 10}h per task` : 'No tasks yet'}
            </div>
          </div>
        </motion.div>

        {/* View Toggle & Search Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects, activities, or tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px] outline-none cursor-pointer"
              >
                <option value="all">📁 All Projects ({uniqueProjects.length})</option>
                {uniqueProjects.map(project => (
                  <option key={project} value={project}>
                    {project.length > 40 ? project.substring(0, 40) + '...' : project}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('projects')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'projects'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <FolderOpen size={16} />
                Projects
              </button>
              {/* <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <BarChart3 size={16} />
                Timeline
              </button> */}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Work Records Found</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || filterProject !== 'all'
                ? 'No projects match your current filters. Try adjusting your search criteria.'
                : "You haven't logged any work hours yet. Start by browsing available projects and logging your first task."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterProject('all');
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => navigate('/all-projects')}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Browse Projects
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        ) : viewMode === 'projects' ? (
          <div className="space-y-4">
            {filteredProjects.map((project, index) => {
              const isProjectExpanded = expandedProjects[project.project_id];
              const projectHours = project.activities?.reduce((sum, act) => {
                const parts = act.total_time_spent?.split(':') || ['0', '0', '0'];
                const hours = parseInt(parts[0]);
                return sum + hours;
              }, 0) || 0;
              const projectActivityCount = project.activities?.length || 0;
              const projectTaskCount = project.activities?.reduce((sum, act) => sum + (act.subactivities?.length || 0), 0) || 0;

              return (
                <motion.div
                  key={project.project_id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Project Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div
                        className="flex items-start gap-3 flex-1 cursor-pointer group"
                        onClick={() => toggleProjectExpand(project.project_id)}
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                          <Building2 size={22} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {project.project_name}
                          </h3>
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Activity size={12} />
                              {projectActivityCount} activities
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Layers size={12} />
                              {projectTaskCount} tasks
                            </span>
                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                              <Timer size={12} />
                              {projectHours} hours total
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-2xl font-bold text-blue-600">{projectHours}</p>
                          <p className="text-xs text-gray-400">hours logged</p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleViewProject(project.project_id, e)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                          <Eye size={16} />
                          <span className="text-sm font-medium hidden sm:inline">View Project</span>
                        </motion.button>

                        <button
                          onClick={() => toggleProjectExpand(project.project_id)}
                          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          {isProjectExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* Quick stats bar */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Activities: {projectActivityCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Tasks: {projectTaskCount}</span>
                        </div>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min((projectHours / Math.max(totalHours, 1)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-blue-600 font-medium">{Math.round((projectHours / Math.max(totalHours, 1)) * 100)}% of total</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Content */}
                  <AnimatePresence>
                    {isProjectExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Quick Action Banner */}
                        {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b border-blue-100">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <AlertCircle size={14} className="text-blue-600" />
                              </div>
                              <p className="text-sm text-blue-700">
                                Want to log more hours on this project?
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/my-projects/${project.project_id}`)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              <PlusCircle size={14} />
                              Log Time Now
                            </button>
                          </div>
                        </div> */}

                        {/* Activities List */}
                        <div className="divide-y divide-gray-100">
                          {project.activities?.map((activity) => {
                            const isActivityExpanded = expandedActivities[activity.activity_id];
                            const activityHours = formatDuration(activity.total_time_spent);
                            const activityHoursDetailed = formatDurationDetailed(activity.total_time_spent);

                            return (
                              <div key={activity.activity_id} className="bg-gray-50">
                                {/* Activity Header */}
                                <div
                                  className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => toggleActivityExpand(activity.activity_id)}
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Clock size={18} className="text-purple-600" />
                                      </div>
                                      <div>
                                        <h4 className="font-medium text-gray-800">{activity.activity_name}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {activity.subactivities?.length || 0} tasks • {activityHoursDetailed}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <span className="text-lg font-semibold text-purple-600">{activityHours}</span>
                                        <p className="text-xs text-gray-400">total time</p>
                                      </div>
                                      <button className="p-1.5 hover:bg-white rounded-lg transition-colors">
                                        {isActivityExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Subactivities (Tasks) */}
                                <AnimatePresence>
                                  {isActivityExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="bg-white p-4 space-y-3"
                                    >
                                      {activity.subactivities?.length === 0 ? (
                                        <div className="text-center py-8">
                                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <AlertCircle size={20} className="text-gray-400" />
                                          </div>
                                          <p className="text-sm text-gray-500">No tasks logged in this activity yet</p>
                                          <button
                                            onClick={(e) => handleContinueWork(project.project_id, activity.activity_id, null, e)}
                                            className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1 mx-auto"
                                          >
                                            <PlusCircle size={14} />
                                            Log your first task
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="grid gap-3">
                                          {activity.subactivities?.map((sub) => (
                                            <div key={sub.subactivity_id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all border border-gray-100">
                                              <div className="flex justify-between items-start flex-wrap gap-3">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <h5 className="font-medium text-gray-800">{sub.subactivity_name}</h5>
                                                  </div>
                                                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                      <Timer size={12} />
                                                      Time spent: <strong className="text-blue-600">{formatDuration(sub.total_time_spent)}</strong>
                                                    </span>
                                                    {sub.completion_status && (
                                                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${sub.completion_status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {sub.completion_status === 'COMPLETED' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                        {sub.completion_status}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <button
                                                  // onClick={(e) => handleContinueWork(project.project_id, activity.activity_id, sub.subactivity_id, e)}
                                                  onClick={(e) => handleProjectContinueWork(project.project_id, activity.activity_id, sub.subactivity_id, e)}
                                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200"
                                                >
                                                  <Eye size={16} />
                                                  View Details
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}

                          {(!project.activities || project.activities.length === 0) && (
                            <div className="p-8 text-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Activity size={28} className="text-gray-400" />
                              </div>
                              <p className="text-gray-500">No activities found for this project</p>
                              <button
                                onClick={() => navigate(`/my-projects/${project.project_id}`)}
                                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                              >
                                Start working on this project
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                          <button
                            onClick={(e) => handleViewProject(project.project_id, e)}
                            // onClick={() => navigate(`/my-projects/${project.project_id}`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-2 group"
                          >
                            <Eye size={14} className="group-hover:scale-110 transition-transform" />
                            View complete project details and all tasks
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Timeline View
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Work Timeline</h3>
            </div>

            <div className="space-y-6">
              {projectStats.map((stat, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2 line-clamp-1">{stat.name}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Hours</p>
                      <p className="text-xl font-bold text-blue-600">{stat.hours}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Activities</p>
                      <p className="text-xl font-bold text-purple-600">{stat.activities}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tasks</p>
                      <p className="text-xl font-bold text-orange-600">{stat.tasks}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(stat.hours / Math.max(totalHours, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary Footer */}
        {filteredProjects.length > 0 && viewMode === 'projects' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Your Work Summary</h4>
                <p className="text-sm text-blue-700">
                  You have logged <strong className="text-blue-800">{totalHours} hours</strong> across <strong className="text-blue-800">{uniqueProjects.length} projects</strong>.
                  This includes <strong className="text-blue-800">{totalActivities} activities</strong> and <strong className="text-blue-800">{totalTasks} individual tasks</strong>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-white/80 text-blue-700 px-2 py-1 rounded-full">
                    ⚡ Average: {totalActivities > 0 ? (totalHours / totalActivities).toFixed(1) : 0}h per activity
                  </span>
                  <span className="text-xs bg-white/80 text-blue-700 px-2 py-1 rounded-full">
                    📊 {totalTasks > 0 ? (totalHours / totalTasks).toFixed(1) : 0}h per task
                  </span>
                  <span className="text-xs bg-white/80 text-blue-700 px-2 py-1 rounded-full">
                    🎯 {uniqueProjects.length} project{uniqueProjects.length !== 1 ? 's' : ''} active
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
                  💡 <span>Tip: Click "View Project" to see all available tasks and log more work hours for any project.</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MyTasks;