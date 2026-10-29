import { IPlacementRepository } from './IPlacementRepository.js';
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
import { getOraclePool } from '../config/database.js';

export class OraclePlacementRepository implements IPlacementRepository {
  private async executeQuery<T>(sql: string, binds: any = {}, options: any = {}): Promise<T[]> {
    const pool = getOraclePool();
    if (!pool) {
      throw new Error('Oracle Database connection pool is not initialized. Please verify your .env settings.');
    }
    const connection = await pool.getConnection();
    try {
      const result = await connection.execute(sql, binds, {
        outFormat: 4002, // oracledb.OUT_FORMAT_OBJECT
        ...options,
      });
      return (result.rows as T[]) || [];
    } finally {
      await connection.close();
    }
  }

  // --- Students (maps to STUDENTS table and VW_STUDENT_DIRECTORY) ---
  async getStudents(search?: string, department?: string, minCgpa?: number): Promise<Student[]> {
    let sql = `
      SELECT student_id, student_name, email, cgpa, graduation_year, active_backlogs,
             acquired_skills, created_at
      FROM VW_STUDENT_DIRECTORY
      WHERE 1=1
    `;
    const binds: any = {};
    if (search) {
      sql += ` AND (LOWER(student_name) LIKE :q OR LOWER(email) LIKE :q OR TO_CHAR(student_id) LIKE :q)`;
      binds.q = `%${search.toLowerCase()}%`;
    }
    if (minCgpa) {
      sql += ` AND cgpa >= :minCgpa`;
      binds.minCgpa = minCgpa;
    }
    sql += ` ORDER BY student_id DESC`;

    const rows: any[] = await this.executeQuery(sql, binds);
    return rows.map((r) => ({
      student_id: r.STUDENT_ID,
      student_name: r.STUDENT_NAME,
      email: r.EMAIL,
      cgpa: r.CGPA,
      graduation_year: r.GRADUATION_YEAR,
      active_backlogs: r.ACTIVE_BACKLOGS,
      department: 'Computer Science',
      created_at: r.CREATED_AT,
      skills: r.ACQUIRED_SKILLS ? r.ACQUIRED_SKILLS.split(', ') : [],
    }));
  }

  async getStudentById(id: number): Promise<Student | null> {
    const rows: any[] = await this.executeQuery(
      `SELECT student_id, student_name, email, cgpa, graduation_year, active_backlogs, acquired_skills, created_at
       FROM VW_STUDENT_DIRECTORY WHERE student_id = :id`,
      { id }
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      student_id: r.STUDENT_ID,
      student_name: r.STUDENT_NAME,
      email: r.EMAIL,
      cgpa: r.CGPA,
      graduation_year: r.GRADUATION_YEAR,
      active_backlogs: r.ACTIVE_BACKLOGS,
      department: 'Computer Science',
      created_at: r.CREATED_AT,
      skills: r.ACQUIRED_SKILLS ? r.ACQUIRED_SKILLS.split(', ') : [],
    };
  }

  async createStudent(data: Omit<Student, 'student_id' | 'created_at'>): Promise<Student> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      const oracledb = await import('oracledb');
      const result: any = await connection.execute(
        `BEGIN
           PLACEMENT_PKG.add_student(
             p_name => :name,
             p_email => :email,
             p_cgpa => :cgpa,
             p_grad_year => :grad_year,
             p_backlogs => :backlogs,
             o_student_id => :o_id
           );
         END;`,
        {
          name: data.student_name,
          email: data.email,
          cgpa: data.cgpa,
          grad_year: data.graduation_year,
          backlogs: data.active_backlogs || 0,
          o_id: { dir: oracledb.default.BIND_OUT, type: oracledb.default.NUMBER },
        },
        { autoCommit: true }
      );
      const studentId = result.outBinds.o_id;
      return (await this.getStudentById(studentId))!;
    } finally {
      await connection.close();
    }
  }

  async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `BEGIN
           PLACEMENT_PKG.update_student(
             p_student_id => :id,
             p_cgpa => :cgpa,
             p_backlogs => :backlogs,
             p_grad_year => :grad_year
           );
         END;`,
        {
          id,
          cgpa: data.cgpa || null,
          backlogs: data.active_backlogs !== undefined ? data.active_backlogs : null,
          grad_year: data.graduation_year || null,
        },
        { autoCommit: true }
      );
      return (await this.getStudentById(id))!;
    } finally {
      await connection.close();
    }
  }

  async deleteStudent(id: number): Promise<boolean> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `DELETE FROM STUDENTS WHERE student_id = :id`,
        { id },
        { autoCommit: true }
      );
      return true;
    } finally {
      await connection.close();
    }
  }

  // --- Skills ---
  async getSkills(): Promise<Skill[]> {
    const rows: any[] = await this.executeQuery(`SELECT skill_id, skill_name FROM SKILLS ORDER BY skill_name`);
    return rows.map((r) => ({ skill_id: r.SKILL_ID, skill_name: r.SKILL_NAME }));
  }

  async getStudentSkills(studentId: number): Promise<string[]> {
    const student = await this.getStudentById(studentId);
    return student?.skills || [];
  }

  async addStudentSkill(studentId: number, skillId: number): Promise<boolean> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `BEGIN
           PLACEMENT_PKG.add_student_skill(:studentId, :skillId);
         END;`,
        { studentId, skillId },
        { autoCommit: true }
      );
      return true;
    } finally {
      await connection.close();
    }
  }

  // --- Companies ---
  async getCompanies(search?: string, industry?: string): Promise<Company[]> {
    let sql = `SELECT company_id, company_name, industry, contact_email, total_openings_posted, active_drives_count FROM VW_COMPANY_DIRECTORY WHERE 1=1`;
    const binds: any = {};
    if (search) {
      sql += ` AND (LOWER(company_name) LIKE :q OR LOWER(industry) LIKE :q)`;
      binds.q = `%${search.toLowerCase()}%`;
    }
    const rows: any[] = await this.executeQuery(sql, binds);
    return rows.map((r) => ({
      company_id: r.COMPANY_ID,
      company_name: r.COMPANY_NAME,
      industry: r.INDUSTRY,
      contact_email: r.CONTACT_EMAIL,
      created_at: new Date().toISOString(),
      total_openings_posted: r.TOTAL_OPENINGS_POSTED,
      active_drives_count: r.ACTIVE_DRIVES_COUNT,
    }));
  }

  async getCompanyById(id: number): Promise<Company | null> {
    const rows: any[] = await this.executeQuery(
      `SELECT company_id, company_name, industry, contact_email, total_openings_posted, active_drives_count FROM VW_COMPANY_DIRECTORY WHERE company_id = :id`,
      { id }
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      company_id: r.COMPANY_ID,
      company_name: r.COMPANY_NAME,
      industry: r.INDUSTRY,
      contact_email: r.CONTACT_EMAIL,
      created_at: new Date().toISOString(),
      total_openings_posted: r.TOTAL_OPENINGS_POSTED,
      active_drives_count: r.ACTIVE_DRIVES_COUNT,
    };
  }

  async createCompany(data: Omit<Company, 'company_id' | 'created_at'>): Promise<Company> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      const oracledb = await import('oracledb');
      const result: any = await connection.execute(
        `BEGIN
           PLACEMENT_PKG.add_company(:name, :industry, :email, :o_id);
         END;`,
        {
          name: data.company_name,
          industry: data.industry,
          email: data.contact_email,
          o_id: { dir: oracledb.default.BIND_OUT, type: oracledb.default.NUMBER },
        },
        { autoCommit: true }
      );
      return (await this.getCompanyById(result.outBinds.o_id))!;
    } finally {
      await connection.close();
    }
  }

  async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE COMPANIES SET company_name = NVL(:name, company_name), industry = NVL(:industry, industry), contact_email = NVL(:email, contact_email) WHERE company_id = :id`,
        {
          id,
          name: data.company_name || null,
          industry: data.industry || null,
          email: data.contact_email || null,
        },
        { autoCommit: true }
      );
      return (await this.getCompanyById(id))!;
    } finally {
      await connection.close();
    }
  }

  async deleteCompany(id: number): Promise<boolean> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(`DELETE FROM COMPANIES WHERE company_id = :id`, { id }, { autoCommit: true });
      return true;
    } finally {
      await connection.close();
    }
  }

  // --- Jobs ---
  async getJobs(search?: string, isActiveOnly?: boolean): Promise<Job[]> {
    let sql = `SELECT job_id, company_name, job_title, package_lpa, minimum_cgpa, maximum_backlogs, eligible_batches, mandatory_skills, created_at FROM VW_ACTIVE_JOBS WHERE 1=1`;
    const binds: any = {};
    if (search) {
      sql += ` AND (LOWER(job_title) LIKE :q OR LOWER(company_name) LIKE :q)`;
      binds.q = `%${search.toLowerCase()}%`;
    }
    const rows: any[] = await this.executeQuery(sql, binds);
    return rows.map((r) => ({
      job_id: r.JOB_ID,
      company_id: 0,
      company_name: r.COMPANY_NAME,
      job_title: r.JOB_TITLE,
      package_lpa: r.PACKAGE_LPA,
      minimum_cgpa: r.MINIMUM_CGPA,
      maximum_backlogs: r.MAXIMUM_BACKLOGS,
      is_active: 'Y',
      created_at: r.CREATED_AT,
      eligible_batches: r.ELIGIBLE_BATCHES ? r.ELIGIBLE_BATCHES.split(', ').map(Number) : [],
      mandatory_skills: r.MANDATORY_SKILLS && r.MANDATORY_SKILLS !== 'None (Open to all skills)' ? r.MANDATORY_SKILLS.split(', ') : [],
    }));
  }

  async getJobById(id: number): Promise<Job | null> {
    const jobs = await this.getJobs();
    return jobs.find((j) => j.job_id === id) || null;
  }

  async createJob(data: Omit<Job, 'job_id' | 'created_at'>): Promise<Job> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      const oracledb = await import('oracledb');
      const result: any = await connection.execute(
        `BEGIN
           PLACEMENT_PKG.add_job(
             p_company_id => :cid,
             p_job_title => :title,
             p_package_lpa => :lpa,
             p_min_cgpa => :minCgpa,
             p_max_backlogs => :backlogs,
             p_is_active => :active,
             o_job_id => :o_id
           );
         END;`,
        {
          cid: data.company_id,
          title: data.job_title,
          lpa: data.package_lpa,
          minCgpa: data.minimum_cgpa,
          backlogs: data.maximum_backlogs || 0,
          active: data.is_active || 'Y',
          o_id: { dir: oracledb.default.BIND_OUT, type: oracledb.default.NUMBER },
        },
        { autoCommit: true }
      );
      const jobId = result.outBinds.o_id;
      return (await this.getJobById(jobId))!;
    } finally {
      await connection.close();
    }
  }

  async setJobStatus(jobId: number, isActive: 'Y' | 'N'): Promise<boolean> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `BEGIN PLACEMENT_PKG.set_job_status(:jobId, :isActive); END;`,
        { jobId, isActive },
        { autoCommit: true }
      );
      return true;
    } finally {
      await connection.close();
    }
  }

  // --- Eligibility Engine (invokes PLACEMENT_PKG.check_eligibility) ---
  async checkEligibility(studentId: number, jobId: number): Promise<EligibilityResult> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      const oracledb = await import('oracledb');
      const result: any = await connection.execute(
        `BEGIN
           PLACEMENT_PKG.check_eligibility_desc(
             p_student_id => :sid,
             p_job_id => :jid,
             o_is_eligible => :o_is_elig,
             o_reasons => :o_reasons
           );
         END;`,
        {
          sid: studentId,
          jid: jobId,
          o_is_elig: { dir: oracledb.default.BIND_OUT, type: oracledb.default.STRING, maxSize: 10 },
          o_reasons: { dir: oracledb.default.BIND_OUT, type: oracledb.default.STRING, maxSize: 4000 },
        }
      );

      const is_eligible = result.outBinds.o_is_elig === 'YES';
      const reasons = result.outBinds.o_reasons;

      const student = (await this.getStudentById(studentId))!;
      const job = (await this.getJobById(jobId))!;

      return {
        student_id: studentId,
        student_name: student.student_name,
        cgpa: student.cgpa,
        graduation_year: student.graduation_year,
        active_backlogs: student.active_backlogs,
        job_id: jobId,
        job_title: job.job_title,
        company_name: job.company_name || '',
        is_eligible,
        reasons,
        criteria_breakdown: {
          active_ok: job.is_active === 'Y',
          cgpa_ok: student.cgpa >= job.minimum_cgpa,
          backlogs_ok: student.active_backlogs <= job.maximum_backlogs,
          batch_ok: job.eligible_batches.includes(student.graduation_year),
          skills_ok: !reasons.includes('Missing mandatory skill'),
          missing_skills: [],
        },
      };
    } finally {
      await connection.close();
    }
  }

  async getJobEligibilityMatrix(jobId: number): Promise<{
    job: Job;
    eligibleStudents: EligibilityResult[];
    ineligibleStudents: EligibilityResult[];
  }> {
    const job = (await this.getJobById(jobId))!;
    const students = await this.getStudents();
    const eligibleStudents: EligibilityResult[] = [];
    const ineligibleStudents: EligibilityResult[] = [];

    for (const s of students) {
      const res = await this.checkEligibility(s.student_id, jobId);
      if (res.is_eligible) eligibleStudents.push(res);
      else ineligibleStudents.push(res);
    }

    return { job, eligibleStudents, ineligibleStudents };
  }

  // --- Applications (invokes PLACEMENT_PKG.apply_for_job & update_application_status) ---
  async getApplications(status?: string, jobId?: number, studentId?: number): Promise<Application[]> {
    let sql = `SELECT application_id, student_id, student_name, student_email, company_name, job_title, package_lpa, application_status, applied_at, updated_at FROM VW_STUDENT_APPLICATION_HISTORY WHERE 1=1`;
    const binds: any = {};
    if (status && status !== 'ALL') {
      sql += ` AND application_status = :status`;
      binds.status = status;
    }
    const rows: any[] = await this.executeQuery(sql, binds);
    return rows.map((r) => ({
      application_id: r.APPLICATION_ID,
      student_id: r.STUDENT_ID,
      student_name: r.STUDENT_NAME,
      student_email: r.STUDENT_EMAIL,
      job_id: 0,
      job_title: r.JOB_TITLE,
      company_name: r.COMPANY_NAME,
      package_lpa: r.PACKAGE_LPA,
      application_status: r.APPLICATION_STATUS,
      applied_at: r.APPLIED_AT,
      updated_at: r.UPDATED_AT,
    }));
  }

  async getApplicationById(id: number): Promise<Application | null> {
    const apps = await this.getApplications();
    return apps.find((a) => a.application_id === id) || null;
  }

  async createApplication(studentId: number, jobId: number): Promise<Application> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      const oracledb = await import('oracledb');
      const result: any = await connection.execute(
        `BEGIN
           PLACEMENT_PKG.apply_for_job(
             p_student_id => :sid,
             p_job_id => :jid,
             o_application_id => :o_aid
           );
         END;`,
        {
          sid: studentId,
          jid: jobId,
          o_aid: { dir: oracledb.default.BIND_OUT, type: oracledb.default.NUMBER },
        },
        { autoCommit: true }
      );
      return (await this.getApplicationById(result.outBinds.o_aid))!;
    } finally {
      await connection.close();
    }
  }

  async updateApplicationStatus(applicationId: number, newStatus: ApplicationStatus): Promise<Application> {
    const pool = getOraclePool();
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `BEGIN
           PLACEMENT_PKG.update_application_status(:aid, :status);
         END;`,
        { aid: applicationId, status: newStatus },
        { autoCommit: true }
      );
      return (await this.getApplicationById(applicationId))!;
    } finally {
      await connection.close();
    }
  }

  async getApplicationHistory(applicationId: number): Promise<ApplicationStatusHistory[]> {
    const rows: any[] = await this.executeQuery(
      `SELECT history_id, application_id, old_status, new_status, changed_at, changed_by
       FROM APPLICATION_STATUS_HISTORY WHERE application_id = :id ORDER BY history_id DESC`,
      { id: applicationId }
    );
    return rows.map((r) => ({
      history_id: r.HISTORY_ID,
      application_id: r.APPLICATION_ID,
      old_status: r.OLD_STATUS,
      new_status: r.NEW_STATUS,
      changed_at: r.CHANGED_AT,
      changed_by: r.CHANGED_BY,
    }));
  }

  // --- Reports (queries VW_OVERALL_PLACEMENT_STATS & VW_COMPANY_APPLICATION_STATS) ---
  async getPlacementSummary(): Promise<PlacementSummary> {
    const kpiRows: any[] = await this.executeQuery(`SELECT * FROM VW_OVERALL_PLACEMENT_STATS`);
    const kpi = kpiRows[0] || {};

    const recruiterRows: any[] = await this.executeQuery(`SELECT * FROM VW_COMPANY_APPLICATION_STATS`);
    const recruiter_breakdown = recruiterRows.map((r) => ({
      company_name: r.COMPANY_NAME,
      industry: r.INDUSTRY,
      total_openings: 0,
      total_applicants: r.TOTAL_APPLICATIONS,
      shortlisted_count: r.SHORTLISTED_COUNT,
      selected_count: r.SELECTED_COUNT,
    }));

    return {
      total_students: kpi.TOTAL_ENROLLED_STUDENTS || 0,
      final_year_students: kpi.FINAL_YEAR_STUDENTS || 0,
      total_companies: recruiterRows.length,
      total_jobs: 0,
      active_jobs: kpi.ACTIVE_JOB_DRIVES || 0,
      total_applications: 0,
      placed_students: kpi.TOTAL_PLACED_STUDENTS || 0,
      total_offers: kpi.TOTAL_OFFER_LETTERS || 0,
      placement_percentage: kpi.PLACEMENT_PERCENTAGE_2025 || 0,
      highest_package_lpa: kpi.HIGHEST_PACKAGE_LPA || 0,
      average_package_lpa: kpi.AVERAGE_PACKAGE_LPA || 0,
      recruiter_breakdown,
    };
  }

  async getDashboardMetrics(): Promise<any> {
    const summary = await this.getPlacementSummary();
    const apps = await this.getApplications();
    const statusCounts: Record<string, number> = {
      APPLIED: apps.filter((a) => a.application_status === 'APPLIED').length,
      SHORTLISTED: apps.filter((a) => a.application_status === 'SHORTLISTED').length,
      SELECTED: apps.filter((a) => a.application_status === 'SELECTED').length,
      REJECTED: apps.filter((a) => a.application_status === 'REJECTED').length,
      WITHDRAWN: apps.filter((a) => a.application_status === 'WITHDRAWN').length,
    };
    return {
      ...summary,
      statusCounts,
      recentApplications: apps.slice(0, 5),
      topOpportunities: await this.getJobs('', true),
    };
  }

  async resetDemoData(): Promise<boolean> {
    return true;
  }
}
