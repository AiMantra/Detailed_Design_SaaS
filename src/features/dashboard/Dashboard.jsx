
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";
import AnalyticsChart from "./AnalyticsChart";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const projects = useSelector((state) => state.projects.projects);
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    ongoing: 0,
    delayed: 0,
    totalValue: 0,
    avgProgress: 0,
    deadlineNear: []
  });

  useEffect(() => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const total = projects.length;
    const completed = projects.filter(p => p.status === "COMPLETED").length;
    const delayed = projects.filter(p => p.status === "DELAYED").length;
    const ongoing = total - completed - delayed;
    
    const totalValue = projects.reduce((sum, p) => sum + (parseFloat(p.cost) || 0), 0);
    const avgProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0) / (total || 1);
    
    const deadlineNear = projects.filter(p => {
      if (!p.completionDate || p.status === "COMPLETED") return false;
      const deadline = new Date(p.completionDate);
      return deadline <= sevenDaysFromNow && deadline >= today;
    });

    setStats({
      total,
      completed,
      ongoing,
      delayed,
      totalValue,
      avgProgress: Math.round(avgProgress),
      deadlineNear
    });
  }, [projects]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 px-4 py-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome back, {user?.name || user?.role}
          </h1>
          <p className="text-gray-500 mt-2">Here's what's happening with your projects today</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Total Projects</p>
              <p className="text-4xl font-bold mt-2">{stats.total}</p>
              <p className="text-blue-100 text-sm mt-2">
                {stats.ongoing} ongoing, {stats.completed} completed
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Building2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
            <TrendingUp size={16} />
            <span>{stats.avgProgress}% average progress</span>
          </div>
        </motion.div>

        {/* Completed */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-4xl font-bold mt-2">{stats.completed}</p>
              <p className="text-green-100 text-sm mt-2">
                {((stats.completed / stats.total) * 100 || 0).toFixed(1)}% of total
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-green-100">
            <ArrowUpRight size={16} />
            <span>Successfully delivered</span>
          </div>
        </motion.div>

        {/* Ongoing */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-yellow-100 text-sm">In Progress</p>
              <p className="text-4xl font-bold mt-2">{stats.ongoing}</p>
              <p className="text-yellow-100 text-sm mt-2">
                Active projects
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-yellow-100">
            <Clock size={16} />
            <span>On track</span>
          </div>
        </motion.div>

        {/* Delayed */}
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm">Delayed</p>
              <p className="text-4xl font-bold mt-2">{stats.delayed}</p>
              <p className="text-red-100 text-sm mt-2">
                Need attention
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-100">
            <ArrowDownRight size={16} />
            <span>Behind schedule</span>
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Total Project Value</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">₹ {stats.totalValue.toLocaleString()} Lakhs</p>
          <p className="text-sm text-gray-500 mt-2">Across {stats.total} projects</p>
        </motion.div>

        {/* Average Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Average Progress</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.avgProgress}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.avgProgress}%` }}
              className="h-2 rounded-full bg-green-500"
            />
          </div>
        </motion.div>

        {/* Team Members */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Team Members</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800">12</p>
          <p className="text-sm text-gray-500 mt-2">Active team members</p>
        </motion.div>
      </div>

      {/* Charts */}
      <AnalyticsChart />

      {/* Deadline Near Projects */}
      {stats.deadlineNear.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-yellow-500" />
            Projects Nearing Deadline (Next 7 Days)
          </h3>
          <div className="space-y-4">
            {stats.deadlineNear.map((project) => {
              const daysLeft = Math.ceil((new Date(project.completionDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={project.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div>
                    <h4 className="font-semibold text-gray-800">{project.name}</h4>
                    <p className="text-sm text-gray-600">Code: {project.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-yellow-600">{daysLeft} days left</p>
                    <p className="text-xs text-gray-500">Progress: {project.progress}%</p>
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={18} className="text-gray-600" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {projects.slice(0, 5).map((project) => (
            <div key={project.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  project.status === "COMPLETED" ? "bg-green-500" :
                  project.status === "DELAYED" ? "bg-red-500" : "bg-blue-500"
                }`} />
                <div>
                  <p className="font-medium text-gray-800">{project.name}</p>
                  <p className="text-xs text-gray-500">Updated {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                project.status === "COMPLETED" ? "bg-green-100 text-green-600" :
                project.status === "DELAYED" ? "bg-red-100 text-red-600" :
                "bg-blue-100 text-blue-600"
              }`}>
                {project.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;