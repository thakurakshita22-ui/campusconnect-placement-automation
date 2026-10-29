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
import { IPlacementRepository } from './IPlacementRepository.js';

export class DemoPlacementRepository implements IPlacementRepository {
  private students: Student[] = [];
  private skills: Skill[] = [];
  private studentSkills: Map<number, Set<number>> = new Map();
  private companies: Company[] = [];
  private jobs: Job[] = [];
  private applications: Application[] = [];
  private history: ApplicationStatusHistory[] = [];

  private nextStudentId = 1011;
  private nextCompanyId = 506;
  private nextJobId = 209;
  private nextAppId = 8016;
  private nextHistoryId = 100;

  constructor() {
    this.seedData();
  }

  private seedData() {
    this.skills = [
      { skill_id: 1, skill_name: 'Java' },
      { skill_id: 2, skill_name: 'Python' },
      { skill_id: 3, skill_name: 'Oracle SQL' },
      { skill_id: 4, skill_name: 'PL/SQL' },
      { skill_id: 5, skill_name: 'React' },
      { skill_id: 6, skill_name: 'Spring Boot' },
      { skill_id: 7, skill_name: 'Cloud Computing (AWS)' },
      { skill_id: 8, skill_name: 'Machine Learning' },
    ];

    this.companies = [
      { company_id: 501, company_name: 'Google Cloud', industry: 'Information Technology', contact_email: 'campus-recruiting@google.com', created_at: '2025-01-10T10:00:00Z', total_openings_posted: 2, active_drives_count: 1 },
      { company_id: 502, company_name: 'Microsoft Corporation', industry: 'Software Engineering', contact_email: 'university-hires@microsoft.com', created_at: '2025-01-12T11:30:00Z', total_openings_posted: 2, active_drives_count: 2 },
      { company_id: 503, company_name: 'Amazon Web Services', industry: 'Cloud & E-Commerce', contact_email: 'aws-placement@amazon.com', created_at: '2025-01-15T09:15:00Z', total_openings_posted: 1, active_drives_count: 1 },
      { company_id: 504, company_name: 'Tata Consultancy Services', industry: 'IT Services & Consulting', contact_email: 'campus.connect@tcs.com', created_at: '2025-01-18T14:00:00Z', total_openings_posted: 2, active_drives_count: 2 },
      { company_id: 505, company_name: 'Infosys Limited', industry: 'IT Solutions', contact_email: 'talent.acquisition@infosys.com', created_at: '2025-01-20T16:45:00Z', total_openings_posted: 1, active_drives_count: 1 },
    ];

    this.students = [
      { student_id: 1001, student_name: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', cgpa: 9.45, graduation_year: 2025, active_backlogs: 0, department: 'Computer Science', created_at: '2025-01-05T08:00:00Z', skills: ['Java', 'Python', 'Oracle SQL', 'PL/SQL', 'Cloud Computing (AWS)', 'Machine Learning'], placement_status: 'PLACED' },
      { student_id: 1002, student_name: 'Diya Patel', email: 'diya.patel@campus.edu', cgpa: 8.80, graduation_year: 2025, active_backlogs: 0, department: 'Computer Science', created_at: '2025-01-05T08:30:00Z', skills: ['Java', 'Oracle SQL', 'React', 'Spring Boot'], placement_status: 'PLACED' },
      { student_id: 1003, student_name: 'Rohan Iyer', email: 'rohan.iyer@campus.edu', cgpa: 8.20, graduation_year: 2025, active_backlogs: 0, department: 'Information Technology', created_at: '2025-01-06T09:00:00Z', skills: ['Java', 'Oracle SQL', 'PL/SQL', 'Cloud Computing (AWS)'], placement_status: 'PLACED' },
      { student_id: 1004, student_name: 'Ananya Sen', email: 'ananya.sen@campus.edu', cgpa: 7.10, graduation_year: 2025, active_backlogs: 0, department: 'Data Science', created_at: '2025-01-06T09:45:00Z', skills: ['Python', 'Oracle SQL', 'Machine Learning'], placement_status: 'SEEKING' },
      { student_id: 1005, student_name: 'Vikram Malhotra', email: 'vikram.m@campus.edu', cgpa: 6.90, graduation_year: 2025, active_backlogs: 1, department: 'Electronics', created_at: '2025-01-07T10:15:00Z', skills: ['Java', 'Oracle SQL'], placement_status: 'SEEKING' },
      { student_id: 1006, student_name: 'Neha Verma', email: 'neha.verma@campus.edu', cgpa: 5.80, graduation_year: 2025, active_backlogs: 3, department: 'Computer Science', created_at: '2025-01-07T11:00:00Z', skills: ['Python', 'React'], placement_status: 'SEEKING' },
      { student_id: 1007, student_name: 'Kabir Joshi', email: 'kabir.joshi@campus.edu', cgpa: 9.10, graduation_year: 2026, active_backlogs: 0, department: 'Computer Science', created_at: '2025-01-08T12:00:00Z', skills: ['Python', 'Cloud Computing (AWS)', 'Machine Learning'], placement_status: 'SEEKING' },
      { student_id: 1008, student_name: 'Pooja Nair', email: 'pooja.nair@campus.edu', cgpa: 8.40, graduation_year: 2024, active_backlogs: 0, department: 'Information Technology', created_at: '2025-01-08T13:30:00Z', skills: ['Java', 'Oracle SQL', 'Spring Boot', 'Cloud Computing (AWS)'], placement_status: 'PLACED' },
      { student_id: 1009, student_name: 'Karthik Reddy', email: 'karthik.r@campus.edu', cgpa: 7.65, graduation_year: 2025, active_backlogs: 0, department: 'Computer Science', created_at: '2025-01-09T14:00:00Z', skills: ['Java', 'Oracle SQL', 'React'], placement_status: 'SEEKING' },
      { student_id: 1010, student_name: 'Sneha Kulkarni', email: 'sneha.k@campus.edu', cgpa: 6.10, graduation_year: 2025, active_backlogs: 0, department: 'Electrical', created_at: '2025-01-09T15:00:00Z', skills: ['Oracle SQL'], placement_status: 'SEEKING' },
    ];

    this.studentSkills.clear();
    this.studentSkills.set(1001, new Set([1, 2, 3, 4, 7, 8]));
    this.studentSkills.set(1002, new Set([1, 3, 5, 6]));
    this.studentSkills.set(1003, new Set([1, 3, 4, 7]));
    this.studentSkills.set(1004, new Set([2, 3, 8]));
    this.studentSkills.set(1005, new Set([1, 3]));
    this.studentSkills.set(1006, new Set([2, 5]));
    this.studentSkills.set(1007, new Set([2, 7, 8]));
    this.studentSkills.set(1008, new Set([1, 3, 6, 7]));
    this.studentSkills.set(1009, new Set([1, 3, 5]));
    this.studentSkills.set(1010, new Set([3]));

    this.jobs = [
      { job_id: 201, company_id: 501, company_name: 'Google Cloud', job_title: 'Cloud Systems Engineer', package_lpa: 28.50, minimum_cgpa: 8.50, maximum_backlogs: 0, is_active: 'Y', created_at: '2025-01-15T10:00:00Z', eligible_batches: [2025], mandatory_skills: ['Python', 'Cloud Computing (AWS)'] },
      { job_id: 202, company_id: 502, company_name: 'Microsoft Corporation', job_title: 'Software Development Engineer', package_lpa: 24.00, minimum_cgpa: 8.00, maximum_backlogs: 0, is_active: 'Y', created_at: '2025-01-16T11:00:00Z', eligible_batches: [2024, 2025], mandatory_skills: ['Java', 'Spring Boot'] },
      { job_id: 203, company_id: 503, company_name: 'Amazon Web Services', job_title: 'Cloud Solutions Associate', package_lpa: 19.50, minimum_cgpa: 7.50, maximum_backlogs: 0, is_active: 'Y', created_at: '2025-01-17T12:00:00Z', eligible_batches: [2025], mandatory_skills: ['Oracle SQL', 'Cloud Computing (AWS)'] },
      { job_id: 204, company_id: 504, company_name: 'Tata Consultancy Services', job_title: 'Database & PL/SQL Developer', package_lpa: 9.00, minimum_cgpa: 7.00, maximum_backlogs: 0, is_active: 'Y', created_at: '2025-01-18T13:00:00Z', eligible_batches: [2025], mandatory_skills: ['Oracle SQL', 'PL/SQL'] },
      { job_id: 205, company_id: 505, company_name: 'Infosys Limited', job_title: 'Specialist Programmer', package_lpa: 9.50, minimum_cgpa: 7.00, maximum_backlogs: 1, is_active: 'Y', created_at: '2025-01-19T14:00:00Z', eligible_batches: [2025], mandatory_skills: ['Java'] },
      { job_id: 206, company_id: 502, company_name: 'Microsoft Corporation', job_title: 'Full Stack Web Engineer', package_lpa: 22.00, minimum_cgpa: 7.80, maximum_backlogs: 0, is_active: 'Y', created_at: '2025-01-20T15:00:00Z', eligible_batches: [2025], mandatory_skills: ['Java', 'React'] },
      { job_id: 207, company_id: 501, company_name: 'Google Cloud', job_title: 'AI/ML Research Intern', package_lpa: 18.00, minimum_cgpa: 9.00, maximum_backlogs: 0, is_active: 'N', created_at: '2025-01-21T16:00:00Z', eligible_batches: [2025, 2026], mandatory_skills: ['Python', 'Machine Learning'] },
      { job_id: 208, company_id: 504, company_name: 'Tata Consultancy Services', job_title: 'Systems Engineer Trainee', package_lpa: 4.50, minimum_cgpa: 6.00, maximum_backlogs: 1, is_active: 'Y', created_at: '2025-01-22T17:00:00Z', eligible_batches: [2024, 2025], mandatory_skills: ['Oracle SQL'] },
    ];

    this.applications = [
      { application_id: 8001, student_id: 1001, student_name: 'Aarav Sharma', student_email: 'aarav.sharma@campus.edu', cgpa: 9.45, job_id: 201, job_title: 'Cloud Systems Engineer', company_name: 'Google Cloud', package_lpa: 28.50, application_status: 'SELECTED', applied_at: '2025-01-25T10:00:00Z', updated_at: '2025-02-10T14:30:00Z' },
      { application_id: 8002, student_id: 1001, student_name: 'Aarav Sharma', student_email: 'aarav.sharma@campus.edu', cgpa: 9.45, job_id: 203, job_title: 'Cloud Solutions Associate', company_name: 'Amazon Web Services', package_lpa: 19.50, application_status: 'SHORTLISTED', applied_at: '2025-01-26T11:00:00Z', updated_at: '2025-02-05T12:00:00Z' },
      { application_id: 8003, student_id: 1002, student_name: 'Diya Patel', student_email: 'diya.patel@campus.edu', cgpa: 8.80, job_id: 202, job_title: 'Software Development Engineer', company_name: 'Microsoft Corporation', package_lpa: 24.00, application_status: 'SELECTED', applied_at: '2025-01-25T11:30:00Z', updated_at: '2025-02-12T16:00:00Z' },
      { application_id: 8004, student_id: 1002, student_name: 'Diya Patel', student_email: 'diya.patel@campus.edu', cgpa: 8.80, job_id: 206, job_title: 'Full Stack Web Engineer', company_name: 'Microsoft Corporation', package_lpa: 22.00, application_status: 'APPLIED', applied_at: '2025-01-28T09:00:00Z', updated_at: '2025-01-28T09:00:00Z' },
      { application_id: 8005, student_id: 1003, student_name: 'Rohan Iyer', student_email: 'rohan.iyer@campus.edu', cgpa: 8.20, job_id: 204, job_title: 'Database & PL/SQL Developer', company_name: 'Tata Consultancy Services', package_lpa: 9.00, application_status: 'SELECTED', applied_at: '2025-01-24T14:00:00Z', updated_at: '2025-02-14T10:15:00Z' },
      { application_id: 8006, student_id: 1003, student_name: 'Rohan Iyer', student_email: 'rohan.iyer@campus.edu', cgpa: 8.20, job_id: 203, job_title: 'Cloud Solutions Associate', company_name: 'Amazon Web Services', package_lpa: 19.50, application_status: 'SHORTLISTED', applied_at: '2025-01-27T10:45:00Z', updated_at: '2025-02-06T11:00:00Z' },
      { application_id: 8007, student_id: 1004, student_name: 'Ananya Sen', student_email: 'ananya.sen@campus.edu', cgpa: 7.10, job_id: 208, job_title: 'Systems Engineer Trainee', company_name: 'Tata Consultancy Services', package_lpa: 4.50, application_status: 'SHORTLISTED', applied_at: '2025-01-29T15:20:00Z', updated_at: '2025-02-08T14:00:00Z' },
      { application_id: 8008, student_id: 1005, student_name: 'Vikram Malhotra', student_email: 'vikram.m@campus.edu', cgpa: 6.90, job_id: 205, job_title: 'Specialist Programmer', company_name: 'Infosys Limited', package_lpa: 9.50, application_status: 'SHORTLISTED', applied_at: '2025-01-30T16:00:00Z', updated_at: '2025-02-09T13:45:00Z' },
      { application_id: 8009, student_id: 1005, student_name: 'Vikram Malhotra', student_email: 'vikram.m@campus.edu', cgpa: 6.90, job_id: 208, job_title: 'Systems Engineer Trainee', company_name: 'Tata Consultancy Services', package_lpa: 4.50, application_status: 'APPLIED', applied_at: '2025-02-01T11:00:00Z', updated_at: '2025-02-01T11:00:00Z' },
      { application_id: 8010, student_id: 1008, student_name: 'Pooja Nair', student_email: 'pooja.nair@campus.edu', cgpa: 8.40, job_id: 202, job_title: 'Software Development Engineer', company_name: 'Microsoft Corporation', package_lpa: 24.00, application_status: 'SELECTED', applied_at: '2025-01-25T13:00:00Z', updated_at: '2025-02-11T17:00:00Z' },
      { application_id: 8011, student_id: 1008, student_name: 'Pooja Nair', student_email: 'pooja.nair@campus.edu', cgpa: 8.40, job_id: 203, job_title: 'Cloud Solutions Associate', company_name: 'Amazon Web Services', package_lpa: 19.50, application_status: 'REJECTED', applied_at: '2025-01-27T12:00:00Z', updated_at: '2025-02-03T15:30:00Z' },
      { application_id: 8012, student_id: 1009, student_name: 'Karthik Reddy', student_email: 'karthik.r@campus.edu', cgpa: 7.65, job_id: 206, job_title: 'Full Stack Web Engineer', company_name: 'Microsoft Corporation', package_lpa: 22.00, application_status: 'SHORTLISTED', applied_at: '2025-01-29T10:00:00Z', updated_at: '2025-02-07T11:15:00Z' },
      { application_id: 8013, student_id: 1009, student_name: 'Karthik Reddy', student_email: 'karthik.r@campus.edu', cgpa: 7.65, job_id: 208, job_title: 'Systems Engineer Trainee', company_name: 'Tata Consultancy Services', package_lpa: 4.50, application_status: 'APPLIED', applied_at: '2025-02-02T14:30:00Z', updated_at: '2025-02-02T14:30:00Z' },
      { application_id: 8014, student_id: 1010, student_name: 'Sneha Kulkarni', student_email: 'sneha.k@campus.edu', cgpa: 6.10, job_id: 208, job_title: 'Systems Engineer Trainee', company_name: 'Tata Consultancy Services', package_lpa: 4.50, application_status: 'APPLIED', applied_at: '2025-02-03T09:15:00Z', updated_at: '2025-02-03T09:15:00Z' },
      { application_id: 8015, student_id: 1001, student_name: 'Aarav Sharma', student_email: 'aarav.sharma@campus.edu', cgpa: 9.45, job_id: 204, job_title: 'Database & PL/SQL Developer', company_name: 'Tata Consultancy Services', package_lpa: 9.00, application_status: 'WITHDRAWN', applied_at: '2025-01-24T10:00:00Z', updated_at: '2025-02-11T12:00:00Z' },
    ];

    this.history = [
      { history_id: 1, application_id: 8001, old_status: 'APPLIED', new_status: 'SHORTLISTED', changed_at: '2025-02-01T10:00:00Z', changed_by: 'ADMIN_PORTAL' },
      { history_id: 2, application_id: 8001, old_status: 'SHORTLISTED', new_status: 'SELECTED', changed_at: '2025-02-10T14:30:00Z', changed_by: 'GOOGLE_RECRUITER' },
      { history_id: 3, application_id: 8002, old_status: 'APPLIED', new_status: 'SHORTLISTED', changed_at: '2025-02-05T12:00:00Z', changed_by: 'AWS_COORDINATOR' },
      { history_id: 4, application_id: 8003, old_status: 'APPLIED', new_status: 'SHORTLISTED', changed_at: '2025-02-02T11:00:00Z', changed_by: 'ADMIN_PORTAL' },
      { history_id: 5, application_id: 8003, old_status: 'SHORTLISTED', new_status: 'SELECTED', changed_at: '2025-02-12T16:00:00Z', changed_by: 'MSFT_HR' },
      { history_id: 6, application_id: 8005, old_status: 'APPLIED', new_status: 'SHORTLISTED', changed_at: '2025-02-04T10:00:00Z', changed_by: 'TCS_RECRUITER' },
      { history_id: 7, application_id: 8005, old_status: 'SHORTLISTED', new_status: 'SELECTED', changed_at: '2025-02-14T10:15:00Z', changed_by: 'TCS_RECRUITER' },
      { history_id: 8, application_id: 8011, old_status: 'APPLIED', new_status: 'REJECTED', changed_at: '2025-02-03T15:30:00Z', changed_by: 'AWS_SCREENING' },
      { history_id: 9, application_id: 8015, old_status: 'APPLIED', new_status: 'SHORTLISTED', changed_at: '2025-02-02T10:00:00Z', changed_by: 'ADMIN_PORTAL' },
      { history_id: 10, application_id: 8015, old_status: 'SHORTLISTED', new_status: 'WITHDRAWN', changed_at: '2025-02-11T12:00:00Z', changed_by: 'STUDENT_PORTAL' },
    ];
  }

  // --- Student Methods ---
  async getStudents(search?: string, department?: string, minCgpa?: number): Promise<Student[]> {
    let result = [...this.students];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.student_name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.student_id.toString().includes(q)
      );
    }
    if (department && department !== 'ALL') {
      result = result.filter((s) => s.department === department);
    }
    if (minCgpa !== undefined && minCgpa > 0) {
      result = result.filter((s) => s.cgpa >= minCgpa);
    }
    return result;
  }

  async getStudentById(id: number): Promise<Student | null> {
    const s = this.students.find((item) => item.student_id === id);
    return s ? { ...s } : null;
  }

  async createStudent(data: Omit<Student, 'student_id' | 'created_at'>): Promise<Student> {
    if (data.cgpa < 0.0 || data.cgpa > 10.0) {
      throw new Error(`ERR_INVALID_CGPA (-20007): CGPA must be between 0.00 and 10.00. Provided: ${data.cgpa}`);
    }
    if (data.active_backlogs < 0) {
      throw new Error(`ERR_NEGATIVE_BACKLOG (-20008): Active backlogs cannot be negative.`);
    }
    if (this.students.some((s) => s.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error(`ERR_DUPLICATE_STUDENT (-20011): A student with email '${data.email}' already exists.`);
    }

    const newStudent: Student = {
      ...data,
      student_id: this.nextStudentId++,
      created_at: new Date().toISOString(),
      skills: data.skills || [],
      placement_status: 'SEEKING',
    };
    this.students.push(newStudent);
    return newStudent;
  }

  async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    const idx = this.students.findIndex((s) => s.student_id === id);
    if (idx === -1) {
      throw new Error(`ERR_STUDENT_NOT_FOUND (-20001): Student ID ${id} not found.`);
    }
    if (data.cgpa !== undefined && (data.cgpa < 0.0 || data.cgpa > 10.0)) {
      throw new Error(`ERR_INVALID_CGPA (-20007): CGPA must be between 0.00 and 10.00.`);
    }
    if (data.active_backlogs !== undefined && data.active_backlogs < 0) {
      throw new Error(`ERR_NEGATIVE_BACKLOG (-20008): Active backlogs cannot be negative.`);
    }

    this.students[idx] = { ...this.students[idx], ...data };
    return this.students[idx];
  }

  async deleteStudent(id: number): Promise<boolean> {
    const idx = this.students.findIndex((s) => s.student_id === id);
    if (idx === -1) return false;
    this.students.splice(idx, 1);
    this.applications = this.applications.filter((a) => a.student_id !== id);
    return true;
  }

  // --- Skills ---
  async getSkills(): Promise<Skill[]> {
    return [...this.skills];
  }

  async getStudentSkills(studentId: number): Promise<string[]> {
    const s = await this.getStudentById(studentId);
    return s?.skills || [];
  }

  async addStudentSkill(studentId: number, skillId: number): Promise<boolean> {
    const skill = this.skills.find((sk) => sk.skill_id === skillId);
    if (!skill) throw new Error('Skill not found');
    const s = this.students.find((item) => item.student_id === studentId);
    if (!s) throw new Error('Student not found');
    if (!s.skills) s.skills = [];
    if (!s.skills.includes(skill.skill_name)) {
      s.skills.push(skill.skill_name);
    }
    return true;
  }

  // --- Companies ---
  async getCompanies(search?: string, industry?: string): Promise<Company[]> {
    let result = this.companies.map((c) => {
      const companyJobs = this.jobs.filter((j) => j.company_id === c.company_id);
      return {
        ...c,
        total_openings_posted: companyJobs.length,
        active_drives_count: companyJobs.filter((j) => j.is_active === 'Y').length,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.company_name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.contact_email.toLowerCase().includes(q)
      );
    }
    if (industry && industry !== 'ALL') {
      result = result.filter((c) => c.industry === industry);
    }
    return result;
  }

  async getCompanyById(id: number): Promise<Company | null> {
    const c = this.companies.find((item) => item.company_id === id);
    return c ? { ...c } : null;
  }

  async createCompany(data: Omit<Company, 'company_id' | 'created_at'>): Promise<Company> {
    if (this.companies.some((c) => c.company_name.toLowerCase() === data.company_name.toLowerCase())) {
      throw new Error(`ERR_DUPLICATE_COMPANY (-20013): Company '${data.company_name}' already exists.`);
    }
    const newComp: Company = {
      ...data,
      company_id: this.nextCompanyId++,
      created_at: new Date().toISOString(),
      total_openings_posted: 0,
      active_drives_count: 0,
    };
    this.companies.push(newComp);
    return newComp;
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    const idx = this.companies.findIndex((c) => c.company_id === id);
    if (idx === -1) throw new Error(`ERR_COMPANY_NOT_FOUND (-20010): Company ID ${id} not found.`);
    this.companies[idx] = { ...this.companies[idx], ...data };
    return this.companies[idx];
  }

  async deleteCompany(id: number): Promise<boolean> {
    const idx = this.companies.findIndex((c) => c.company_id === id);
    if (idx === -1) return false;
    this.companies.splice(idx, 1);
    this.jobs = this.jobs.filter((j) => j.company_id !== id);
    return true;
  }

  // --- Jobs ---
  async getJobs(search?: string, isActiveOnly?: boolean): Promise<Job[]> {
    let result = [...this.jobs];
    if (isActiveOnly) {
      result = result.filter((j) => j.is_active === 'Y');
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.job_title.toLowerCase().includes(q) ||
          (j.company_name && j.company_name.toLowerCase().includes(q))
      );
    }
    return result;
  }

  async getJobById(id: number): Promise<Job | null> {
    const j = this.jobs.find((item) => item.job_id === id);
    return j ? { ...j } : null;
  }

  async createJob(data: Omit<Job, 'job_id' | 'created_at'>): Promise<Job> {
    const comp = this.companies.find((c) => c.company_id === data.company_id);
    if (!comp) throw new Error(`ERR_COMPANY_NOT_FOUND (-20010): Company ID ${data.company_id} does not exist.`);

    const newJob: Job = {
      ...data,
      job_id: this.nextJobId++,
      company_name: comp.company_name,
      created_at: new Date().toISOString(),
    };
    this.jobs.push(newJob);
    return newJob;
  }

  async setJobStatus(jobId: number, isActive: 'Y' | 'N'): Promise<boolean> {
    const j = this.jobs.find((item) => item.job_id === jobId);
    if (!j) throw new Error(`ERR_JOB_NOT_FOUND (-20002): Job ID ${jobId} not found.`);
    j.is_active = isActive;
    return true;
  }

  // --- Eligibility Engine (5-Criteria Evaluation matching PLACEMENT_PKG) ---
  async checkEligibility(studentId: number, jobId: number): Promise<EligibilityResult> {
    const student = this.students.find((s) => s.student_id === studentId);
    if (!student) throw new Error(`ERR_STUDENT_NOT_FOUND (-20001): Student ID ${studentId} not found.`);

    const job = this.jobs.find((j) => j.job_id === jobId);
    if (!job) throw new Error(`ERR_JOB_NOT_FOUND (-20002): Job ID ${jobId} not found.`);

    const reasons: string[] = [];
    const active_ok = job.is_active === 'Y';
    if (!active_ok) {
      reasons.push('Job opportunity is currently INACTIVE.');
    }

    const cgpa_ok = student.cgpa >= job.minimum_cgpa;
    if (!cgpa_ok) {
      reasons.push(`CGPA (${student.cgpa.toFixed(2)}) is below the required minimum cutoff (${job.minimum_cgpa.toFixed(2)}).`);
    }

    const backlogs_ok = student.active_backlogs <= job.maximum_backlogs;
    if (!backlogs_ok) {
      reasons.push(`Active backlogs (${student.active_backlogs}) exceed maximum permitted limit (${job.maximum_backlogs}).`);
    }

    const batch_ok = job.eligible_batches.includes(student.graduation_year);
    if (!batch_ok) {
      reasons.push(`Graduation year (${student.graduation_year}) is not eligible. Permitted batches: ${job.eligible_batches.join(', ')}.`);
    }

    const studSkills = student.skills || [];
    const missing_skills = job.mandatory_skills.filter((sk) => !studSkills.includes(sk));
    const skills_ok = missing_skills.length === 0;
    if (!skills_ok) {
      reasons.push(`Missing mandatory technical skill(s): ${missing_skills.join(', ')}.`);
    }

    const is_eligible = active_ok && cgpa_ok && backlogs_ok && batch_ok && skills_ok;

    return {
      student_id: student.student_id,
      student_name: student.student_name,
      cgpa: student.cgpa,
      graduation_year: student.graduation_year,
      active_backlogs: student.active_backlogs,
      job_id: job.job_id,
      job_title: job.job_title,
      company_name: job.company_name || 'Recruiter',
      is_eligible,
      reasons: is_eligible ? 'Candidate satisfies all criteria: CGPA, Backlogs, Batch, and Technical Skills.' : reasons.join(' '),
      criteria_breakdown: {
        active_ok,
        cgpa_ok,
        backlogs_ok,
        batch_ok,
        skills_ok,
        missing_skills,
      },
    };
  }

  async getJobEligibilityMatrix(jobId: number): Promise<{
    job: Job;
    eligibleStudents: EligibilityResult[];
    ineligibleStudents: EligibilityResult[];
  }> {
    const job = await this.getJobById(jobId);
    if (!job) throw new Error(`ERR_JOB_NOT_FOUND (-20002): Job ID ${jobId} not found.`);

    const eligibleStudents: EligibilityResult[] = [];
    const ineligibleStudents: EligibilityResult[] = [];

    for (const student of this.students) {
      const evalRes = await this.checkEligibility(student.student_id, jobId);
      if (evalRes.is_eligible) {
        eligibleStudents.push(evalRes);
      } else {
        ineligibleStudents.push(evalRes);
      }
    }

    return { job, eligibleStudents, ineligibleStudents };
  }

  // --- Applications ---
  async getApplications(status?: string, jobId?: number, studentId?: number): Promise<Application[]> {
    let result = [...this.applications];
    if (status && status !== 'ALL') {
      result = result.filter((a) => a.application_status === status);
    }
    if (jobId) {
      result = result.filter((a) => a.job_id === jobId);
    }
    if (studentId) {
      result = result.filter((a) => a.student_id === studentId);
    }
    return result;
  }

  async getApplicationById(id: number): Promise<Application | null> {
    const a = this.applications.find((item) => item.application_id === id);
    return a ? { ...a } : null;
  }

  async createApplication(studentId: number, jobId: number): Promise<Application> {
    // 1. Prevent duplicate submission (database constraint uq_student_job_app)
    const exists = this.applications.some((a) => a.student_id === studentId && a.job_id === jobId);
    if (exists) {
      throw new Error(`ERR_DUPLICATE_APPLICATION (-20005): Student ID ${studentId} has already submitted an application for Job ID ${jobId}.`);
    }

    // 2. Enforce eligibility engine check
    const elig = await this.checkEligibility(studentId, jobId);
    if (!elig.is_eligible) {
      throw new Error(`ERR_STUDENT_INELIGIBLE (-20004): Application Rejected: Ineligible. ${elig.reasons}`);
    }

    const student = this.students.find((s) => s.student_id === studentId)!;
    const job = this.jobs.find((j) => j.job_id === jobId)!;

    const newApp: Application = {
      application_id: this.nextAppId++,
      student_id: studentId,
      student_name: student.student_name,
      student_email: student.email,
      cgpa: student.cgpa,
      job_id: jobId,
      job_title: job.job_title,
      company_name: job.company_name,
      package_lpa: job.package_lpa,
      application_status: 'APPLIED',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.applications.push(newApp);
    return newApp;
  }

  async updateApplicationStatus(applicationId: number, newStatus: ApplicationStatus): Promise<Application> {
    const app = this.applications.find((a) => a.application_id === applicationId);
    if (!app) {
      throw new Error(`ERR_APPLICATION_NOT_FOUND (-20009): Application ID ${applicationId} does not exist.`);
    }

    const current = app.application_status;
    const target = newStatus;

    // Enforce PL/SQL State Machine Transition Rules
    let valid = false;
    if (current === 'APPLIED' && ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'].includes(target)) {
      valid = true;
    } else if (current === 'SHORTLISTED' && ['SELECTED', 'REJECTED', 'WITHDRAWN'].includes(target)) {
      valid = true;
    } else if (current === 'SELECTED' && target === 'WITHDRAWN') {
      valid = true;
    }

    if (!valid) {
      throw new Error(
        `ERR_INVALID_STATUS_TRANSITION (-20006): Cannot transition application #${applicationId} from '${current}' to '${target}'.`
      );
    }

    const oldStatus = app.application_status;
    app.application_status = target;
    app.updated_at = new Date().toISOString();

    // Emulate Trigger: trg_app_status_audit
    this.history.unshift({
      history_id: this.nextHistoryId++,
      application_id: applicationId,
      old_status: oldStatus,
      new_status: target,
      changed_at: new Date().toISOString(),
      changed_by: 'PORTAL_OPERATOR',
    });

    // Update student placement status if SELECTED
    if (target === 'SELECTED') {
      const stud = this.students.find((s) => s.student_id === app.student_id);
      if (stud) stud.placement_status = 'PLACED';
    }

    return { ...app };
  }

  async getApplicationHistory(applicationId: number): Promise<ApplicationStatusHistory[]> {
    return this.history.filter((h) => h.application_id === applicationId);
  }

  // --- Reports & Executive Dashboard ---
  async getPlacementSummary(): Promise<PlacementSummary> {
    const total_students = this.students.length;
    const final_year_students = this.students.filter((s) => s.graduation_year === 2025).length;
    const total_companies = this.companies.length;
    const total_jobs = this.jobs.length;
    const active_jobs = this.jobs.filter((j) => j.is_active === 'Y').length;
    const total_applications = this.applications.length;

    const selectedApps = this.applications.filter((a) => a.application_status === 'SELECTED');
    const placed_student_ids = new Set(selectedApps.map((a) => a.student_id));
    const placed_students = placed_student_ids.size;
    const total_offers = selectedApps.length;

    const placement_percentage =
      final_year_students > 0 ? parseFloat(((placed_students / final_year_students) * 100).toFixed(2)) : 0;

    const selectedPackages = selectedApps.map((a) => a.package_lpa || 0);
    const highest_package_lpa = selectedPackages.length > 0 ? Math.max(...selectedPackages) : 0;
    const average_package_lpa =
      selectedPackages.length > 0
        ? parseFloat((selectedPackages.reduce((sum, p) => sum + p, 0) / selectedPackages.length).toFixed(2))
        : 0;

    const recruiter_breakdown = this.companies.map((c) => {
      const compJobs = this.jobs.filter((j) => j.company_id === c.company_id);
      const compJobIds = new Set(compJobs.map((j) => j.job_id));
      const compApps = this.applications.filter((a) => compJobIds.has(a.job_id));
      const shortlisted = compApps.filter((a) => a.application_status === 'SHORTLISTED').length;
      const selected = compApps.filter((a) => a.application_status === 'SELECTED').length;

      return {
        company_name: c.company_name,
        industry: c.industry,
        total_openings: compJobs.length,
        total_applicants: compApps.length,
        shortlisted_count: shortlisted,
        selected_count: selected,
      };
    });

    return {
      total_students,
      final_year_students,
      total_companies,
      total_jobs,
      active_jobs,
      total_applications,
      placed_students,
      total_offers,
      placement_percentage,
      highest_package_lpa,
      average_package_lpa,
      recruiter_breakdown,
    };
  }

  async getDashboardMetrics(): Promise<any> {
    const summary = await this.getPlacementSummary();

    // Status breakdown
    const statusCounts: Record<string, number> = {
      APPLIED: 0,
      SHORTLISTED: 0,
      SELECTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };
    this.applications.forEach((a) => {
      statusCounts[a.application_status] = (statusCounts[a.application_status] || 0) + 1;
    });

    // Recent 5 applications
    const recentApplications = [...this.applications]
      .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
      .slice(0, 5);

    // Active openings
    const topOpportunities = this.jobs.filter((j) => j.is_active === 'Y').slice(0, 4);

    return {
      ...summary,
      statusCounts,
      recentApplications,
      topOpportunities,
    };
  }

  async resetDemoData(): Promise<boolean> {
    this.seedData();
    return true;
  }
}
