import React from 'react';

const NotFound: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6 animate-fade-in">
      {/* 404 Icon Illustration */}
      <div className="text-9xl font-black text-[#1a1a54]/10 select-none mb-4">404</div>
      
      <h1 className="text-4xl font-black text-[#1a1a54] mb-2 tracking-tight">Page Not Found</h1>
      <p className="text-slate-500 text-lg mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <button 
        onClick={onHome}
        className="px-8 py-4 bg-[#1a1a54] text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-[#d32f2f] transition-all shadow-xl shadow-indigo-100 transform hover:scale-[1.02]"
      >
        Return to Home
      </button>

      {/* Security Badge */}
      <div className="mt-12 flex items-center gap-2 opacity-60">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          System Secure & Monitored
        </span>
      </div>
    </div>
  );
};

export default NotFound;