import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationsModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // This will be populated from your backend later
  const [notifications] = useState([]); // Empty array for now

  // Later: Handle different notification types with navigation
  const handleNotificationClick = (notification) => {
    
    
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        title="Notifications"
        aria-label="Notifications"
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors relative"
      >
        <Bell size={20} />
        {/* Optional: Show badge if there are unread notifications */}
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Body - Notification List */}
              <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
                {notifications.length === 0 ? (
                  // Empty State - Coming Soon Message
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="text-center">
                      <Bell size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        Coming Soon!
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Notifications will appear here once available.
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Stay tuned for updates
                      </p>
                    </div>
                  </div>
                ) : (
                  // Notification List (For when you have notifications)
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {/* Notification Icon based on type */}
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              {/* You can add different icons based on notification type */}
                              <Bell size={16} className="text-blue-600 dark:text-blue-300" />
                            </div>
                          </div>
                          
                          {/* Notification Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationsModal;