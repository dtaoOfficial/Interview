import React, { useState, useEffect, useCallback } from 'react';
import { AppView, ApplicationStep, JobRole, Question, Application } from './types';
import AdminPortal from './components/AdminPortal';
import VideoRecorder from './components/VideoRecorder';
import Login from './components/Login';
import JobBoard from './components/JobBoard';
import CandidateForm from './components/CandidateForm';
import NotFound from './components/NotFound'; 
import SharedProfile from './components/SharedProfile'; 
import { fetchAllRoles } from './services/roleService';
import { isAuthenticated, logoutAdmin } from './services/authService';
import { submitApplication, fetchAllApplications } from './services/applicationService';

// ✅ IMPORT ASSETS
import nhceLogo from './data/nhce.png';
import hrPolicyPdf from './data/HR.pdf'; // ✅ Imported PDF

// ✅ CUSTOM ANIMATION STYLES
const styles = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes zoomOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
  @keyframes zoomIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  @keyframes pulseSlow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  
  .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
  .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
  .animate-zoom-out { animation: zoomOut 0.8s ease-in-out forwards; }
  .animate-zoom-in { animation: zoomIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .animate-pulse-slow { animation: pulseSlow 3s infinite ease-in-out; }
  
  .page-transition {
    animation: slideUp 0.5s ease-out;
  }
`;

const App: React.FC = () => {
  // ✅ AUTH & ROUTING STATE
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  
  // ✅ CHECK IF IT IS A SHARED LINK
  const isSharedLink = window.location.pathname.startsWith('/share/');

  const [currentView, setCurrentView] = useState<AppView>(() => {
      const path = window.location.pathname;
      if (path === '/login') return AppView.ADMIN_DASHBOARD;
      if (isAuthenticated()) return AppView.ADMIN_DASHBOARD;
      return AppView.CANDIDATE_JOBS;
  });

  // ✅ INTRO STATE
  const [showIntro, setShowIntro] = useState(() => {
      const path = window.location.pathname;
      return path === '/' && !isAuthenticated() && !path.startsWith('/share/');
  });
  const [isIntroExiting, setIsIntroExiting] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false); 

  // ✅ Contact Page State
  const [showContactPage, setShowContactPage] = useState(false);

  const [currentStep, setCurrentStep] = useState<ApplicationStep>(ApplicationStep.FORM);
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [applications, setApplications] = useState<Application[]>([]); 
  
  // Data State
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [candidateData, setCandidateData] = useState<any>(null); 
  const [resumeFile, setResumeFile] = useState<File | null>(null); 
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

  // UI Status
  const [retakeCount, setRetakeCount] = useState(0);
  const [isApplicationSubmitted, setIsApplicationSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // ✅ NEW: SCROLL TO TOP ON NAVIGATION
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, currentStep, showContactPage]); 

  // ✅ SECURITY: Auto-Logout Timer (15 Minutes)
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("🔒 Security Alert: Session expired due to inactivity.");
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [isLoggedIn]);

  // ✅ 1. INTRO & ROUTING LOGIC
  useEffect(() => {
    const path = window.location.pathname;
    
    if (path !== '/' && path !== '/login' && !path.startsWith('/share/')) {
        setIsNotFound(true);
        setShowIntro(false);
        return;
    }

    if (showIntro) {
        const timer = setTimeout(() => {
            setIsIntroExiting(true);
            setTimeout(() => setShowIntro(false), 800);
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, [showIntro]);

  // ✅ 2. CENTRALIZED DATA LOADER
  const loadData = useCallback(async () => {
    if (window.location.pathname.startsWith('/share/')) return;

    try {
      const backendRoles = await fetchAllRoles();
      setRoles(backendRoles);
      setLastUpdated(Date.now());

      if (isAuthenticated()) {
        const backendApps = await fetchAllApplications();
        setApplications(backendApps);
      }
    } catch (error) { console.log("Data fetch error:", error); }
  }, []);

  // ✅ 3. LIVE POLLING
  useEffect(() => { 
      loadData(); 
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
  }, [loadData]);

  // --- Handlers ---

  const handleHomeClick = () => {
    setIsNotFound(false); 
    setShowContactPage(false);
    setCurrentView(AppView.CANDIDATE_JOBS);
    setSelectedRole(null);
    window.history.pushState({}, '', '/');
  };

  const handleContactClick = () => {
    setIsNotFound(false);
    setSelectedRole(null);
    setShowContactPage(true);
  };

  const handleBackToJobs = () => {
    setSelectedRole(null);
    setCandidateData(null);
    setResumeFile(null);
    setCurrentView(AppView.CANDIDATE_JOBS);
  };

  const handleApply = (role: JobRole) => {
    setShowContactPage(false);
    setSelectedRole(role);
    setRetakeCount(0);
    setResumeFile(null);
    setCurrentStep(ApplicationStep.FORM);
    setCurrentView(AppView.CANDIDATE_APPLICATION);
    const shuffled = [...role.questionPool].sort(() => 0.5 - Math.random());
    setActiveQuestions(shuffled.slice(0, 2));
  };

  // ✅ NEW HANDLER: Open HR Policy PDF
  const openHrPolicy = () => {
    window.open(hrPolicyPdf, '_blank');
  };

  // ✅ NEW HANDLER: Open Mail App
  const openMailApp = () => {
    window.location.href = "mailto:hr.nhce.raj@gmail.com";
  };

  const handleFormSubmit = async (info: any, file: File, skipVideo: boolean) => {
    setCandidateData(info);
    setResumeFile(file);

    const effectiveSkipVideo = skipVideo || (selectedRole?.videoRequired === false);

    if (effectiveSkipVideo) {
        try {
            setIsSubmitting(true);
            const dummyVideo = new Blob([], { type: 'video/webm' });
            await submitApplication({
                jobId: selectedRole!.id,
                name: info.name,
                email: info.email,
                phone: info.phone,
                comments: info.comments,
                resume: file,
                video: dummyVideo, 
                askedQuestions: [] 
            });
            setIsApplicationSubmitted(true);
        } catch (error) {
            alert("Submission failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    } else {
        setCurrentStep(ApplicationStep.PERMISSION_INFO);
    }
  };

  const handleVideoComplete = async (blob: Blob) => {
    if (!selectedRole || !resumeFile) return;
    try {
      setIsSubmitting(true);
      await submitApplication({
        jobId: selectedRole.id,
        name: candidateData.name,
        email: candidateData.email,
        phone: candidateData.phone,
        comments: candidateData.comments,
        resume: resumeFile,
        video: blob,
        askedQuestions: activeQuestions
      });
      setIsApplicationSubmitted(true);
    } catch (error) {
      alert("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetakeRequest = () => {
    if (selectedRole && retakeCount < selectedRole.maxRetakes) {
      setRetakeCount(prev => prev + 1);
      const shuffled = [...selectedRole.questionPool].sort(() => 0.5 - Math.random());
      setActiveQuestions(shuffled.slice(0, 2));
    }
  };

  const handleLogout = useCallback(() => {
    logoutAdmin();
    setIsLoggedIn(false);
    setShowContactPage(false);
    setCurrentView(AppView.CANDIDATE_JOBS);
    window.history.pushState({}, '', '/'); 
  }, []);

  // --- Render Helpers ---

  const renderApplicationFlow = () => {
    if (!selectedRole) return null;

    if (isSubmitting) return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
           <div className="w-16 h-16 border-4 border-t-[#1a1a54] border-slate-200 rounded-full animate-spin mb-4"></div>
           <h2 className="text-2xl font-bold text-[#1a1a54]">Uploading Application...</h2>
           <p className="text-slate-500 text-sm mt-2 font-medium">Please do not close this window.</p>
        </div>
    );

    if (isApplicationSubmitted) return (
        <div className="max-w-md mx-auto py-20 px-6 text-center animate-zoom-in">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">✓</div>
          <h2 className="text-3xl font-bold mb-4 text-[#1a1a54]">Submission Received</h2>
          <p className="text-slate-500 mb-8">Thank you for applying. Our recruitment team will review your application shortly.</p>
          <button onClick={() => { setIsApplicationSubmitted(false); handleHomeClick(); }} className="bg-[#1a1a54] text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Return to Home</button>
        </div>
    );

    return (
      <div className="max-w-4xl mx-auto py-12 px-6 page-transition">
        {!isApplicationSubmitted && currentStep !== ApplicationStep.FORM && (
            <div className="mb-12 flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
            {[ApplicationStep.FORM, ApplicationStep.PERMISSION_INFO, ApplicationStep.VIDEO_INTERVIEW].map((step, idx) => (
                <div key={step} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${currentStep === step ? 'bg-[#d32f2f] border-[#d32f2f] text-white scale-110' : 'bg-white border-slate-200 text-slate-400'}`}>{idx + 1}</div>
            ))}
            </div>
        )}

        {currentStep === ApplicationStep.FORM && (
          <div className="animate-slide-up">
              <CandidateForm 
                onSubmit={handleFormSubmit} 
                onBack={handleBackToJobs} 
                videoRequired={selectedRole.videoRequired !== false}
              />
          </div>
        )}

        {currentStep === ApplicationStep.PERMISSION_INFO && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#1a1a54]/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl animate-zoom-in">
              <h2 className="text-2xl font-bold mb-4 text-[#1a1a54]">Video Interview Setup</h2>
              <p className="text-slate-600 mb-8">We need access to your camera and microphone. You will have 1 minute to answer {activeQuestions.length} questions.</p>
              
              <div className="flex gap-3">
                  <button onClick={() => setCurrentStep(ApplicationStep.FORM)} className="flex-1 py-4 border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-colors">Back</button>
                  <button onClick={() => setCurrentStep(ApplicationStep.VIDEO_INTERVIEW)} className="flex-[2] bg-[#d32f2f] text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">Start Recording</button>
              </div>
            </div>
          </div>
        )}

        {currentStep === ApplicationStep.VIDEO_INTERVIEW && (
          <div className="animate-fade-in">
            <VideoRecorder 
              questions={activeQuestions}
              maxRetakes={selectedRole.maxRetakes}
              retakesRemaining={selectedRole.maxRetakes - retakeCount}
              onComplete={handleVideoComplete}
              onRetake={handleRetakeRequest}
            />
          </div>
        )}
      </div>
    );
  };

  // ✅ 1. SHARED PROFILE RENDER
  if (isSharedLink) {
      return <SharedProfile />;
  }

  // ✅ 2. 404 PAGE
  if (isNotFound) {
    return <NotFound onHome={handleHomeClick} />;
  }

  // ✅ 3. INTRO SCREEN
  if (showIntro) {
    return (
      <div className={`fixed inset-0 z-[200] bg-white flex items-center justify-center transition-all duration-700 ${isIntroExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         <div className="absolute inset-0 bg-slate-50"></div>
         <div className={`relative flex flex-col items-center justify-center transform transition-transform duration-700 ${isIntroExiting ? 'scale-110' : 'scale-100'}`}>
             <img src={nhceLogo} alt="NHCE Logo" className="h-32 md:h-48 object-contain animate-zoom-in drop-shadow-xl" />
             <div className="mt-8 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <h1 className="text-[#1a1a54] font-black text-2xl tracking-widest uppercase">New Horizon</h1>
                <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase">Educational Institution</p>
             </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 animate-fade-in">
      <style>{styles}</style>
      
      {!isSharedLink && (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
            <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={handleHomeClick}>
                <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="font-black text-2xl tracking-tighter text-[#1a1a54] leading-none">NEW HORIZON</span>
                    <span className="text-[10px] font-bold text-[#1a1a54] uppercase tracking-[0.1em]">EDUCATIONAL INSTITUTION</span>
                </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <img src={nhceLogo} alt="NHCE Logo" className="h-16 w-auto object-contain" />
                {currentView === AppView.ADMIN_DASHBOARD && isLoggedIn && (
                <button onClick={handleLogout} className="px-6 py-2 rounded-xl text-sm font-bold bg-red-50 text-[#d32f2f] hover:bg-[#d32f2f] hover:text-white transition-all">Logout</button>
                )}
            </div>
            </div>
        </nav>
      )}

      <main className="pb-24">
        {/* ✅ SHOW CONTACT PAGE LOGIC */}
        {showContactPage ? (
            <div className="max-w-4xl mx-auto py-12 px-6 animate-slide-up">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black text-[#1a1a54] mb-4">Contact Support</h2>
                    <p className="text-slate-500 font-medium">We are here to help. Select a department below.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Technical Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-white hover:border-slate-200 transition-all group flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-blue-50 text-[#1a1a54] rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                            🛠️
                        </div>
                        <h3 className="text-xl font-bold text-[#1a1a54] mb-2">Technical Support</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Facing issues with the website, file uploads, or application errors?
                        </p>
                        <a href="mailto:tech@gmail.com" className="px-6 py-3 rounded-xl bg-slate-50 text-[#1a1a54] font-black text-sm uppercase tracking-widest hover:bg-[#1a1a54] hover:text-white transition-all">
                            tech@gmail.com
                        </a>
                    </div>

                    {/* HR Card - UPDATED EMAIL HERE */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-white hover:border-slate-200 transition-all group flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-50 text-[#d32f2f] rounded-full flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                            🤝
                        </div>
                        <h3 className="text-xl font-bold text-[#1a1a54] mb-2">HR & Interview Queries</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            Questions regarding job roles, interview schedules, or joining dates?
                        </p>
                        <a href="mailto:hr.nhce.raj@gmail.com" className="px-6 py-3 rounded-xl bg-slate-50 text-[#d32f2f] font-black text-sm uppercase tracking-widest hover:bg-[#d32f2f] hover:text-white transition-all">
                            Contact HR Team
                        </a>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button onClick={handleHomeClick} className="px-8 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-400 hover:border-[#1a1a54] hover:text-[#1a1a54] transition-all flex items-center gap-2">
                        ← Back to Home
                    </button>
                </div>
            </div>
        ) : (
            <div key={currentView} className="page-transition">
                {currentView === AppView.CANDIDATE_JOBS && (
                    <JobBoard 
                        roles={roles} 
                        isLoggedIn={isLoggedIn} 
                        onApply={handleApply} 
                        onRefreshData={loadData} 
                    />
                )}
                
                {currentView === AppView.CANDIDATE_APPLICATION && renderApplicationFlow()}
                
                {currentView === AppView.ADMIN_DASHBOARD && (
                  !isLoggedIn ? <Login onLoginSuccess={() => { setIsLoggedIn(true); loadData(); }} /> : 
                  <AdminPortal 
                    roles={roles} 
                    applications={applications} 
                    onAddRole={(r) => {
                        setRoles(prev => [...prev, r]); 
                        loadData(); 
                    }} 
                    onUpdateRole={(r) => {
                        setRoles(prev => prev.map(p => p.id === r.id ? r : p));
                        loadData(); 
                    }} 
                    onRefreshData={loadData} 
                  />
                )}
            </div>
        )}
      </main>

      {/* ✅ REDESIGNED FOOTER (CLEANED) */}
      {!isSharedLink && (
        <footer className="bg-[#1a1a54] text-white pt-16 pb-8 mt-20">
            <div className="max-w-7xl mx-auto px-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    
                    {/* COLUMN 1: ADDRESS */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="text-xl font-bold mb-4 uppercase tracking-widest border-b border-white/20 pb-2">Location</h3>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            New Horizon Knowledge Park,<br/>
                            Ring Road, Bellandur Post,<br/>
                            Marathalli, Bengaluru, India – 560103
                        </p>
                        <a href="https://www.newhorizonindia.edu" target="_blank" rel="noreferrer" className="mt-4 text-[#4ade80] hover:text-white transition-colors text-sm font-bold flex items-center gap-2">
                             🌐 www.newhorizonindia.edu
                        </a>
                    </div>

                    {/* COLUMN 2: HR CONTACTS (UPDATED EMAIL HERE) */}
                    <div className="flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold mb-4 uppercase tracking-widest border-b border-white/20 pb-2">HR Recruitment</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">Send Resumes To:</p>
                        <p className="text-white font-medium text-sm mb-4">
                            hr.nhce.raj@gmail.com <br/>
                            tam_hr@newhorizonindia.edu
                        </p>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">Contact Persons:</p>
                        <div className="space-y-1 text-slate-300 text-sm">
                            <p>Ms. Sulochana Punagin: <span className="text-white font-bold">96635 25962</span></p>
                            <p>Ms. Prita Dutta: <span className="text-white font-bold">91085 11397</span></p>
                        </div>
                    </div>

                    {/* COLUMN 3: QUICK ACTIONS */}
                    <div className="flex flex-col items-center md:items-end text-center md:text-right">
                        <h3 className="text-xl font-bold mb-4 uppercase tracking-widest border-b border-white/20 pb-2">Quick Actions</h3>
                        
                        {/* HR POLICY BUTTON */}
                        <button 
                            onClick={openHrPolicy}
                            className="w-full md:w-auto mb-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                        >
                            <span></span> Read HR Policy
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>

                        {/* CONTACT HR BUTTON */}
                        <button 
                            onClick={openMailApp}
                            className="w-full md:w-auto bg-[#d32f2f] hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/50 flex items-center justify-center gap-2"
                        >
                            <span></span> Email HR Team
                        </button>
                        
                        {/* Technical Support Link */}
                        <button 
                             onClick={handleContactClick}
                             className="mt-4 text-xs text-slate-400 hover:text-white underline decoration-slate-500 underline-offset-4"
                        >
                            Need Technical Help?
                        </button>
                    </div>
                </div>

                {/* BOTTOM BAR - CLEANED (Badge Removed) */}
                <div className="pt-8 border-t border-white/10 flex flex-col items-center gap-3">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">© {new Date().getFullYear()} New Horizon Educational Institution</span>
                </div>
            </div>
        </footer>
      )}
    </div>
  );
};

export default App;