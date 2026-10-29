import {
  Student,
  Company,
  Job,
  Skill,
  Application,
  ApplicationStatusHistory,
  EligibilityResult,
  PlacementSummary,
  DashboardMetrics,
  ApplicationStatus,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || res.statusText;
    } catch {
      errorMsg = res.statusText || `HTTP ${res.status}`;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then((r) => handleResponse<{ status: string; mode: string; message: string; version: string }>(r)),

  // Dashboard
  getDashboard: () => fetch(`${API_BASE}/dashboard`).then((r) => handleResponse<DashboardMetrics>(r)),

  // Students
  getStudents: (search?: string, department?: string, minCgpa?: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (department && department !== 'ALL') params.append('department', department);
    if (minCgpa) params.append('minCgpa', minCgpa.toString());
    return fetch(`${API_BASE}/students?${params.toString()}`).then((r) => handleResponse<Student[]>(r));
  },
  getStudentById: (id: number) => fetch(`${API_BASE}/students/${id}`).then((r) => handleResponse<Student>(r)),
  createStudent: (data: Partial<Student>) =>
    fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Student>(r)),
  updateStudent: (id: number, data: Partial<Student>) =>
    fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Student>(r)),
  deleteStudent: (id: number) =>
    fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ message: string }>(r)),

  // Skills
  getSkills: () => fetch(`${API_BASE}/skills`).then((r) => handleResponse<Skill[]>(r)),

  // Companies
  getCompanies: (search?: string, industry?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (industry && industry !== 'ALL') params.append('industry', industry);
    return fetch(`${API_BASE}/companies?${params.toString()}`).then((r) => handleResponse<Company[]>(r));
  },
  getCompanyById: (id: number) => fetch(`${API_BASE}/companies/${id}`).then((r) => handleResponse<Company>(r)),
  createCompany: (data: Partial<Company>) =>
    fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Company>(r)),
  updateCompany: (id: number, data: Partial<Company>) =>
    fetch(`${API_BASE}/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Company>(r)),
  deleteCompany: (id: number) =>
    fetch(`${API_BASE}/companies/${id}`, { method: 'DELETE' }).then((r) => handleResponse<{ message: string }>(r)),

  // Jobs
  getJobs: (search?: string, activeOnly?: boolean) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (activeOnly) params.append('activeOnly', 'true');
    return fetch(`${API_BASE}/jobs?${params.toString()}`).then((r) => handleResponse<Job[]>(r));
  },
  getJobById: (id: number) => fetch(`${API_BASE}/jobs/${id}`).then((r) => handleResponse<Job>(r)),
  createJob: (data: Partial<Job>) =>
    fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<Job>(r)),
  setJobStatus: (id: number, is_active: 'Y' | 'N') =>
    fetch(`${API_BASE}/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    }).then((r) => handleResponse<{ message: string }>(r)),

  // Eligibility
  checkEligibility: (student_id: number, job_id: number) =>
    fetch(`${API_BASE}/eligibility/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, job_id }),
    }).then((r) => handleResponse<EligibilityResult>(r)),
  getJobEligibilityMatrix: (jobId: number) =>
    fetch(`${API_BASE}/jobs/${jobId}/eligibility`).then((r) =>
      handleResponse<{ job: Job; eligibleStudents: EligibilityResult[]; ineligibleStudents: EligibilityResult[] }>(r)
    ),

  // Applications
  getApplications: (status?: string, jobId?: number, studentId?: number) => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (jobId) params.append('jobId', jobId.toString());
    if (studentId) params.append('studentId', studentId.toString());
    return fetch(`${API_BASE}/applications?${params.toString()}`).then((r) => handleResponse<Application[]>(r));
  },
  createApplication: (student_id: number, job_id: number) =>
    fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, job_id }),
    }).then((r) => handleResponse<Application>(r)),
  updateApplicationStatus: (id: number, status: ApplicationStatus) =>
    fetch(`${API_BASE}/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => handleResponse<Application>(r)),
  getApplicationHistory: (id: number) =>
    fetch(`${API_BASE}/applications/${id}/history`).then((r) => handleResponse<ApplicationStatusHistory[]>(r)),

  // Reports
  getPlacementSummary: () => fetch(`${API_BASE}/reports/placements`).then((r) => handleResponse<PlacementSummary>(r)),

  // Demo Reset
  resetDemoData: () =>
    fetch(`${API_BASE}/demo/reset`, { method: 'POST' }).then((r) => handleResponse<{ message: string }>(r)),
};
