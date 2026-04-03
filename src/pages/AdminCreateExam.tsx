import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Exam } from '../models';
import { GoogleGenAI, Type } from "@google/genai";
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';

const AdminCreateExam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    difficulty: 'medium',
    scheduledDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: name === 'duration' || name === 'totalMarks' || name === 'passingMarks' ? Number(value) : value 
    });
  };

  const handleSubmit = async (e: React.FormEvent, generateAI = false) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    if (generateAI) setIsGeneratingAI(true);
    
    try {
      const examData: Omit<Exam, 'id'> = {
        ...formData,
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        activeStatus: true,
        createdBy: user.id!,
        questions: []
      };

      const docRef = await addDoc(collection(db, 'exams'), examData);
      
      const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
      if (generateAI && apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate 5 multiple choice questions for an exam titled "${formData.title}" on the subject of "${formData.subject}". 
            The difficulty should be "${formData.difficulty}". 
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
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                    correctAnswerIndex: { type: Type.INTEGER }
                  },
                  required: ["questionText", "options", "correctAnswerIndex"]
                }
              }
            }
          });

          const generatedQuestions = JSON.parse(response.text);
          for (const q of generatedQuestions) {
            const qData = {
              ...q,
              subject: formData.subject,
              difficulty: formData.difficulty,
              linkedExam: docRef.id,
              createdAt: new Date().toISOString()
            };
            const qRef = await addDoc(collection(db, 'questions'), qData);
            await updateDoc(docRef, {
              questions: arrayUnion(qRef.id)
            });
          }
          toast.success('Exam created with AI questions!');
        } catch (aiErr) {
          console.error("AI Generation failed during creation:", aiErr);
          toast.error('Exam created, but AI question generation failed.');
        }
      } else {
        toast.success('Exam created successfully!');
      }
      
      navigate(`/admin/exams/${docRef.id}`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'exams');
    } finally {
      setLoading(false);
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 glass rounded-xl text-cream/40 hover:text-accent transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold font-heading">Create New Exam</h1>
          <p className="text-cream/50">Configure the exam details and schedule.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="glass p-8 rounded-3xl border-white/5 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Exam Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Computer Science Midterm 2026"
                value={formData.title}
                onChange={handleChange}
                className="w-full input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Briefly describe the exam scope..."
                value={formData.description}
                onChange={handleChange}
                className="w-full input-field resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                name="subject"
                required
                placeholder="e.g. Computer Science"
                value={formData.subject}
                onChange={handleChange}
                className="w-full input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider">Difficulty Level</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full input-field"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider flex items-center">
                <Clock size={14} className="mr-2" /> Duration (Mins)
              </label>
              <input
                type="number"
                name="duration"
                required
                value={formData.duration}
                onChange={handleChange}
                className="w-full input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider flex items-center">
                <Target size={14} className="mr-2" /> Total Marks
              </label>
              <input
                type="number"
                name="totalMarks"
                required
                value={formData.totalMarks}
                onChange={handleChange}
                className="w-full input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-cream/40 uppercase tracking-wider flex items-center">
                <CheckCircle2 size={14} className="mr-2" /> Passing Marks
              </label>
              <input
                type="number"
                name="passingMarks"
                required
                value={formData.passingMarks}
                onChange={handleChange}
                className="w-full input-field"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-cream/40 uppercase tracking-wider flex items-center">
              <Calendar size={14} className="mr-2" /> Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              name="scheduledDate"
              required
              value={formData.scheduledDate}
              onChange={handleChange}
              className="w-full input-field"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => handleSubmit(e as any, true)}
            className="glass px-8 py-3 rounded-xl flex items-center space-x-2 text-accent hover:bg-accent/10 transition-all font-bold"
          >
            {isGeneratingAI ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            <span>Create & Generate AI Questions</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-12 py-3 flex items-center space-x-2"
          >
            {loading && !isGeneratingAI ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <PlusCircle size={20} />
                <span>Create Exam</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="glass p-6 rounded-2xl border-white/5 bg-accent/5 flex items-start space-x-4">
        <div className="p-2 rounded-lg bg-accent/20 text-accent">
          <AlertCircle size={20} />
        </div>
        <div>
          <p className="font-bold text-accent">Pro Tip</p>
          <p className="text-sm text-cream/60">After creating an exam, you can add questions manually, generate them using AI, or upload a bulk CSV file.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateExam;
