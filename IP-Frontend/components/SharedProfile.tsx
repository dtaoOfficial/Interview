import React, { useEffect, useState } from 'react';
import { Application, Question } from '../types';
import api from '../services/api'; // Ensure this points to your axios instance
import nhceLogo from '../data/nhce.png';

// Reuse styles for consistency
const styles = `
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .anim-entry { animation: fadeIn 0.6s ease-out forwards; }
`;

const SharedProfile: React.FC = () => {
  const [appData, setAppData] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Get ID from URL manually (since we might not have react-router hooks set up for this specific standalone view in your setup)
  const appId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (!appId) return;

    const fetchData = async () => {
      try {
        // 1. Get Details
        const res = await api.get(`/public/share/${appId}`);
        setAppData(res.data);

        // 2. Get Video (if exists)
        if (res.data.videoPath) {
            const vidRes = await api.get(`/public/share/${appId}/video`, { responseType: 'blob' });
            if (vidRes.data.size > 100) {
                setVideoUrl(URL.createObjectURL(new Blob([vidRes.data])));
            }
        }
      } catch (err) {
        console.error("Error loading shared profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [appId]);

  const viewResume = async () => {
      if(!appId) return;
      try {
          const response = await api.get(`/public/share/${appId}/resume`, { responseType: 'blob' });
          const file = new Blob([response.data], { type: 'application/pdf' });
          window.open(URL.createObjectURL(file), '_blank');
      } catch (e) { alert("Resume not available"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#1a1a54] font-bold">Loading Candidate Profile...</div>;
  if (!appData) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Link Expired or Invalid</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <style>{styles}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
            <img src={nhceLogo} alt="Logo" className="h-10 object-contain" />
            <div>
                <h1 className="text-lg font-black text-[#1a1a54] leading-none">CANDIDATE PROFILE</h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Shared for Review</p>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto mt-10 px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 anim-entry">
         
         {/* LEFT: Video Player */}
         <div className="space-y-4">
            <div className="bg-black rounded-[2rem] overflow-hidden shadow-2xl aspect-video relative flex items-center justify-center group">
                {videoUrl ? (
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center">
                        <div className="text-6xl mb-2">📄</div>
                        <p className="text-white/50 font-bold text-sm uppercase tracking-widest">Resume Only Submission</p>
                    </div>
                )}
            </div>
            
            {/* Questions List */}
            {appData.askedQuestions && appData.askedQuestions.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black text-[#1a1a54] uppercase tracking-widest mb-4">Interview Questions Asked</h3>
                    <ul className="space-y-3">
                        {appData.askedQuestions.map((q, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                                <span className="font-bold text-slate-300">0{i+1}</span>
                                {q.text}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
         </div>

         {/* RIGHT: Details */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-black text-[#1a1a54] mb-1">{appData.candidateName}</h2>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                            {appData.status}
                        </span>
                    </div>
                    <button onClick={viewResume} className="bg-[#1a1a54] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-indigo-100">
                        Download Resume
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">📧</div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                            <p className="font-bold text-[#1a1a54]">{appData.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg shadow-sm">📱</div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                            <p className="font-bold text-[#1a1a54]">{appData.phone}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Candidate Comments</h3>
                    <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                        "{appData.comments || "No additional comments provided."}"
                    </p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SharedProfile;