import api from './api';
import { JobRole, Question } from '../types';
import { decryptData } from '../utils/security'; // ✅ Import Decryption Utility

// --- Types matching your Java Backend Models ---
interface BackendRole {
  id?: string;
  jobTitle: string;       
  department: string;
  positionDetails: string;
  
  // ✅ NEW FIELDS (Match Java Model)
  isActive?: boolean;
  videoRequired?: boolean;
}

// ✅ Matches your Java Backend Question Model
interface BackendQuestion {
  id?: string;
  roleId: string;
  text: string;    
  duration: number;
}

// --- Service Methods ---

export const fetchAllRoles = async (): Promise<JobRole[]> => {
  try {
    const roleRes = await api.get<BackendRole[]>('/admin/roles');
    const backendRoles = roleRes.data;

    const fullRoles = await Promise.all(
      backendRoles.map(async (role) => {
        try {
          // ✅ Fetch Questions
          const qRes = await api.get<BackendQuestion[] | string>(`/admin/questions?roleId=${role.id}`);
          
          let questionsData: BackendQuestion[] = [];

          // ✅ DECRYPTION LOGIC
          if (typeof qRes.data === 'string') {
              const decrypted = decryptData(qRes.data);
              if (decrypted) {
                  questionsData = decrypted;
              } else {
                  console.error(`Failed to decrypt questions for role ${role.id}`);
              }
          } else {
              questionsData = qRes.data;
          }
          
          return {
            id: role.id!,
            title: role.jobTitle,
            department: role.department,
            description: role.positionDetails,
            
            // ✅ MAP BACKEND FIELDS (Default to true if missing)
            isActive: role.isActive !== false, 
            videoRequired: role.videoRequired !== false,
            
            maxRetakes: 1, 
            questionPool: questionsData.map(q => ({
              id: q.id!,
              text: q.text, 
              duration: q.duration
            }))
          };
        } catch (err) {
          console.error(`Error fetching questions for role ${role.id}`, err);
          return {
            id: role.id!,
            title: role.jobTitle,
            department: role.department,
            description: role.positionDetails,
            isActive: true,
            videoRequired: true,
            maxRetakes: 1,
            questionPool: []
          };
        }
      })
    );
    return fullRoles;
  } catch (error) {
    console.error("Error fetching all roles:", error);
    throw error;
  }
};

export const createRoleWithQuestions = async (newRole: Partial<JobRole>) => {
  const rolePayload: BackendRole = {
    jobTitle: newRole.title!,
    department: newRole.department!,
    positionDetails: newRole.description!,
    isActive: newRole.isActive,
    videoRequired: newRole.videoRequired
  };

  const roleRes = await api.post<BackendRole>('/admin/roles', rolePayload);
  const createdRoleId = roleRes.data.id!;

  if (newRole.questionPool && newRole.questionPool.length > 0) {
    await Promise.all(newRole.questionPool.map(async (q, index) => {
      const qPayload: BackendQuestion = {
        roleId: createdRoleId,
        text: q.text,
        duration: q.duration
      };
      
      try {
        await api.post('/admin/questions', qPayload);
      } catch (err) {
        console.error(`❌ Failed to save question ${index + 1}:`, err);
      }
    }));
  }

  return createdRoleId;
};

export const updateRoleData = async (role: JobRole) => {
  const rolePayload: BackendRole = {
    id: role.id,
    jobTitle: role.title,
    department: role.department,
    positionDetails: role.description,
    isActive: role.isActive,
    videoRequired: role.videoRequired
  };
  await api.put(`/admin/roles/${role.id}`, rolePayload);

  if (role.questionPool && role.questionPool.length > 0) {
    await Promise.all(role.questionPool.map(async (q) => {
      const isNewQuestion = typeof q.id === 'string' && q.id.startsWith('q-');

      const qPayload: BackendQuestion = {
        roleId: role.id, 
        text: q.text,
        duration: q.duration
      };

      try {
        if (isNewQuestion) {
          await api.post('/admin/questions', qPayload);
        } else {
          await api.put(`/admin/questions/${q.id}`, qPayload);
        }
      } catch (err) {
        console.error("❌ Failed to sync question:", q.text, err);
      }
    }));
  }
};

// ✅ UPDATED: Clean delete function matching AdminPortal
export const deleteRole = async (roleId: string) => {
  // Uses the endpoint you already have in RoleController.java
  await api.delete(`/admin/roles/${roleId}`);
};

export const deleteQuestion = async (questionId: string) => {
  await api.delete(`/admin/questions/${questionId}`);
};