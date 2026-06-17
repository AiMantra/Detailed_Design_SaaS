// // import React, { useState, useEffect } from "react";
// // import { useDispatch, useSelector } from "react-redux";
// // // WARNING: Verify this path points exactly to where your apiSlice file is located.
// // // If your slice is in src/store/apiSlice, change this to match.
// // import { fetchTrackWorkLog } from ; 
// // import { 
// //   Clock, 
// //   CalendarDays, 
// //   User, 
// //   ChevronDown, 
// //   ChevronUp, 
// //   CheckCircle2, 
// //   Activity,
// //   FileText
// // } from "lucide-react";

// // const TrackWorkLog = () => {
// //   // In a real app, you might get the ID from useParams() if routed dynamically
// //   const id = "5e131a6c-e250-4690-943a-5506ea55d38c"; 
// //   const dispatch = useDispatch();

// //   // Assuming your apiSlice is mounted as 'api' in your root reducer (store.js)
// //   const { trackWorkLogData: data, loading: isLoading, error } = useSelector((state) => state.api);

// //   useEffect(() => {
// //     dispatch(fetchTrackWorkLog(id));
// //   }, [dispatch, id]);

// //   if (isLoading) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
// //       </div>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <div className="p-4 bg-red-50 text-red-600 rounded-lg">
// //         Error loading work logs: {typeof error === 'string' ? error : 'Please try again.'}
// //       </div>
// //     );
// //   }

// //   if (!data) {
// //     return null; // Don't render anything until data is fetched
// //   }

// //   return (
// //     <div className="p-6 max-w-7xl mx-auto space-y-6">
// //       {/* Header Section */}
// //       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
// //         <div className="flex justify-between items-start">
// //           <div>
// //             <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
// //               {data.subactivity_name}
// //             </h1>
// //             <p className="text-gray-500 mt-1">{data.description}</p>
// //           </div>
// //           <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold">
// //             <Clock size={20} />
// //             Total Time: {data.work_summary?.total_hours || "00:00:00"}
// //           </div>
// //         </div>
        
// //         <div className="flex gap-4 mt-6">
// //           <span className={`px-3 py-1 rounded-full text-sm font-medium ${
// //             data.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
// //           }`}>
// //             Status: {data.status}
// //           </span>
// //           <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300">
// //             Chainage: {data.chainage_start} to {data.chainage_end}
// //           </span>
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// //         {/* Left Column: User Work Summary */}
// //         <div className="lg:col-span-2 space-y-4">
// //           <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
// //             <User className="text-blue-500" /> Team Work Summary
// //           </h2>
          
// //           {data.work_summary?.users?.map((user, index) => (
// //             <UserLogCard key={index} user={user} />
// //           ))}
// //         </div>

// //         {/* Right Column: Stage Cycle Overview */}
// //         <div className="space-y-4">
// //           <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
// //             <Activity className="text-purple-500" /> Stage Breakdown
// //           </h2>
          
// //           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 space-y-4">
// //             {data.cycles?.[0]?.stages?.map((stage) => (
// //               <div key={stage.stage_id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 pb-3 last:pb-0">
// //                 <div className="flex justify-between items-center mb-2">
// //                   <span className="font-semibold text-gray-700 dark:text-gray-200">{stage.stage_name}</span>
// //                   <span className="text-sm font-medium text-gray-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
// //                     {stage.total_time_spent}
// //                   </span>
// //                 </div>
                
// //                 {/* Status time breakdown */}
// //                 <div className="space-y-1">
// //                   {stage.work_status_logs
// //                     .filter(log => log.total_time_spent !== "00:00:00")
// //                     .map((log, i) => (
// //                     <div key={i} className="flex justify-between text-sm items-center">
// //                       <span className="flex items-center gap-1 text-gray-500">
// //                         <CheckCircle2 size={14} className="text-blue-400" />
// //                         {log.work_status}
// //                       </span>
// //                       <span className="text-gray-600 dark:text-gray-400 font-mono">
// //                         {log.total_time_spent}
// //                       </span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // Sub-component for rendering individual user logs
// // const UserLogCard = ({ user }) => {
// //   const [expanded, setExpanded] = useState(false);

// //   return (
// //     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
// //       {/* User Header */}
// //       <div 
// //         className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
// //         onClick={() => setExpanded(!expanded)}
// //       >
// //         <div className="flex items-center gap-4">
// //           <img 
// //             src={user.profilepic} 
// //             alt={user.name} 
// //             className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
// //             onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + user.name; }}
// //           />
// //           <div>
// //             <h3 className="font-bold text-gray-800 dark:text-white">{user.name}</h3>
// //             <p className="text-xs text-gray-500">{user.emp_code} • {user.days_worked} days worked</p>
// //           </div>
// //         </div>
        
// //         <div className="flex items-center gap-4">
// //           <div className="text-right">
// //             <span className="block font-bold text-blue-600 dark:text-blue-400 font-mono">
// //               {user.total_time_spent}
// //             </span>
// //           </div>
// //           {expanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
// //         </div>
// //       </div>

// //       {/* Expanded Logs */}
// //       {expanded && (
// //         <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 space-y-4">
// //           {user.date_wise?.map((dayRecord, idx) => (
// //             <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-slate-700">
// //               <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
// //                 <span className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
// //                   <CalendarDays size={16} className="text-blue-500"/>
// //                   {new Date(dayRecord.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
// //                 </span>
// //                 <span className="text-sm font-bold text-gray-600 dark:text-gray-400 font-mono">
// //                   {dayRecord.total_time_spent}
// //                 </span>
// //               </div>
              
// //               <div className="space-y-3">
// //                 {dayRecord.logs?.map((log, logIdx) => (
// //                   <div key={logIdx} className="pl-4 border-l-2 border-blue-200 dark:border-blue-800 relative">
// //                     <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></div>
// //                     <div className="flex justify-between items-start">
// //                       <div>
// //                         <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
// //                           {log.work_type}
// //                         </p>
// //                         <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
// //                           <FileText size={12}/> {log.description}
// //                         </p>
// //                       </div>
// //                       <div className="text-right text-xs">
// //                         <span className="block text-gray-600 dark:text-gray-300 font-mono font-medium">
// //                           {log.time_spent}
// //                         </span>
// //                         <span className="text-gray-400">
// //                           {new Date(log.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
// //                           {new Date(log.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
// //                         </span>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default TrackWorkLog;









// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchTrackWorkLog } from "../api/apiSlice"; // Update with your actual path

// // --- 1. Event Log Table (Lowest Level) ---
// const EventLogTable = ({ eventlogs }) => {
//   if (!eventlogs || eventlogs.length === 0) return <p className="text-gray-500 text-sm">No rework logs found.</p>;
  
//   return (
//     <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
//       <thead>
//         <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>
//           <th style={{ padding: '8px' }}>Event Type</th>
//           <th style={{ padding: '8px' }}>Reason</th>
//           <th style={{ padding: '8px' }}>Date</th>
//           <th style={{ padding: '8px' }}>Extra Payment %</th>
//           <th style={{ padding: '8px' }}>Created By</th>
//         </tr>
//       </thead>
//       <tbody>
//         {eventlogs.map((log) => (
//           <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
//             <td style={{ padding: '8px', textTransform: 'capitalize' }}>{log.event_type.replace('_', ' ')}</td>
//             <td style={{ padding: '8px' }}>{log.reason || 'N/A'}</td>
//             <td style={{ padding: '8px' }}>{log.intimation_date}</td>
//             <td style={{ padding: '8px' }}>{log.extra_payment_percent ? `${log.extra_payment_percent}%` : 'N/A'}</td>
//             <td style={{ padding: '8px' }}>{log.created_by}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// };

// // --- 2. Subactivity Section ---
// const SubactivitySection = ({ subactivity }) => (
//   <div style={{ margin: '15px 0', padding: '15px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
//     <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>
//       Subactivity: {subactivity.subactivity_name} 
//       <span style={{ fontSize: '12px', marginLeft: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px' }}>
//         Reworks: {subactivity.rework_count}
//       </span>
//     </h4>
//     <EventLogTable eventlogs={subactivity.eventlogs} />
//   </div>
// );

// // --- 3. Activity Section ---
// const ActivitySection = ({ activity }) => (
//   <div style={{ marginLeft: '15px', paddingLeft: '15px', borderLeft: '3px solid #3b82f6', marginBottom: '25px' }}>
//     <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>
//       Activity: {activity.activity_name} (Total Reworks: {activity.total_reworks})
//     </h3>
//     {activity.subactivities?.map(sub => (
//       <SubactivitySection key={sub.subactivity_id} subactivity={sub} />
//     ))}
//   </div>
// );

// // --- 4. Main Main Wrapper Component ---
// const ReworkSummaryViewer = () => {
//   const dispatch = useDispatch();
//   // Replace this with your actual state selector path
//  // Target state.api, and map 'trackWorkLogData' to the variable 'data'
//   const { trackWorkLogData: data, loading, error } = useSelector((state) => state.api || {});

//   useEffect(() => {
//     // Example dispatch: You can pass project_id, activity_id, or subactivity_id here
//     dispatch(fetchTrackWorkLog({ 
//       project_id: "372b00fb-8360-4dcb-94f0-1101c57fbcc2" 
//       // activity_id: "...",
//       // subactivity_id: "..."
//     }));
//   }, [dispatch]);

//   if (loading) return <div>Loading rework data...</div>;
//   if (error) return <div>Error loading data: {error}</div>;
//   if (!data) return <div>No data available</div>;

//   return (
//     <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1000px' }}>
      
//       {/* Renders if level is 'project' */}
//       {data.level === 'project' && (
//         <div>
//           <h2 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
//             Project: {data.project_name} (Total Reworks: {data.total_reworks})
//           </h2>
//           <div style={{ marginTop: '20px' }}>
//             {data.activities?.map(act => <ActivitySection key={act.activity_id} activity={act} />)}
//           </div>
//         </div>
//       )}

//       {/* Renders if level is 'activity' */}
//       {data.level === 'activity' && (
//         <div>
//            <h2 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
//              Activity Level Summary
//            </h2>
//           <ActivitySection activity={data} />
//         </div>
//       )}

//       {/* Renders if level is 'subactivity' */}
//       {data.level === 'subactivity' && (
//         <div>
//           <h2 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
//              Subactivity Level Summary
//            </h2>
//           <SubactivitySection subactivity={data} />
//         </div>
//       )}

//     </div>
//   );
// };

// export default ReworkSummaryViewer;
























// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchTrackWorkLog } from "../api/apiSlice"; // Update with your actual path

// // --- 1. Event Log Table (Lowest Level) ---
// const EventLogTable = ({ eventlogs }) => {
//   if (!eventlogs || eventlogs.length === 0) return <p className="text-gray-500 text-sm py-2 italic">No rework logs found.</p>;
  
//   return (
//     <div className="overflow-x-auto mt-3 border border-gray-200 rounded-lg">
//       <table className="w-full text-sm text-left">
//         <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
//           <tr>
//             <th className="px-4 py-2 font-semibold">Event Type</th>
//             <th className="px-4 py-2 font-semibold">Reason</th>
//             <th className="px-4 py-2 font-semibold">Date</th>
//             <th className="px-4 py-2 font-semibold text-center">Extra Payment %</th>
//             <th className="px-4 py-2 font-semibold">Created By</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-gray-100">
//           {eventlogs.map((log) => (
//             <tr key={log.id} className="hover:bg-gray-50 bg-white">
//               <td className="px-4 py-3 text-red-600 font-medium capitalize">{log.event_type.replace('_', ' ')}</td>
//               <td className="px-4 py-3 text-gray-700">{log.reason || 'N/A'}</td>
//               <td className="px-4 py-3 text-gray-600">{log.intimation_date}</td>
//               <td className="px-4 py-3 text-center text-orange-600 font-mono font-medium">{log.extra_payment_percent ? `${log.extra_payment_percent}%` : '—'}</td>
//               <td className="px-4 py-3 text-gray-700">
//                 <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{log.created_by}</span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// // --- 2. Subactivity Section ---
// const SubactivitySection = ({ subactivity }) => (
//   <div className="mt-4 p-4 bg-white border border-purple-100 rounded-xl shadow-sm">
//     <div className="flex justify-between items-center mb-2">
//       <h4 className="font-semibold text-gray-800 text-lg">
//         {subactivity.subactivity_name} 
//       </h4>
//       <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
//         Reworks: {subactivity.rework_count}
//       </span>
//     </div>
//     <EventLogTable eventlogs={subactivity.eventlogs} />
//   </div>
// );

// // --- 3. Activity Section ---
// const ActivitySection = ({ activity }) => (
//   <div className="ml-2 pl-4 border-l-4 border-blue-400 mt-6 pb-2">
//     <div className="flex items-center gap-3 mb-3">
//       <h3 className="text-xl font-bold text-gray-800">
//         {activity.activity_name} 
//       </h3>
//       <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-200">
//         Total Reworks: {activity.total_reworks}
//       </span>
//     </div>
//     <div className="pl-2">
//       {activity.subactivities?.map(sub => (
//         <SubactivitySection key={sub.subactivity_id} subactivity={sub} />
//       ))}
//     </div>
//   </div>
// );

// // --- 4. Main Wrapper Component ---
// // NOTE: We pass `projectsList` as a prop so the dropdown has projects to show!
// const ReworkSummaryViewer = ({ projectsList = [] }) => {
//   const dispatch = useDispatch();
  
//   // Get data from Redux
//   const { trackWorkLogData: data, loading, error } = useSelector((state) => state.api || {});

//   // Local state for the selected dropdown filters
//   const [selectedProject, setSelectedProject] = useState("");
//   const [selectedActivity, setSelectedActivity] = useState("");
//   const [selectedSubactivity, setSelectedSubactivity] = useState("");

//   // This is CRUCIAL: We cache the project-level response. 
//   // If we don't do this, selecting an activity will overwrite the Redux state 
//   // with activity-only data, causing the other dropdown options to disappear!
//   const [cachedProjectTree, setCachedProjectTree] = useState(null);

//   // Update our cache whenever a fresh PROJECT-level response comes in
//   useEffect(() => {
//     if (data && data.level === 'project') {
//       setCachedProjectTree(data);
//     }
//   }, [data]);

//   // --- Handlers for Dropdowns ---
//   const handleProjectChange = (e) => {
//     const projectId = e.target.value;
//     setSelectedProject(projectId);
    
//     // Reset lower-level dropdowns
//     setSelectedActivity("");
//     setSelectedSubactivity("");
//     setCachedProjectTree(null); 

//     if (projectId) {
//       dispatch(fetchTrackWorkLog({ project_id: projectId }));
//     }
//   };

//   const handleActivityChange = (e) => {
//     const activityId = e.target.value;
//     setSelectedActivity(activityId);
    
//     // Reset subactivity dropdown
//     setSelectedSubactivity("");

//     if (activityId) {
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: activityId }));
//     } else {
//       // If "All Activities" is selected, fetch the whole project again
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
//     }
//   };

//   const handleSubactivityChange = (e) => {
//     const subactivityId = e.target.value;
//     setSelectedSubactivity(subactivityId);

//     if (subactivityId) {
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: selectedActivity, subactivity_id: subactivityId }));
//     } else if (selectedActivity) {
//       // If "All Subactivities" is selected, fetch the activity
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: selectedActivity }));
//     } else {
//       // Fetch the whole project
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
//     }
//   };

//   // --- Dropdown Options (derived from cache) ---
//   const availableActivities = cachedProjectTree?.activities || [];
//   const selectedActivityObj = availableActivities.find(a => a.activity_id === selectedActivity);
//   const availableSubactivities = selectedActivityObj?.subactivities || [];

//   return (
//     <div className="p-6 font-sans max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100">
      
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-800 mb-4">Rework Logs</h2>
        
//         {/* --- The 3 Filters --- */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          
//           {/* Project Filter */}
//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">1. Select Project</label>
//             <select 
//               value={selectedProject} 
//               onChange={handleProjectChange} 
//               className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
//             >
//               <option value="">-- Choose a Project --</option>
//               {projectsList.map(p => (
//                 <option key={p.id || p.project_id} value={p.id || p.project_id}>
//                   {p.project_name || p.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Activity Filter */}
//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">2. Select Activity</label>
//             <select 
//               value={selectedActivity} 
//               onChange={handleActivityChange} 
//               disabled={!selectedProject || availableActivities.length === 0} 
//               className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100"
//             >
//               <option value="">All Activities</option>
//               {availableActivities.map(act => (
//                 <option key={act.activity_id} value={act.activity_id}>
//                   {act.activity_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Subactivity Filter */}
//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">3. Select Subactivity</label>
//             <select 
//               value={selectedSubactivity} 
//               onChange={handleSubactivityChange} 
//               disabled={!selectedActivity || availableSubactivities.length === 0} 
//               className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100"
//             >
//               <option value="">All Subactivities</option>
//               {availableSubactivities.map(sub => (
//                 <option key={sub.subactivity_id} value={sub.subactivity_id}>
//                   {sub.subactivity_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//         </div>
//       </div>

//       {/* --- Data Display Area --- */}
//       <div className="min-h-[300px]">
//         {loading && <div className="text-center py-20 text-blue-600 font-medium animate-pulse">Loading rework data...</div>}
//         {error && <div className="text-center py-10 bg-red-50 text-red-600 rounded-lg border border-red-200">Error loading data: {typeof error === 'string' ? error : 'Something went wrong.'}</div>}
        
//         {!loading && !error && !selectedProject && (
//           <div className="text-center py-20 text-gray-400">
//             <p>Please select a project from the dropdown to view rework logs.</p>
//           </div>
//         )}

//         {!loading && !error && data && selectedProject && (
//           <div className="space-y-6">
            
//             {/* Renders if level is 'project' */}
//             {data.level === 'project' && (
//               <div>
//                 <div className="flex justify-between items-end border-b-2 border-gray-200 pb-3 mb-4">
//                   <h2 className="text-2xl font-bold text-gray-800">{data.project_name}</h2>
//                   <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-sm">
//                     Project Total Reworks: {data.total_reworks}
//                   </span>
//                 </div>
//                 <div className="mt-4">
//                   {data.activities?.map(act => <ActivitySection key={act.activity_id} activity={act} />)}
//                   {data.activities?.length === 0 && <p className="text-gray-500 text-center py-10">No rework logs found for this project.</p>}
//                 </div>
//               </div>
//             )}

//             {/* Renders if level is 'activity' */}
//             {data.level === 'activity' && (
//               <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
//                  <h2 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2">Filtered to Activity Level</h2>
//                  <ActivitySection activity={data} />
//               </div>
//             )}

//             {/* Renders if level is 'subactivity' */}
//             {data.level === 'subactivity' && (
//               <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-100">
//                 <h2 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2">Filtered to Subactivity Level</h2>
//                 <SubactivitySection subactivity={data} />
//               </div>
//             )}

//           </div>
//         )}
//       </div>

//     </div>
//   );
// };

// export default ReworkSummaryViewer;

// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// // Update these imports to match your actual file structure
// import { fetchTrackWorkLog, fetchOnlyProjectsList } from "../api/apiSlice"; 
// import { AlertCircle, FolderOpen, Briefcase, Layers, Loader2 } from "lucide-react";
// import { motion } from "framer-motion";

// // --- 1. Event Log Table (Lowest Level) ---
// const EventLogTable = ({ eventlogs }) => {
//   if (!eventlogs || eventlogs.length === 0) return <p className="text-gray-500 text-sm py-2 italic">No rework logs found.</p>;
  
//   return (
//     <div className="overflow-x-auto mt-3 border border-gray-200 rounded-lg">
//       <table className="w-full text-sm text-left">
//         <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
//           <tr>
//             <th className="px-4 py-2 font-semibold">Event Type</th>
//             <th className="px-4 py-2 font-semibold">Reason</th>
//             <th className="px-4 py-2 font-semibold text-center">Date</th>
//             <th className="px-4 py-2 font-semibold text-center">Extra Payment %</th>
//             <th className="px-4 py-2 font-semibold text-center">Created By</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-gray-100">
//           {eventlogs.map((log) => (
//             <tr key={log.id} className="hover:bg-gray-50 bg-white">
//               <td className="px-4 py-3 text-red-600 font-medium capitalize">{log.event_type.replace('_', ' ')}</td>
//               <td className="px-4 py-3 text-gray-700">{log.reason || 'N/A'}</td>
//               <td className="px-4 py-3 text-center text-gray-600">{log.intimation_date}</td>
//               <td className="px-4 py-3 text-center text-orange-600 font-mono font-medium">{log.extra_payment_percent ? `${log.extra_payment_percent}%` : '—'}</td>
//               <td className="px-4 py-3 text-gray-700 text-center">
//                 <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{log.created_by}</span>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// // --- 2. Subactivity Section ---
// const SubactivitySection = ({ subactivity }) => (
//   <div className="mt-4 p-4 bg-white border border-purple-100 rounded-xl shadow-sm">
//     <div className="flex justify-between items-center mb-2">
//       <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
//         <Layers size={18} className="text-purple-500" />
//         {subactivity.subactivity_name} 
//       </h4>
//       <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
//         Reworks: {subactivity.rework_count}
//       </span>
//     </div>
//     <EventLogTable eventlogs={subactivity.eventlogs} />
//   </div>
// );

// // --- 3. Activity Section ---
// const ActivitySection = ({ activity }) => (
//   <div className="ml-2 pl-4 border-l-4 border-blue-400 mt-6 pb-2">
//     <div className="flex items-center gap-3 mb-3">
//       <Briefcase size={20} className="text-blue-600" />
//       <h3 className="text-xl font-bold text-gray-800">
//         {activity.activity_name} 
//       </h3>
//       <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-md border border-gray-200">
//         Total Reworks: {activity.total_reworks}
//       </span>
//     </div>
//     <div className="pl-2">
//       {activity.subactivities?.map(sub => (
//         <SubactivitySection key={sub.subactivity_id} subactivity={sub} />
//       ))}
//     </div>
//   </div>
// );

// // --- 4. Main Standalone Component ---
// const TrackWorkLog = () => {
//   const dispatch = useDispatch();
  
//   // Pull projects list AND rework data from Redux
//   const { 
//     projectsOnly = [], 
//     trackWorkLogData: data, 
//     loading, 
//     error 
//   } = useSelector((state) => state.api || {});

//   // Fetch projects on initial mount if not already loaded
//   useEffect(() => {
//     if (projectsOnly.length === 0) {
//       dispatch(fetchOnlyProjectsList());
//     }
//   }, [dispatch, projectsOnly.length]);

//   // Local State for dropdown selections
//   const [selectedProject, setSelectedProject] = useState("");
//   const [selectedActivity, setSelectedActivity] = useState("");
//   const [selectedSubactivity, setSelectedSubactivity] = useState("");

//   // CRITICAL: Cache the project tree. 
//   // If we don't cache this, filtering by activity overwrites the state and destroys the other dropdown options.
//   const [cachedProjectTree, setCachedProjectTree] = useState(null);

//   useEffect(() => {
//     if (data && data.level === 'project') {
//       setCachedProjectTree(data);
//     }
//   }, [data]);

//   // --- Dropdown Event Handlers ---
//   const handleProjectChange = (e) => {
//     const projectId = e.target.value;
//     setSelectedProject(projectId);
    
//     // Reset lower dropdowns
//     setSelectedActivity("");
//     setSelectedSubactivity("");
//     setCachedProjectTree(null); 

//     if (projectId) {
//       dispatch(fetchTrackWorkLog({ project_id: projectId }));
//     }
//   };

//   const handleActivityChange = (e) => {
//     const activityId = e.target.value;
//     setSelectedActivity(activityId);
//     setSelectedSubactivity("");

//     if (activityId) {
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: activityId }));
//     } else {
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
//     }
//   };

//   const handleSubactivityChange = (e) => {
//     const subactivityId = e.target.value;
//     setSelectedSubactivity(subactivityId);

//     if (subactivityId) {
//       dispatch(fetchTrackWorkLog({ 
//         project_id: selectedProject, 
//         activity_id: selectedActivity, 
//         subactivity_id: subactivityId 
//       }));
//     } else if (selectedActivity) {
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: selectedActivity }));
//     } else {
//       dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
//     }
//   };

//   // --- Derive dropdown options from the cached project tree ---
//   const availableActivities = cachedProjectTree?.activities || [];
//   const selectedActivityObj = availableActivities.find(a => a.activity_id === selectedActivity);
//   const availableSubactivities = selectedActivityObj?.subactivities || [];

//   return (
//     <div className="p-6 font-sans max-w-7xl mx-auto space-y-6">
      
//       {/* --- Filter Section --- */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
//           <AlertCircle className="text-red-500" /> Rework Tracking Logs
//         </h1>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
          
//           {/* Project Filter */}
//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Project</label>
//             <select 
//               value={selectedProject} 
//               onChange={handleProjectChange} 
//               className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
//             >
//               <option value="">-- Choose a Project --</option>
//               {projectsOnly.map(p => (
//                 <option key={p.id || p.project_id} value={p.id || p.project_id}>
//                   {p.project_name || p.name || p.short_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Activity Filter */}
//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Select Activity</label>
//             <select 
//               value={selectedActivity} 
//               onChange={handleActivityChange} 
//               disabled={!selectedProject || availableActivities.length === 0} 
//               className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100"
//             >
//               <option value="">All Activities</option>
//               {availableActivities.map(act => (
//                 <option key={act.activity_id} value={act.activity_id}>
//                   {act.activity_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Subactivity Filter */}
//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Select Subactivity</label>
//             <select 
//               value={selectedSubactivity} 
//               onChange={handleSubactivityChange} 
//               disabled={!selectedActivity || availableSubactivities.length === 0} 
//               className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100"
//             >
//               <option value="">All Subactivities</option>
//               {availableSubactivities.map(sub => (
//                 <option key={sub.subactivity_id} value={sub.subactivity_id}>
//                   {sub.subactivity_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//         </div>
//       </div>

//       {/* --- Data Display Section --- */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
//         {loading && (
//           <div className="flex flex-col items-center justify-center py-20 h-full">
//             <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
//             <p className="text-gray-500 font-medium">Fetching Rework Logs...</p>
//           </div>
//         )}
        
//         {!loading && error && (
//           <div className="text-center py-10 bg-red-50 text-red-600 rounded-lg border border-red-200">
//              <AlertCircle className="mx-auto mb-2" size={32} />
//              {typeof error === 'string' ? error : "Error loading rework data"}
//           </div>
//         )}
        
//         {!loading && !error && !selectedProject && (
//           <div className="text-center py-24 text-gray-400 flex flex-col items-center">
//             <FolderOpen size={64} className="mb-4 opacity-50" />
//             <p className="text-lg">Please select a project from the filters above to view rework logs.</p>
//           </div>
//         )}

//         {!loading && !error && data && selectedProject && (
//           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
//             {/* Level 1: Project View */}
//             {data.level === 'project' && (
//               <div>
//                 <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
//                   <h2 className="text-2xl font-bold text-gray-800">{data.project_name}</h2>
//                   <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold">
//                     Project Total Reworks: {data.total_reworks}
//                   </span>
//                 </div>
//                 <div>
//                   {data.activities?.map(act => <ActivitySection key={act.activity_id} activity={act} />)}
//                   {(!data.activities || data.activities.length === 0) && (
//                     <p className="text-gray-500 text-center py-10">No rework data recorded for this project.</p>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Level 2: Activity View */}
//             {data.level === 'activity' && (
//               <div className="bg-blue-50/30 p-2 rounded-xl">
//                  <h2 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 pl-4">Filtered to Activity Scope</h2>
//                  <ActivitySection activity={data} />
//               </div>
//             )}

//             {/* Level 3: Subactivity View */}
//             {data.level === 'subactivity' && (
//               <div className="bg-purple-50/30 p-2 rounded-xl">
//                 <h2 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2 pl-4">Filtered to Subactivity Scope</h2>
//                 <SubactivitySection subactivity={data} />
//               </div>
//             )}

//           </motion.div>
//         )}
//       </div>

//     </div>
//   );
// };

// export default TrackWorkLog;




import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrackWorkLog, fetchOnlyProjectsList } from "../api/apiSlice"; 
import { 
  AlertCircle, FolderOpen, Briefcase, Layers, Loader2, 
  Clock, CalendarDays, User, ChevronDown, ChevronUp, 
  FileText 
} from "lucide-react";
import { motion } from "framer-motion";

// --- Helper: Group flat worklogs by User and Date ---
const processUserLogs = (employees = [], worklogs = []) => {
  return employees.map(emp => {
    // Find logs for this specific employee
    const empLogs = worklogs.filter(w => w.user === emp.employee_code);
    
    // Group their logs by date
    const logsByDate = {};
    empLogs.forEach(log => {
      const dateStr = log.start_time ? log.start_time.split('T')[0] : 'N/A';
      if(!logsByDate[dateStr]) {
        logsByDate[dateStr] = { date: dateStr, logs: [], total_time: log.duration_display }; 
      }
      logsByDate[dateStr].logs.push({
        work_type: log.work_type,
        description: log.note,
        time_spent: log.duration_display,
        start_time: log.start_time,
        end_time: log.end_time
      });
    });
    
    return {
      name: emp.name,
      emp_code: emp.employee_code,
      designation: emp.designation,
      total_logs: emp.total_logs,
      date_wise: Object.values(logsByDate)
    };
  });
};

// --- 1. User Work Log Card ---
const UserLogCard = ({ user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* User Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
             {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.emp_code} • {user.designation}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {user.total_logs} logs
            </span>
          </div>
          {expanded ? <ChevronUp className="text-gray-400" size={18} /> : <ChevronDown className="text-gray-400" size={18} />}
        </div>
      </div>

      {/* Expanded Daily Logs */}
      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
          {user.date_wise?.map((dayRecord, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarDays size={16} className="text-blue-500"/>
                  {dayRecord.date !== 'N/A' ? new Date(dayRecord.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                </span>
              </div>
              
              <div className="space-y-3">
                {dayRecord.logs?.map((log, logIdx) => (
                  <div key={logIdx} className="pl-4 border-l-2 border-blue-200 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">
                          Log Entry
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FileText size={12}/> {log.description || "No description"}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="block text-gray-600 font-mono font-medium">
                          {log.time_spent}
                        </span>
                        <span className="text-gray-400">
                          {log.start_time ? new Date(log.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""} - 
                          {log.end_time ? new Date(log.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
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

// --- 2. Cycle Section (Represents 1 item from eventlogs array) ---
const CycleSection = ({ cycle }) => {
  // Process the raw data into user-grouped blocks
  const users = processUserLogs(cycle.employees || [], cycle.worklogs || []);
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      
      {/* Header containing the Rework Event details */}
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-800 text-lg">Cycle: {cycle.cycle_number || "Initial"}</span>
            {cycle.event_type && (
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {cycle.event_type.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <CalendarDays size={14} /> {cycle.intimation_date || new Date(cycle.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-6 text-sm">
           {cycle.extra_payment_percent && (
             <div className="text-right">
               <p className="text-xs text-gray-500 font-semibold uppercase">Extra Payment</p>
               <p className="font-mono text-orange-600 font-bold">{cycle.extra_payment_percent}%</p>
             </div>
           )}
           {cycle.reason && (
             <div className="text-right max-w-xs">
               <p className="text-xs text-gray-500 font-semibold uppercase">Reason</p>
               <p className="text-gray-700 truncate" title={cycle.reason}>{cycle.reason}</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Work Logs Body */}
      <div className="p-5">
         <h5 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
           <User size={16} className="text-blue-500" /> Work Logs ({cycle.worklog_count || 0})
         </h5>
         {users.length > 0 ? (
            <div className="space-y-4">
              {users.map((u, i) => <UserLogCard key={i} user={u} />)}
            </div>
         ) : (
            <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center border border-dashed border-gray-200">
              No work logs recorded by employees in this cycle.
            </p>
         )}
      </div>
    </div>
  )
}

// --- 3. Subactivity Section ---
const SubactivitySection = ({ subactivity }) => (
  <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
    
    {/* Subactivity Header */}
    <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
      <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
        <Layers size={20} className="text-purple-600" />
        {subactivity.subactivity_name} 
      </h4>
      <div className="flex gap-3">
        <span className="text-xs font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
          <AlertCircle size={14}/> Total Reworks: {subactivity.rework_count || 0}
        </span>
      </div>
    </div>

    {/* Render every cycle (eventlog) inside this subactivity */}
    <div className="space-y-6">
      {subactivity.eventlogs?.map((cycle) => (
         <CycleSection key={cycle.id} cycle={cycle} />
      ))}
      {(!subactivity.eventlogs || subactivity.eventlogs.length === 0) && (
        <p className="text-center text-gray-500 py-4 italic">No work cycles or reworks found.</p>
      )}
    </div>

  </div>
);

// --- 4. Activity Section ---
const ActivitySection = ({ activity }) => (
  <div className="ml-2 pl-4 border-l-4 border-blue-400 mt-6 pb-2">
    <div className="flex items-center gap-3 mb-3">
      <Briefcase size={20} className="text-blue-600" />
      <h3 className="text-xl font-bold text-gray-800">
        {activity.activity_name} 
      </h3>
      <span className="text-sm font-semibold bg-red-50 text-red-700 px-3 py-1 rounded-md border border-red-100">
        Total Reworks: {activity.total_reworks}
      </span>
    </div>
    <div className="pl-2">
      {activity.subactivities?.map(sub => (
        <SubactivitySection key={sub.subactivity_id} subactivity={sub} />
      ))}
    </div>
  </div>
);

// --- 5. Main Standalone Component ---
const TrackWorkLog = () => {
  const dispatch = useDispatch();
  
  // Pull projects list AND rework data from Redux
  const { 
    projectsOnly = [], 
    trackWorkLogData: data, 
    loading, 
    error 
  } = useSelector((state) => state.api || {});

  // Fetch projects on initial mount if not already loaded
  useEffect(() => {
    if (projectsOnly.length === 0) {
      dispatch(fetchOnlyProjectsList());
    }
  }, [dispatch, projectsOnly.length]);

  // Local State for dropdown selections
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedSubactivity, setSelectedSubactivity] = useState("");

  // Cache the project tree so filtering doesn't destroy options
  const [cachedProjectTree, setCachedProjectTree] = useState(null);

  useEffect(() => {
    if (data && data.level === 'project') {
      setCachedProjectTree(data);
    }
  }, [data]);

  // --- Dropdown Event Handlers ---
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    
    // Reset lower dropdowns
    setSelectedActivity("");
    setSelectedSubactivity("");
    setCachedProjectTree(null); 

    if (projectId) {
      dispatch(fetchTrackWorkLog({ project_id: projectId }));
    }
  };

  const handleActivityChange = (e) => {
    const activityId = e.target.value;
    setSelectedActivity(activityId);
    setSelectedSubactivity("");

    if (activityId) {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: activityId }));
    } else {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
    }
  };

  const handleSubactivityChange = (e) => {
    const subactivityId = e.target.value;
    setSelectedSubactivity(subactivityId);

    if (subactivityId) {
      dispatch(fetchTrackWorkLog({ 
        project_id: selectedProject, 
        activity_id: selectedActivity, 
        subactivity_id: subactivityId 
      }));
    } else if (selectedActivity) {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: selectedActivity }));
    } else {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
    }
  };

  // --- Derive dropdown options from the cached project tree ---
  const availableActivities = cachedProjectTree?.activities || [];
  const selectedActivityObj = availableActivities.find(a => a.activity_id === selectedActivity);
  const availableSubactivities = selectedActivityObj?.subactivities || [];

  return (
    <div className="p-6 font-sans max-w-7xl mx-auto space-y-6">
      
      {/* --- Filter Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <AlertCircle className="text-red-500" /> Project Work & Rework Logs
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
          
          {/* Project Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Project</label>
            <select 
              value={selectedProject} 
              onChange={handleProjectChange} 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
            >
              <option value="">-- Choose a Project --</option>
              {projectsOnly.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.project_name || p.name || p.short_name}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Select Activity</label>
            <select 
              value={selectedActivity} 
              onChange={handleActivityChange} 
              disabled={!selectedProject || availableActivities.length === 0} 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100 cursor-pointer"
            >
              <option value="">All Activities</option>
              {availableActivities.map(act => (
                <option key={act.activity_id} value={act.activity_id}>
                  {act.activity_name}
                </option>
              ))}
            </select>
          </div>

          {/* Subactivity Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Select Subactivity</label>
            <select 
              value={selectedSubactivity} 
              onChange={handleSubactivityChange} 
              disabled={!selectedActivity || availableSubactivities.length === 0} 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100 cursor-pointer"
            >
              <option value="">All Subactivities</option>
              {availableSubactivities.map(sub => (
                <option key={sub.subactivity_id} value={sub.subactivity_id}>
                  {sub.subactivity_name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* --- Data Display Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 h-full">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Fetching Logs...</p>
          </div>
        )}
        
        {!loading && error && (
          <div className="text-center py-10 bg-red-50 text-red-600 rounded-lg border border-red-200">
             <AlertCircle className="mx-auto mb-2" size={32} />
             {typeof error === 'string' ? error : "Error loading data"}
          </div>
        )}
        
        {!loading && !error && !selectedProject && (
          <div className="text-center py-24 text-gray-400 flex flex-col items-center">
            <FolderOpen size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Please select a project from the filters above to view logs.</p>
          </div>
        )}

        {!loading && !error && data && selectedProject && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Level 1: Project View */}
            {data.level === 'project' && (
              <div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{data.project_name}</h2>
                  <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold">
                    Project Total Reworks: {data.total_reworks}
                  </span>
                </div>
                <div>
                  {data.activities?.map(act => <ActivitySection key={act.activity_id} activity={act} />)}
                  {(!data.activities || data.activities.length === 0) && (
                    <p className="text-gray-500 text-center py-10">No data recorded for this project.</p>
                  )}
                </div>
              </div>
            )}

            {/* Level 2: Activity View */}
            {data.level === 'activity' && (
              <div className="bg-blue-50/30 p-2 rounded-xl">
                 <h2 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 pl-4">Filtered to Activity Scope</h2>
                 <ActivitySection activity={data} />
              </div>
            )}

            {/* Level 3: Subactivity View */}
            {data.level === 'subactivity' && (
              <div className="bg-purple-50/30 p-2 rounded-xl">
                <h2 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2 pl-4">Filtered to Subactivity Scope</h2>
                <SubactivitySection subactivity={data} />
              </div>
            )}

          </motion.div>
        )}
      </div>

    </div>
  );
};

export default TrackWorkLog;