import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Trophy,
  Calendar,
  Zap,
  BarChart3,
  User as UserIcon,
  Search,
  Filter,
  History,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';
import { Exam, Result } from '../models';

const StudentDashboard = () => {
  const { user, isAuthReady } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const fetchData = async () => {
      try {
        // Fetch active exams
        const examsQuery = query(
          collection(db, 'exams'), 
          where('activeStatus', '==', true),
          orderBy('scheduledDate', 'asc')
        );
        const examsSnapshot = await getDocs(examsQuery);
        const examsList = examsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
        setExams(examsList);

        // Fetch user results for analytics
        const resultsQuery = query(
          collection(db, 'results'),
          where('studentId', '==', user.id),
          orderBy('submittedAt', 'desc')
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsList = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));

        // Calculate analytics
        const totalExams = resultsList.length;
        const avgScore = totalExams > 0 
          ? resultsList.reduce((acc, r) => acc + r.percentage, 0) / totalExams 
          : 0;
        const passRate = totalExams > 0 
          ? (resultsList.filter(r => r.passStatus).length / totalExams) * 100 
          : 0;
        
        setAnalytics({
          totalExams,
          avgScore,
          passRate,
          history: resultsList.map(r => ({
            date: r.submittedAt,
            score: r.percentage,
            exam: r.examId // In a real app, you'd fetch the exam title or denormalize it
          }))
        });

      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'exams/results');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isAuthReady]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-48 glass rounded-3xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1,2,3].map(i => <div key={i} className="h-32 glass rounded-2xl"></div>)}
    </div>
    <div className="h-96 glass rounded-2xl"></div>
  </div>;

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass-dark p-8 rounded-3xl border-white/10 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">
              Welcome back, <span className="text-accent">{user?.username}</span>! 👋
            </h1>
            <p className="text-cream/60 text-lg">
              You have <span className="text-white font-bold">{exams.length}</span> upcoming exams this week.
            </p>
          </div>
          <Link to="/exams" className="btn-primary flex items-center space-x-2 px-8 py-4">
            <span>View All Exams</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border-white/5 flex items-center space-x-4">
          <div className="p-4 rounded-xl bg-blue-400/10 text-blue-400">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-cream/40 text-sm font-medium">Exams Taken</p>
            <p className="text-2xl font-bold">{analytics?.totalExams || 0}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border-white/5 flex items-center space-x-4">
          <div className="p-4 rounded-xl bg-green-400/10 text-green-400">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-cream/40 text-sm font-medium">Avg. Score</p>
            <p className="text-2xl font-bold">{Math.round(analytics?.avgScore || 0)}%</p>
          </div>
        </div>
        <div className="glass p-6 rounded-2xl border-white/5 flex items-center space-x-4">
          <div className="p-4 rounded-xl bg-orange-400/10 text-orange-400">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-cream/40 text-sm font-medium">Pass Rate</p>
            <p className="text-2xl font-bold">{Math.round(analytics?.passRate || 0)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Exams */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-heading">Upcoming Exams</h2>
            <div className="flex space-x-2">
              <button className="p-2 glass rounded-lg text-cream/60 hover:text-accent transition-colors"><Search size={18} /></button>
              <button className="p-2 glass rounded-lg text-cream/60 hover:text-accent transition-colors"><Filter size={18} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {exams.length > 0 ? exams.map((exam, i) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-2xl border-white/5 hover:border-accent/30 transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-accent transition-colors">{exam.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-cream/40 mt-1">
                        <span className="flex items-center"><Calendar size={14} className="mr-1" /> {formatDate(exam.scheduledDate)}</span>
                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {exam.duration} Mins</span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to={`/exam/${exam.id}`}
                    className="btn-primary text-sm px-6 py-2"
                  >
                    Take Exam
                  </Link>
                </div>
              </motion.div>
            )) : (
              <div className="glass p-12 rounded-2xl border-white/5 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-cream/20">
                  <BookOpen size={32} />
                </div>
                <p className="text-cream/40">No upcoming exams found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Snapshot */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-heading">Quick Links</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { name: 'My Profile', icon: UserIcon, path: '/profile', color: 'text-blue-400' },
              { name: 'Detailed Analytics', icon: BarChart3, path: '/analytics', color: 'text-purple-400' },
              { name: 'Question Bank', icon: BookOpen, path: '/question-bank', color: 'text-green-400' },
              { name: 'Exam History', icon: History, path: '/history', color: 'text-orange-400' },
            ].map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className="glass p-5 rounded-2xl border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className={cn("p-3 rounded-xl bg-white/5", link.color)}>
                    <link.icon size={20} />
                  </div>
                  <span className="font-semibold">{link.name}</span>
                </div>
                <ArrowRight size={18} className="text-cream/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>

          <div className="glass p-6 rounded-2xl border-white/5 mt-8">
            <h3 className="font-bold mb-4 flex items-center">
              <Zap size={18} className="mr-2 text-accent" />
              Recent Results
            </h3>
            <div className="space-y-4">
              {analytics?.history?.slice(0, 3).map((h: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">Exam Result</p>
                    <p className="text-cream/40 text-xs">{formatDate(h.date)}</p>
                  </div>
                  <span className={cn(
                    "font-bold px-2 py-1 rounded-lg",
                    h.score >= 40 ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                  )}>
                    {Math.round(h.score)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
