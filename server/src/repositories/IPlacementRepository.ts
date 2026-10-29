import {
  Student,
  Company,
  Job,
  Skill,
  Application,
  ApplicationStatusHistory,
  EligibilityResult,
  PlacementSummary,
  ApplicationStatus,
} from '../types/models.js';

export interface IPlacementRepository {
  // Students
  getStudents(search?: string, department?: string, minCgpa?: number): Promise<Student[]>;
  getStudentById(id: number): Promise<Student | null>;
  createStudent(data: Omit<Student, 'student_id' | 'created_at'>): Promise<Student>;
  updateStudent(id: number, data: Partial<Student>): Promise<Student>;
  deleteStudent(id: number): Promise<boolean>;

  // Skills
  getSkills(): Promise<Skill[]>;
  getStudentSkills(studentId: number): Promise<string[]>;
  addStudentSkill(studentId: number, skillId: number): Promise<boolean>;

  // Companies
  getCompanies(search?: string, industry?: string): Promise<Company[]>;
  getCompanyById(id: number): Promise<Company | null>;
  createCompany(data: Omit<Company, 'company_id' | 'created_at'>): Promise<Company>;
  updateCompany(id: number, data: Partial<Company>): Promise<Company>;
  deleteCompany(id: number): Promise<boolean>;

  // Jobs
  getJobs(search?: string, isActiveOnly?: boolean): Promise<Job[]>;
  getJobById(id: number): Promise<Job | null>;
  createJob(data: Omit<Job, 'job_id' | 'created_at'>): Promise<Job>;
  setJobStatus(jobId: number, isActive: 'Y' | 'N'): Promise<boolean>;

  // Eligibility Engine
  checkEligibility(studentId: number, jobId: number): Promise<EligibilityResult>;
  getJobEligibilityMatrix(jobId: number): Promise<{
    job: Job;
    eligibleStudents: EligibilityResult[];
    ineligibleStudents: EligibilityResult[];
  }>;

  // Applications
  getApplications(status?: string, jobId?: number, studentId?: number): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | null>;
  createApplication(studentId: number, jobId: number): Promise<Application>;
  updateApplicationStatus(applicationId: number, newStatus: ApplicationStatus): Promise<Application>;
  getApplicationHistory(applicationId: number): Promise<ApplicationStatusHistory[]>;

  // Reports & Dashboard
  getPlacementSummary(): Promise<PlacementSummary>;
  getDashboardMetrics(): Promise<any>;
  resetDemoData(): Promise<boolean>;
}
