import api from './api'; // ✅ Import your API instance (handles Base URL & Tokens)
import { Application, Question } from '../types'; 

// Define the shape of the data we need to send
interface ApplicationPayload {
  jobId: string;
  name: string;
  email: string;
  phone: string;
  comments: string;
  resume: File;       // The actual PDF file
  video: Blob;        // The recorded Video Blob
  
  // ✅ NEW: Receive the list of questions asked to the candidate
  askedQuestions: Question[]; 
}

// 1. Submit Application (Public - No Token Required)
export const submitApplication = async (data: ApplicationPayload) => {
  const formData = new FormData();

  // Append Text Data
  formData.append('jobId', data.jobId);
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('comments', data.comments || '');

  // ✅ CONVERT QUESTIONS TO JSON STRING & SEND
  formData.append('questions', JSON.stringify(data.askedQuestions));

  // Append Files
  formData.append('resume', data.resume);
  
  // Give the blob a filename so Java accepts it as a file
  formData.append('video', data.video, 'interview_recording.webm');

  // ✅ FIX: Use 'api' instead of 'axios' to use the relative path (/api) defined in api.ts
  // This automatically handles the base URL (e.g., /api/public/apply)
  const response = await api.post('/public/apply', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// 2. ✅ Fetch All Applications (Admin - Requires Token)
export const fetchAllApplications = async (): Promise<Application[]> => {
  try {
    // Uses 'api' so it attaches "Authorization: Bearer <token>" automatically
    const response = await api.get<Application[]>('/admin/applications');
    return response.data;
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

// 3. ✅ Update Application Status (Approve/Reject)
export const updateApplicationStatus = async (id: string, status: string) => {
  try {
    const response = await api.put(`/admin/applications/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};