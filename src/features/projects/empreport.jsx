import { useState, useMemo, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
    ArrowUpDown,
    Layers,
    ChevronDown,
    ChevronUp,
    Recycle,
    CheckCircle,
    XCircle,
    FilterX
} from 'lucide-react';
import { fetchAllEmployeesReport } from '../tasks/taskSlice';

const TeamLeaderReport = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [expandedEmployee, setExpandedEmployee] = useState(null);
    const [expandedSubActivity, setExpandedSubActivity] = useState(null);

    // Get data from Redux store
    const { allEmployeesReport, loading } = useSelector((state) => state.tasks || {});
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user?.emp_code) {
            fetchReportData();
        }
    }, [dispatch, user?.emp_code]);

    const fetchReportData = async () => {
        await dispatch(fetchAllEmployeesReport(user?.emp_code));
    };

    const formatDuration = (timeString) => {
        if (!timeString || timeString === '00:00:00') return '0h';
        const parts = timeString.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
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

    // Transform API data - FIXED to handle the actual API structure
    const transformedData = useMemo(() => {
        if (!allEmployeesReport?.projects || allEmployeesReport.projects.length === 0) {
            return {
                employees: [],
                totalHours: 0,
                totalProjects: 0,
                projectsInfo: [],
                allProjects: []
            };
        }

        const projects = allEmployeesReport.projects;
        const employeesMap = new Map();

        projects.forEach(project => {
            project.users?.forEach(user => {
                if (!employeesMap.has(user.emp_code)) {
                    employeesMap.set(user.emp_code, {
                        emp_code: user.emp_code,
                        name: user.name,
                        total_hours: user?.total_time_spent,
                        total_tasks: 0,
                        approved_tasks: 0,
                        submitted_tasks: 0,
                        inprogress_tasks: 0,
                        rejected_tasks: 0,
                        working_days: new Set(),
                        projects: []
                    });
                }

                const employee = employeesMap.get(user.emp_code);
                let userTotalTasks = 0;
                let userApprovedTasks = 0;
                let userSubmittedTasks = 0;
                let userInprogressTasks = 0;
                let userRejectedTasks = 0;
                let userTotalHours = 0;

                const userProject = {
                    project_id: project.project_id,
                    project_name: project.project_name,
                    total_time_spent: user.total_time_spent,
                    activities: user.activities?.map(activity => ({
                        activity_id: activity.activity_id,
                        activity_name: activity.activity_name,
                        total_time_spent: activity.total_time_spent,
                        subactivities: activity.subactivities?.map(sub => {
                            userTotalTasks++;
                            if (sub.status === 'Approved') userApprovedTasks++;
                            if (sub.status === 'Submitted') userSubmittedTasks++;
                            if (sub.status === 'Inprogress') userInprogressTasks++;
                            if (sub.status === 'Rejected') userRejectedTasks++;

                            const hours = parseInt(sub.total_time_spent?.split(':')[0] || 0);
                            userTotalHours += hours;

                            sub.date_wise?.forEach(dateLog => {
                                if (dateLog.date) {
                                    employee.working_days.add(dateLog.date);
                                }
                            });

                            return {
                                subactivity_id: sub.subactivity_id,
                                subactivity_name: sub.subactivity_name,
                                status: sub.status,
                                total_time_spent: sub.total_time_spent,
                                date_wise: sub.date_wise || []
                            };
                        })
                    }))
                };

                employee.projects.push(userProject);
                employee.total_hours += userTotalHours;
                employee.total_tasks += userTotalTasks;
                employee.approved_tasks += userApprovedTasks;
                employee.submitted_tasks += userSubmittedTasks;
                employee.inprogress_tasks += userInprogressTasks;
                employee.rejected_tasks += userRejectedTasks;
            });
        });

        const employees = Array.from(employeesMap.values()).map(emp => ({
            ...emp,
            working_days: emp.working_days.size
        }));

        const totalHours = employees.reduce((sum, emp) => sum + emp.total_hours, 0);
        const allProjects = projects.map(project => ({
            project_id: project.project_id,
            project_name: project.project_name,
            total_users: project.users?.length || 0,
            total_hours: project.users?.reduce((sum, user) => {
                const hours = parseInt(user.total_time_spent?.split(':')[0] || 0);
                return sum + hours;
            }, 0)
        }));

        return {
            employees,
            totalHours,
            totalProjects: projects.length,
            projectsInfo: allProjects,
            allProjects
        };
    }, [allEmployeesReport]);

    // 🔹 helper: HH:MM:SS → seconds
    const timeToSeconds = (time) => {
        if (!time) return 0;
        const [h = 0, m = 0, s = 0] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    };

    // 🔹 helper: seconds → HH:MM:SS
    const secondsToTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Filter employees based on all filters - ENSURES data shows ONLY according to selected filters
    const filteredEmployees = useMemo(() => {
        if (!transformedData.employees.length) return [];

        let filtered = [...transformedData.employees];

        // 1. Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(emp =>
                emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.emp_code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Filter by specific employee
        if (selectedEmployee !== 'all') {
            filtered = filtered.filter(emp => emp.emp_code === selectedEmployee);
        }

        // 3. Filter by specific project - CRITICAL: Only shows data for selected project
        if (selectedProject !== 'all') {
            filtered = filtered.map(emp => ({
                ...emp,
                projects: emp.projects.filter(project => project.project_id === selectedProject)
            })).filter(emp => emp.projects.length > 0);
        }

        // 4. Filter by status - Only shows subactivities with selected status
        if (selectedStatus !== 'all') {
            filtered = filtered.map(emp => ({
                ...emp,
                projects: emp.projects.map(project => ({
                    ...project,
                    activities: project.activities.map(activity => ({
                        ...activity,
                        subactivities: activity.subactivities.filter(sub => sub.status === selectedStatus)
                    })).filter(activity => activity.subactivities.length > 0)
                })).filter(project => project.activities.length > 0)
            })).filter(emp => emp.projects.length > 0);
        }

        // Recalculate totals for filtered data and add total_projects count
        filtered = filtered.map(emp => {

            let totalSeconds = 0;
            let totalTasks = 0;
            let approvedTasks = 0;
            let submittedTasks = 0;
            let inprogressTasks = 0;
            let rejectedTasks = 0;
            const workingDays = new Set();

            // Get unique project IDs for this employee
            const uniqueProjectIds = new Set();

            emp.projects.forEach(project => {
                uniqueProjectIds.add(project.project_id);

                project.activities.forEach(activity => {
                    activity.subactivities.forEach(sub => {
                        totalTasks++;
                        if (sub.status === 'Approved') approvedTasks++;
                        if (sub.status === 'Submitted') submittedTasks++;
                        if (sub.status === 'Inprogress') inprogressTasks++;
                        if (sub.status === 'Rejected') rejectedTasks++;

                        totalSeconds += timeToSeconds(sub.total_time_spent);


                        sub.date_wise?.forEach(dateLog => {
                            if (dateLog.date) workingDays.add(dateLog.date);
                        });
                    });
                });
            });

            return {
                ...emp,
                total_projects: uniqueProjectIds.size, // Add total projects count for this user
                total_hours: (totalSeconds / 3600).toFixed(2)?.replace(".", ":"),
                total_tasks: totalTasks,
                approved_tasks: approvedTasks,
                submitted_tasks: submittedTasks,
                inprogress_tasks: inprogressTasks,
                rejected_tasks: rejectedTasks,
                working_days: workingDays.size
            };
        });

        // Sort
        filtered.sort((a, b) => {
            let aVal, bVal;
            switch (sortField) {
                case 'name':
                    aVal = a.name || '';
                    bVal = b.name || '';
                    break;
                case 'total_hours':
                    aVal = a.total_hours || 0;
                    bVal = b.total_hours || 0;
                    break;
                case 'total_tasks':
                    aVal = a.total_tasks || 0;
                    bVal = b.total_tasks || 0;
                    break;
                case 'total_projects':
                    aVal = a.total_projects || 0;
                    bVal = b.total_projects || 0;
                    break;
                default:
                    aVal = a[sortField] || '';
                    bVal = b[sortField] || '';
            }
            return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });

        return filtered;
    }, [transformedData, searchTerm, selectedEmployee, selectedProject, selectedStatus, sortField, sortDirection]);

    // Calculate statistics based on filtered data ONLY
    const filteredStats = useMemo(() => {
        if (!filteredEmployees.length) {
            return {
                totalEmployees: 0,
                totalProjects: 0,
                totalHours: 0,
                totalTasks: 0,
                approvedTasks: 0,
                submittedTasks: 0,
                inprogressTasks: 0,
                rejectedTasks: 0
            };
        }

        let totalHoursadded = 0;
        let totalTasks = 0;
        let approvedTasks = 0;
        let submittedTasks = 0;
        let inprogressTasks = 0;
        let rejectedTasks = 0;
        const uniqueProjects = new Set();

        filteredEmployees.forEach(emp => {
            totalHoursadded += timeToSeconds(emp.total_hours || 0);
            totalTasks += emp.total_tasks || 0;
            approvedTasks += emp.approved_tasks || 0;
            submittedTasks += emp.submitted_tasks || 0;
            inprogressTasks += emp.inprogress_tasks || 0;
            rejectedTasks += emp.rejected_tasks || 0;

            emp.projects?.forEach(project => {
                uniqueProjects.add(project.project_id);
            });
        });

        return {
            totalEmployees: filteredEmployees.length,
            totalProjects: uniqueProjects.size,
            totalHours: (totalHoursadded / 3600).toFixed(2).replace(".", ":"),
            totalTasks,
            approvedTasks,
            submittedTasks,
            inprogressTasks,
            rejectedTasks
        };
    }, [filteredEmployees]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
        return sortDirection === 'asc' ?
            <ChevronUp size={14} /> :
            <ChevronDown size={14} />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading report...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-full mx-auto px-4 py-6 bg-gray-50 min-h-screen"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Team Leader Report</h1>
                        <p className="text-blue-100">View your team's task details and performance</p>

                        {/* Active Filters Display */}
                        {(selectedProject !== 'all' || selectedEmployee !== 'all' || selectedStatus !== 'all' || searchTerm) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-xs text-blue-200 mr-1">Active filters:</span>
                                {selectedProject !== 'all' && (
                                    <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                                        <Briefcase size={14} />
                                        {transformedData.allProjects.find(p => p.project_id === selectedProject)?.project_name?.substring(0, 30) || 'Selected Project'}
                                    </span>
                                )}
                                {selectedEmployee !== 'all' && (
                                    <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                                        <User size={14} />
                                        {transformedData.employees.find(e => e.emp_code === selectedEmployee)?.name || 'Selected'}
                                    </span>
                                )}
                                {selectedStatus !== 'all' && (
                                    <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                                        <Activity size={14} />
                                        Status: {selectedStatus}
                                    </span>
                                )}
                                {searchTerm && (
                                    <span className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                                        <Search size={14} />
                                        Search: {searchTerm}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchReportData}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <Recycle size={18} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Task Summary Cards - Shows filtered data only */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                    <div className="flex items-center justify-between">
                        <Activity size={20} className="text-yellow-600" />
                        <span className="text-lg font-bold text-yellow-700">{filteredStats.inprogressTasks}</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">In Progress</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <FileText size={20} className="text-blue-600" />
                        <span className="text-lg font-bold text-blue-700">{filteredStats.submittedTasks}</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Submitted</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center justify-between">
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-lg font-bold text-green-700">{filteredStats.approvedTasks}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Approved</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                    <div className="flex items-center justify-between">
                        <XCircle size={20} className="text-red-600" />
                        <span className="text-lg font-bold text-red-700">{filteredStats.rejectedTasks}</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Rejected</p>
                </div>
            </div>

            {/* Statistics Cards - Shows filtered data only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Projects</p>
                            <p className="text-3xl font-bold text-gray-800">{filteredStats.totalProjects}</p>
                            {selectedProject !== 'all' && (
                                <p className="text-xs text-blue-500 mt-1">Filtered</p>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Briefcase size={24} className="text-purple-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Team Members</p>
                            <p className="text-3xl font-bold text-gray-800">{filteredStats.totalEmployees}</p>
                            {selectedEmployee !== 'all' && (
                                <p className="text-xs text-blue-500 mt-1">Filtered</p>
                            )}
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Hours</p>
                            <p className="text-3xl font-bold text-gray-800">{filteredStats.totalHours}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Timer size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Tasks</p>
                            <p className="text-3xl font-bold text-gray-800">{filteredStats.totalTasks}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <FileText size={24} className="text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or emp code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Projects</option>
                        {transformedData.allProjects?.map(project => (
                            <option key={project.project_id} value={project.project_id}>
                                {project.project_name.length > 40 ? project.project_name.substring(0, 40) + '...' : project.project_name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Employees</option>
                        {transformedData.employees?.map(emp => (
                            <option key={emp.emp_code} value={emp.emp_code}>
                                {emp.name} ({emp.emp_code})
                            </option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="Approved">✅ Approved</option>
                        <option value="Submitted">📤 Submitted</option>
                        <option value="Inprogress">⏳ In Progress</option>
                        <option value="Rejected">❌ Rejected</option>
                    </select>
                </div>

                {/* Clear Filters Button */}
                {(searchTerm || selectedProject !== 'all' || selectedEmployee !== 'all' || selectedStatus !== 'all') && (
                    <div className="mt-3 text-right">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedProject('all');
                                setSelectedEmployee('all');
                                setSelectedStatus('all');
                            }}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                            <FilterX size={14} />
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    Showing {filteredEmployees.length} of {transformedData.employees?.length || 0} employees
                    {selectedProject !== 'all' && <span className="text-blue-500 ml-1">(filtered by project)</span>}
                    {selectedEmployee !== 'all' && <span className="text-blue-500 ml-1">(filtered by employee)</span>}
                    {selectedStatus !== 'all' && <span className="text-blue-500 ml-1">(filtered by status)</span>}
                </p>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Employee <SortIcon field="name" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('total_tasks')}>
                                    <div className="flex items-center gap-1">Projects & Tasks <SortIcon field="total_tasks" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => handleSort('total_hours')}>
                                    <div className="flex items-center gap-1">Total Hours <SortIcon field="total_hours" /></div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Working Days</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredEmployees.map((employee) => {
                                const isExpanded = expandedEmployee === employee.emp_code;

                                return (
                                    <Fragment key={employee.emp_code}>
                                        <tr className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {employee.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{employee.name}</p>
                                                        <p className="text-xs text-gray-500">{employee.emp_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {/* Modern Stats Display */}
                                                <div className="space-y-2">
                                                    {/* Projects & Tasks Row */}
                                                    <div className="flex items-center gap-3 justify-evenly">
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                                                                <Briefcase size={14} className="text-purple-600" />
                                                            </div>
                                                            <div className="flex gap-1 items-center">
                                                                <p className="text-lg font-bold text-purple-700">{employee.total_projects || 0}</p>
                                                                <p className="text-xs text-gray-400 leading-none">Projects</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-px h-8 bg-gray-200"></div>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                <FileText size={14} className="text-blue-600" />
                                                            </div>
                                                            <div className="flex gap-1 items-center">
                                                                <p className="text-lg font-bold text-blue-700">{employee.total_tasks || 0}</p>
                                                                <p className="text-xs text-gray-400 leading-none">Tasks</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Progress Bar */}
                                                    <div className="space-y-1">
                                                        <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100">
                                                            {employee.approved_tasks > 0 && (
                                                                <div className="bg-green-500" style={{ width: `${(employee.approved_tasks / employee.total_tasks) * 100}%` }} />
                                                            )}
                                                            {employee.submitted_tasks > 0 && (
                                                                <div className="bg-blue-500" style={{ width: `${(employee.submitted_tasks / employee.total_tasks) * 100}%` }} />
                                                            )}
                                                            {employee.inprogress_tasks > 0 && (
                                                                <div className="bg-yellow-500" style={{ width: `${(employee.inprogress_tasks / employee.total_tasks) * 100}%` }} />
                                                            )}
                                                            {employee.rejected_tasks > 0 && (
                                                                <div className="bg-red-500" style={{ width: `${(employee.rejected_tasks / employee.total_tasks) * 100}%` }} />
                                                            )}
                                                        </div>

                                                        {/* Status Legend */}
                                                        <div className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                    <span className="text-gray-600">App</span>
                                                                    <span className="font-medium text-gray-800">{employee.approved_tasks}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    <span className="text-gray-600">Sub</span>
                                                                    <span className="font-medium text-gray-800">{employee.submitted_tasks}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                                    <span className="text-gray-600">Prog</span>
                                                                    <span className="font-medium text-gray-800">{employee.inprogress_tasks}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                                    <span className="text-gray-600">Rej</span>
                                                                    <span className="font-medium text-gray-800">{employee.rejected_tasks}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-blue-600">{employee.total_hours || 0}h</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700">{employee.working_days || 0} days</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setExpandedEmployee(isExpanded ? null : employee.emp_code)}
                                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                                >
                                                    <Eye size={14} />
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Details - Shows ONLY filtered projects */}
                                        {isExpanded && (
                                            <tr className="bg-gray-50">
                                                <td colSpan="5" className="px-4 py-4">
                                                    <div className="space-y-4">
                                                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                                            <Layers size={16} />
                                                            Task Details for {employee.name}
                                                            {selectedProject !== 'all' && (
                                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full ml-2">
                                                                    Filtered by project
                                                                </span>
                                                            )}
                                                        </h4>

                                                        {employee.projects?.map((project) => (
                                                            <div key={project.project_id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                                                <div className="flex justify-between items-center p-4 bg-gray-50">
                                                                    <div className="flex items-center gap-2">
                                                                        <Briefcase size={16} className="text-purple-500" />
                                                                        <h5 className="font-semibold text-gray-700">{project.project_name}</h5>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                        Total: {formatDuration(project.total_time_spent)}
                                                                    </span>
                                                                </div>

                                                                <div className="p-4 space-y-3">
                                                                    {project.activities?.map((activity) => (
                                                                        <div key={activity.activity_id} className="ml-4 border border-gray-100 rounded-lg overflow-hidden">
                                                                            <div className="flex justify-between items-center p-3 bg-gray-50/50">
                                                                                <h6 className="font-medium text-gray-600 text-sm">{activity.activity_name}</h6>
                                                                                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                                                                    {formatDuration(activity.total_time_spent)}
                                                                                </span>
                                                                            </div>

                                                                            <div className="p-3 space-y-2">
                                                                                {activity.subactivities?.map((sub) => {
                                                                                    const isSubExpanded = expandedSubActivity === `${employee.emp_code}-${project.project_id}-${activity.activity_id}-${sub.subactivity_id}`;

                                                                                    return (
                                                                                        <div key={sub.subactivity_id} className="border border-gray-100 rounded-lg overflow-hidden">
                                                                                            <div
                                                                                                className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                                                                                onClick={() => setExpandedSubActivity(isSubExpanded ? null : `${employee.emp_code}-${project.project_id}-${activity.activity_id}-${sub.subactivity_id}`)}
                                                                                            >
                                                                                                <div className="flex items-center gap-2 flex-1">
                                                                                                    {isSubExpanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
                                                                                                    <span className="text-sm text-gray-700">{sub.subactivity_name}</span>
                                                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                                                                        sub.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                                                                                                            sub.status === 'Inprogress' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                                sub.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                                                                    'bg-gray-100 text-gray-700'
                                                                                                        }`}>
                                                                                                        {sub.status}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <span className="text-sm font-medium text-blue-600">{formatDuration(sub.total_time_spent)}</span>
                                                                                            </div>

                                                                                            {isSubExpanded && sub.date_wise && sub.date_wise.length > 0 && (
                                                                                                <div className="border-t border-gray-100 p-3 bg-gray-50/30">
                                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                                        <CalendarDays size={12} className="text-gray-500" />
                                                                                                        <span className="text-xs font-medium text-gray-600">Date-wise Breakdown</span>
                                                                                                    </div>
                                                                                                    <div className="space-y-1">
                                                                                                        {sub.date_wise.map((dateLog, idx) => (
                                                                                                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <CalendarDays size={12} className="text-gray-400" />
                                                                                                                    <span className="text-sm text-gray-700">{formatDate(dateLog.date)}</span>
                                                                                                                </div>
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <Clock size={12} className="text-gray-400" />
                                                                                                                    <span className="text-sm font-medium text-blue-600">{formatDuration(dateLog.time_spent)}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-100 mt-2">
                                                                                                            <span className="text-xs font-medium text-blue-700">Total Time:</span>
                                                                                                            <span className="text-sm font-bold text-blue-700">{formatDuration(sub.total_time_spent)}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {employee.projects?.length === 0 && (
                                                            <div className="text-center py-8 text-gray-500">
                                                                No tasks found for this employee with the current filters.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* No Results */}
            {filteredEmployees.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
                    <Users size={64} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No Results Found</h2>
                    <p className="text-gray-500">No employees match your filter criteria.</p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedProject('all');
                            setSelectedEmployee('all');
                            setSelectedStatus('all');
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                        <FilterX size={14} />
                        Clear all filters
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default TeamLeaderReport;