import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck, Chrome } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from '../models';

const AuthPage: React.FC<{ type: 'login' | 'register' }> = ({ type }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'admin',
    department: '',
    rollNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const fUser = userCredential.user;
        
        await updateProfile(fUser, { displayName: formData.username });
        
        const newUser: User = {
          id: fUser.uid,
          username: formData.username,
          email: formData.email,
          role: formData.email.toLowerCase() === 'thakurjatin8882@gmail.com' ? 'admin' : formData.role,
          department: formData.department,
          rollNumber: formData.rollNumber,
          joinDate: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', fUser.uid), newUser);
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('Welcome back!');
      }
      
      // Wait a bit for AuthContext to update
      setTimeout(() => {
        const isAdmin = formData.email.toLowerCase() === 'thakurjatin8882@gmail.com' || formData.role === 'admin';
        const from = (location.state as any)?.from?.pathname || (isAdmin ? '/admin' : '/dashboard');
        navigate(from, { replace: true });
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      const fUser = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', fUser.uid));
      if (!userDoc.exists()) {
        const newUser: User = {
          id: fUser.uid,
          username: fUser.displayName || 'User',
          email: fUser.email || '',
          role: fUser.email?.toLowerCase() === 'thakurjatin8882@gmail.com' ? 'admin' : 'student',
          joinDate: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', fUser.uid), newUser);
      }
      
      toast.success('Signed in with Google!');
      
      // Wait a bit for AuthContext to update
      setTimeout(() => {
        const isAdmin = fUser.email?.toLowerCase() === 'thakurjatin8882@gmail.com';
        const from = (location.state as any)?.from?.pathname || (isAdmin ? '/admin' : '/dashboard');
        navigate(from, { replace: true });
      }, 500);
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Animated Mesh */}
      <div className="hidden md:flex flex-1 relative items-center justify-center p-12 overflow-hidden bg-deep">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-secondary/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-5xl font-bold font-heading mb-6 text-accent">ExamNex</h1>
          <p className="text-xl text-cream/60 max-w-md mx-auto">
            {type === 'login' 
              ? "Access your dashboard and continue your learning journey." 
              : "Join thousands of students and educators in the future of testing."}
          </p>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md glass p-8 rounded-2xl border-white/10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-heading mb-2">
              {type === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-cream/50">
              {type === 'login' ? 'Please enter your details to sign in.' : 'Fill in the information to get started.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Toggle */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all duration-300",
                  formData.role === 'student' ? "bg-accent text-white shadow-lg" : "text-cream/50 hover:text-cream"
                )}
              >
                <GraduationCap size={18} />
                <span className="font-semibold">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'admin' })}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all duration-300",
                  formData.role === 'admin' ? "bg-accent text-white shadow-lg" : "text-cream/50 hover:text-cream"
                )}
              >
                <ShieldCheck size={18} />
                <span className="font-semibold">Admin</span>
              </button>
            </div>

            {type === 'register' && (
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  type="text"
                  name="username"
                  placeholder="Full Name"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full input-field pl-12"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40 group-focus-within:text-accent transition-colors" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full input-field pl-12"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40 group-focus-within:text-accent transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full input-field pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {type === 'register' && formData.role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="department"
                  placeholder="Dept (e.g. CS)"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full input-field"
                />
                <input
                  type="text"
                  name="rollNumber"
                  placeholder="Roll Number"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="w-full input-field"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>{type === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-primary text-cream/40">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full glass py-3 rounded-xl flex items-center justify-center space-x-3 hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <Chrome size={20} className="text-accent" />
            <span className="font-semibold">Google</span>
          </button>

          <div className="mt-8 text-center text-cream/50">
            {type === 'login' ? (
              <p>Don't have an account? <Link to="/register" className="text-accent hover:underline font-semibold">Sign Up</Link></p>
            ) : (
              <p>Already have an account? <Link to="/login" className="text-accent hover:underline font-semibold">Sign In</Link></p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
