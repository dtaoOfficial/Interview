import React, { useState, useRef, useEffect, useMemo } from 'react';
import { JobRole, Question, Application } from '../types';
import { generateQuestionsForRole } from '../services/geminiService';
// ✅ ADDED deleteRole HERE
import { createRoleWithQuestions, updateRoleData, fetchAllRoles, deleteQuestion as apiDeleteQuestion, deleteRole } from '../services/roleService';
import { updateApplicationStatus } from '../services/applicationService';
import api from '../services/api';

// ✅ CUSTOM ANIMATIONS & STYLES
const adminStyles = `
  @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  
  .anim-slide-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .anim-scale-in { animation: scaleIn 0.3s ease-out forwards; }
  .anim-fade-in { animation: fadeIn 0.5s ease-out forwards; }
  
  .table-row-anim { transition: background-color 0.2s, transform 0.2s; }
  .table-row-anim:hover { transform: scale(1.005); background-color: #f8fafc; }
  
  /* Smooth Toggle Switch Animation */
  .toggle-track { transition: background-color 0.3s ease; }
  .toggle-thumb { transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); }
`;

interface AdminPortalProps {
  roles: JobRole[];
  applications: Application[];
  onAddRole: (role: JobRole) => void;
  onUpdateRole: (role: JobRole) => void;
  onRefreshData?: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ roles, applications, onAddRole, onUpdateRole, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'resume_only'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  
  // Review State
  const [reviewApplication, setReviewApplication] = useState<Application | null>(null);

  // New Role State
  const [newRole, setNewRole] = useState<Partial<JobRole>>({
    title: '', description: '', department: '', maxRetakes: 1, questionPool: [], 
    isActive: true, videoRequired: true 
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Notifications
  const [hasNewApps, setHasNewApps] = useState(false);
  const prevAppCountRef = useRef(applications.length);

  // Live Update Poll
  useEffect(() => {
    const interval = setInterval(() => {
        if (onRefreshData) onRefreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [onRefreshData]);

  // New Application Alert
  useEffect(() => {
    if (applications.length > prevAppCountRef.current) {
        if (activeTab !== 'applications') {
            setHasNewApps(true);
        }
    }
    prevAppCountRef.current = applications.length;
  }, [applications.length, activeTab]);

  useEffect(() => {
    if (activeTab === 'applications') {
        setHasNewApps(false);
    }
  }, [activeTab]);

  // ✅ HELPER: Check if video exists
  const checkHasVideo = (app: Application) => {
      // @ts-ignore
      const videoField = app.videoUrl || app.videoPath;
      return videoField && videoField !== 'null' && videoField.length > 0;
  };

  // ✅ FILTER LOGIC
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
        const matchSearch = app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            app.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const hasVideo = checkHasVideo(app);
        
        // Type Filter
        let matchType = true;
        if (filterType === 'video') matchType = !!hasVideo;
        if (filterType === 'resume_only') matchType = !hasVideo;

        // Status Filter
        let matchStatus = true;
        if (filterStatus !== 'all') {
            matchStatus = app.status === filterStatus;
        }

        // Date Filter
        let matchDate = true;
        if (startDate || endDate) {
            matchDate = true; 
        }
        
        return matchSearch && matchType && matchStatus && matchDate;
    });
  }, [applications, searchTerm, filterType, filterStatus, startDate, endDate]);

  // ✅ EXPORT CSV
  const handleExportCSV = () => {
    const headers = ["Candidate Name", "Email", "Phone", "Role", "Status", "Submission Type", "Comments"];
    const csvContent = [
        headers.join(","), 
        ...filteredApplications.map(app => [
            `"${app.candidateName}"`,
            `"${app.email}"`,
            `"${app.phone}"`,
            `"${roles.find(r => r.id === app.jobId)?.title || 'Unknown'}"`,
            `"${app.status}"`,
            `"${checkHasVideo(app) ? 'Video Interview' : 'Resume Only'}"`,
            `"${app.comments || ''}"`
        ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `applications_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ROLE FUNCTIONS ---
  const handleCreateRole = async () => {
    if (newRole.title && newRole.description) {
      try {
        setIsSaving(true);
        const createdId = await createRoleWithQuestions(newRole);
        onAddRole({ ...newRole as JobRole, id: createdId, questionPool: newRole.questionPool || [] });
        setNewRole({ title: '', description: '', department: '', maxRetakes: 1, questionPool: [], isActive: true, videoRequired: true });
        alert('Position successfully published! 🚀');
        if (onRefreshData) onRefreshData();
      } catch (error) { console.error("Failed to save:", error); alert('Error saving to database.'); } finally { setIsSaving(false); }
    } else { alert("Please enter Title and Description."); }
  };

  // ✅ NEW: HANDLE DELETE ROLE
  const handleDeleteRole = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this Job Role? This action cannot be undone.")) {
        try {
            await deleteRole(id);
            alert("Job Role deleted successfully.");
            if (onRefreshData) onRefreshData();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Error deleting job role.");
        }
    }
  };

  const startEditing = (role: JobRole) => {
    setEditingRole({ 
        ...role, 
        questionPool: [...role.questionPool],
        isActive: role.isActive !== undefined ? role.isActive : true, 
        videoRequired: role.videoRequired !== undefined ? role.videoRequired : true 
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editingRole) {
      try {
        setIsSaving(true);
        await updateRoleData(editingRole);
        onUpdateRole(editingRole);
        if (onRefreshData) { onRefreshData(); } else {
            const freshRoles = await fetchAllRoles();
            const updatedFreshRole = freshRoles.find(r => r.id === editingRole.id);
            if (updatedFreshRole) onUpdateRole(updatedFreshRole);
        }
        setIsEditing(false); setEditingRole(null);
      } catch (error) { console.error("Failed to update:", error); alert('Error updating database.'); } finally { setIsSaving(false); }
    }
  };

  const handleGenerateAIQuestions = async (isForEdit: boolean) => {
    const targetRole = isForEdit ? editingRole : newRole;
    if (!targetRole?.title || !targetRole?.description) { alert("Please enter title and description."); return; }
    setIsGenerating(true);
    try {
      const questions = await generateQuestionsForRole(targetRole.title, targetRole.description);
      const formattedQuestions: Question[] = questions.map((q: any, i: number) => ({ id: `q-${Date.now()}-${i}`, text: q.text, duration: q.duration || 30 }));
      if (isForEdit && editingRole) setEditingRole({ ...editingRole, questionPool: formattedQuestions });
      else setNewRole(prev => ({ ...prev, questionPool: formattedQuestions }));
    } catch (e) { alert("AI Generation failed. Try again."); } finally { setIsGenerating(false); }
  };

  const addQuestion = (isForEdit: boolean) => {
    const newQ: Question = { id: `q-${Date.now()}`, text: 'New Question', duration: 30 };
    if (isForEdit && editingRole) setEditingRole({ ...editingRole, questionPool: [...editingRole.questionPool, newQ] });
    else setNewRole(prev => ({ ...prev, questionPool: [...(prev.questionPool || []), newQ] }));
  };

  const removeQuestion = async (idx: number, isForEdit: boolean) => {
    if (isForEdit && editingRole) {
      const questionToRemove = editingRole.questionPool[idx];
      if (questionToRemove.id && !questionToRemove.id.toString().startsWith('q-')) {
          if(!window.confirm("Delete this question from database?")) return;
          try { await apiDeleteQuestion(questionToRemove.id); } 
          catch(err) { alert("Failed to delete question."); return; }
      }
      const updated = [...editingRole.questionPool];
      updated.splice(idx, 1);
      setEditingRole({ ...editingRole, questionPool: updated });
    } else {
      const updated = [...(newRole.questionPool || [])];
      updated.splice(idx, 1);
      setNewRole(prev => ({ ...prev, questionPool: updated }));
    }
  };

  const updateQuestion = (idx: number, field: keyof Question, value: any, isForEdit: boolean) => {
    if (isForEdit && editingRole) {
      const updated = [...editingRole.questionPool];
      updated[idx] = { ...updated[idx], [field]: value };
      setEditingRole({ ...editingRole, questionPool: updated });
    } else {
      const updated = [...(newRole.questionPool || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      setNewRole(prev => ({ ...prev, questionPool: updated }));
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!reviewApplication) return;
    try {
      await updateApplicationStatus(reviewApplication.id, newStatus);
      if (onRefreshData) onRefreshData();
      setReviewApplication(null);
      alert(`Application marked as ${newStatus}`);
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const viewResume = async (id: string) => {
      try {
          const response = await api.get(`/admin/files/${id}/resume`, { responseType: 'blob' });
          const file = new Blob([response.data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);
          window.open(fileURL, '_blank');
      } catch (e) {
          alert("Could not load resume.");
      }
  };

  const currentReviewRole = reviewApplication ? roles.find(r => r.id === reviewApplication.jobId) : null;

  // ✅ TOGGLE COMPONENT
  const ToggleSwitch = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
      <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div>
              <h3 className="text-xs font-bold text-[#1a1a54] uppercase tracking-widest">{label}</h3>
              <p className={`text-[10px] font-medium ${checked ? 'text-green-600' : 'text-slate-400'}`}>
                  {checked ? 'Enabled' : 'Disabled'}
              </p>
          </div>
          <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); onChange(); }}
              className={`w-12 h-6 rounded-full p-1 relative toggle-track ${checked ? 'bg-green-500' : 'bg-slate-300'}`}
          >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md toggle-thumb ${checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
      </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 anim-fade-in">
      <style>{adminStyles}</style>

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 anim-scale-in">
        <div>
          <h1 className="text-3xl font-black text-[#1a1a54] tracking-tight">Recruiter Panel</h1>
          <p className="text-slate-500 font-medium italic text-sm">New Horizon Educational Institution Recruitment System</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          <button onClick={() => setActiveTab('jobs')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'jobs' ? 'bg-[#1a1a54] text-white shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>Job Roles</button>
          <button onClick={() => setActiveTab('applications')} className={`relative px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'applications' ? 'bg-[#1a1a54] text-white shadow-md transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
            Applications ({applications.length})
            {hasNewApps && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
          </button>
        </div>
      </header>

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 h-fit space-y-3 anim-slide-right" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-bold text-[#1a1a54] flex items-center gap-2 mb-2">Add New Position</h2>
            <div className="space-y-3">
              <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a1a54] outline-none transition-all text-sm" placeholder="Job Title" value={newRole.title} onChange={e => setNewRole(prev => ({ ...prev, title: e.target.value }))}/>
              <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a1a54] outline-none transition-all text-sm" placeholder="Department" value={newRole.department} onChange={e => setNewRole(prev => ({ ...prev, department: e.target.value }))}/>
              <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1a1a54] outline-none h-20 transition-all text-sm" placeholder="Position Details" value={newRole.description} onChange={e => setNewRole(prev => ({ ...prev, description: e.target.value }))}/>
              
              {/* TOGGLES */}
              <div className="grid grid-cols-2 gap-2">
                  <ToggleSwitch label="Online Status" checked={newRole.isActive !== false} onChange={() => setNewRole(prev => ({...prev, isActive: !prev.isActive}))} />
                  <ToggleSwitch label="Video Required" checked={newRole.videoRequired !== false} onChange={() => setNewRole(prev => ({...prev, videoRequired: !prev.videoRequired}))} />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black uppercase text-slate-400">Assessment Steps</span><button onClick={() => handleGenerateAIQuestions(false)} className="text-[#d32f2f] text-[10px] font-black uppercase tracking-widest hover:underline">{isGenerating ? 'Generating...' : 'AI Assist ✨'}</button></div>
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                  {newRole.questionPool?.map((q, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100 anim-scale-in"><input type="text" className="flex-1 bg-transparent text-xs outline-none font-medium" value={q.text} onChange={e => updateQuestion(idx, 'text', e.target.value, false)}/><button onClick={() => removeQuestion(idx, false)} className="text-red-400 hover:text-red-600 font-bold px-1">×</button></div>
                  ))}
                  <button onClick={() => addQuestion(false)} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 font-bold hover:border-[#1a1a54] hover:text-[#1a1a54] transition-all">+ Add Step</button>
                </div>
                <button onClick={handleCreateRole} disabled={isSaving} className="w-full bg-[#d32f2f] text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-50 disabled:opacity-70 transform hover:scale-[1.02] active:scale-95">{isSaving ? 'Saving...' : 'Publish Position'}</button>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1 mb-2">Currently Recruiting</h2>
            {roles.map((role, idx) => (
              <div key={role.id} className={`bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center hover:border-[#1a1a54] transition-all duration-300 group anim-slide-right ${!role.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-[#1a1a54]">{role.title}</h3>
                      <span className="px-2 py-0.5 bg-red-50 text-[#d32f2f] rounded-md text-[10px] uppercase font-black tracking-widest">{role.department}</span>
                      {!role.isActive && <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">OFFLINE</span>}
                  </div>
                  <div className="flex gap-4">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          {role.questionPool.length} Assessment Steps
                          {role.videoRequired ? ' • 🎥 Video On' : ' • 📄 Resume Only'}
                      </span>
                  </div>
                </div>
                {/* ✅ UPDATED ACTION BUTTONS */}
                <div className="flex gap-2">
                    <button onClick={() => startEditing(role)} className="bg-slate-100 text-[#1a1a54] px-5 py-2 rounded-xl text-xs font-black hover:bg-[#1a1a54] hover:text-white transition-all shadow-sm">Edit</button>
                    <button onClick={() => handleDeleteRole(role.id)} className="bg-red-50 text-red-600 px-5 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all shadow-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center anim-scale-in">
                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative">
                        <input type="text" placeholder="Search Name or Email..." className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm w-full md:w-64 focus:border-[#1a1a54] outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                    </div>

                    {/* Submission Type Filter */}
                    <select className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#1a1a54] outline-none bg-white" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                        <option value="all">All Submissions</option>
                        <option value="video">Interview & Resume</option>
                        <option value="resume_only">Resume Only</option>
                    </select>

                    {/* Status Filter */}
                    <select 
                        className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-[#1a1a54] outline-none bg-white" 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="WAITLISTED">Waitlisted</option>
                    </select>

                    {/* Date Filters */}
                    <input type="date" className="px-4 py-3 rounded-xl border border-slate-200 text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <input type="date" className="px-4 py-3 rounded-xl border border-slate-200 text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                
                <button onClick={handleExportCSV} className="px-6 py-3 bg-[#1a1a54] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#151545] shadow-lg flex items-center gap-2 transition-all hover:scale-105">
                    <span>⬇</span> Export CSV
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden anim-scale-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                        <th className="px-6 py-4">Full Name</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Contact & Resume</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredApplications.map((app, idx) => (
                            <tr key={app.id} className="table-row-anim anim-slide-right" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <td className="px-6 py-4"><div className="font-bold text-[#1a1a54]">{app.candidateName}</div><div className="text-[10px] text-slate-400 truncate max-w-[120px] italic">{app.comments}</div></td>
                            <td className="px-6 py-4"><div className="inline-block px-2 py-1 bg-red-50 text-[#d32f2f] rounded-md text-[10px] font-black uppercase tracking-tighter">{roles.find(r => r.id === app.jobId)?.title || "Unknown"}</div></td>
                            <td className="px-6 py-4">
                                {checkHasVideo(app) ? (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100 flex items-center gap-1 w-fit">🎥 Video & Resume</span>
                                ) : (
                                    <span className="px-2 py-1 bg-orange-50 text-orange-600 rounded-md text-[10px] font-bold border border-orange-100 flex items-center gap-1 w-fit">📄 Resume Only</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div><div className="text-xs font-bold text-slate-700">{app.email}</div><div className="text-[10px] text-slate-400 font-bold">{app.phone}</div></div>
                                    <button onClick={() => viewResume(app.id)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors transform hover:scale-110" title="View Resume">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{app.status || 'PENDING'}</span>
                            </td>
                            <td className="px-6 py-4 text-right"><button onClick={() => setReviewApplication(app)} className="px-4 py-2 bg-[#1a1a54] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#d32f2f] transition-all transform hover:scale-105 shadow-sm">Review</button></td>
                            </tr>
                        ))}
                        {filteredApplications.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm font-medium italic">No applications match your filters.</td></tr>}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* ✅ REVIEW MODAL (With Share Feature) */}
      {reviewApplication && (
        <div className="fixed inset-0 z-[100] bg-[#1a1a54]/90 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in">
           <div className="bg-white w-full max-w-5xl h-[80vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row anim-scale-in">
              <div className="w-full md:w-7/12 bg-black flex items-center justify-center relative group">
                  {/* ✅ KEY ADDED: Forces re-render on ID change */}
                  <VideoPlayer 
                    key={reviewApplication.id} 
                    appId={reviewApplication.id} 
                    questions={reviewApplication.askedQuestions || []} 
                  />
              </div>

              <div className="w-full md:w-5/12 bg-white p-6 flex flex-col border-l border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h2 className="text-2xl font-bold text-[#1a1a54] leading-tight">{reviewApplication.candidateName}</h2>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Applying for {currentReviewRole?.title || "Unknown Role"}</span>
                          {!checkHasVideo(reviewApplication) && <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2 py-0.5 rounded uppercase tracking-wide border border-orange-100">Resume Only - Direct Submit</span>}
                      </div>
                      
                      <div className="flex gap-2">
                          {/* ✅ SHARE BUTTON */}
                          <button 
                              onClick={() => {
                                  const link = `${window.location.origin}/share/${reviewApplication.id}`;
                                  navigator.clipboard.writeText(link);
                                  alert("🔗 Public Share Link Copied to Clipboard!\n\nYou can now share this with hiring managers.");
                              }}
                              className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors transform hover:scale-110"
                              title="Copy Share Link"
                          >
                              🔗
                          </button>

                          <button onClick={() => setReviewApplication(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors transform hover:rotate-90 text-sm">✕</button>
                      </div>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm text-xs">📧</div><span className="text-xs font-bold text-slate-700">{reviewApplication.email}</span></div>
                          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm text-xs">📱</div><span className="text-xs font-bold text-slate-700">{reviewApplication.phone}</span></div>
                      </div>
                      <div><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comments</h3><p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">"{reviewApplication.comments || 'No comments.'}"</p></div>
                      <div>
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resume</h3>
                          <button onClick={() => viewResume(reviewApplication.id)} className="w-full py-3 border border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#1a1a54] hover:bg-slate-50 transition-colors hover:scale-[1.02]">View PDF Resume</button>
                      </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Application Decision</h3>
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => handleStatusUpdate('REJECTED')} className="py-3 rounded-xl bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors hover:scale-105">Reject</button>
                          <button onClick={() => handleStatusUpdate('WAITLISTED')} className="py-3 rounded-xl bg-yellow-50 text-yellow-600 font-bold text-[10px] uppercase tracking-widest hover:bg-yellow-100 transition-colors hover:scale-105">Waitlist</button>
                      </div>
                      <button onClick={() => handleStatusUpdate('APPROVED')} className="w-full py-3 rounded-xl bg-green-500 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-green-600 shadow-md shadow-green-100 transition-all transform hover:scale-[1.02]">Approve Application</button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Editing Modal */}
      {isEditing && editingRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1a1a54]/80 backdrop-blur-md anim-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 anim-scale-in">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><h2 className="text-2xl font-black text-[#1a1a54]">Configuration Editor</h2><button onClick={() => setIsEditing(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-600 shadow-sm transition-all transform hover:rotate-90">×</button></div>
              <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-[#1a1a54] font-bold transition-all text-sm" value={editingRole.title} onChange={e => setEditingRole({ ...editingRole, title: e.target.value })} placeholder="Job Title"/>
                    <input className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-[#1a1a54] font-bold transition-all text-sm" value={editingRole.department} onChange={e => setEditingRole({ ...editingRole, department: e.target.value })} placeholder="Department"/>
                    <textarea className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-[#1a1a54] h-40 transition-all text-sm" value={editingRole.description} onChange={e => setEditingRole({ ...editingRole, description: e.target.value })} placeholder="Role Description"/>
                    
                    {/* TOGGLES */}
                    <div className="grid grid-cols-2 gap-2">
                        <ToggleSwitch label="Online Status" checked={editingRole.isActive !== false} onChange={() => setEditingRole({...editingRole, isActive: !editingRole.isActive})} />
                        <ToggleSwitch label="Video Required" checked={editingRole.videoRequired !== false} onChange={() => setEditingRole({...editingRole, videoRequired: !editingRole.videoRequired})} />
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1"><h3 className="text-sm font-black text-[#1a1a54] uppercase tracking-widest">Sequence steps</h3><button onClick={() => handleGenerateAIQuestions(true)} className="text-[#d32f2f] text-[10px] font-black uppercase tracking-widest hover:underline">{isGenerating ? 'Generating...' : 'Regenerate ✨'}</button></div>
                    <div className="space-y-3">
                        {editingRole.questionPool.map((q, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-200 anim-scale-in">
                                <div className="flex gap-3 mb-3"><textarea className="flex-1 bg-white px-3 py-2 rounded-lg border border-slate-100 text-xs outline-none font-medium leading-relaxed" value={q.text} rows={2} onChange={e => updateQuestion(idx, 'text', e.target.value, true)}/><button onClick={() => removeQuestion(idx, true)} className="text-red-400 hover:text-red-600 font-bold px-1 text-lg">×</button></div>
                                <div className="flex items-center gap-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (sec):</label><input type="number" className="w-14 bg-white px-2 py-1 rounded-md border border-slate-200 text-xs font-black text-[#1a1a54] text-center" value={q.duration} onChange={e => updateQuestion(idx, 'duration', parseInt(e.target.value), true)}/></div>
                            </div>
                        ))}
                        <button onClick={() => addQuestion(true)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-[1.5rem] text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:border-[#1a1a54] hover:text-[#1a1a54] transition-all">+ Add Custom Assessment Question</button>
                    </div>
                </div>
             </div>
             <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
                 <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                 <button onClick={handleSaveEdit} disabled={isSaving} className="px-10 py-3 bg-[#1a1a54] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#151545] shadow-md disabled:opacity-70 transform hover:scale-105 active:scale-95 transition-all">{isSaving ? 'Saving...' : 'Apply Changes'}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ VIDEO PLAYER HELPER (With strict check & explicitly typed props)
interface VideoPlayerProps {
    appId: string;
    questions: Question[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ appId, questions }) => {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true; 
        const fetchVideo = async () => {
            try {
                if (!appId) throw new Error("No ID");
                
                const response = await api.get(`/admin/files/${appId}/video`, { responseType: 'blob' });
                // If blob size is tiny, it's likely an empty/dummy file
                if (response.data.size < 100 || response.data.type === "application/json") throw new Error("No video");
                
                const url = URL.createObjectURL(new Blob([response.data]));
                if (isMounted) {
                    setVideoUrl(url);
                    setError(false);
                }
            } catch (e) { 
                if (isMounted) {
                    setError(true);
                    setVideoUrl(null);
                }
            }
        };
        fetchVideo();
        return () => { 
            isMounted = false; 
            if (videoUrl) URL.revokeObjectURL(videoUrl); 
        };
    }, [appId]); 

    // Sync Questions
    useEffect(() => {
        if (!questions || questions.length === 0) return;
        let timeAccumulator = 0;
        let found = false;
        for (const q of questions) {
            const duration = q.duration || 30; 
            if (currentTime >= timeAccumulator && currentTime < timeAccumulator + duration) {
                setActiveQuestion(q);
                found = true;
                break;
            }
            timeAccumulator += duration;
        }
        if (!found && currentTime >= timeAccumulator) setActiveQuestion(null); 
    }, [currentTime, questions]);

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <div className="text-6xl mb-4">📴</div>
                <h3 className="text-lg font-bold text-[#1a1a54]">No Video Interview</h3>
                <p className="text-xs font-medium uppercase tracking-widest text-center mt-2 text-orange-500">Direct Resume Submission</p>
            </div>
        );
    }

    if (!videoUrl) return <div className="text-white/50 animate-pulse">Loading Interview...</div>;

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
            <div className="absolute top-6 inset-x-0 flex flex-col items-center text-center px-4 z-10 pointer-events-none transition-all duration-500">
                {activeQuestion ? (
                    <div className="bg-black/40 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10 shadow-lg anim-scale-in">
                        <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.2em] mb-1 block">NOW ANSWERING</span>
                        {/* @ts-ignore */}
                        <p className="text-sm md:text-base font-medium text-white leading-snug drop-shadow-md">"{activeQuestion.text || activeQuestion.questionText}"</p>
                    </div>
                ) : (
                    <div className="text-white/30 text-[10px] italic mt-4">Candidate finished answering specific questions.</div>
                )}
            </div>
            <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="max-w-full max-h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />
        </div>
    );
};

export default AdminPortal;