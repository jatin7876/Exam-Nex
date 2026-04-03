import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, addDoc, getDocs, query, where, deleteDoc, arrayRemove } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Trash2, 
  FileText, 
  Clock, 
  Target, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Exam, Question } from '../models';
import toast from 'react-hot-toast';
import { cn, formatDate } from '../lib/utils';
import { GoogleGenAI, Type } from "@google/genai";

const AdminExamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    subject: '',
    difficulty: 'medium',
    linkedExam: id
  });

  const fetchData = async () => {
    if (!id) return;
    try {
      const examDoc = await getDoc(doc(db, 'exams', id));
      if (examDoc.exists()) {
        const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
        setExam(examData);
        setNewQuestion(prev => ({ ...prev, subject: examData.subject, difficulty: examData.difficulty }));
        
        // Fetch questions for this exam
        const qQuery = query(collection(db, 'questions'), where('linkedExam', '==', id));
        const qSnapshot = await getDocs(qQuery);
        setQuestions(qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
      } else {
        toast.error('Exam not found');
        navigate('/admin');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `exams/${id}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, navigate]);

  const handleAddManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !exam) return;
    setLoading(true);
    try {
      const qRef = await addDoc(collection(db, 'questions'), {
        ...newQuestion,
        linkedExam: id,
        createdAt: new Date().toISOString()
      });
      
      await updateDoc(doc(db, 'exams', id), {
        questions: arrayUnion(qRef.id)
      });
      
      setQuestions([...questions, { id: qRef.id, ...newQuestion } as Question]);
      setIsAddingQuestion(false);
      setNewQuestion({
        ...newQuestion,
        questionText: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0
      });
      toast.success('Question added successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'questions');
    } finally {
      setLoading(false);
    }
  };

  const generateAIQuestions = async () => {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    if (!exam || !apiKey) {
      toast.error('AI generation requires an API key and exam details.');
      return;
    }
    
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 multiple choice questions for an exam titled "${exam.title}" on the subject of "${exam.subject}". 
        The difficulty should be "${exam.difficulty}". 
        Return the result as a JSON array of objects with the following structure:
        {
          "questionText": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswerIndex": number (0-3)
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  minItems: 4,
                  maxItems: 4
                },
                correctAnswerIndex: { type: Type.INTEGER }
              },
              required: ["questionText", "options", "correctAnswerIndex"]
            }
          }
        }
      });

      const generatedQuestions = JSON.parse(response.text);
      
      // Save all generated questions to Firestore
      const addedQuestions: Question[] = [];
      for (const q of generatedQuestions) {
        const qData = {
          ...q,
          subject: exam.subject,
          difficulty: exam.difficulty,
          linkedExam: id,
          createdAt: new Date().toISOString()
        };
        const qRef = await addDoc(collection(db, 'questions'), qData);
        await updateDoc(doc(db, 'exams', id!), {
          questions: arrayUnion(qRef.id)
        });
        addedQuestions.push({ id: qRef.id, ...qData });
      }
      
      setQuestions([...questions, ...addedQuestions]);
      toast.success(`Successfully generated ${addedQuestions.length} questions using AI!`);
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      toast.error('Failed to generate questions with AI.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!id || !window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      await updateDoc(doc(db, 'exams', id), {
        questions: arrayRemove(questionId)
      });
      toast.success('Question deleted');
      fetchData();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/${questionId}`);
    }
  };

  if (loading && !exam) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-accent" size={48} />
    </div>
  );

  if (!exam) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/admin')} className="p-2 glass rounded-xl text-cream/40 hover:text-accent transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold font-heading">{exam.title}</h1>
            <p className="text-cream/50">{exam.subject} • {exam.difficulty} • {exam.duration} mins</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsAddingQuestion(true)}
            className="btn-secondary flex items-center space-x-2 px-6"
          >
            <Plus size={18} />
            <span>Add Question</span>
          </button>
          <button 
            onClick={generateAIQuestions}
            disabled={isGeneratingAI}
            className="btn-primary flex items-center space-x-2 px-6 bg-gradient-to-r from-accent to-secondary"
          >
            {isGeneratingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {/* Exam Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border-white/5">
          <div className="flex items-center space-x-3 text-cream/40 mb-2">
            <FileText size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Questions</span>
          </div>
          <p className="text-2xl font-bold">{questions.length}</p>
        </div>
        <div className="glass p-6 rounded-2xl border-white/5">
          <div className="flex items-center space-x-3 text-cream/40 mb-2">
            <Clock size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Duration</span>
          </div>
          <p className="text-2xl font-bold">{exam.duration}m</p>
        </div>
        <div className="glass p-6 rounded-2xl border-white/5">
          <div className="flex items-center space-x-3 text-cream/40 mb-2">
            <Target size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Marks</span>
          </div>
          <p className="text-2xl font-bold">{exam.totalMarks}</p>
        </div>
        <div className="glass p-6 rounded-2xl border-white/5">
          <div className="flex items-center space-x-3 text-cream/40 mb-2">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Passing Marks</span>
          </div>
          <p className="text-2xl font-bold">{exam.passingMarks}</p>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold flex items-center">
          Questions
          <span className="ml-3 px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
            {questions.length}
          </span>
        </h2>

        {questions.length === 0 ? (
          <div className="glass p-12 rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-white/5 text-cream/20">
              <AlertCircle size={48} />
            </div>
            <div>
              <h3 className="text-lg font-bold">No questions added yet</h3>
              <p className="text-cream/40 max-w-xs mx-auto">Start by adding questions manually or use our AI generator to create them instantly.</p>
            </div>
            <div className="flex space-x-4 pt-4">
              <button onClick={() => setIsAddingQuestion(true)} className="btn-secondary px-6">Manual Add</button>
              <button onClick={generateAIQuestions} className="btn-primary px-6">AI Generate</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q, idx) => (
              <motion.div 
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass p-6 rounded-2xl border-white/5 group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-accent uppercase tracking-widest">Question {idx + 1}</span>
                  <button 
                    onClick={() => handleDeleteQuestion(q.id!)}
                    className="p-2 text-cream/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-lg font-medium mb-6">{q.questionText}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-4 rounded-xl border text-sm transition-all",
                        i === q.correctAnswerIndex 
                          ? "bg-green-400/10 border-green-400/30 text-green-400" 
                          : "bg-white/5 border-white/5 text-cream/70"
                      )}
                    >
                      <span className="font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Question Modal */}
      <AnimatePresence>
        {isAddingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingQuestion(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass p-8 rounded-3xl border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Add New Question</h2>
                <button onClick={() => setIsAddingQuestion(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddManualQuestion} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Question Text</label>
                  <textarea
                    required
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                    className="w-full input-field resize-none"
                    rows={3}
                    placeholder="Enter your question here..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Options</label>
                  {newQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div 
                        onClick={() => setNewQuestion({ ...newQuestion, correctAnswerIndex: i })}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all border-2",
                          newQuestion.correctAnswerIndex === i 
                            ? "bg-accent border-accent text-white" 
                            : "border-white/10 text-cream/20 hover:border-accent/50"
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[i] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                        className="flex-1 input-field"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuestion(false)}
                    className="px-6 py-2 rounded-xl hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-8 py-2 flex items-center space-x-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Save Question</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminExamDetails;
