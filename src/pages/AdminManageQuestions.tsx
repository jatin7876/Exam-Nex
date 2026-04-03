import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  PlusCircle, 
  BrainCircuit, 
  Upload, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Question, Exam } from '../models';

const AdminManageQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [aiForm, setAiForm] = useState({ subject: '', topic: '', difficulty: 'medium', count: 5 });
  const [manualForm, setManualForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    subject: '',
    difficulty: 'medium',
    linkedExam: ''
  });
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    fetchQuestions();
    fetchExams();
  }, []);

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

  const fetchExams = async () => {
    try {
      const eSnapshot = await getDocs(collection(db, 'exams'));
      setExams(eSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
    if (!apiKey) {
      toast.error('AI generation requires an API key.');
      return;
    }
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${aiForm.count} multiple choice questions for subject: ${aiForm.subject}, topic: ${aiForm.topic}, difficulty: ${aiForm.difficulty}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswerIndex: { type: Type.INTEGER },
                subject: { type: Type.STRING },
                difficulty: { type: Type.STRING }
              },
              required: ["questionText", "options", "correctAnswerIndex", "subject", "difficulty"]
            }
          }
        }
      });

      const generatedQuestions = JSON.parse(response.text);
      
      // Save to Firestore
      const batchPromises = generatedQuestions.map((q: any) => addDoc(collection(db, 'questions'), q));
      await Promise.all(batchPromises);

      toast.success('AI Questions generated and saved!');
      setShowAIModal(false);
      fetchQuestions();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { linkedExam, ...qData } = manualForm;
      const docRef = await addDoc(collection(db, 'questions'), qData);
      
      if (linkedExam) {
        await updateDoc(doc(db, 'exams', linkedExam), {
          questions: arrayUnion(docRef.id)
        });
      }

      toast.success('Question added successfully!');
      setShowManualModal(false);
      setManualForm({
        questionText: '',
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        subject: '',
        difficulty: 'medium',
        linkedExam: ''
      });
      fetchQuestions();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      toast.success('Question deleted');
      fetchQuestions();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `questions/${id}`);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      try {
        const lines = csvData.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        const dataRows = lines.slice(1);

        const batchPromises = dataRows.map(row => {
          const values = row.split(',');
          const q: any = {
            questionText: values[0],
            options: [values[1], values[2], values[3], values[4]],
            correctAnswerIndex: parseInt(values[5]),
            subject: values[6],
            difficulty: values[7] || 'medium'
          };
          return addDoc(collection(db, 'questions'), q);
        });

        await Promise.all(batchPromises);
        toast.success('Bulk questions uploaded successfully!');
        setShowBulkModal(false);
        fetchQuestions();
      } catch (err) {
        toast.error('Failed to upload CSV');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">Manage Questions</h1>
          <p className="text-cream/50">Create, generate, or upload questions for your exams.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowAIModal(true)} className="glass px-4 py-2 rounded-xl flex items-center space-x-2 text-accent hover:bg-accent/10 transition-all">
            <BrainCircuit size={20} />
            <span className="font-bold">AI Generate</span>
          </button>
          <button onClick={() => setShowBulkModal(true)} className="glass px-4 py-2 rounded-xl flex items-center space-x-2 text-secondary hover:bg-secondary/10 transition-all">
            <Upload size={20} />
            <span className="font-bold">Bulk Upload</span>
          </button>
          <button onClick={() => setShowManualModal(true)} className="btn-primary flex items-center space-x-2">
            <PlusCircle size={20} />
            <span className="font-bold">Add Question</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-4 rounded-2xl border-white/5 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={20} />
          <input
            type="text"
            placeholder="Search questions..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-cream/60">
            <option value="">All Subjects</option>
          </select>
          <select className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-cream/60">
            <option value="">All Difficulty</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="glass rounded-3xl border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-cream/40 text-xs uppercase">
              <tr>
                <th className="px-8 py-5 font-bold">Question Text</th>
                <th className="px-8 py-5 font-bold">Subject</th>
                <th className="px-8 py-5 font-bold">Difficulty</th>
                <th className="px-8 py-5 font-bold">Correct Ans</th>
                <th className="px-8 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {questions.length > 0 ? questions.map((q) => (
                <tr key={q.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-bold line-clamp-1 max-w-md">{q.questionText}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase">{q.subject}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase",
                      q.difficulty === 'easy' ? 'bg-green-400/10 text-green-400' :
                      q.difficulty === 'medium' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'
                    )}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-8 h-8 rounded-lg bg-green-400/10 text-green-400 flex items-center justify-center font-bold">
                      {String.fromCharCode(65 + q.correctAnswerIndex)}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button className="p-2 text-cream/40 hover:text-accent transition-colors"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(q.id!)} className="p-2 text-cream/40 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-cream/40">
                    No questions found. Add some to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAIModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative glass p-8 rounded-3xl border-white/10 max-w-md w-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center"><BrainCircuit className="mr-2 text-accent" /> AI Question Generator</h2>
                <button onClick={() => setShowAIModal(false)} className="text-cream/40 hover:text-white"><X /></button>
              </div>
              <form onSubmit={handleAIGenerate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase">Subject</label>
                  <input type="text" required value={aiForm.subject} onChange={e => setAiForm({ ...aiForm, subject: e.target.value })} className="w-full input-field" placeholder="e.g. Computer Science" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase">Topic</label>
                  <input type="text" required value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} className="w-full input-field" placeholder="e.g. Data Structures" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-cream/40 uppercase">Difficulty</label>
                    <select value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })} className="w-full input-field">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-cream/40 uppercase">Count</label>
                    <input type="number" min="1" max="20" value={aiForm.count} onChange={e => setAiForm({ ...aiForm, count: parseInt(e.target.value) })} className="w-full input-field" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-4">
                  {loading ? 'Generating...' : 'Generate Questions'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowManualModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative glass p-8 rounded-3xl border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center"><PlusCircle className="mr-2 text-accent" /> Add Question Manually</h2>
                <button onClick={() => setShowManualModal(false)} className="text-cream/40 hover:text-white"><X /></button>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-cream/40 uppercase">Question Text</label>
                  <textarea required rows={3} value={manualForm.questionText} onChange={e => setManualForm({ ...manualForm, questionText: e.target.value })} className="w-full input-field resize-none" placeholder="Enter your question here..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {manualForm.options.map((opt, i) => (
                    <div key={i} className="space-y-2">
                      <label className="text-sm font-bold text-cream/40 uppercase">Option {String.fromCharCode(65 + i)}</label>
                      <div className="flex items-center space-x-2">
                        <input type="radio" name="correct" checked={manualForm.correctAnswerIndex === i} onChange={() => setManualForm({ ...manualForm, correctAnswerIndex: i })} className="w-5 h-5 accent-accent" />
                        <input type="text" required value={opt} onChange={e => {
                          const newOptions = [...manualForm.options];
                          newOptions[i] = e.target.value;
                          setManualForm({ ...manualForm, options: newOptions });
                        }} className="w-full input-field" placeholder={`Option ${i + 1}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-cream/40 uppercase">Subject</label>
                    <input type="text" required value={manualForm.subject} onChange={e => setManualForm({ ...manualForm, subject: e.target.value })} className="w-full input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-cream/40 uppercase">Difficulty</label>
                    <select value={manualForm.difficulty} onChange={e => setManualForm({ ...manualForm, difficulty: e.target.value })} className="w-full input-field">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-cream/40 uppercase">Link to Exam</label>
                    <select value={manualForm.linkedExam} onChange={e => setManualForm({ ...manualForm, linkedExam: e.target.value })} className="w-full input-field">
                      <option value="">None</option>
                      {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-4">
                  {loading ? 'Saving...' : 'Save Question'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBulkModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative glass p-8 rounded-3xl border-white/10 max-w-md w-full text-center">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold flex items-center"><Upload className="mr-2 text-secondary" /> Bulk CSV Upload</h2>
                <button onClick={() => setShowBulkModal(false)} className="text-cream/40 hover:text-white"><X /></button>
              </div>
              <div className="space-y-6">
                <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer relative group">
                  <input type="file" accept=".csv" onChange={handleBulkUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={48} className="mx-auto mb-4 text-cream/20 group-hover:text-secondary transition-colors" />
                  <p className="font-bold">Click to upload CSV</p>
                  <p className="text-sm text-cream/40">or drag and drop file here</p>
                </div>
                <div className="text-left p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-xs font-bold text-cream/40 uppercase mb-2">CSV Template Format:</p>
                  <code className="text-[10px] text-secondary block">question,option_a,option_b,option_c,option_d,correct_ans,subject,difficulty</code>
                </div>
                <button className="w-full glass py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-white/5 transition-all">
                  <Download size={18} />
                  <span>Download Template</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManageQuestions;
