import React, { useState, useMemo, useEffect } from 'react';
import { JobRole } from '../types';

// ✅ CUSTOM STYLES & ANIMATIONS
const styles = `
  html { scroll-behavior: smooth; }

  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
  
  /* 🌊 Water Wave Animation */
  @keyframes fluid-wave {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .anim-float { animation: float 4s ease-in-out infinite; }
  
  .btn-wave {
    background: linear-gradient(60deg, #d32f2f, #ff6b6b, #d32f2f, #b71c1c);
    background-size: 300% 300%;
    animation: fluid-wave 4s ease infinite;
    box-shadow: 0 10px 20px -5px rgba(211, 47, 47, 0.4);
    transition: all 0.3s ease;
  }
  .btn-wave:hover { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(211, 47, 47, 0.5); }

  /* Clean Card Hover */
  .job-card { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
  .job-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(26, 26, 84, 0.15); border-color: rgba(26, 26, 84, 0.1); }

  /* ✨ SCROLL REVEAL EFFECT */
  .reveal-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.5, 0, 0, 1);
  }
  .reveal-on-scroll.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

// ✅ SVG ICONS (Professional & Clean)
const Icons = {
  Search: () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Upload: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Check: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  File: () => <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Video: () => <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Rocket: () => <svg className="w-4 h-4 text-white mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Empty: () => <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ChevronDown: () => <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
  ChevronUp: () => <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
};

interface JobBoardProps {
  roles: JobRole[];
  isLoggedIn: boolean;
  onApply: (role: JobRole) => void;
  onRefreshData?: () => void;
}

const JobBoard: React.FC<JobBoardProps> = ({ roles, isLoggedIn, onApply, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // AI Matching States
  const [isMatching, setIsMatching] = useState(false);
  const [matchScore, setMatchScore] = useState<Record<string, number>>({});
  const [resumeName, setResumeName] = useState<string | null>(null);

  // Read More State
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});

  // 1. LIVE UPDATE LOGIC
  useEffect(() => {
    const interval = setInterval(() => {
        if (onRefreshData) {
            onRefreshData();
        }
    }, 5000); 
    return () => clearInterval(interval);
  }, [onRefreshData]);

  // 2. SCROLL REVEAL OBSERVER
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.reveal-on-scroll');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [roles, searchTerm, selectedDept]); // Re-run when content changes

  // 3. Extract Departments
  const departments = ['All', ...Array.from(new Set(roles.filter(r => r.isActive !== false).map(r => r.department)))];

  // 4. Filter & Sort Logic
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      if (role.isActive === false) return false; // Strict Active Check

      const matchesSearch = role.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            role.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All' || role.department === selectedDept;
      
      return matchesSearch && matchesDept;
    }).sort((a, b) => (matchScore[b.id] || 0) - (matchScore[a.id] || 0));
  }, [roles, searchTerm, selectedDept, matchScore]);

  // 5. Resume Match Logic
  const handleResumeMatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert("Please upload a valid document (PDF or Word).");
            return;
        }

        setResumeName(file.name);
        setIsMatching(true);
        
        setTimeout(() => {
            setIsMatching(false);
            const newScores: Record<string, number> = {};
            roles.forEach(r => {
                newScores[r.id] = Math.floor(Math.random() * (98 - 60 + 1)) + 60;
            });
            setMatchScore(newScores);
            alert(`Resume Analyzed! Found matching jobs.`);
        }, 2500);
    }
  };

  // 6. Toggle Read More
  const toggleExpand = (id: string) => {
    setExpandedRoles(prev => ({
        ...prev,
        [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{styles}</style>

      {/* HERO SECTION */}
      <div className="bg-[#1a1a54] text-white pt-20 pb-28 px-6 relative overflow-hidden rounded-b-[4rem] shadow-2xl reveal-on-scroll">
        {/* Subtle Ambient Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-400 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="px-5 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest mb-6 inline-flex items-center backdrop-blur-md anim-float shadow-lg">
                <Icons.Rocket /> Hiring Now
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight drop-shadow-sm reveal-on-scroll">
                Shape the Future of <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-red-200">Education</span>
            </h1>
            <p className="text-blue-100/90 text-lg mb-12 max-w-2xl mx-auto font-medium leading-relaxed reveal-on-scroll">
                Join Our Team
            </p>

            {/* SEARCH BAR & WAVE BUTTON */}
            <div className="bg-white p-3 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-3 max-w-3xl mx-auto transform transition-transform duration-300 border-4 border-white/10 backdrop-blur-sm reveal-on-scroll">
                <div className="flex-1 relative flex items-center bg-slate-50 rounded-2xl">
                    <span className="absolute left-6"><Icons.Search /></span>
                    <input 
                        type="text" 
                        placeholder="Search for job titles or keywords..." 
                        className="w-full h-full pl-14 pr-4 py-5 rounded-2xl outline-none text-slate-700 font-bold placeholder:text-slate-400 bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="relative group">
                    <input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeMatch}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        disabled={isMatching}
                    />
                    <button className={`h-full px-10 py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-3 whitespace-nowrap ${isMatching ? 'bg-slate-800 cursor-wait' : 'btn-wave'}`}>
                        {isMatching ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="text-sm">Scanning...</span>
                            </>
                        ) : (
                            <>
                                {resumeName ? <Icons.Check /> : <Icons.Upload />}
                                <span className="tracking-wide text-sm">{resumeName ? 'Analyzed' : 'AI Match Resume'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {resumeName && !isMatching && (
                <div className="mt-4 text-xs font-bold text-blue-200 animate-in fade-in slide-in-from-bottom-2">
                    🎯 Showing AI matched results for <u>{resumeName}</u>
                    <button onClick={() => {setResumeName(null); setMatchScore({});}} className="ml-3 text-white hover:text-red-300 transition-colors">Clear</button>
                </div>
            )}
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 pb-24">
        
        {/* FILTERS */}
        <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide justify-center reveal-on-scroll">
            {departments.map(dept => (
                <button 
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-md ${
                        selectedDept === dept 
                        ? 'bg-[#d32f2f] text-white shadow-red-500/30 scale-105' 
                        : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                    {dept}
                </button>
            ))}
        </div>

        {/* JOB CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                    <div 
                        key={role.id} 
                        className="bg-white rounded-[2rem] p-7 shadow-lg shadow-slate-200/50 border border-white hover:border-slate-200 job-card flex flex-col group relative reveal-on-scroll"
                    >
                        {/* Match Score */}
                        {matchScore[role.id] && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl shadow-lg z-10 tracking-wider">
                                {matchScore[role.id]}% MATCH
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-slate-50 text-[#1a1a54] border border-slate-100 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">
                                    {role.department}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-[#1a1a54] mb-3 group-hover:text-[#d32f2f] transition-colors leading-tight">
                                {role.title}
                            </h3>
                            
                            {/* DESCRIPTION WITH READ MORE */}
                            <div className="mb-8">
                                <p className={`text-slate-500 text-sm font-medium leading-relaxed ${expandedRoles[role.id] ? '' : 'line-clamp-3'}`}>
                                    {role.description}
                                </p>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(role.id); }}
                                    className="text-[#d32f2f] text-xs font-bold mt-2 hover:underline focus:outline-none flex items-center"
                                >
                                    {expandedRoles[role.id] ? (
                                        <>Show Less <Icons.ChevronUp /></>
                                    ) : (
                                        <>Read More <Icons.ChevronDown /></>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="border-t border-slate-100 pt-6 mb-6 flex justify-between items-center">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Full-time
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    Bangalore
                                </div>
                            </div>
                            
                            {/* Dynamic Icons */}
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm" title="Resume Required">
                                    <Icons.File />
                                </div>
                                {role.videoRequired === true && (
                                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm" title="Video Interview Required">
                                        <Icons.Video />
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => onApply(role)}
                            className="w-full py-4 bg-[#1a1a54] text-white rounded-xl font-bold uppercase tracking-widest text-xs flex justify-center items-center gap-3 group-hover:bg-[#d32f2f] transition-all shadow-xl shadow-slate-200 group-hover:shadow-red-200"
                        >
                            Apply Now
                            <Icons.ArrowRight />
                        </button>
                    </div>
                ))
            ) : (
                <div className="col-span-full py-24 text-center reveal-on-scroll">
                    <div className="flex justify-center mb-6 opacity-50"><Icons.Empty /></div>
                    <h3 className="text-2xl font-bold text-[#1a1a54] mb-2">No jobs found</h3>
                    <p className="text-slate-400 mb-6">We couldn't find any roles matching your search.</p>
                    <button onClick={() => {setSearchTerm(''); setSelectedDept('All');}} className="text-[#d32f2f] font-bold text-sm hover:underline">Clear all filters</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;