



import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { 
  Eye, 
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Briefcase,
} from "lucide-react";

const UserProjectList = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { userTasks = [] } = useSelector((state) => state.tasks || {});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const userProjects = useMemo(() => {
    const projectMap = new Map();
    
    userTasks.forEach(task => {
      if (!task.project_id) return;
      
      if (!projectMap.has(task.project_id)) {
        projectMap.set(task.project_id, {
          id: task.project_id,
          name: task.project_name || "Unknown Project",
          code: task.project_code || "N/A",
          tasks: [],
          completedTasks: 0,
          totalTasks: 0
        });
      }
      
      const project = projectMap.get(task.project_id);
      project.tasks.push(task);
      project.totalTasks++;
      if (task.status === 'COMPLETED') {
        project.completedTasks++;
      }
    });
    
    return Array.from(projectMap.values()).map(project => ({
      ...project,
      status: project.completedTasks === project.totalTasks && project.totalTasks > 0
        ? 'completed'
        : project.completedTasks > 0
        ? 'in-progress'
        : 'pending'
    }));
  }, [userTasks]);

  const filteredProjects = useMemo(() => {
    let filtered = userProjects;
    
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(project => project.status === filterStatus);
    }
    
    return filtered;
  }, [userProjects, searchTerm, filterStatus]);

  if (userProjects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 py-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Projects</h1>
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
          <Briefcase size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Projects Yet</h2>
          <p className="text-gray-500 mb-6">
            You haven't worked on any tasks yet.
          </p>
          <button
            onClick={() => navigate("/all-projects")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Browse Projects
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-8">My Projects</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="pending">Pending</option>
            </select>
            <Filter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No projects match your search criteria.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all cursor-pointer"
              onClick={() => navigate(`/my-picked-projects/${project.id}`)}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-xl font-semibold text-gray-800">{project.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'completed' 
                          ? "bg-green-100 text-green-600" 
                          : project.status === 'in-progress' 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-yellow-100 text-yellow-600"
                      }`}>
                        {project.status === 'completed' ? "Completed" : 
                         project.status === 'in-progress' ? "Ongoing" : "Pending"}
                      </span>
                      <span className="text-sm text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {project.code}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {project.totalTasks} task{project.totalTasks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span className="text-sm text-gray-600">
                          {project.completedTasks} completed
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors self-start md:self-center">
                    <Eye size={20} className="text-blue-600" />
                  </button>
                </div>

                {/* Task Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    {project.tasks.slice(0, 3).map((task, idx) => (
                      <div key={`${task.id}-${idx}`} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.status === 'COMPLETED' ? 'bg-green-500' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-gray-600 truncate">{task.subactivity_name}</span>
                        <span className={`text-xs ml-auto flex-shrink-0 px-2 py-0.5 rounded-full ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {task.status === 'COMPLETED' ? 'Completed' :
                           task.status === 'IN_PROGRESS' ? 'Ongoing' : 'Pending'}
                        </span>
                      </div>
                    ))}
                    {project.tasks.length > 3 && (
                      <p className="text-xs text-gray-400 pl-4">+{project.tasks.length - 3} more tasks</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default UserProjectList;