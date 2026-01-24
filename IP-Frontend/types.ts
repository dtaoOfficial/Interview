export enum AppView {
  CANDIDATE_JOBS = 'CANDIDATE_JOBS',
  CANDIDATE_APPLICATION = 'CANDIDATE_APPLICATION',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}

export enum ApplicationStep {
  FORM = 'FORM',
  PERMISSION_INFO = 'PERMISSION_INFO',
  VIDEO_INTERVIEW = 'VIDEO_INTERVIEW'
}

export interface Question {
  id?: string; // Optional because new questions on frontend don't have DB IDs yet
  text: string;
  duration: number; // seconds this question should be on screen
}

export interface JobRole {
  id: string;
  title: string;
  department: string;
  description: string;
  questionPool: Question[];
  maxRetakes: number;

  // ✅ NEW FIELDS (Match Backend Toggles)
  isActive?: boolean;       // Online/Offline status
  videoRequired?: boolean;  // Is video interview needed?
}

export interface Application {
  id: string;
  jobId: string;
  candidateName: string;
  phone: string;
  email: string;
  resumeUrl: string;
  
  // ✅ Update: Can be null if video was not required
  videoUrl: string | null; 
  
  comments: string;
  
  // ✅ Optional to prevent crashes with old data
  askedQuestions?: Question[]; 
  
  // ✅ Strict typing for status
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED';
}