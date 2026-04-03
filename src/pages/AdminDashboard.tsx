import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  PlusCircle, 
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Exam, User, Result } from '../models';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const examsSnapshot = await getDocs(collection(db, 'exams'));
        const studentsSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const resultsSnapshot = await getDocs(collection(db, 'results'));
        
        const resultsList = resultsSnapshot.docs.map(doc => doc.data() as Result);
        const avgScore = resultsList.length > 0 
          ? resultsList.reduce((acc, r) => acc + r.percentage, 0) / resultsList.length 
          : 0;
        const passRate = resultsList.length > 0 
          ? (resultsList.filter(r => r.passStatus).length / resultsList.length) * 100 
          : 0;

        setStats({
          totalExams: examsSnapshot.size,
          totalStudents: studentsSnapshot.size,
          totalResults: resultsSnapshot.size,
          avgScore,
          passRate
        });

        // Fetch recent exams
        const recentExamsQuery = query(collection(db, 'exams'), orderBy('scheduledDate', 'desc'), limit(5));
        const recentExamsSnapshot = await getDocs(recentExamsQuery);
        setRecentExams(recentExamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));

      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'admin/stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', attempts: 45 },
    { name: 'Tue', attempts: 52 },
    { name: 'Wed', attempts: 38 },
    { name: 'Thu', attempts: 65 },
    { name: 'Fri', attempts: 48 },
    { name: 'Sat', attempts: 25 },
    { name: 'Sun', attempts: 32 },
  ];

  const statCards = [
    { title: 'Total Exams', value: stats?.totalExams || 0, icon: BookOpen, color: 'text-blue-400', trend: '+12%' },
    { title: 'Active Students', value: stats?.totalStudents || 0, icon: Users, color: 'text-purple-400', trend: '+5%' },
    { title: 'Pass Rate', value: `${Math.round(stats?.passRate || 0)}%`, icon: CheckCircle2, color: 'text-green-400', trend: '+2%' },
    { title: 'Avg Score', value: `${Math.round(stats?.avgScore || 0)}%`, icon: TrendingUp, color: 'text-orange-400', trend: '-1%' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 glass rounded-2xl"></div>)}
    </div>
    <div className="h-96 glass rounded-2xl"></div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading">Admin Dashboard</h1>
          <p className="text-cream/50">Overview of platform performance and activity.</p>
        </div>
        <div className="flex space-x-4">
          <Link to="/admin/create-exam" className="btn-primary flex items-center space-x-2">
            <PlusCircle size={20} />
            <span>Create Exam</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border-white/5 hover:border-accent/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
                <stat.icon size={24} />
              </div>
              <div className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                stat.trend.startsWith('+') ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
              )}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                {stat.trend}
              </div>
            </div>
            <h3 className="text-cream/50 text-sm font-medium">{stat.title}</h3>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-2xl border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <Clock className="mr-2 text-accent" size={20} />
            Weekly Exam Attempts
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#E85D26' }}
                />
                <Bar dataKey="attempts" fill="#E85D26" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <TrendingUp className="mr-2 text-secondary" size={20} />
            Performance Trends
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#F5A623' }}
                />
                <Area type="monotone" dataKey="attempts" stroke="#F5A623" fillOpacity={1} fill="url(#colorAttempts)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass rounded-2xl border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-bold">Recent Exams</h3>
          <Link to="/admin/exams" className="text-accent hover:underline text-sm font-semibold">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-cream/40 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Exam Name</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentExams.length > 0 ? recentExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent mr-3">
                        <FileText size={16} />
                      </div>
                      <span className="font-semibold">{exam.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-cream/60">{exam.subject}</td>
                  <td className="px-6 py-4 text-cream/60">{formatDate(exam.scheduledDate)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      exam.activeStatus ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                    )}>
                      {exam.activeStatus ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/admin/exams/${exam.id}`} className="text-cream/40 hover:text-accent transition-colors">
                      <ArrowUpRight size={18} />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-cream/40">No exams found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
