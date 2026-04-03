import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Bookmark, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { Question } from '../models';

const QuestionBankPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ subject: '', difficulty: '' });
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const qSnapshot = await getDocs(collection(db, 'questions'));
        setQuestions(qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const toggleReveal = (id: string) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
    if (!bookmarked[id]) toast.success('Question bookmarked!');
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.questionText.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filter.subject === '' || q.subject === filter.subject;
    const matchesDifficulty = filter.difficulty === '' || q.difficulty === filter.difficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Question Bank</h1>
          <p className="text-cream/50">Practice with a vast collection of curated questions.</p>
        </div>
        <div className="flex items-center space-x-3 glass p-1 rounded-xl">
          <div className="flex items-center px-4 py-2 bg-accent text-white rounded-lg font-bold text-sm">
            <Database size={16} className="mr-2" />
            {filteredQuestions.length} Questions
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border-white/5 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={20} />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-cream/60"
            onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
          >
            <option value="">All Subjects</option>
            <option value="CS">Computer Science</option>
            <option value="Math">Mathematics</option>
            <option value="Science">Science</option>
          </select>
          <select 
            className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-cream/60"
            onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
          >
            <option value="">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredQuestions.length > 0 ? filteredQuestions.map((q, i) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-3xl border-white/5 hover:border-accent/20 transition-all relative group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase">{q.subject}</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  q.difficulty === 'easy' ? 'bg-green-400/10 text-green-400' :
                  q.difficulty === 'medium' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'
                )}>
                  {q.difficulty}
                </span>
              </div>
              <button 
                onClick={() => toggleBookmark(q.id!)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  bookmarked[q.id!] ? "bg-accent text-white" : "bg-white/5 text-cream/40 hover:bg-white/10"
                )}
              >
                <Bookmark size={20} fill={bookmarked[q.id!] ? "currentColor" : "none"} />
              </button>
            </div>

            <h3 className="text-xl font-bold mb-8 leading-tight">{q.questionText}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {q.options.map((opt: string, idx: number) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-4 rounded-xl border flex items-center space-x-4 transition-all",
                    revealedAnswers[q.id!] && idx === q.correctAnswerIndex 
                      ? "bg-green-400/10 border-green-400/50 text-green-400" 
                      : "bg-white/5 border-white/5"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium">{opt}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/5">
              <button
                onClick={() => toggleReveal(q.id!)}
                className="flex items-center space-x-2 text-accent font-bold hover:underline"
              >
                {revealedAnswers[q.id!] ? (
                  <><EyeOff size={18} /> <span>Hide Answer</span></>
                ) : (
                  <><Eye size={18} /> <span>Reveal Answer</span></>
                )}
              </button>
              <div className="text-cream/20 text-sm font-medium">ID: {q.id?.slice(-6)}</div>
            </div>
          </motion.div>
        )) : (
          <div className="glass p-20 rounded-3xl border-white/5 text-center">
            <p className="text-cream/40">No questions found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 pt-8">
        <button className="p-3 glass rounded-xl text-cream/40 hover:text-accent disabled:opacity-30"><ChevronLeft size={20} /></button>
        <div className="flex space-x-2">
          {[1].map(p => (
            <button key={p} className={cn(
              "w-10 h-10 rounded-xl font-bold transition-all",
              p === 1 ? "bg-accent text-white" : "glass text-cream/40 hover:bg-white/10"
            )}>
              {p}
            </button>
          ))}
        </div>
        <button className="p-3 glass rounded-xl text-cream/40 hover:text-accent"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
};

export default QuestionBankPage;
