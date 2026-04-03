import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, documentId } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  Timer, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Exam, Question, Result } from '../models';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthReady } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const submitExam = useCallback(async () => {
    if (submitting || !exam || !user) return;
    setSubmitting(true);
    try {
      let score = 0;
      selectedAnswers.forEach((answerIndex, i) => {
        if (answerIndex === questions[i].correctAnswerIndex) {
          score += (exam.totalMarks / questions.length);
        }
      });

      const percentage = (score / exam.totalMarks) * 100;
      const passStatus = percentage >= exam.passingMarks;

      const resultData: Result = {
        studentId: user.id!,
        examId: id!,
        selectedAnswers,
        score,
        percentage,
        passStatus,
        timeTaken: exam.duration * 60 - timeLeft,
        submittedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'results'), resultData);
      toast.success('Exam submitted successfully!');
      navigate(`/results/${docRef.id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'results');
      setSubmitting(false);
    }
  }, [id, selectedAnswers, timeLeft, exam, questions, user, navigate, submitting]);

  useEffect(() => {
    if (!isAuthReady || !id) return;

    const fetchExamData = async () => {
      try {
        const examDoc = await getDoc(doc(db, 'exams', id));
        if (!examDoc.exists()) {
          toast.error('Exam not found');
          navigate('/dashboard');
          return;
        }
        const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
        setExam(examData);
        setTimeLeft(examData.duration * 60);
        setSelectedAnswers(new Array(examData.questions.length).fill(-1));

        // Fetch questions
        if (examData.questions.length > 0) {
          const qQuery = query(collection(db, 'questions'), where(documentId(), 'in', examData.questions));
          const qSnapshot = await getDocs(qQuery);
          const qList = qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
          
          // Maintain order as per exam.questions array
          const orderedQuestions = examData.questions.map(qid => qList.find(q => q.id === qid)!);
          setQuestions(orderedQuestions);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `exams/${id}`);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchExamData();
  }, [id, navigate, isAuthReady]);

  useEffect(() => {
    if (timeLeft <= 0 && exam && !loading) {
      submitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    if (timeLeft === 60) {
      toast('1 minute remaining!', { icon: '⚠️', style: { background: '#E85D26', color: '#fff' } });
    }

    return () => clearInterval(timer);
  }, [timeLeft, exam, submitExam, loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const getTimerColor = () => {
    if (timeLeft < 60) return 'text-red-500';
    if (timeLeft < 300) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading || !exam) return <div className="min-h-screen flex items-center justify-center bg-primary">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
  </div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((selectedAnswers.filter(a => a !== -1).length) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header */}
      <header className="glass-dark px-6 py-4 flex justify-between items-center sticky top-0 z-50 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading truncate max-w-[200px] md:max-w-md">{exam.title}</h1>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-accent"
              ></motion.div>
            </div>
          </div>
        </div>

        <div className={cn("flex items-center space-x-3 text-2xl font-bold font-mono", getTimerColor())}>
          <Timer size={24} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        <button 
          onClick={() => setShowConfirmModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Send size={18} />
          <span className="hidden md:inline">Finish Exam</span>
        </button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {currentQuestion && (
              <>
                <div className="mb-8 flex justify-between items-center">
                  <span className="px-4 py-1 rounded-full bg-accent/10 text-accent font-bold text-sm">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-cream/40 text-sm font-medium capitalize">
                    Difficulty: {currentQuestion.difficulty}
                  </span>
                </div>

                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                    {currentQuestion.questionText}
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    {currentQuestion.options.map((option: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleAnswerSelect(i)}
                        className={cn(
                          "flex items-center p-5 rounded-2xl border-2 text-left transition-all duration-300 group",
                          selectedAnswers[currentQuestionIndex] === i 
                            ? "bg-accent/10 border-accent text-white shadow-lg shadow-accent/10" 
                            : "bg-white/5 border-white/5 hover:border-white/20 text-cream/70"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center mr-4 font-bold transition-colors",
                          selectedAnswers[currentQuestionIndex] === i ? "bg-accent text-white" : "bg-white/10 text-cream/40 group-hover:bg-white/20"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="text-lg font-medium">{option}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            <div className="mt-12 flex justify-between items-center">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="flex items-center space-x-2 text-cream/60 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={24} />
                <span className="font-bold">Previous</span>
              </button>
              <button
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="flex items-center space-x-2 text-cream/60 hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="font-bold">Next</span>
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </main>

        {/* Question Navigator Sidebar */}
        <aside className="w-full md:w-80 glass-dark border-l border-white/10 p-6 overflow-y-auto">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <HelpCircle size={20} className="mr-2 text-accent" />
            Question Navigator
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {questions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentQuestionIndex(i)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300",
                  currentQuestionIndex === i ? "ring-2 ring-accent ring-offset-2 ring-offset-primary" : "",
                  selectedAnswers[i] !== -1 
                    ? "bg-accent text-white" 
                    : "bg-white/5 text-cream/40 hover:bg-white/10"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex items-center text-sm text-cream/60">
              <div className="w-3 h-3 rounded-full bg-accent mr-3"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center text-sm text-cream/60">
              <div className="w-3 h-3 rounded-full bg-white/5 mr-3"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass p-8 rounded-3xl border-white/10 max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
                <AlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-4">Finish Exam?</h2>
              <p className="text-cream/60 mb-8">
                You have answered <span className="text-white font-bold">{selectedAnswers.filter(a => a !== -1).length}</span> out of <span className="text-white font-bold">{questions.length}</span> questions. 
                Are you sure you want to submit?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={submitExam}
                  disabled={submitting}
                  className="flex-1 btn-primary py-3"
                >
                  {submitting ? 'Submitting...' : 'Yes, Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExamPage;
