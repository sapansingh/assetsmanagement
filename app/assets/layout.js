'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  FileText,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  Moon,
  Sun,
  Zap,
  TrendingUp,
  Shield,
  Database
} from 'lucide-react';

// Define all menu items without active state
const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/assets/dashboard', allowedRoles: ['admin', 'manager', 'staff'] },
  { icon: Users, label: 'Users', href: '/assets/users', allowedRoles: ['admin'] },
  { icon: Package, label: 'Assets', href: '/assets', allowedRoles: ['admin', 'manager', 'staff'] },
  { icon: Package, label: 'Stock', href: '/assets/stock', allowedRoles: ['admin', 'manager','staff'] },
  // { icon: FileText, label: 'Reports', href: '/reports', allowedRoles: ['admin', 'manager'] },
  // { icon: Shield, label: 'Security', href: '/security', allowedRoles: ['admin'] },
  // { icon: Settings, label: 'Settings', href: '/settings', allowedRoles: ['admin', 'manager'] },
];

export default function AssetsLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userInitials, setUserInitials] = useState('U');
  const [userRole, setUserRole] = useState('');

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUser = localStorage.getItem('assetflow_user');
        const token = localStorage.getItem('assetflow_token');
        
        if (storedUser && token) {
          const user = JSON.parse(storedUser);
          setUserData(user);
          setUserRole(user.role || '');
          
          // Generate initials from full name
          if (user.fullName) {
            const initials = user.fullName
              .split(' ')
              .map(word => word.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2);
            setUserInitials(initials);
          } else if (user.username) {
            setUserInitials(user.username.charAt(0).toUpperCase());
          }
        } else {
          // If no user data, redirect to login
          toast.error('Session expired. Please login again.');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Error loading user data');
      }
    };

    loadUserData();
  }, [router]);

  // Check if menu item is allowed for user role
  const isMenuItemAllowed = (allowedRoles) => {
    if (!userRole || !allowedRoles) return false;
    return allowedRoles.includes(userRole);
  };

  // Get filtered menu items based on user role
  const filteredMenuItems = menuItems.filter(item => isMenuItemAllowed(item.allowedRoles));

  // Check which menu item should be active based on current route
  const getActiveItem = (itemHref) => {
    // Exact match for dashboard
    if (pathname === '/assets/dashboard' && itemHref === '/assets/dashboard') {
      return true;
    }
    if (pathname === '/assets/users' && itemHref === '/assets/users') {
      return true;
    }
    // Check for assets routes
    if (itemHref === '/assets' && pathname.startsWith('/assets')) {
      // Don't mark dashboard as active if we're on other asset pages
      if (pathname === '/assets/dashboard') return false;
      if (pathname === '/assets/users') return false;
       if (pathname === '/assets/stock') return false;
      return true;
    }
    
    // For other routes, check exact match
    return pathname === itemHref || pathname.startsWith(itemHref + '/');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Store theme preference in localStorage
    localStorage.setItem('assetflow_theme', !darkMode ? 'dark' : 'light');
  };

  // Logout function
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('assetflow_user');
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_role');
    localStorage.removeItem('assetflow_username');
    
    toast.success('Logged out successfully');
    
    // Redirect to login page
    router.push('/');
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'from-red-500 to-rose-600';
      case 'manager': return 'from-blue-500 to-cyan-600';
      case 'staff': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  // Get role display text
  const getRoleDisplayText = (role) => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'staff': return 'Staff';
      default: return 'User';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-72' : 'w-20'
          } hidden lg:flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-300 relative overflow-hidden`}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          </div>

          {/* Logo Section */}
          <div className="relative p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Zap className="w-6 h-6" />
                </div>
                {sidebarOpen && (
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">AssetFlow</h1>
                    <p className="text-xs text-slate-400">Management Pro</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {filteredMenuItems.map((item, index) => {
                const isActive = getActiveItem(item.href);
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"></div>
                    )}
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="relative p-4 border-t border-slate-700/50">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 transition-colors cursor-pointer group">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleBadgeColor(userRole)} flex items-center justify-center font-bold text-white shadow-lg`}>
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{userData?.fullName || userData?.username || 'User'}</div>
                  <div className="text-xs text-slate-400 truncate">{getRoleDisplayText(userRole)}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors group"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleBadgeColor(userRole)} flex items-center justify-center font-bold text-white shadow-lg`}>
                  {userInitials}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors z-10"
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${!sidebarOpen && 'rotate-180'}`} />
          </button>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
              {/* Mobile Menu Content */}
              <div className="relative h-full flex flex-col">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
                </div>

                <div className="relative p-6 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight">AssetFlow</h1>
                      <p className="text-xs text-slate-400">Management Pro</p>
                    </div>
                  </div>
                  <button onClick={toggleMobileMenu}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="relative flex-1 px-4 py-6 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredMenuItems.map((item, index) => {
                      const isActive = getActiveItem(item.href);
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          onClick={toggleMobileMenu}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                <div className="relative p-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleBadgeColor(userRole)} flex items-center justify-center font-bold text-white shadow-lg`}>
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{userData?.fullName || userData?.username || 'User'}</div>
                      <div className="text-xs text-slate-400 truncate">{getRoleDisplayText(userRole)}</div>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu();
                      }}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </button>

                {/* Search Bar */}
                <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-2.5 w-96 border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assets, users, reports..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                  <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-600 rounded text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-500">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors relative group"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <Moon className="w-5 h-5 text-slate-600" />
                  )}
                </button>

                {/* Notifications */}
                <button className="relative p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                </button>

                {/* User Menu */}
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                      {userData?.fullName || userData?.username || 'User'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {userRole || 'User'}
                    </div>
                  </div>
                  <div className="relative group">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRoleBadgeColor(userRole)} flex items-center justify-center font-bold text-white shadow-lg cursor-pointer ring-2 ring-offset-2 ring-indigo-200 dark:ring-slate-700`}>
                      {userInitials}
                    </div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {userData?.fullName || userData?.username || 'User'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          {userRole || 'User'}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {userData?.email || ''}
                        </div>
                      </div>
                      <div className="p-2">
                    
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}