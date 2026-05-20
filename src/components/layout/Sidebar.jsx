
import { NavLink, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { closeSidebar, toggleDesktopCollapse } from "../../features/ui/uiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  FileClock,
  ChevronLeft,
  ChevronRight,
  Settings,
  TrendingUp,
  UserCog,
  Shield,
  HardHat,
  Truck,
  Wrench,
  CheckCircle,
  Briefcase,
  Users,
  Clock,
  Settings2,
  ChartArea,
  ChartBar
} from "lucide-react";

import logo from "../../assets/aimantra.png";

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { sidebarOpen, desktopCollapsed } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      dispatch(closeSidebar());
    }
  }, [location, dispatch, isMobile]);

  const menuItems = [
    // Common for all roles
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["ACCOUNT", "USER", "TL"],
      badge: null,
      description: "Overview & Analytics",
    },

    // All Projects - For everyone to pick tasks
    {
      name: "All Projects",
      icon: FolderKanban,
      path: "/all-projects",
      roles: ["ACCOUNT", "ADMIN", "USER"],
      badge: null,
      description: "Browse all projects and pick tasks",
    },


    {
      name: "My Projects",
      icon: FolderKanban,
      path: "/tl-projects",
      roles: ["TL"],
      badge: null,
      description: "My Projects",
    },

    // {
    //   name: "Submitted Task",
    //   icon: FolderKanban,
    //   path: "/submitted-task",
    //   roles: ["TL"],
    //   badge: null,
    //   description: "Submitted Task",
    // },
    {
      name: "Project Report",
      icon: ChartArea,
      path: "/project-report",
      roles: ["TL"],
      badge: null,
      description: "Project Report",
    },

    {
      name: "Employee Report",
      icon: ChartBar,
      path: "/employee-report",
      roles: ["TL"],
      badge: null,
      description: "Employee Report",
    },
    {
      name: "Settings",
      icon: Settings2,
      path: "/settings",
      roles: ["ACCOUNT"],
      badge: null,
      description: "Settings",
    },

    // My Tasks - For users to manage picked tasks
    {
      name: "My Tasks",
      icon: CheckCircle,
      path: "/my-tasks",
      roles: ["USER"],
      badge: null,
      description: "View and manage your picked tasks",
    },

    // Work Logs - Different for User vs Admin
    // Admin sees all logs, User sees only their own logs
    {
      name: "Daily Logs",
      icon: ClipboardList,
      path: "/daily-logs",
      roles: ["ACCOUNT", "ADMIN"],
      badge: null,
      description: "All project logs",
    },
    // {
    //   name: "My Work Logs",
    //   icon: Clock,
    //   path: "/my-work-logs",
    //   roles: ["USER"],
    //   badge: null,
    //   description: "My work hours & logs",
    // },


    // User specific - My Projects
    // {
    //   name: "My Projects",
    //   icon: Briefcase,
    //   path: "/my-projects",
    //   roles: ["USER"],
    //   badge: null,
    //   description: "View my assigned projects",
    // },


    // {
    //   name: "Contractors",
    //   icon: HardHat,
    //   path: "/contractors",
    //   roles: ["ACCOUNT", "ADMIN"],
    //   badge: null,
    //   description: "Manage contractors",
    // },
    // {
    //   name: "Extensions",
    //   icon: FileClock,
    //   path: "/extensions",
    //   roles: ["ACCOUNT", "ADMIN"],
    //   badge: "pending",
    //   description: "Extension requests",
    // },
    // {
    //   name: "Equipment",
    //   icon: Wrench,
    //   path: "/equipment",
    //   roles: ["ACCOUNT", "ADMIN"],
    //   badge: null,
    //   description: "Equipment management",
    // },
    // {
    //   name: "Materials",
    //   icon: Truck,
    //   path: "/materials",
    //   roles: ["ACCOUNT", "ADMIN"],
    //   badge: null,
    //   description: "Material inventory",
    // },

    // // Account only
    // {
    //   name: "Analytics",
    //   icon: TrendingUp,
    //   path: "/analytics",
    //   roles: ["ACCOUNT"],
    //   badge: null,
    //   description: "Advanced analytics",
    // },
    // {
    //   name: "User Management",
    //   icon: UserCog,
    //   path: "/users",
    //   roles: ["ACCOUNT"],
    //   badge: null,
    //   description: "Manage users & roles",
    // },
    // {
    //   name: "Settings",
    //   icon: Settings,
    //   path: "/settings",
    //   roles: ["ACCOUNT"],
    //   badge: null,
    //   description: "System settings",
    // },
    {
      name: "Tech Support",
      icon: CheckCircle,
      path: "/ticket",
      roles: ["USER", "ACCOUNT", "ADMIN", "TL"],
      badge: null,
      description: "Tech Support & Ticketing",
    },
  ];
  console.log("User Role:", user);
  const filteredMenu = menuItems.filter((item) => item.roles.includes(user?.role));

  // Separate menu sections for better organization
  const mainMenu = filteredMenu.filter(item =>
    [
      // "Dashboard",
      "My Work Logs", "All Projects", "My Tasks", "My Projects", "Submitted Task", "Employee Report", "Project Report", "Daily Logs", "Tech Support"
      // "settings"
    ].includes(item.name)
  );

  const managementMenu = filteredMenu.filter(item =>
    ["Contractors", "Extensions", "Equipment", "Materials"].includes(item.name)
  );

  const adminMenu = filteredMenu.filter(item =>
    ["Analytics", "User Management", "Settings"].includes(item.name)
  );

  const tLMenu = filteredMenu.filter(item =>
    ["My Projects", "Submitted Task", "Tech Support"].includes(item.name)
  );

  const getBadgeColor = (badge) => {
    if (badge === "pending") return "bg-yellow-500";
    if (badge === "new") return "bg-green-500";
    if (badge === "alert") return "bg-red-500";
    return "bg-blue-500";
  };

  const getSidebarWidth = () => {
    if (isMobile) return 280;
    return desktopCollapsed ? 80 : 260;
  };

  return (
    <>
      {sidebarOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: getSidebarWidth(),
          x: isMobile ? (sidebarOpen ? 0 : -280) : 0,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`
          fixed top-0 left-0 h-full shadow-2xl z-50
          ${isMobile ? "" : "md:block"}
          overflow-hidden
          bg-gradient-to-br from-white via-indigo-50/90 to-indigo-100/95
          dark:from-gray-950 dark:via-slate-900 dark:to-slate-950
        `}
      >
        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-400 via-blue-400 to-indigo-500 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 0.1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-bl from-blue-300 to-purple-400 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 0.08, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="absolute -top-40 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-indigo-300 to-transparent blur-3xl"
          />
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.3, 0], scale: [0, 1, 0] }}
                transition={{
                  duration: 3,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 5
                }}
                className="absolute w-1 h-1 rounded-full bg-blue-400/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative h-full flex flex-col z-10">
          {/* Header with Logo */}
          <div className="relative flex items-center justify-between px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50 min-h-[70px]">
            {!desktopCollapsed || isMobile ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={logo}
                    alt="Logo"
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-blue-600 font-bold text-lg">DD</span>';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent block leading-tight">
                    Time Sheet
                  </span>
                  {/* <span className="block text-[10px] text-gray-500">Enterprise Suite</span> */}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center overflow-hidden"
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-blue-600 font-bold text-base">DD</span>';
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto overflow-x-visible scrollbar-none hover:overflow-y-auto">
            <nav className="p-2 space-y-4">
              {mainMenu.length > 0 && (
                <div className="space-y-0.5">
                  {(!desktopCollapsed || isMobile) && (
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
                      Main
                    </p>
                  )}
                  {mainMenu.map((item, index) => (
                    <MenuItem
                      key={index}
                      item={item}
                      desktopCollapsed={desktopCollapsed && !isMobile}
                      getBadgeColor={getBadgeColor}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}

              {managementMenu.length > 0 && (
                <div className="space-y-0.5">
                  {(!desktopCollapsed || isMobile) && (
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
                      Management
                    </p>
                  )}
                  {managementMenu.map((item, index) => (
                    <MenuItem
                      key={index}
                      item={item}
                      desktopCollapsed={desktopCollapsed && !isMobile}
                      getBadgeColor={getBadgeColor}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}

              {adminMenu.length > 0 && (
                <div className="space-y-0.5">
                  {(!desktopCollapsed || isMobile) && (
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
                      Administration
                    </p>
                  )}
                  {adminMenu.map((item, index) => (
                    <MenuItem
                      key={index}
                      item={item}
                      desktopCollapsed={desktopCollapsed && !isMobile}
                      getBadgeColor={getBadgeColor}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
              {/* {tLMenu.length > 0 && (
                <div className="space-y-0.5">
                  {(!desktopCollapsed || isMobile) && (
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                      Tl
                    </p>
                  )}
                  {tLMenu.map((item, index) => (
                    <MenuItem
                      key={index}
                      item={item}
                      desktopCollapsed={desktopCollapsed && !isMobile}
                      getBadgeColor={getBadgeColor}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )} */}
            </nav>
          </div>

          {/* Footer user */}
          {!desktopCollapsed || isMobile ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-slate-900/40 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                    <Shield size={8} />
                    {user?.role || "USER"}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-slate-900/40 backdrop-blur-sm flex justify-center"
            >
              <div className="relative">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* Collapse Button */}
      {!isMobile && (
        <button
          onClick={() => dispatch(toggleDesktopCollapse())}
          className="
            fixed
            top-20
            z-[60]
            w-7
            h-7
            rounded-full
            bg-white dark:bg-slate-800
            hover:bg-gray-100 dark:hover:bg-slate-700
            border border-gray-200 dark:border-gray-600
            flex items-center justify-center
            text-gray-600 dark:text-gray-300
            shadow-lg
            transition-all duration-200
            hover:scale-110
          "
          style={{
            left: desktopCollapsed ? 76 : 256,
            transform: 'translateX(-50%)',
          }}
        >
          {desktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
    </>
  );
};

const MenuItem = ({
  item,
  desktopCollapsed,
  getBadgeColor,
  isMobile,
}) => {
  const Icon = item.icon;
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 });

  const isActive =
    location.pathname === item.path ||
    (item.path !== "/" && location.pathname.startsWith(item.path));

  const shouldShowText = !desktopCollapsed || isMobile;

  const handleMouseEnter = () => {
    if (desktopCollapsed && !isMobile) {
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        setTooltipPosition({
          top: rect.top + rect.height / 2,
        });
      }
      setShowTooltip(true);
    }
  };

  return (
    <NavLink to={item.path}>
      {({ isActive: routeActive }) => (
        <div
          ref={itemRef}
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <motion.div
            whileHover={{ x: shouldShowText ? 3 : 0 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex items-center
              ${shouldShowText ? "gap-2 px-3" : "justify-center px-0"}
              py-2 rounded-lg cursor-pointer
              transition-all duration-200 group
              ${routeActive || isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/80"
              }
            `}
          >
            {shouldShowText && (routeActive || isActive) && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                transition={{ type: "spring", damping: 20 }}
              />
            )}

            <div className="relative">
              <Icon
                size={shouldShowText ? 18 : 20}
                className={`
                  transition-all duration-200
                  ${!shouldShowText ? "mx-auto" : ""}
                  group-hover:scale-110
                `}
              />

              {item.badge && (
                <span
                  className={`absolute -top-1 -right-1 w-1.5 h-1.5 ${getBadgeColor(
                    item.badge
                  )} rounded-full`}
                />
              )}
            </div>

            {shouldShowText && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 text-xs font-medium"
              >
                {item.name}
              </motion.span>
            )}
          </motion.div>

          {/* Tooltip for collapsed state */}
          <AnimatePresence>
            {desktopCollapsed && !isMobile && showTooltip && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  left: 88,
                  top: tooltipPosition.top,
                  transform: 'translateY(-50%)',
                }}
                className="px-2 py-1 
                          bg-gray-900 text-white text-xs
                          rounded-md whitespace-nowrap
                          shadow-xl z-[9999] border border-gray-700
                          pointer-events-none"
              >
                {item.name}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 
                              w-1.5 h-1.5 bg-gray-900 rotate-45 border-l border-b border-gray-700" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </NavLink>
  );
};

export default Sidebar;