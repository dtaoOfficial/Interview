import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Question } from '../types';

interface VideoRecorderProps {
  questions: Question[];
  maxRetakes: number;
  onComplete: (videoBlob: Blob) => void;
  onRetake: () => void;
  retakesRemaining: number;
}

// ✅ CUSTOM STYLES
const styles = `
  .text-stroke-sm {
    -webkit-text-stroke: 0.5px black;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  }
  .text-stroke-lg {
    -webkit-text-stroke: 1px black;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  }
`;

const VideoRecorder: React.FC<VideoRecorderProps> = ({ 
  questions, 
  maxRetakes, 
  onComplete, 
  onRetake,
  retakesRemaining
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(questions[0]?.duration || 30);
  
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize camera
  useEffect(() => {
    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, 
          audio: { echoCancellation: true, noiseSuppression: true } 
        });
        setPreviewStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Camera access denied or not available.");
      }
    };
    startPreview();
    return () => { if (previewStream) previewStream.getTracks().forEach(t => t.stop()); };
  }, []);

  const startRecording = useCallback(() => {
    if (!previewStream) return;
    chunksRef.current = [];
    
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
      ? 'video/webm;codecs=vp9,opus' 
      : 'video/webm';

    try {
      const mediaRecorder = new MediaRecorder(previewStream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setIsReviewing(true);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.muted = false;
          videoRef.current.controls = true;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setCurrentQuestionIndex(0);
      setTimeLeft(questions[0]?.duration || 30);
      
    } catch (e) { console.error("Rec failed", e); }
  }, [previewStream, questions]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  useEffect(() => {
    let timer: number;
    if (isRecording && timeLeft > 0) {
      timer = window.setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (isRecording && timeLeft === 0) {
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setTimeLeft(questions[nextIndex]?.duration || 30);
      } else {
        stopRecording();
      }
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft, currentQuestionIndex, questions, stopRecording]);

  const handleRetake = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setIsReviewing(false);
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = previewStream;
      videoRef.current.muted = true;
      videoRef.current.controls = false;
    }
    onRetake();
  };

  const handleUpload = () => {
    if (recordedBlob) onComplete(recordedBlob);
  };

  const currentQuestion = questions[currentQuestionIndex];
  // @ts-ignore
  const questionText = currentQuestion?.text || currentQuestion?.questionText || "Loading question...";

  return (
    // ✅ MAIN CONTAINER: 
    // - Desktop: aspect-video (Box Shape)
    // - Mobile: min-h-screen (Full Scrolling Page, No Box Shape)
    <div className="w-full max-w-5xl mx-auto md:aspect-video md:bg-black md:rounded-3xl md:overflow-hidden md:relative md:border border-white/20 shadow-2xl flex flex-col md:block bg-slate-50">
      <style>{styles}</style>
      
      {/* ========================================================= */}
      {/* 🎥 VIDEO AREA */}
      {/* Mobile: Top 400px fixed height. Desktop: Full absolute cover */}
      {/* ========================================================= */}
      <div className={`relative w-full transition-all duration-500 bg-black ${isRecording ? 'h-[50vh] md:h-full' : 'h-[400px] md:h-full md:absolute md:inset-0'}`}>
         <video 
            ref={videoRef} 
            autoPlay 
            muted={!isReviewing} 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-700 ${isRecording ? 'opacity-100' : 'opacity-80'}`}
         />
         
         {/* DESKTOP ONLY: Dark overlay for instructions visibility */}
         {!isRecording && !isReviewing && (
             <div className="hidden md:block absolute inset-0 bg-[#1a1a54]/80 backdrop-blur-sm"></div>
         )}
      </div>

      {/* ========================================================= */}
      {/* 🟢 START SCREEN (INSTRUCTIONS) */}
      {/* Mobile: Sits BELOW video (Scrollable). Desktop: Overlays VIDEO */}
      {/* ========================================================= */}
      {!isRecording && !isReviewing && (
        <div className="relative md:absolute md:inset-0 z-20 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="w-full max-w-lg bg-white p-6 md:p-8 rounded-3xl md:bg-white/10 md:backdrop-blur-xl md:border md:border-white/20 md:text-white shadow-xl md:shadow-2xl">
              
              <h3 className="text-2xl font-black text-[#1a1a54] md:text-white mb-6 uppercase tracking-wider text-center">
                Interview Guide
              </h3>
              
              {/* Instructions List */}
              <div className="space-y-3 mb-8">
                 {[
                    `Ensure good lighting & clear audio`,
                    `Answer ${questions.length} questions total`,
                    `Strict timer per question`,
                    `Preview & Retake available`
                 ].map((text, i) => (
                   <div key={i} className="flex items-center gap-3 bg-slate-50 md:bg-black/40 p-3 rounded-xl border border-slate-100 md:border-white/5">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 md:bg-green-500/20 md:text-green-400 flex items-center justify-center text-xs font-bold">✓</div>
                      <span className="text-slate-600 md:text-slate-100 text-sm font-medium">{text}</span>
                   </div>
                 ))}
              </div>

              {/* Start Button */}
              <button 
                onClick={startRecording} 
                className="w-full bg-[#d32f2f] hover:bg-red-700 text-white py-4 rounded-xl font-bold text-sm md:text-base shadow-lg shadow-red-900/20 md:shadow-red-900/50 transform transition hover:scale-[1.02] uppercase tracking-widest"
              >
                Start Interview
              </button>

              {/* Mobile Only Note */}
              <p className="md:hidden text-center text-xs text-slate-400 mt-4 font-medium">
                 Scroll down if you need more space
              </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🔴 RECORDING HUD (Overlay on Video) */}
      {/* Works same on Mobile & Desktop because video container is relative */}
      {/* ========================================================= */}
      {isRecording && (
        <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-30">
             {/* Live Badge */}
             <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest animate-pulse shadow-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full"></div> REC
             </div>

             {/* Timer */}
             <div className="flex flex-col items-end">
                <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mb-1 bg-black/40 px-2 rounded">Time Left</span>
                <span className={`text-3xl md:text-5xl font-black tabular-nums drop-shadow-lg ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                   {timeLeft}s
                </span>
             </div>
        </div>
      )}

      {/* QUESTION TEXT (Bottom of Video Area) */}
      {isRecording && (
        <div className="absolute top-[250px] md:bottom-8 left-0 right-0 flex justify-center px-4 z-30">
             <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-2xl max-w-3xl w-full text-center shadow-2xl">
                <span className="block text-[10px] md:text-xs font-black text-red-300 uppercase tracking-[0.2em] mb-2">
                   Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <p className="text-lg md:text-2xl font-bold text-white leading-snug text-stroke-sm md:text-stroke-lg">
                   "{questionText}"
                </p>
             </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🔵 REVIEW SCREEN */}
      {/* Mobile: Sits BELOW video. Desktop: Overlays VIDEO */}
      {/* ========================================================= */}
      {isReviewing && (
        <div className="relative md:absolute md:inset-0 z-40 flex items-center justify-center p-6 bg-slate-50 md:bg-black/60 md:backdrop-blur-sm animate-in zoom-in duration-300">
           
           <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-xl md:shadow-2xl text-center border border-slate-100 md:border-[#1a1a54]">
              <div className="w-16 h-16 bg-blue-50 text-[#1a1a54] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                 👀
              </div>
              <h3 className="text-xl font-black text-[#1a1a54] mb-2">Review Your Answer</h3>
              <p className="text-slate-500 text-sm mb-6">Check your video above before submitting. Ensure audio is clear.</p>
              
              <div className="space-y-3">
                 <button onClick={handleUpload} className="w-full bg-[#1a1a54] hover:bg-[#2a2a84] text-white py-4 rounded-xl font-bold text-sm shadow-lg transition-transform hover:scale-[1.02]">
                    Submit Video
                 </button>
                 
                 {retakesRemaining > 0 && (
                   <button onClick={handleRetake} className="w-full bg-white border-2 border-slate-200 text-slate-500 hover:border-red-400 hover:text-red-500 py-4 rounded-xl font-bold text-sm transition-colors">
                      Retake ({retakesRemaining} left)
                   </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;