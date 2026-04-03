import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User as UserIcon, 
  Lock, 
  Bell, 
  Palette, 
  Trash2, 
  LogOut, 
  Shield, 
  Moon, 
  Sun,
  Camera,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const tabs = [
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: Trash2, color: 'text-red-400' },
  ];

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-heading">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-accent text-white shadow-lg shadow-accent/20" 
                  : "hover:bg-white/5 text-cream/60 hover:text-cream"
              )}
            >
              <tab.icon size={20} className={tab.color} />
              <span className="font-semibold">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 glass p-8 rounded-3xl border-white/5">
          {activeTab === 'account' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center space-x-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-accent/20 flex items-center justify-center text-accent text-4xl font-bold border-2 border-white/10">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-accent rounded-xl text-white shadow-lg hover:scale-110 transition-transform">
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Profile Picture</h3>
                  <p className="text-cream/40 text-sm">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Full Name</label>
                  <input type="text" defaultValue={user?.username} className="w-full input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Email Address</label>
                  <input type="email" defaultValue={user?.email} className="w-full input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Department</label>
                  <input type="text" defaultValue={user?.department} className="w-full input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Roll Number</label>
                  <input type="text" defaultValue={user?.rollNumber} className="w-full input-field" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button onClick={handleSave} className="btn-primary">Save Changes</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Shield className="mr-2 text-accent" size={20} />
                  Change Password
                </h3>
                <div className="space-y-4 max-w-md">
                  <input type="password" placeholder="Current Password" className="w-full input-field" />
                  <input type="password" placeholder="New Password" className="w-full input-field" />
                  <input type="password" placeholder="Confirm New Password" className="w-full input-field" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-6">
                <h3 className="text-xl font-bold flex items-center">
                  <Lock className="mr-2 text-accent" size={20} />
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between p-6 glass rounded-2xl border-white/5">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-white/5 text-cream/40">
                      <Shield size={24} />
                    </div>
                    <div>
                      <p className="font-bold">Authenticator App</p>
                      <p className="text-sm text-cream/40">Use an app like Google Authenticator</p>
                    </div>
                  </div>
                  <button className="px-6 py-2 rounded-xl border border-accent text-accent font-bold hover:bg-accent hover:text-white transition-all">
                    Enable
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button onClick={handleSave} className="btn-primary">Update Security</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold">Theme Preferences</h3>
                <div className="grid grid-cols-2 gap-6 max-w-md">
                  <button 
                    onClick={() => setIsDarkMode(false)}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all flex flex-col items-center space-y-3",
                      !isDarkMode ? "border-accent bg-accent/10" : "border-white/5 bg-white/5"
                    )}
                  >
                    <Sun size={32} className={!isDarkMode ? "text-accent" : "text-cream/40"} />
                    <span className="font-bold">Light Mode</span>
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(true)}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all flex flex-col items-center space-y-3",
                      isDarkMode ? "border-accent bg-accent/10" : "border-white/5 bg-white/5"
                    )}
                  >
                    <Moon size={32} className={isDarkMode ? "text-accent" : "text-cream/40"} />
                    <span className="font-bold">Dark Mode</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-xl font-bold">Accent Color</h3>
                <div className="flex space-x-4">
                  {['#E85D26', '#F5A623', '#3B82F6', '#10B981', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-full border-4 border-primary shadow-lg transition-transform hover:scale-125"
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {[
                { title: 'Exam Reminders', desc: 'Get notified 1 hour before an exam starts.' },
                { title: 'Result Alerts', desc: 'Instant notification when your result is published.' },
                { title: 'System Updates', desc: 'Stay informed about new features and updates.' },
                { title: 'Security Alerts', desc: 'Get notified about new login attempts.' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 glass rounded-2xl border-white/5">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-cream/40">{item.desc}</p>
                  </div>
                  <div className="w-12 h-6 bg-accent rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'danger' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="p-8 rounded-3xl bg-red-400/5 border border-red-400/20 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-red-400 mb-2">Delete Account</h3>
                  <p className="text-cream/60">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button className="px-8 py-3 bg-red-400 hover:bg-red-500 text-white font-bold rounded-xl transition-all">
                  Delete Account
                </button>
              </div>

              <div className="p-8 rounded-3xl glass border-white/5 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Logout All Devices</h3>
                  <p className="text-cream/60">This will sign you out of all other active sessions.</p>
                </div>
                <button onClick={logout} className="px-8 py-3 border border-red-400 text-red-400 font-bold rounded-xl hover:bg-red-400 hover:text-white transition-all">
                  Logout All Devices
                </button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
