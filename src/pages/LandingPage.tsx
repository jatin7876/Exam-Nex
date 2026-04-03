import React from 'react';
import { cn, formatDate } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Shield, 
  Zap, 
  Users, 
  Timer, 
  ArrowRight, 
  CheckCircle2,
  BrainCircuit,
  BarChart3,
  Globe
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    { title: "JWT Auth", desc: "Secure, token-based authentication for all users.", icon: Shield, color: "text-blue-400" },
    { title: "Auto-Evaluation", desc: "Instant results and detailed performance breakdown.", icon: Zap, color: "text-yellow-400" },
    { title: "Role-Based Access", desc: "Separate dashboards for admins and students.", icon: Users, color: "text-purple-400" },
    { title: "Timer Control", desc: "Smart countdown with auto-submit functionality.", icon: Timer, color: "text-red-400" },
    { title: "AI Question Gen", desc: "Generate high-quality MCQs using Gemini AI.", icon: BrainCircuit, color: "text-green-400" },
    { title: "Advanced Analytics", desc: "Visualize progress with interactive charts.", icon: BarChart3, color: "text-orange-400" },
  ];

  const stats = [
    { label: "Active Users", value: "10K+" },
    { label: "Exams Conducted", value: "50K+" },
    { label: "Questions Bank", value: "1M+" },
    { label: "Success Rate", value: "99.9%" },
  ];

  return (
    <div className="min-h-screen bg-primary overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold font-heading text-accent">ExamNex</div>
        <div className="hidden md:flex space-x-8 text-cream/80 font-medium">
          <a href="#features" className="hover:text-accent transition-colors">Features</a>
          <a href="#stats" className="hover:text-accent transition-colors">Stats</a>
          <a href="#testimonials" className="hover:text-accent transition-colors">Testimonials</a>
        </div>
        <div className="flex space-x-4">
          <Link to="/login" className="px-6 py-2 rounded-lg font-semibold hover:text-accent transition-colors">Login</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] -z-10"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-block px-4 py-2 rounded-full glass border-white/10 text-accent font-semibold mb-6"
        >
          ✨ The Future of Online Examinations
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold font-heading mb-6 max-w-4xl leading-tight"
        >
          Exam <span className="text-accent">Smarter</span>, <br />
          Not Harder.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-cream/60 max-w-2xl mb-10"
        >
          A premium, AI-powered examination platform designed for modern education. 
          Streamline your testing process with automated grading and real-time insights.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6"
        >
          <Link to="/register" className="btn-primary text-lg px-10 py-4 flex items-center">
            Start Free Trial <ArrowRight className="ml-2" />
          </Link>
          <a href="#features" className="glass px-10 py-4 rounded-lg font-semibold hover:bg-white/5 transition-all">
            View Features
          </a>
        </motion.div>

        {/* Floating Cards Mockup */}
        <div className="mt-20 relative w-full max-w-5xl">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-dark rounded-2xl p-8 border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm text-cream/40">examnex.app/dashboard</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 rounded-xl bg-white/5 animate-pulse"></div>
              <div className="h-32 rounded-xl bg-white/5 animate-pulse"></div>
              <div className="h-32 rounded-xl bg-white/5 animate-pulse"></div>
            </div>
            <div className="mt-6 h-64 rounded-xl bg-white/5 animate-pulse"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-heading mb-4">Powerful Features</h2>
          <p className="text-cream/60">Everything you need to conduct seamless online exams.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="glass p-8 rounded-2xl border-white/5 hover:border-accent/30 transition-all"
            >
              <div className={cn("w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6", f.color)}>
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-cream/60 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-deep/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">{s.value}</div>
              <div className="text-cream/40 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="text-2xl font-bold font-heading text-accent mb-6">ExamNex</div>
        <p className="text-cream/40 mb-8 max-w-md mx-auto">
          Empowering educators and students with smart examination tools.
        </p>
        <div className="flex justify-center space-x-6 text-cream/60 mb-8">
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
          <a href="#" className="hover:text-accent transition-colors">Terms</a>
          <a href="#" className="hover:text-accent transition-colors">Contact</a>
        </div>
        <div className="text-sm text-cream/20">
          © 2026 ExamNex. Built with ❤️ for the future of education.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
