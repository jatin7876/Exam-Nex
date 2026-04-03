import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  Calendar, 
  Download,
  BrainCircuit,
  Award,
  AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Result } from '../models';

const AnalyticsPage = () => {
  const { user, isAuthReady } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const fetchAnalytics = async () => {
      try {
        const resultsQuery = query(
          collection(db, 'results'),
          where('studentId', '==', user.id),
          orderBy('submittedAt', 'asc')
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsList = resultsSnapshot.docs.map(doc => doc.data() as Result);

        if (resultsList.length === 0) {
          setAnalytics({
            totalExams: 0,
            avgScore: 0,
            passRate: 0,
            bestScore: 0,
            history: []
          });
          return;
        }

        const totalExams = resultsList.length;
        const avgScore = resultsList.reduce((acc, r) => acc + r.percentage, 0) / totalExams;
        const passRate = (resultsList.filter(r => r.passStatus).length / totalExams) * 100;
        const bestScore = Math.max(...resultsList.map(r => r.percentage));

        setAnalytics({
          totalExams,
          avgScore,
          passRate,
          bestScore,
          history: resultsList.map(r => ({
            date: r.submittedAt,
            score: r.percentage
          }))
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'results/analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user, isAuthReady]);

  const radarData = [
    { subject: 'Math', A: 80, fullMark: 100 },
    { subject: 'Science', A: 90, fullMark: 100 },
    { subject: 'History', A: 70, fullMark: 100 },
    { subject: 'CS', A: 95, fullMark: 100 },
    { subject: 'English', A: 85, fullMark: 100 },
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
          <h1 className="text-3xl font-bold font-heading">Performance Analytics</h1>
          <p className="text-cream/50">Deep dive into your learning progress and exam results.</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Exams', value: analytics?.totalExams || 0, icon: Calendar, color: 'text-blue-400' },
          { label: 'Average Score', value: `${Math.round(analytics?.avgScore || 0)}%`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Pass Rate', value: `${Math.round(analytics?.passRate || 0)}%`, icon: Award, color: 'text-purple-400' },
          { label: 'Best Score', value: `${Math.round(analytics?.bestScore || 0)}%`, icon: Target, color: 'text-orange-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl border-white/5"
          >
            <div className={cn("p-3 rounded-xl bg-white/5 w-fit mb-4", stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-cream/40 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Trend */}
        <div className="glass p-8 rounded-3xl border-white/5">
          <h3 className="text-xl font-bold mb-8 flex items-center">
            <BarChart3 className="mr-2 text-accent" size={20} />
            Performance Trend
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.history || []}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E85D26" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#E85D26" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff40" 
                  fontSize={12} 
                  tickFormatter={(val) => formatDate(val)}
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #ffffff20', borderRadius: '12px' }}
                  itemStyle={{ color: '#E85D26' }}
                  labelFormatter={(val) => formatDate(val)}
                />
                <Area type="monotone" dataKey="score" stroke="#E85D26" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Radar */}
        <div className="glass p-8 rounded-3xl border-white/5">
          <h3 className="text-xl font-bold mb-8 flex items-center">
            <BrainCircuit className="mr-2 text-secondary" size={20} />
            Subject Proficiency
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" stroke="#ffffff40" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ffffff20" />
                <Radar
                  name="Proficiency"
                  dataKey="A"
                  stroke="#F5A623"
                  fill="#F5A623"
                  fillOpacity={0.4}
                />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #ffffff20', borderRadius: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl border-white/5 flex items-start space-x-6">
          <div className="p-4 rounded-2xl bg-green-400/10 text-green-400">
            <Zap size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Strongest Subject</h3>
            <p className="text-3xl font-bold text-green-400 mb-2">Computer Science</p>
            <p className="text-cream/40">You consistently score above 90% in this subject. Great job!</p>
          </div>
        </div>
        <div className="glass p-8 rounded-3xl border-white/5 flex items-start space-x-6">
          <div className="p-4 rounded-2xl bg-red-400/10 text-red-400">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Needs Improvement</h3>
            <p className="text-3xl font-bold text-red-400 mb-2">History</p>
            <p className="text-cream/40">Your average score is 68%. Consider spending more time on this.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
