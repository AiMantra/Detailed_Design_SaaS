// // src/components/LogCard.jsx
// import { motion, AnimatePresence } from "framer-motion";
// import { useState } from "react";
// import {
//   Calendar,
//   Clock,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   FileText,
//   User,
//   TrendingUp,
//   Activity,
//   ChevronDown,
//   ChevronUp,
//   Eye,
//   EyeOff,
//   Zap,
//   Settings,
//   Edit,
//   Trash2,
//   Building2,
//   Tag,
//   Hash
// } from "lucide-react";

// const LogCard = ({ log, onDelete, userRole, isExpanded, onToggle }) => {
//   const [showChanges, setShowChanges] = useState(false);

//   const getLogIcon = (eventType) => {
//     const iconMap = {
//       "Project Created": <FileText className="text-blue-500" size={24} />,
//       "Project Updated": <Settings className="text-green-500" size={24} />,
//       "Progress Changed": <TrendingUp className="text-purple-500" size={24} />,
//       "Activity Created": <Activity className="text-indigo-500" size={24} />,
//       "Activity Updated": <Edit className="text-indigo-500" size={24} />,
//       "SubActivity Created": <CheckCircle className="text-emerald-500" size={24} />,
//       "SubActivity Updated": <Edit className="text-emerald-500" size={24} />,
//       "Extension Requested": <Clock className="text-yellow-500" size={24} />,
//       "Extension Approved": <CheckCircle className="text-green-500" size={24} />,
//       "Extension Rejected": <XCircle className="text-red-500" size={24} />,
//       "MANUAL_LOG": <FileText className="text-orange-500" size={24} />,
//       "Status Update": <Zap className="text-yellow-500" size={24} />,
//       "Date Update": <Calendar className="text-blue-500" size={24} />
//     };
//     return iconMap[eventType] || <AlertCircle className="text-gray-500" size={24} />;
//   };

//   const getLogColor = (eventType) => {
//     const colorMap = {
//       "Project Created": "border-blue-200 bg-blue-50",
//       "Project Updated": "border-green-200 bg-green-50",
//       "Progress Changed": "border-purple-200 bg-purple-50",
//       "Activity Created": "border-indigo-200 bg-indigo-50",
//       "Activity Updated": "border-indigo-200 bg-indigo-50",
//       "SubActivity Created": "border-emerald-200 bg-emerald-50",
//       "SubActivity Updated": "border-emerald-200 bg-emerald-50",
//       "Extension Requested": "border-yellow-200 bg-yellow-50",
//       "Extension Approved": "border-green-200 bg-green-50",
//       "Extension Rejected": "border-red-200 bg-red-50",
//       "MANUAL_LOG": "border-orange-200 bg-orange-50",
//       "Status Update": "border-yellow-200 bg-yellow-50",
//       "Date Update": "border-blue-200 bg-blue-50"
//     };
//     return colorMap[eventType] || "border-gray-200 bg-gray-50";
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     const date = new Date(dateString);
//     return {
//       full: date.toLocaleDateString('en-IN', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit'
//       }),
//       relative: getRelativeTime(date),
//       short: date.toLocaleDateString('en-IN', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       }),
//       time: date.toLocaleTimeString('en-IN', {
//         hour: '2-digit',
//         minute: '2-digit'
//       })
//     };
//   };

//   const getRelativeTime = (date) => {
//     const now = new Date();
//     const diffMs = now - date;
//     const diffSec = Math.floor(diffMs / 1000);
//     const diffMin = Math.floor(diffSec / 60);
//     const diffHour = Math.floor(diffMin / 60);
//     const diffDay = Math.floor(diffHour / 24);

//     if (diffSec < 60) return `${diffSec} seconds ago`;
//     if (diffMin < 60) return `${diffMin} minutes ago`;
//     if (diffHour < 24) return `${diffHour} hours ago`;
//     if (diffDay === 1) return `yesterday`;
//     if (diffDay < 7) return `${diffDay} days ago`;
//     return date.toLocaleDateString();
//   };

//   const formatValue = (value, path = '') => {
//     if (value === null || value === undefined) return null;

//     if (typeof value === 'object') {
//       return (
//         <div className="ml-4 border-l-2 border-gray-200 pl-3">
//           {Object.entries(value).map(([key, val]) => {
//             const currentPath = path ? `${path}.${key}` : key;
//             const formatted = formatValue(val, currentPath);
//             if (formatted === null) return null;

//             return (
//               <div key={currentPath} className="mb-2">
//                 <span className="text-xs font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
//                 <div className="mt-1">{formatted}</div>
//               </div>
//             );
//           })}
//         </div>
//       );
//     }

//     if (typeof value === 'boolean') {
//       return (
//         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//           }`}>
//           {value ? 'Yes' : 'No'}
//         </span>
//       );
//     }

//     if (typeof value === 'number') {
//       return <span className="font-mono text-sm text-blue-600">{value}</span>;
//     }

//     if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
//       return <span className="text-sm text-purple-600">{new Date(value).toLocaleDateString()}</span>;
//     }

//     return <span className="text-sm text-gray-700">{String(value)}</span>;
//   };

//   const formatChanges = (oldVal, newVal) => {
//     if (!oldVal && !newVal) return [];

//     const changes = [];

//     if (oldVal && newVal && typeof oldVal === 'object' && typeof newVal === 'object') {
//       const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

//       allKeys.forEach(key => {
//         const oldV = oldVal[key];
//         const newV = newVal[key];

//         if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
//           changes.push({
//             field: key,
//             old: oldV,
//             new: newV
//           });
//         }
//       });
//     } else if (oldVal !== newVal) {
//       changes.push({
//         field: 'value',
//         old: oldVal,
//         new: newVal
//       });
//     }

//     return changes;
//   };

//   const formattedDate = formatDate(log.created_at);
//   const changes = formatChanges(log.old_value, log.new_value);

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, y: -20 }}
//       className={`bg-white rounded-xl shadow-lg border-2 ${getLogColor(log.event_type)} overflow-hidden hover:shadow-xl transition-all`}
//     >
//       {/* Header */}
//       <div className="p-5">
//         <div className="flex items-start gap-4">
//           {/* Icon */}
//           <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
//             {getLogIcon(log.event_type)}
//           </div>

//           {/* Content */}
//           <div className="flex-1 min-w-0">
//             {/* Title Row */}
//             <div className="flex items-center justify-between gap-2 mb-2">
//               <div className="flex items-center gap-2 flex-wrap">
//                 <h3 className="font-semibold text-gray-800">
//                   {log.event_type}
//                 </h3>
//                 <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
//                   <Building2 size={10} />
//                   {log.project_name}
//                 </span>
//                 {log.project_code && (
//                   <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
//                     <Hash size={10} />
//                     {log.project_code}
//                   </span>
//                 )}
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-xs text-gray-400 hidden sm:block" title={formattedDate.full}>
//                   {formattedDate.short}
//                 </span>
//                 <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
//                   {formattedDate.relative}
//                 </span>
//               </div>
//             </div>

//             {/* Message */}
//             <p className="text-gray-600 mb-3">{log.message}</p>

//             {/* Quick Info Badges */}
//             <div className="flex flex-wrap gap-2 mb-2">
//               {log.user && (
//                 <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
//                   <User size={12} />
//                   {log.user}
//                 </span>
//               )}
//               {log.user_role && (
//                 <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
//                   <Tag size={12} />
//                   {log.user_role}
//                 </span>
//               )}
//               {log.activity_detail && (
//                 <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
//                   <Activity size={12} />
//                   {log.activity_detail.activity_name}
//                 </span>
//               )}
//               {log.subactivity_detail && (
//                 <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
//                   <CheckCircle size={12} />
//                   {log.subactivity_detail.subactivity_name}
//                 </span>
//               )}
//             </div>

//             {/* Changes Preview */}
//             {changes.length > 0 && (
//               <div className="mt-3">
//                 <button
//                   onClick={() => setShowChanges(!showChanges)}
//                   className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
//                 >
//                   {showChanges ? <EyeOff size={16} /> : <Eye size={16} />}
//                   {showChanges ? 'Hide changes' : `Show ${changes.length} change${changes.length > 1 ? 's' : ''}`}
//                 </button>

//                 <AnimatePresence>
//                   {showChanges && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: 'auto' }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200"
//                     >
//                       <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Changes</h4>
//                       <div className="space-y-4">
//                         {changes.map((change, idx) => (
//                           <div key={idx} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
//                             <p className="text-xs font-medium text-gray-500 mb-2 capitalize">
//                               {change.field.replace(/_/g, ' ')}
//                             </p>
//                             <div className="grid md:grid-cols-2 gap-3">
//                               <div className="bg-white p-2 rounded border border-gray-200">
//                                 <p className="text-xs text-gray-400 mb-1">Previous</p>
//                                 <div className="text-sm">
//                                   {formatValue(change.old)}
//                                 </div>
//                               </div>
//                               <div className="bg-white p-2 rounded border border-green-200">
//                                 <p className="text-xs text-gray-400 mb-1">New</p>
//                                 <div className="text-sm">
//                                   {formatValue(change.new)}
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             )}
//           </div>

//           {/* Actions */}
//           <div className="flex items-center gap-1">
//             <button
//               onClick={onToggle}
//               className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               title={isExpanded ? "Show less" : "Show more"}
//             >
//               {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
//             </button>

//             {/* {userRole === "ACCOUNT" && (
//               <button
//                 onClick={() => onDelete(log)}
//                 className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                 title="Delete log"
//               >
//                 <Trash2 size={18} />
//               </button>
//             )} */}
//           </div>
//         </div>
//       </div>

//       {/* Expanded Details */}
//       <AnimatePresence>
//         {isExpanded && (
//           <motion.div
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: 'auto', opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             className="border-t border-gray-200 bg-white"
//           >
//             <div className="p-5 space-y-4">
//               {/* Full Details Grid */}
//               <div className="grid md:grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
//                     Event Details
//                   </h5>
//                   <div className="bg-gray-50 rounded-lg p-3 space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Event ID:</span>
//                       <span className="text-xs font-mono text-gray-700">{log.id}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Type:</span>
//                       <span className="text-xs font-medium">{log.event_type}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Date:</span>
//                       <span className="text-xs">{formattedDate.full}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Time:</span>
//                       <span className="text-xs">{formattedDate.time}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
//                     Project Details
//                   </h5>
//                   <div className="bg-gray-50 rounded-lg p-3 space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Project ID:</span>
//                       <span className="text-xs font-mono text-gray-700">{log.project}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Name:</span>
//                       <span className="text-xs font-medium">{log.project_name}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-xs text-gray-500">Code:</span>
//                       <span className="text-xs">{log.project_code}</span>
//                     </div>
//                     {log.company_name && (
//                       <div className="flex justify-between">
//                         <span className="text-xs text-gray-500">Company:</span>
//                         <span className="text-xs">{log.company_name}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Related Entities */}
//               {/* {(log.activity_detail || log.subactivity_detail) && (
//                 <div>
//                   <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
//                     Related Entities
//                   </h5>
//                   <div className="grid md:grid-cols-2 gap-3">
//                     {log.activity_detail && (
//                       <div className="bg-blue-50 rounded-lg p-3">
//                         <p className="text-xs font-medium text-blue-700 mb-2">Activity</p>
//                         <pre className="text-xs bg-white p-2 rounded border border-blue-200 overflow-auto max-h-40">
//                           {JSON.stringify(log.activity_detail, null, 2)}
//                         </pre>
//                       </div>
//                     )}
//                     {log.subactivity_detail && (
//                       <div className="bg-emerald-50 rounded-lg p-3">
//                         <p className="text-xs font-medium text-emerald-700 mb-2">SubActivity</p>
//                         <pre className="text-xs bg-white p-2 rounded border border-emerald-200 overflow-auto max-h-40">
//                           {JSON.stringify(log.subactivity_detail, null, 2)}
//                         </pre>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )} */}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// };

// export default LogCard;


// src/components/LogCard.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  User,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Zap,
  Settings,
  Edit,
  Trash2,
  Building2,
  Tag,
  Hash
} from "lucide-react";

const LogCard = ({ log, onDelete, userRole, isExpanded, onToggle }) => {
  const [showChanges, setShowChanges] = useState(false);

  const getLogIcon = (eventType) => {
    const iconMap = {
      "Project Created": <FileText className="text-blue-500" size={24} />,
      "Project Updated": <Settings className="text-green-500" size={24} />,
      "Progress Changed": <TrendingUp className="text-purple-500" size={24} />,
      "Activity Created": <Activity className="text-indigo-500" size={24} />,
      "Activity Updated": <Edit className="text-indigo-500" size={24} />,
      "SubActivity Created": <CheckCircle className="text-emerald-500" size={24} />,
      "SubActivity Updated": <Edit className="text-emerald-500" size={24} />,
      "Extension Requested": <Clock className="text-yellow-500" size={24} />,
      "Extension Approved": <CheckCircle className="text-green-500" size={24} />,
      "Extension Rejected": <XCircle className="text-red-500" size={24} />,
      "MANUAL_LOG": <FileText className="text-orange-500" size={24} />,
      "Status Update": <Zap className="text-yellow-500" size={24} />,
      "Date Update": <Calendar className="text-blue-500" size={24} />
    };
    return iconMap[eventType] || <AlertCircle className="text-gray-500" size={24} />;
  };

  const getLogColor = (eventType) => {
    const colorMap = {
      "Project Created": "border-blue-200 bg-blue-50",
      "Project Updated": "border-green-200 bg-green-50",
      "Progress Changed": "border-purple-200 bg-purple-50",
      "Activity Created": "border-indigo-200 bg-indigo-50",
      "Activity Updated": "border-indigo-200 bg-indigo-50",
      "SubActivity Created": "border-emerald-200 bg-emerald-50",
      "SubActivity Updated": "border-emerald-200 bg-emerald-50",
      "Extension Requested": "border-yellow-200 bg-yellow-50",
      "Extension Approved": "border-green-200 bg-green-50",
      "Extension Rejected": "border-red-200 bg-red-50",
      "MANUAL_LOG": "border-orange-200 bg-orange-50",
      "Status Update": "border-yellow-200 bg-yellow-50",
      "Date Update": "border-blue-200 bg-blue-50"
    };
    return colorMap[eventType] || "border-gray-200 bg-gray-50";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      relative: getRelativeTime(date),
      short: date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return `yesterday`;
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString();
  };

  // const formatValue = (value, path = '') => {
  //   if (value === null || value === undefined) return null;

  //   // --- RETAINED PREVIOUS FIX: Handle "None" string from backend gracefully ---
  //   if (typeof value === 'string' && value === 'None') {
  //     return <span className="text-gray-400 italic">Not previously set</span>;
  //   }
  //   // -------------------------------------------------------------------------

  //   if (typeof value === 'object') {
  //     return (
  //       <div className="ml-4 border-l-2 border-gray-200 pl-3">
  //         {Object.entries(value).map(([key, val]) => {
  //           const currentPath = path ? `${path}.${key}` : key;
  //           const formatted = formatValue(val, currentPath);
  //           if (formatted === null) return null;

  //           return (
  //             <div key={currentPath} className="mb-2">
  //               <span className="text-xs font-medium text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
  //               <div className="mt-1">{formatted}</div>
  //             </div>
  //           );
  //         })}
  //       </div>
  //     );
  //   }


  const formatValue = (value, path = '') => {
    if (value === null || value === undefined) return null;

    // 1. Adds the check for the "None" string
    if (typeof value === 'string' && value === 'None') {
      return <span className="text-gray-400 italic">Not previously set</span>;
    }

    // if (typeof value === 'object') {
    //   return (
    //     <div className="ml-4 border-l-2 border-gray-200 pl-3">
    //       {Object.entries(value).map(([key, val]) => {
    //         const currentPath = path ? `${path}.${key}` : key;
    //         const formatted = formatValue(val, currentPath);
    //         if (formatted === null) return null;

    //         return (
    //           <div key={currentPath} className="mb-2">
    //             {/* 2. Adds the .replace() for clientbranch here too */}
    //             <span className="text-xs font-medium text-gray-500 capitalize">
    //               {key.replace(/_/g, ' ').replace(/clientbranch/gi, 'client branch')}:
    //             </span>
    //             <div className="mt-1">{formatted}</div>
    //           </div>
    //         );
    //       })}
    //     </div>
    //   );
    // }

    if (typeof value === 'object') {
      const isArray = Array.isArray(value); // Check if the object is an array

      return (
        <div className="ml-4 border-l-2 border-gray-200 pl-3">
          {Object.entries(value).map(([key, val]) => {
            const currentPath = path ? `${path}.${key}` : key;
            const formatted = formatValue(val, currentPath);
            if (formatted === null) return null;

            // If it is an array, convert the index to a number and add 1. 
            // Otherwise, format the string key normally.
            const displayKey = (isArray && !isNaN(key)) 
              ? parseInt(key, 10) + 1 
              : key.replace(/_/g, ' ').replace(/clientbranch/gi, 'client branch');

            return (
              <div key={currentPath} className="mb-2">
                <span className="text-xs font-medium text-gray-500 capitalize">
                  {displayKey}:
                </span>
                <div className="mt-1">{formatted}</div>
              </div>
            );
          })}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span className="font-mono text-sm text-blue-600">{value}</span>;
    }

    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return <span className="text-sm text-purple-600">{new Date(value).toLocaleDateString()}</span>;
    }

    return <span className="text-sm text-gray-700">{String(value)}</span>;
  };

  const formatChanges = (oldVal, newVal) => {
    if (!oldVal && !newVal) return [];

    const changes = [];

    if (oldVal && newVal && typeof oldVal === 'object' && typeof newVal === 'object') {
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

      allKeys.forEach(key => {
        const oldV = oldVal[key];
        const newV = newVal[key];

        if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
          changes.push({
            field: key,
            old: oldV,
            new: newV
          });
        }
      });
    } else if (oldVal !== newVal) {
      changes.push({
        field: 'value',
        old: oldVal,
        new: newVal
      });
    }

    return changes;
  };

  const formattedDate = formatDate(log.created_at);
  const changes = formatChanges(log.old_value, log.new_value);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-xl shadow-lg border-2 ${getLogColor(log.event_type)} overflow-hidden hover:shadow-xl transition-all`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
            {getLogIcon(log.event_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-800">
                  {log.event_type}
                </h3>
                <span className="text-xs bg-white px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Building2 size={10} />
                  {log.project_name}
                </span>
                {log.project_code && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <Hash size={10} />
                    {log.project_code}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden sm:block" title={formattedDate.full}>
                  {formattedDate.short}
                </span>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {formattedDate.relative}
                </span>
              </div>
            </div>

            {/* Message */}
            <p className="text-gray-600 mb-3">{log.message}</p>

            {/* Quick Info Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {log.user && (
                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  <User size={12} />
                  {log.user}
                </span>
              )}
              {log.user_role && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  <Tag size={12} />
                  {log.user_role}
                </span>
              )}
              {log.activity_detail && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  <Activity size={12} />
                  {log.activity_detail.activity_name}
                </span>
              )}
              {log.subactivity_detail && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  <CheckCircle size={12} />
                  {log.subactivity_detail.subactivity_name}
                </span>
              )}
            </div>

            {/* Changes Preview */}
            {changes.length > 0 && (
              <div className="mt-3">
                {/* <button
                  onClick={() => setShowChanges(!showChanges)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  {showChanges ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showChanges ? 'Hide changes' : `Show ${changes.length} change${changes.length > 1 ? 's' : ''}`}
                </button> */}

                <button
               onClick={() => setShowChanges(!showChanges)}
               className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
             >
               {showChanges ? <EyeOff size={16} /> : <Eye size={16} />}
               {showChanges ? 'Hide Changes' : 'Show Changes'}
              </button>

                {/* <AnimatePresence>
                  {showChanges && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Updated Fields</h4>
                      <div className="space-y-3">
                        {changes.map((change, idx) => (
                          
                          // --- NEW CHANGE: Removed "Previous" grid block, redesigned as a single sleek card for the new value ---
                          <div 
                            key={idx} 
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-green-500"
                          >
                            <p className="text-xs text-green-600 font-semibold mb-1 uppercase tracking-wider">
                              {change.field.replace(/_/g, ' ')}
                            </p>
                            <div className="text-sm text-gray-800">
                              {formatValue(change.new)}
                            </div>
                          </div>
                          // -------------------------------------------------------------------------------------------------------

                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence> */}
                <AnimatePresence>
                  {showChanges && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Updated Fields</h4>
                      <div className="space-y-3">
                        {changes.map((change, idx) => (
                          
                          <div 
                            key={idx} 
                            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm border-l-4 border-l-green-500"
                          >
                            <p className="text-xs text-green-600 font-semibold mb-1 capitalize tracking-wider">
                              {change.field.replace(/_/g, ' ').replace(/clientbranch/gi, 'client branch')}
                            </p>
                            <div className="text-sm text-gray-800">
                              {formatValue(change.new)}
                            </div>
                          </div>

                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isExpanded ? "Show less" : "Show more"}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 bg-white"
          >
            <div className="p-5 space-y-4">
              {/* Full Details Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Event Details
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Event ID:</span>
                      <span className="text-xs font-mono text-gray-700">{log.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Type:</span>
                      <span className="text-xs font-medium">{log.event_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Date:</span>
                      <span className="text-xs">{formattedDate.full}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Time:</span>
                      <span className="text-xs">{formattedDate.time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project Details
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Project ID:</span>
                      <span className="text-xs font-mono text-gray-700">{log.project}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Name:</span>
                      <span className="text-xs font-medium">{log.project_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Code:</span>
                      <span className="text-xs">{log.project_code}</span>
                    </div>
                    {log.company_name && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Company:</span>
                        <span className="text-xs">{log.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LogCard;