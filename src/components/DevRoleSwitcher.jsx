// src/components/DevRoleSwitcher.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserRole } from '../features/auth/authSlice';
import { Shield, UserCog, User } from 'lucide-react';

const DevRoleSwitcher = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const roles = [
    { name: 'ACCOUNT', icon: Shield, color: 'purple' },
    // { name: 'ADMIN', icon: UserCog, color: 'blue' },
    { name: 'TL', icon: UserCog, color: 'blue' },
    { name: 'USER', icon: User, color: 'green' },
  ];

  const handleRoleChange = (role) => {
    dispatch(setUserRole({ role }));
    setIsOpen(false);
    // Reload the page to refresh dashboard
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all"
        title="Switch Role (Dev Only)"
      >
        <Shield size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[180px]">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">Current Role: <span className="font-semibold">{user?.role}</span></p>
          </div>
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => handleRoleChange(role.name)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 ${user?.role === role.name ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600'
                }`}
            >
              <role.icon size={16} className={`text-${role.color}-500`} />
              {role.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevRoleSwitcher;