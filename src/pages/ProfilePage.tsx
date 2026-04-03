import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Hash, 
  Building2, 
  History,
  Trophy,
  BarChart3,
  Zap,
  ArrowUpRight,
  FileText,
  Award
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Result, Exam } from '../models';

const ProfilePage = () => {
  const { user, isAuthReady } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    const fetchResults = async () => {
      try {
        const resultsQuery = query(
          collection(db, 'results'),
          where('studentId', '==', user.id),
          orderBy('submittedAt', 'desc')
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsList = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Result));

        // Fetch exam titles for each result
        const resultsWithExams = await Promise.all(resultsList.map(async (res) => {
          const examDoc = await getDoc(doc(db, 'exams', res.examId));
          return {
            ...res,
            examTitle: examDoc.exists() ? (examDoc.data() as Exam).title : 'Unknown Exam'
          };
        }));

        setResults(resultsWithExams);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'results/my');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user, isAuthReady]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-64 glass rounded-3xl"></div>
    <div className="h-96 glass rounded-2xl"></div>
  </div>;

  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0;
  const avgScore = results.length > 0 ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-heading">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="glass-dark p-8 rounded-[40px] border-white/10 flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        
        <div className="relative">
          <div className="w-40 h-40 rounded-[40px] bg-accent/20 flex items-center justify-center text-accent text-6xl font-bold border-4 border-white/10 shadow-2xl">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-primary flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-6">
          <div>
            <h2 className="text-4xl font-bold font-heading mb-2">{user?.username}</h2>
            <p className="text-accent font-bold uppercase tracking-widest text-sm">{user?.role}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 text-cream/60">
              <Mail size={20} className="text-accent" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center space-x-3 text-cream/60">
              <Building2 size={20} className="text-accent" />
              <span>{user?.department || 'Not Specified'}</span>
            </div>
            <div className="flex items-center space-x-3 text-cream/60">
              <Hash size={20} className="text-accent" />
              <span>Roll: {user?.rollNumber || 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-3 text-cream/60">
              <Calendar size={20} className="text-accent" />
              <span>Joined {formatDate(user?.joinDate || new Date().toISOString())}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="glass p-6 rounded-3xl text-center">
            <p className="text-cream/40 text-xs font-bold uppercase mb-1">Rank</p>
            <p className="text-2xl font-bold">#42</p>
          </div>
          <div className="glass p-6 rounded-3xl text-center">
            <p className="text-cream/40 text-xs font-bold uppercase mb-1">Streak</p>
            <p className="text-2xl font-bold">7 🔥</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Exams', value: results.length, icon: History, color: 'text-blue-400' },
          { label: 'Best Score', value: `${Math.round(bestScore)}%`, icon: Trophy, color: 'text-secondary' },
          { label: 'Avg. Percentage', value: `${Math.round(avgScore)}%`, icon: BarChart3, color: 'text-purple-400' },
          { label: 'Certificates', value: results.filter(r => r.passStatus).length, icon: Award, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-2xl border-white/5 flex items-center space-x-4">
            <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-cream/40 text-xs font-bold uppercase">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Exam History Table */}
      <div className="glass rounded-3xl border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-2xl font-bold font-heading">Exam History</h3>
          <button className="text-accent font-bold hover:underline">Download All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-cream/40 text-xs uppercase">
              <tr>
                <th className="px-8 py-5 font-bold">Exam Name</th>
                <th className="px-8 py-5 font-bold">Date</th>
                <th className="px-8 py-5 font-bold">Score</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.length > 0 ? results.map((result) => (
                <tr key={result.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent mr-4">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold">{result.examTitle}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-cream/60">{formatDate(result.submittedAt)}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center">
                      <span className="font-bold mr-2">{Math.round(result.percentage)}%</span>
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${result.percentage}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      result.passStatus ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                    )}>
                      {result.passStatus ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link to={`/results/${result.id}`} className="text-cream/40 hover:text-accent transition-colors">
                      <ArrowUpRight size={20} />
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-cream/40">
                    No exam history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
