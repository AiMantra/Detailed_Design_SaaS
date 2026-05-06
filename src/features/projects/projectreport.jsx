import { useState, useMemo, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
    Search,
    User,
    Briefcase,
    Activity,
    CalendarDays,
    FileText,
    Users,
    Timer,
    Eye,
    ChevronRight,
    Clock,
    Layers,
    ChevronDown,
    ChevronUp,
    Recycle,
    CheckCircle,
    XCircle,
    FilterX,
    Building2,
    Calendar,
    Hourglass,
    MessageSquare,
    TrendingUp,
    Grid,
    List,
    BarChart3,
    Download,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { fetchProjectReport } from '../tasks/taskSlice';

const ProjectReport = () => {
    const dispatch = useDispatch();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [expandedProject, setExpandedProject] = useState(null);
    const [expandedActivity, setExpandedActivity] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'compact'
    const [showDescriptions, setShowDescriptions] = useState(true);

    // Get data from Redux store
    const { projectsReport, loading } = useSelector((state) => state.tasks || {});
    const user = sessionStorage.getItem('emp_code');

    useEffect(() => {
        if (user) {
            fetchReportData();
        }
    }, [dispatch, user]);

    const fetchReportData = async () => {
        await dispatch(fetchProjectReport({ emp_code: user }));
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
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) return 'Today';
            if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Transform API data for all projects
    const reportData = useMemo(() => {
        if (!projectsReport) {
            return {
                projects: [],
                totalStats: {
                    totalProjects: 0,
                    totalEmployees: 0,
                    totalHours: 0,
                    totalTasks: 0,
                    statusBreakdown: { Approved: 0, Submitted: 0, Inprogress: 0, Rejected: 0 }
                },
                allEmployees: [],
                allActivities: []
            };
        }

        const projects = projectsReport.projects || [];
        const allEmployeesMap = new Map();
        let totalHours = 0;
        let totalTasks = 0;
        const globalStatusCount = { Approved: 0, Submitted: 0, Inprogress: 0, Rejected: 0 };

        const processedProjects = projects.map(project => {
            let projectTotalHours = 0;
            let projectTotalTasks = 0;
            const projectStatusCount = { Approved: 0, Submitted: 0, Inprogress: 0, Rejected: 0 };
            const projectEmployeesMap = new Map();

            const processedActivities = (project.activities || []).map(activity => {
                let activityTotalHours = 0;

                const processedSubactivities = (activity.subactivities || []).map(sub => {
                    let subTotalHours = 0;
                    const usersList = [];
                    const allLogs = [];

                    (sub.users || []).forEach(user => {
                        const userHours = parseInt(user.total_time_spent?.split(':')[0] || 0);
                        subTotalHours += userHours;
                        projectTotalHours += userHours;
                        totalHours += userHours;
                        projectTotalTasks++;
                        totalTasks++;
                        projectStatusCount[sub.status] = (projectStatusCount[sub.status] || 0) + 1;
                        globalStatusCount[sub.status] = (globalStatusCount[sub.status] || 0) + 1;

                        // Track employees globally
                        if (!allEmployeesMap.has(user.emp_code)) {
                            allEmployeesMap.set(user.emp_code, {
                                emp_code: user.emp_code,
                                name: user.name,
                                total_hours: 0,
                                total_tasks: 0,
                                projects: new Set(),
                                statusBreakdown: { Approved: 0, Submitted: 0, Inprogress: 0, Rejected: 0 }
                            });
                        }
                        const globalEmp = allEmployeesMap.get(user.emp_code);
                        globalEmp.total_hours += userHours;
                        globalEmp.total_tasks++;
                        globalEmp.projects.add(project.project_id);
                        globalEmp.statusBreakdown[sub.status] = (globalEmp.statusBreakdown[sub.status] || 0) + 1;

                        // Track employees per project
                        if (!projectEmployeesMap.has(user.emp_code)) {
                            projectEmployeesMap.set(user.emp_code, {
                                emp_code: user.emp_code,
                                name: user.name,
                                total_hours: 0,
                                total_tasks: 0
                            });
                        }
                        const projectEmp = projectEmployeesMap.get(user.emp_code);
                        projectEmp.total_hours += userHours;
                        projectEmp.total_tasks++;

                        // Collect all logs with descriptions
                        (user.date_wise || []).forEach(dateLog => {
                            (dateLog.logs || []).forEach(log => {
                                allLogs.push({
                                    date: dateLog.date,
                                    time_spent: log.time_spent,
                                    description: log.description,
                                    user: user.name,
                                    user_code: user.emp_code
                                });
                            });
                        });

                        usersList.push({
                            ...user,
                            hours: userHours,
                            logs: user.date_wise
                        });
                    });

                    activityTotalHours += subTotalHours;

                    return {
                        subactivity_id: sub.subactivity_id,
                        subactivity_name: sub.subactivity_name,
                        status: sub.status,
                        total_time_spent: sub.total_time_spent,
                        total_hours: subTotalHours,
                        users: usersList,
                        logs: allLogs,
                        date_wise: sub.users?.flatMap(u => u.date_wise || []) || []
                    };
                });

                return {
                    activity_id: activity.activity_id,
                    activity_name: activity.activity_name,
                    total_time_spent: activity.total_time_spent,
                    total_hours: activityTotalHours,
                    subactivities: processedSubactivities,
                    statusCount: {
                        Approved: processedSubactivities.filter(s => s.status === 'Approved').length,
                        Submitted: processedSubactivities.filter(s => s.status === 'Submitted').length,
                        Inprogress: processedSubactivities.filter(s => s.status === 'Inprogress').length,
                        Rejected: processedSubactivities.filter(s => s.status === 'Rejected').length
                    }
                };
            });

            return {
                project_id: project.project_id,
                project_name: project.project_name,
                project_code: project.project_code,
                total_hours: projectTotalHours,
                total_tasks: projectTotalTasks,
                total_activities: processedActivities.length,
                total_employees: projectEmployeesMap.size,
                statusBreakdown: projectStatusCount,
                activities: processedActivities,
                employees: Array.from(projectEmployeesMap.values()).sort((a, b) => b.total_hours - a.total_hours)
            };
        });

        return {
            projects: processedProjects,
            totalStats: {
                totalProjects: projects.length,
                totalEmployees: allEmployeesMap.size,
                totalHours: totalHours,
                totalTasks: totalTasks,
                statusBreakdown: globalStatusCount
            },
            allEmployees: Array.from(allEmployeesMap.values()).sort((a, b) => b.total_hours - a.total_hours),
            allActivities: processedProjects.flatMap(p => p.activities)
        };
    }, [projectsReport]);

    // Filter data based on selections
    const filteredData = useMemo(() => {
        if (!reportData.projects.length) return { projects: [], filteredStats: reportData.totalStats };

        let filteredProjects = [...reportData.projects];

        if (selectedProject !== 'all') {
            filteredProjects = filteredProjects.filter(project => project.project_id === selectedProject);
        }

        if (selectedStatus !== 'all') {
            filteredProjects = filteredProjects.map(project => ({
                ...project,
                activities: project.activities.map(activity => ({
                    ...activity,
                    subactivities: activity.subactivities.filter(sub => sub.status === selectedStatus)
                })).filter(activity => activity.subactivities.length > 0)
            })).filter(project => project.activities.length > 0);
        }

        if (selectedEmployee !== 'all') {
            filteredProjects = filteredProjects.map(project => ({
                ...project,
                activities: project.activities.map(activity => ({
                    ...activity,
                    subactivities: activity.subactivities.map(sub => ({
                        ...sub,
                        users: sub.users.filter(user => user.emp_code === selectedEmployee),
                        logs: sub.logs.filter(log => log.user_code === selectedEmployee)
                    })).filter(sub => sub.users.length > 0)
                })).filter(activity => activity.subactivities.length > 0),
                employees: project.employees.filter(emp => emp.emp_code === selectedEmployee)
            })).filter(project => project.activities.length > 0);
        }

        if (searchTerm) {
            filteredProjects = filteredProjects.map(project => ({
                ...project,
                activities: project.activities.map(activity => ({
                    ...activity,
                    subactivities: activity.subactivities.filter(sub =>
                        sub.subactivity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sub.users.some(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        sub.logs.some(l => l.description.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                })).filter(activity => activity.subactivities.length > 0)
            })).filter(project => project.activities.length > 0);
        }

        let filteredTotalHours = 0;
        let filteredTotalTasks = 0;
        const filteredStatusBreakdown = { Approved: 0, Submitted: 0, Inprogress: 0, Rejected: 0 };

        filteredProjects.forEach(project => {
            filteredTotalHours += project.total_hours;
            filteredTotalTasks += project.total_tasks;
            filteredStatusBreakdown.Approved += project.statusBreakdown.Approved;
            filteredStatusBreakdown.Submitted += project.statusBreakdown.Submitted;
            filteredStatusBreakdown.Inprogress += project.statusBreakdown.Inprogress;
            filteredStatusBreakdown.Rejected += project.statusBreakdown.Rejected;
        });

        return {
            projects: filteredProjects,
            filteredStats: {
                totalProjects: filteredProjects.length,
                totalEmployees: selectedEmployee !== 'all' ? filteredProjects.reduce((sum, p) => sum + p.employees.length, 0) : reportData.totalStats.totalEmployees,
                totalHours: filteredTotalHours,
                totalTasks: filteredTotalTasks,
                statusBreakdown: filteredStatusBreakdown
            }
        };
    }, [reportData, searchTerm, selectedProject, selectedStatus, selectedEmployee]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedProject('all');
        setSelectedStatus('all');
        setSelectedEmployee('all');
    };

    const hasActiveFilters = searchTerm || selectedProject !== 'all' || selectedStatus !== 'all' || selectedEmployee !== 'all';

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'Submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Inprogress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={14} className="text-green-600" />;
            case 'Submitted': return <FileText size={14} className="text-blue-600" />;
            case 'Inprogress': return <Activity size={14} className="text-yellow-600" />;
            case 'Rejected': return <XCircle size={14} className="text-red-600" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading projects report...</p>
                    <p className="text-sm text-gray-400 mt-1">Please wait while we fetch the data</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 shadow-xl rounded-xl">
                <div className="max-w-full mx-auto px-6 py-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 rounded-xl">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                                <Briefcase size={36} className="text-purple-200" />
                                Project Performance Dashboard
                            </h1>
                            <p className="text-purple-100 text-lg">Complete overview of all projects, activities, and team performance metrics</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchReportData}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium text-white"
                            >
                                <Recycle size={18} />
                                Refresh Data
                            </button>
                            {/* <button
                                onClick={() => window.print()}
                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-medium text-white"
                            >
                                <Download size={18} />
                                Export
                            </button> */}
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            <span className="text-sm text-purple-200">Active filters:</span>
                            {selectedProject !== 'all' && (
                                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                                    <Briefcase size={14} />
                                    {reportData.projects.find(p => p.project_id === selectedProject)?.project_name?.substring(0, 40)}
                                    <button onClick={() => setSelectedProject('all')} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                            {selectedEmployee !== 'all' && (
                                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                                    <User size={14} />
                                    {reportData.allEmployees.find(e => e.emp_code === selectedEmployee)?.name}
                                    <button onClick={() => setSelectedEmployee('all')} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                            {selectedStatus !== 'all' && (
                                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                                    {getStatusIcon(selectedStatus)}
                                    Status: {selectedStatus}
                                    <button onClick={() => setSelectedStatus('all')} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                            {searchTerm && (
                                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                                    <Search size={14} />
                                    "{searchTerm}"
                                    <button onClick={() => setSearchTerm('')} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                            <button
                                onClick={handleResetFilters}
                                className="inline-flex items-center gap-1 text-sm text-purple-200 hover:text-white ml-2"
                            >
                                <FilterX size={14} />
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-full mx-auto px-6 py-6">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Projects</p>
                                <p className="text-3xl font-bold text-purple-700">{hasActiveFilters ? filteredData.filteredStats.totalProjects : reportData.totalStats.totalProjects}</p>
                                <p className="text-xs text-gray-400 mt-1">Active projects</p>
                            </div>
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                                <Briefcase size={28} className="text-purple-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Team Members</p>
                                <p className="text-3xl font-bold text-blue-700">{hasActiveFilters ? filteredData.filteredStats.totalEmployees : reportData.totalStats.totalEmployees}</p>
                                <p className="text-xs text-gray-400 mt-1">Across all projects</p>
                            </div>
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                                <Users size={28} className="text-blue-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Hours</p>
                                <p className="text-3xl font-bold text-green-700">{hasActiveFilters ? filteredData.filteredStats.totalHours : reportData.totalStats.totalHours}</p>
                                <p className="text-xs text-gray-400 mt-1">Man-hours logged</p>
                            </div>
                            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                                <Timer size={28} className="text-green-600" />
                            </div>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                                <p className="text-3xl font-bold text-orange-700">{hasActiveFilters ? filteredData.filteredStats.totalTasks : reportData.totalStats.totalTasks}</p>
                                <p className="text-xs text-gray-400 mt-1">Sub-activities completed</p>
                            </div>
                            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                                <FileText size={28} className="text-orange-600" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Status Distribution Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-700 font-medium">In Progress</p>
                                <p className="text-2xl font-bold text-yellow-800">
                                    {hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Inprogress : reportData.totalStats.statusBreakdown.Inprogress}
                                </p>
                            </div>
                            <Activity size={28} className="text-yellow-600" />
                        </div>
                        <div className="mt-2 h-1.5 bg-yellow-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{
                                width: `${((hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Inprogress : reportData.totalStats.statusBreakdown.Inprogress) /
                                    (hasActiveFilters ? filteredData.filteredStats.totalTasks : reportData.totalStats.totalTasks)) * 100}%`
                            }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Submitted</p>
                                <p className="text-2xl font-bold text-blue-800">
                                    {hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Submitted : reportData.totalStats.statusBreakdown.Submitted}
                                </p>
                            </div>
                            <FileText size={28} className="text-blue-600" />
                        </div>
                        <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{
                                width: `${((hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Submitted : reportData.totalStats.statusBreakdown.Submitted) /
                                    (hasActiveFilters ? filteredData.filteredStats.totalTasks : reportData.totalStats.totalTasks)) * 100}%`
                            }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium">Approved</p>
                                <p className="text-2xl font-bold text-green-800">
                                    {hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Approved : reportData.totalStats.statusBreakdown.Approved}
                                </p>
                            </div>
                            <CheckCircle size={28} className="text-green-600" />
                        </div>
                        <div className="mt-2 h-1.5 bg-green-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{
                                width: `${((hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Approved : reportData.totalStats.statusBreakdown.Approved) /
                                    (hasActiveFilters ? filteredData.filteredStats.totalTasks : reportData.totalStats.totalTasks)) * 100}%`
                            }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700 font-medium">Rejected</p>
                                <p className="text-2xl font-bold text-red-800">
                                    {hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Rejected : reportData.totalStats.statusBreakdown.Rejected}
                                </p>
                            </div>
                            <XCircle size={28} className="text-red-600" />
                        </div>
                        <div className="mt-2 h-1.5 bg-red-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{
                                width: `${((hasActiveFilters ? filteredData.filteredStats.statusBreakdown.Rejected : reportData.totalStats.statusBreakdown.Rejected) /
                                    (hasActiveFilters ? filteredData.filteredStats.totalTasks : reportData.totalStats.totalTasks)) * 100}%`
                            }} />
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by sub-activity, employee, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                            <option value="all">📊 All Projects</option>
                            {reportData.projects?.map(project => (
                                <option key={project.project_id} value={project.project_id}>
                                    📁 {project.project_name.length > 50 ? project.project_name.substring(0, 50) + '...' : project.project_name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                            <option value="all">👥 All Employees</option>
                            {reportData.allEmployees?.map(emp => (
                                <option key={emp.emp_code} value={emp.emp_code}>
                                    👤 {emp.name} ({emp.total_hours}h - {emp.total_tasks} tasks)
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                            <option value="all">🎯 All Status</option>
                            <option value="Approved">✅ Approved</option>
                            <option value="Submitted">📤 Submitted</option>
                            <option value="Inprogress">⏳ In Progress</option>
                            <option value="Rejected">❌ Rejected</option>
                        </select>
                    </div>

                    {/* View Options */}
                    {/* <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white shadow-md text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                <Grid size={16} />
                                Grid View
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'compact' ? 'bg-white shadow-md text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                <List size={16} />
                                Compact View
                            </button>
                        </div>

                        <button
                            onClick={() => setShowDescriptions(!showDescriptions)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${showDescriptions ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <MessageSquare size={14} />
                            {showDescriptions ? 'Hide' : 'Show'} Descriptions
                        </button>
                    </div> */}
                </div>

                {/* Results Count */}
                <div className="mb-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-purple-600">{filteredData.projects.length}</span> of <span className="font-semibold">{reportData.projects.length}</span> projects
                        {hasActiveFilters && <span className="text-purple-500 ml-2">(filtered results)</span>}
                    </p>
                </div>

                {/* Projects List */}
                <div className="space-y-4">
                    {filteredData.projects.map((project, index) => {
                        const isProjectExpanded = expandedProject === project.project_id;
                        const completionRate = ((project.statusBreakdown.Approved / project.total_tasks) * 100).toFixed(0);

                        return (
                            <motion.div
                                key={project.project_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Project Header - Always Visible */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedProject(isProjectExpanded ? null : project.project_id)}
                                >
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                                                    {project.project_code}
                                                </span>
                                                <div className="flex gap-2">
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Activity size={12} /> {project.total_activities} activities
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Users size={12} /> {project.total_employees} members
                                                    </span>
                                                </div>
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-800 mb-2">{project.project_name}</h2>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Timer size={14} className="text-purple-500" />
                                                    {project.total_hours} total hours
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText size={14} className="text-blue-500" />
                                                    {project.total_tasks} total tasks
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle size={14} className="text-green-500" />
                                                    {project.statusBreakdown.Approved} approved
                                                </span>
                                                {/* <span className="flex items-center gap-1">
                                                    <TrendingUp size={14} className="text-green-600" />
                                                    {completionRate}% completion rate
                                                </span> */}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Quick Stats Circles */}
                                            <div className="flex gap-3">
                                                {project.statusBreakdown.Approved > 0 && (
                                                    <div className="text-center">
                                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                            <CheckCircle size={18} className="text-green-600" />
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-600 mt-1">{project.statusBreakdown.Approved}</p>
                                                    </div>
                                                )}
                                                {project.statusBreakdown.Submitted > 0 && (
                                                    <div className="text-center">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <FileText size={18} className="text-blue-600" />
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-600 mt-1">{project.statusBreakdown.Submitted}</p>
                                                    </div>
                                                )}
                                                {project.statusBreakdown.Inprogress > 0 && (
                                                    <div className="text-center">
                                                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                                            <Activity size={18} className="text-yellow-600" />
                                                        </div>
                                                        <p className="text-xs font-medium text-gray-600 mt-1">{project.statusBreakdown.Inprogress}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {isProjectExpanded ? (
                                                <ChevronUp size={24} className="text-purple-500" />
                                            ) : (
                                                <ChevronDown size={24} className="text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    {/* <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>{completionRate}% Complete</span>
                                        </div>
                                        <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                                            <div className="bg-green-500" style={{ width: `${(project.statusBreakdown.Approved / project.total_tasks) * 100}%` }} />
                                            <div className="bg-blue-500" style={{ width: `${(project.statusBreakdown.Submitted / project.total_tasks) * 100}%` }} />
                                            <div className="bg-yellow-500" style={{ width: `${(project.statusBreakdown.Inprogress / project.total_tasks) * 100}%` }} />
                                            <div className="bg-red-500" style={{ width: `${(project.statusBreakdown.Rejected / project.total_tasks) * 100}%` }} />
                                        </div>
                                    </div> */}
                                </div>

                                {/* Expanded Content - Shows only when clicked */}
                                <AnimatePresence>
                                    {isProjectExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="border-t border-gray-200 bg-gray-50"
                                        >
                                            <div className="p-6">
                                                {/* Activities Section */}
                                                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                    <Activity size={18} className="text-purple-600" />
                                                    Activities & Tasks
                                                </h3>

                                                <div className="space-y-3">
                                                    {project.activities.map((activity) => {
                                                        const isActivityExpanded = expandedActivity === `${project.project_id}-${activity.activity_id}`;

                                                        return (
                                                            <div key={activity.activity_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                                                <div
                                                                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                                    onClick={() => setExpandedActivity(isActivityExpanded ? null : `${project.project_id}-${activity.activity_id}`)}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        {isActivityExpanded ? <ChevronDown size={18} className="text-purple-500" /> : <ChevronRight size={18} className="text-gray-400" />}
                                                                        <div>
                                                                            <h4 className="font-medium text-gray-800">{activity.activity_name}</h4>
                                                                            <p className="text-xs text-gray-500">{activity.subactivities.length} sub-activities</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="flex gap-2">
                                                                            {activity.statusCount.Approved > 0 && <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg">✓ {activity.statusCount.Approved}</span>}
                                                                            {activity.statusCount.Submitted > 0 && <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg">📤 {activity.statusCount.Submitted}</span>}
                                                                            {activity.statusCount.Inprogress > 0 && <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg">⏳ {activity.statusCount.Inprogress}</span>}
                                                                        </div>
                                                                        <span className="font-semibold text-purple-600">{formatDuration(activity.total_time_spent)}</span>
                                                                    </div>
                                                                </div>

                                                                {isActivityExpanded && (
                                                                    <div className="border-t border-gray-100 p-4 space-y-2">
                                                                        {activity.subactivities.map((sub) => (
                                                                            <div key={sub.subactivity_id} className="border border-gray-100 rounded-lg overflow-hidden mb-2">
                                                                                <div className="p-3 bg-gray-50">
                                                                                    <div className="flex justify-between items-start">
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                                                <span className="font-medium text-gray-800">{sub.subactivity_name}</span>
                                                                                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusColor(sub.status)}`}>
                                                                                                    {getStatusIcon(sub.status)}
                                                                                                    {sub.status}
                                                                                                </span>
                                                                                            </div>

                                                                                            {/* Team Members */}
                                                                                            <div className="mt-2">
                                                                                                <p className="text-xs text-gray-500 mb-1">Team Members:</p>
                                                                                                <div className="flex flex-wrap gap-2">
                                                                                                    {sub.users.map(user => (
                                                                                                        <div key={user.emp_code} className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                                                                                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                                                                                                <span className="text-xs font-medium text-purple-600">{user.name.charAt(0)}</span>
                                                                                                            </div>
                                                                                                            <span className="text-sm">{user.name}</span>
                                                                                                            <span className="text-xs text-purple-600 font-medium">{user.hours}h</span>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <p className="text-lg font-bold text-purple-600">{formatDuration(sub.total_time_spent)}</p>
                                                                                            <p className="text-xs text-gray-400">{sub.users.length} </p>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Description Logs */}
                                                                                    {showDescriptions && sub.logs && sub.logs.length > 0 && (
                                                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                                                            <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                                                                                                <MessageSquare size={12} />
                                                                                                Activity Logs & Descriptions
                                                                                            </p>
                                                                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                                                                {sub.logs.slice(0, 5).map((log, idx) => (
                                                                                                    <div key={idx} className="bg-white rounded-lg p-2 text-sm border border-gray-100">
                                                                                                        <div className="flex justify-between items-start mb-1">
                                                                                                            <span className="text-xs font-medium text-gray-600">{log.user}</span>
                                                                                                            <span className="text-xs text-gray-400">{formatDate(log.date)}</span>
                                                                                                        </div>
                                                                                                        <p className="text-gray-700 text-sm">{log.description || 'No description provided'}</p>
                                                                                                        <p className="text-xs text-purple-600 mt-1">Time: {formatDurationDetailed(log.time_spent)}</p>
                                                                                                    </div>
                                                                                                ))}
                                                                                                {sub.logs.length > 5 && (
                                                                                                    <p className="text-xs text-center text-gray-400 mt-1">+{sub.logs.length - 5} more entries</p>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Team Members Grid */}
                                                {project.employees.length > 0 && (
                                                    <div className="mt-6">
                                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                            <Users size={18} className="text-purple-600" />
                                                            Project Team ({project.employees.length})
                                                        </h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                            {project.employees.map(emp => (
                                                                <div key={emp.emp_code} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between hover:shadow-md transition-shadow">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                                            {emp.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-gray-800 text-sm">{emp.name}</p>
                                                                            <p className="text-xs text-gray-400">{emp.emp_code}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="font-semibold text-purple-600 text-sm">{emp.total_hours}h</p>
                                                                        <p className="text-xs text-gray-400">{emp.total_tasks} tasks</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredData.projects.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-16 text-center shadow-lg"
                    >
                        <Briefcase size={80} className="mx-auto mb-4 text-gray-300" />
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Results Found</h2>
                        <p className="text-gray-500 mb-4">No projects match your filter criteria.</p>
                        <button
                            onClick={handleResetFilters}
                            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
                        >
                            <FilterX size={18} />
                            Clear All Filters
                        </button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default ProjectReport;