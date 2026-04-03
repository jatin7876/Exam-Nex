import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  PlusCircle,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const studentLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Exams', path: '/exams', icon: BookOpen },
    { name: 'History', path: '/history', icon: History },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Question Bank', path: '/question-bank', icon: Database },
    { name: 'Profile', path: '/profile', icon: UserIcon },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Exams', path: '/admin/exams', icon: BookOpen },
    { name: 'Manage Questions', path: '/admin/questions', icon: Database },
    { name: 'Create Exam', path: '/admin/create-exam', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col md:flex-row">
      {/* Mobile Nav */}
      <div className="md:hidden glass-dark fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold font-heading text-accent">ExamNex</Link>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={cn(
              "fixed md:relative z-40 w-64 h-screen glass-dark flex flex-col transition-all duration-300",
              !isSidebarOpen && "hidden md:flex"
            )}
          >
            <div className="p-6">
              <Link to="/" className="text-2xl font-bold font-heading text-accent">ExamNex</Link>
            </div>

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300",
                    location.pathname === link.path 
                      ? "bg-accent text-white shadow-lg shadow-accent/20" 
                      : "hover:bg-white/5 text-cream/70 hover:text-cream"
                  )}
                >
                  <link.icon size={20} />
                  <span className="font-medium">{link.name}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 mt-auto border-t border-white/10">
              <div className="flex items-center space-x-3 px-4 py-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate">{user?.username}</p>
                  <p className="text-xs text-cream/50 truncate capitalize">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all duration-300"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;
