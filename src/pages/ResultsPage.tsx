import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  BarChart3,
  FileText,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn, formatDate } from '../lib/utils';
import confetti from 'canvas-confetti';
import { Result, Exam } from '../models';

const ResultsPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState<Result | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchResult = async () => {
      try {
        const resultDoc = await getDoc(doc(db, 'results', id));
        if (!resultDoc.exists()) {
          setLoading(false);
          return;
        }
        const resultData = { id: resultDoc.id, ...resultDoc.data() } as Result;
        setResult(resultData);

        // Fetch exam details
        const examDoc = await getDoc(doc(db, 'exams', resultData.examId));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() } as Exam);
        }
        
        if (resultData.passStatus) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#E85D26', '#F5A623', '#FAF0E6']
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `results/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-primary">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
  </div>;

  if (!result || !exam) return <div className="text-center p-20">Result not found.</div>;

  const chartData = [
    { name: 'Correct', value: result.score },
    { name: 'Incorrect', value: exam.totalMarks - result.score },
  ];

  const COLORS = ['#E85D26', '#ffffff10'];

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Score Reveal Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-dark p-12 rounded-[40px] border-white/10 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-accent/5 to-transparent"></div>
        
        <div className="relative z-10">
          <div className="inline-block p-4 rounded-2xl bg-white/5 mb-6">
            {result.passStatus ? (
              <Trophy size={48} className="text-secondary animate-bounce" />
            ) : (
              <AlertCircle size={48} className="text-red-400" />
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-4">
            {result.passStatus ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xl text-cream/60 mb-12">
            You scored <span className="text-white font-bold">{Math.round(result.percentage)}%</span> in the <span className="text-accent">{exam.title}</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-2">
              <p className="text-cream/40 font-medium uppercase tracking-wider text-sm">Time Taken</p>
              <div className="flex items-center justify-center text-2xl font-bold">
                <Clock className="mr-2 text-accent" size={24} />
                {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
              </div>
            </div>

            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{Math.round(result.percentage)}%</span>
                <span className="text-xs text-cream/40 font-bold uppercase">Score</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-cream/40 font-medium uppercase tracking-wider text-sm">Status</p>
              <div className={cn(
                "inline-flex items-center px-6 py-2 rounded-full text-xl font-bold",
                result.passStatus ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
              )}>
                {result.passStatus ? <CheckCircle2 className="mr-2" /> : <XCircle className="mr-2" />}
                {result.passStatus ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
        <Link to="/dashboard" className="btn-primary flex items-center justify-center space-x-2 px-10 py-4">
          <ArrowRight size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <Link to={`/exam/${exam.id}`} className="glass px-10 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-white/5 transition-all">
          <RotateCcw size={20} />
          <span>Retake Exam</span>
        </Link>
        <Link to="/analytics" className="glass px-10 py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-white/5 transition-all">
          <BarChart3 size={20} />
          <span>View Analytics</span>
        </Link>
      </div>

      {/* Performance Breakdown */}
      <div className="glass rounded-[32px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-2xl font-bold font-heading">Performance Breakdown</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-cream/40">
              <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
              Correct
            </div>
            <div className="flex items-center text-sm text-cream/40">
              <div className="w-3 h-3 rounded-full bg-white/10 mr-2"></div>
              Incorrect
            </div>
          </div>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <h3 className="text-cream/40 text-sm font-bold uppercase mb-4">Subject Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{exam.subject}</span>
                    <span className="font-bold">{Math.round(result.percentage)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${result.percentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
              <h3 className="text-cream/40 text-sm font-bold uppercase mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-cream/40 text-xs mb-1">Total Marks</p>
                  <p className="text-xl font-bold">{exam.totalMarks}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-cream/40 text-xs mb-1">Your Score</p>
                  <p className="text-xl font-bold">{result.score}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-cream/40 text-xs mb-1">Passing Marks</p>
                  <p className="text-xl font-bold">{exam.passingMarks}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-cream/40 text-xs mb-1">Submission</p>
                  <p className="text-sm font-bold">{formatDate(result.submittedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
