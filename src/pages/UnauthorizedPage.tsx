import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 rounded-[40px] border-white/10 max-w-md w-full text-center"
      >
        <div className="w-24 h-24 bg-red-400/10 rounded-full flex items-center justify-center mx-auto mb-8 text-red-400">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-4xl font-bold font-heading mb-4">Access Denied</h1>
        <p className="text-cream/60 mb-10">
          You don't have permission to access this page. Please contact your administrator if you think this is a mistake.
        </p>
        <Link to="/" className="btn-primary w-full flex items-center justify-center space-x-2">
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
