import React, { useState } from 'react';

// ✅ Modal Animation Styles & Hover Effects
const modalStyles = `
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .anim-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .anim-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  
  /* Smooth Button Hover */
  .btn-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .btn-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.2); }
  .btn-hover:active { transform: translateY(0); }
`;

interface CandidateFormProps {
  onSubmit: (info: any, file: File, skipVideo: boolean) => void;
  onBack: () => void;
  // ✅ Receive video requirement from App.tsx
  videoRequired: boolean; 
}

const CandidateForm: React.FC<CandidateFormProps> = ({ onSubmit, onBack, videoRequired }) => {
  const [info, setInfo] = useState({ name: '', email: '', phone: '', comments: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  // Validation State
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [fileError, setFileError] = useState('');

  // Modal States
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showFinalWarning, setShowFinalWarning] = useState(false);

  // 1. STRICT EMAIL VALIDATION
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|outlook\.com|[a-zA-Z0-9.-]+\.(edu|org|net|gov|in))$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid official email (e.g., gmail.com, yahoo.com, or .edu)');
      return false;
    }
    setEmailError('');
    return true;
  };

  // 2. STRICT PHONE VALIDATION
  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // 3. STRICT FILE VALIDATION (PDF ONLY + 2MB LIMIT)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check Size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        setFileError('⚠️ File too large. Maximum size allowed is 2MB.');
        setResumeFile(null);
        e.target.value = ''; // Reset input
        return;
      }

      // Check Type
      if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
        setFileError('⚠️ Invalid file type. Only .pdf files are allowed.');
        setResumeFile(null); 
        e.target.value = ''; 
      } else {
        setFileError('');
        setResumeFile(file);
      }
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Run Validations
    const isEmailValid = validateEmail(info.email);
    const isPhoneValid = validatePhone(info.phone);
    const isFileValid = resumeFile !== null;

    if (!isFileValid) setFileError('Please upload your resume in PDF format.');

    if (isEmailValid && isPhoneValid && isFileValid && info.name) {
        // If Video IS required -> Show Warning Modal (Choice)
        // If Video is NOT required -> Submit Directly
        if (videoRequired) {
            setShowChoiceModal(true);
        } else {
            onSubmit(info, resumeFile!, true); // true = skip video
        }
    }
  };

  const handleProceedToVideo = () => {
    onSubmit(info, resumeFile!, false); // false = do NOT skip video
  };

  const handleDirectSubmitClick = () => {
    setShowChoiceModal(false);
    setShowFinalWarning(true);
  };

  const confirmDirectSubmit = () => {
    onSubmit(info, resumeFile!, true);
  };

  return (
    <>
      <style>{modalStyles}</style>
      
      <form onSubmit={handleInitialSubmit} className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-100 space-y-6 max-w-3xl mx-auto animate-slide-up relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-black text-[#1a1a54] tracking-tight">Application Form</h2>
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
        
        <p className="text-slate-400 text-sm font-medium mb-6">Please complete your details below to proceed.</p>

        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
            <input 
              required type="text" 
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1a1a54] focus:bg-white outline-none font-bold text-[#1a1a54] transition-all"
              placeholder="John Doe"
              value={info.name} onChange={e => setInfo({ ...info, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address *</label>
            <input 
              required type="email" 
              className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 ${emailError ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-[#1a1a54]'} focus:bg-white outline-none font-bold text-[#1a1a54] transition-all`}
              placeholder="john@gmail.com"
              value={info.email} 
              onChange={e => {
                  setInfo({ ...info, email: e.target.value });
                  if(emailError) validateEmail(e.target.value); 
              }}
              onBlur={() => validateEmail(info.email)} 
            />
            {emailError && <p className="text-[10px] font-bold text-red-500 ml-1">{emailError}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number *</label>
            <input 
              required type="tel" maxLength={10}
              className={`w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 ${phoneError ? 'border-red-300 focus:border-red-500' : 'border-slate-100 focus:border-[#1a1a54]'} focus:bg-white outline-none font-bold text-[#1a1a54] transition-all`}
              placeholder="9876543210"
              value={info.phone} 
              onChange={e => {
                  const val = e.target.value.replace(/\D/g, ''); 
                  setInfo({ ...info, phone: val });
                  if(phoneError) validatePhone(val);
              }}
              onBlur={() => validatePhone(info.phone)}
            />
            {phoneError && <p className="text-[10px] font-bold text-red-500 ml-1">{phoneError}</p>}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Resume Upload (PDF Only) *</label>
                {/* ℹ️ TOOLTIP FOR FILE REQUIREMENTS */}
                <div className="relative group cursor-help">
                    <svg className="w-4 h-4 text-slate-400 hover:text-[#1a1a54] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#1a1a54] text-white text-[10px] leading-tight rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 text-center font-medium">
                        Max file size: 2MB.<br/>Please ensure you upload your latest resume version.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1a1a54]"></div>
                    </div>
                </div>
            </div>

            <input 
              required type="file" accept=".pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500
                file:mr-4 file:py-4 file:px-6
                file:rounded-2xl file:border-0
                file:text-xs file:font-black file:uppercase file:tracking-widest
                file:bg-[#1a1a54]/10 file:text-[#1a1a54]
                hover:file:bg-[#1a1a54]/20 cursor-pointer" 
            />
            {fileError && <p className="text-[10px] font-bold text-red-500 ml-1 bg-red-50 p-2 rounded-lg inline-block">{fileError}</p>}
          </div>
        </div>

        <div className="space-y-2">
          {/* ✅ RENAMED LABEL */}
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Skills & Credentials</label>
          <textarea 
            className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#1a1a54] focus:bg-white outline-none font-medium text-slate-600 h-32 transition-all resize-none"
            placeholder="Portfolio links, LinkedIn, or extra comments..."
            value={info.comments} onChange={e => setInfo({ ...info, comments: e.target.value })}
          />
        </div>

        {/* Actions Row */}
        <div className="flex gap-4 pt-4">
          <button 
              type="button" 
              onClick={onBack}
              className="w-1/3 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 border-2 border-slate-100 hover:border-slate-300 hover:text-slate-600 btn-hover"
          >
              Back
          </button>
          <button 
              type="submit" 
              className="flex-1 bg-[#1a1a54] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs btn-hover shadow-lg shadow-indigo-100"
          >
              {videoRequired ? 'Proceed' : 'Submit Application'}
          </button>
        </div>
      </form>

      {/* ✅ 1. CHOICE MODAL (CLEANED - SINGLE BUTTON) */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1a1a54]/80 backdrop-blur-md anim-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl text-center anim-scale-in border border-white/20">
             <h3 className="text-2xl font-black text-[#1a1a54] mb-2">Ready to Interview?</h3>
             <p className="text-slate-500 text-sm mb-8 font-medium">This role requires a short video interview.</p>
             
             <div className="space-y-4">
                {/* Single Clean Button */}
                <button onClick={handleProceedToVideo} className="w-full bg-[#d32f2f] text-white py-5 rounded-2xl flex items-center justify-center px-6 btn-hover shadow-lg shadow-red-100 transition-all hover:bg-red-700">
                    <div className="text-lg font-bold">Proceed to Video Interview</div>
                </button>
             </div>
             
             <button onClick={() => setShowChoiceModal(false)} className="mt-6 text-slate-400 text-xs font-bold hover:text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {/* ✅ 2. FINAL WARNING MODAL (Technically Unreachable Now, but kept for code safety) */}
      {showFinalWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-red-900/90 backdrop-blur-md anim-fade-in">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl text-center anim-scale-in border-4 border-red-100">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl animate-pulse">⚠️</div>
             <h3 className="text-2xl font-black text-[#1a1a54] mb-4">Are you absolutely sure?</h3>
             <p className="text-slate-600 text-sm mb-8 leading-relaxed">
               Candidates who submit <strong>without a video</strong> interview have a significantly lower chance of being shortlisted.
             </p>
             
             <div className="space-y-3">
                <button onClick={() => { setShowFinalWarning(false); handleProceedToVideo(); }} className="w-full bg-[#1a1a54] text-white py-4 rounded-2xl font-bold shadow-lg btn-hover">
                    Wait! I'll do the Video Interview
                </button>
                
                <button 
                    onClick={confirmDirectSubmit} 
                    className="w-full py-4 rounded-2xl font-bold text-red-500 border-2 border-transparent hover:bg-red-50 transition-all"
                >
                    Yes, Submit Anyway
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandidateForm;