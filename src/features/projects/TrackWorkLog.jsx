import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// WARNING: Verify this path points exactly to where your apiSlice file is located.
// If your slice is in src/store/apiSlice, change this to match.
import { fetchTrackWorkLog } from "../api/apiSlice"; 
import { 
  Clock, 
  CalendarDays, 
  User, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Activity,
  FileText
} from "lucide-react";

const TrackWorkLog = () => {
  // In a real app, you might get the ID from useParams() if routed dynamically
  const id = "5e131a6c-e250-4690-943a-5506ea55d38c"; 
  const dispatch = useDispatch();

  // Assuming your apiSlice is mounted as 'api' in your root reducer (store.js)
  const { trackWorkLogData: data, loading: isLoading, error } = useSelector((state) => state.api);

  useEffect(() => {
    dispatch(fetchTrackWorkLog(id));
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading work logs: {typeof error === 'string' ? error : 'Please try again.'}
      </div>
    );
  }

  if (!data) {
    return null; // Don't render anything until data is fetched
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {data.subactivity_name}
            </h1>
            <p className="text-gray-500 mt-1">{data.description}</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold">
            <Clock size={20} />
            Total Time: {data.work_summary?.total_hours || "00:00:00"}
          </div>
        </div>
        
        <div className="flex gap-4 mt-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            Status: {data.status}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300">
            Chainage: {data.chainage_start} to {data.chainage_end}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Work Summary */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <User className="text-blue-500" /> Team Work Summary
          </h2>
          
          {data.work_summary?.users?.map((user, index) => (
            <UserLogCard key={index} user={user} />
          ))}
        </div>

        {/* Right Column: Stage Cycle Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="text-purple-500" /> Stage Breakdown
          </h2>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-4">
            {data.cycles?.[0]?.stages?.map((stage) => (
              <div key={stage.stage_id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{stage.stage_name}</span>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {stage.total_time_spent}
                  </span>
                </div>
                
                {/* Status time breakdown */}
                <div className="space-y-1">
                  {stage.work_status_logs
                    .filter(log => log.total_time_spent !== "00:00:00")
                    .map((log, i) => (
                    <div key={i} className="flex justify-between text-sm items-center">
                      <span className="flex items-center gap-1 text-gray-500">
                        <CheckCircle2 size={14} className="text-blue-400" />
                        {log.work_status}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 font-mono">
                        {log.total_time_spent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for rendering individual user logs
const UserLogCard = ({ user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* User Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <img 
            src={user.profilepic} 
            alt={user.name} 
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + user.name; }}
          />
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.emp_code} • {user.days_worked} days worked</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block font-bold text-blue-600 dark:text-blue-400 font-mono">
              {user.total_time_spent}
            </span>
          </div>
          {expanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded Logs */}
      {expanded && (
        <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 space-y-4">
          {user.date_wise?.map((dayRecord, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
                <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <CalendarDays size={16} className="text-blue-500"/>
                  {new Date(dayRecord.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-400 font-mono">
                  {dayRecord.total_time_spent}
                </span>
              </div>
              
              <div className="space-y-3">
                {dayRecord.logs?.map((log, logIdx) => (
                  <div key={logIdx} className="pl-4 border-l-2 border-blue-200 dark:border-blue-800 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                          {log.work_type}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FileText size={12}/> {log.description}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="block text-gray-600 dark:text-gray-300 font-mono font-medium">
                          {log.time_spent}
                        </span>
                        <span className="text-gray-400">
                          {new Date(log.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(log.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrackWorkLog;