




import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Send, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText
} from "lucide-react";

const DailyLogForm = ({ onSubmit, onCancel, loading }) => {
  const [status, setStatus] = useState("WORKED");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (status === "NOT_WORKED" && !reason.trim()) {
      alert("Please provide a reason for not working");
      return;
    }

    onSubmit({
      status,
      reason: status === "NOT_WORKED" ? reason : null,
      description,
      date,
      type: "MANUAL_LOG"
    });
  };

  const getStatusIcon = () => {
    switch(status) {
      case "WORKED": return <CheckCircle className="text-green-500" size={20} />;
      case "NOT_WORKED": return <XCircle className="text-red-500" size={20} />;
      case "DELAYED": return <Clock className="text-yellow-500" size={20} />;
      case "COMPLETED": return <CheckCircle className="text-green-500" size={20} />;
      default: return <FileText className="text-gray-500" size={20} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          {getStatusIcon()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Daily Work Log</h3>
          <p className="text-sm text-gray-500">Record your daily progress</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: "WORKED", label: "Worked", icon: CheckCircle, color: "green" },
              { value: "NOT_WORKED", label: "Not Worked", icon: XCircle, color: "red" },
              { value: "DELAYED", label: "Delayed", icon: Clock, color: "yellow" },
              { value: "COMPLETED", label: "Completed", icon: CheckCircle, color: "green" }
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = status === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Icon size={16} className={isSelected ? `text-${option.color}-500` : ''} />
                  <span className="text-sm">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason (only for NOT_WORKED) */}
        {status === "NOT_WORKED" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for not working <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <AlertCircle size={16} className="absolute left-3 top-3 text-red-400" />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you couldn't work today..."
                rows={2}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                required={status === "NOT_WORKED"}
              />
            </div>
          </motion.div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description / Notes
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on today?"
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Log
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default DailyLogForm;