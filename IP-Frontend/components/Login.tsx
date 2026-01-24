import React, { useState, useEffect } from 'react';
import { loginAdmin } from '../services/authService';
// ✅ Import Logo
import nhceLogo from '../data/nhce.png'; 

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ UI STATE
  const [showPassword, setShowPassword] = useState(false);

  // ✅ SECURITY STATES
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // ✅ 1. CHECK LOCKOUT STATUS ON MOUNT
  useEffect(() => {
    const storedLockout = localStorage.getItem('login_lockout_until');
    const storedAttempts = localStorage.getItem('login_attempts');

    if (storedAttempts) setFailedAttempts(parseInt(storedAttempts));

    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      const now = Date.now();
      
      if (lockoutTime > now) {
        setIsLocked(true);
        setLockoutTimer(Math.ceil((lockoutTime - now) / 1000));
      } else {
        localStorage.removeItem('login_lockout_until');
        localStorage.setItem('login_attempts', '0');
        setFailedAttempts(0);
        setIsLocked(false);
      }
    }

    // ✅ ANTI-TAMPER: Disable Right Click
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // ✅ TIMER COUNTDOWN EFFECT
  useEffect(() => {
    let timerInterval: number;
    if (isLocked && lockoutTimer > 0) {
      timerInterval = window.setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            localStorage.removeItem('login_lockout_until');
            localStorage.setItem('login_attempts', '0');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isLocked, lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    // ✅ DOS PROTECTION
    const lastRequest = localStorage.getItem('last_login_request');
    const now = Date.now();
    if (lastRequest && now - parseInt(lastRequest) < 2000) {
        setError("Too many requests. Please wait.");
        return;
    }
    localStorage.setItem('last_login_request', now.toString());

    setError('');
    setLoading(true);

    try {
      await loginAdmin({ email, password });
      
      localStorage.setItem('login_attempts', '0');
      localStorage.removeItem('login_lockout_until');
      onLoginSuccess();

    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('login_attempts', newAttempts.toString());

      if (newAttempts >= 3) {
        setIsLocked(true);
        const lockoutDuration = 10 * 60 * 1000; // 10 Minutes
        const unlockTime = Date.now() + lockoutDuration;
        localStorage.setItem('login_lockout_until', unlockTime.toString());
        setLockoutTimer(600);
        setError('Account locked for 10 minutes.');
      } else {
        setError(`Invalid credentials. ${3 - newAttempts} attempts remaining.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden select-none">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#1a1a54]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#d32f2f]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md animate-slide-up z-10 relative">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
           <img src={nhceLogo} alt="NHCE Logo" className="h-20 object-contain mb-4 drop-shadow-sm" />
           <h1 className="text-2xl font-black text-[#1a1a54] tracking-tight">Recruitment Portal</h1>
           <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Admin Access Only</p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white/50 backdrop-blur-xl relative overflow-hidden">
          
          {/* LOCKED OVERLAY */}
          {isLocked && (
             <div className="absolute inset-0 bg-slate-50/95 z-20 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4 animate-pulse">🔒</div>
                <h3 className="text-xl font-bold text-[#1a1a54]">Access Locked</h3>
                <p className="text-slate-500 text-xs mt-2 mb-6">Too many failed attempts. Security protocol activated.</p>
                <div className="text-3xl font-black text-red-500 font-mono tracking-widest">{formatTime(lockoutTimer)}</div>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && !isLocked && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-center animate-shake">
                <p className="text-red-600 text-xs font-black uppercase tracking-wide">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Official Email ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-300 group-focus-within:text-[#1a1a54] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1a1a54] focus:bg-white outline-none font-bold text-[#1a1a54] transition-all placeholder:text-slate-300 placeholder:font-medium"
                  placeholder="admin@newhorizon.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Password Input (With Show/Hide Toggle) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
              <div className="relative group">
                {/* Left Icon */}
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-slate-300 group-focus-within:text-[#1a1a54] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                </div>
                
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1a1a54] focus:bg-white outline-none font-bold text-[#1a1a54] transition-all placeholder:text-slate-300 placeholder:font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLocked}
                />

                {/* ✅ Show/Hide Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#1a1a54] transition-colors"
                  disabled={isLocked}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              disabled={loading || isLocked}
              className="w-full bg-[#1a1a54] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#d32f2f] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
        
        <div className="flex flex-col items-center mt-8">
            <p className="text-xs text-slate-400 font-medium mb-1">
            Protected System • Authorized Personnel Only
            </p>
            {/* ✅ DTAO WATERMARK */}
            <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-default">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protected by DTAO</span>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;