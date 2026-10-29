import { Router, Request, Response } from 'express';
import { getRepository } from '../repositories/index.js';
import { config } from '../config/env.js';
import { ApplicationStatus } from '../types/models.js';

export const apiRouter = Router();

const getId = (param: any): number => {
  if (!param) return 0;
  const str = Array.isArray(param) ? param[0] : param;
  return parseInt(String(str), 10);
};

// --- Health & Mode Check ---
apiRouter.get('/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    mode: config.dbMode,
    message:
      config.dbMode === 'oracle'
        ? 'Connected to Oracle Database (PL/SQL Backend)'
        : 'Running in Demo Mode (In-Memory PL/SQL Emulation for FreeSQL/Local Dev)',
    version: '1.0.0',
  });
});

// --- Dashboard ---
apiRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const data = await repo.getDashboardMetrics();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Students ---
apiRouter.get('/students', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const search = req.query.search as string;
    const department = req.query.department as string;
    const minCgpa = req.query.minCgpa ? parseFloat(req.query.minCgpa as string) : undefined;
    const data = await repo.getStudents(search, department, minCgpa);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/students/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const student = await repo.getStudentById(getId(req.params.id));
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/students', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const { student_name, email, cgpa, graduation_year, active_backlogs, department, skills } = req.body;
    if (!student_name || !email || cgpa === undefined || !graduation_year) {
      return res.status(400).json({ error: 'Missing required fields: student_name, email, cgpa, graduation_year' });
    }
    const student = await repo.createStudent({
      student_name,
      email,
      cgpa: parseFloat(cgpa),
      graduation_year: parseInt(graduation_year, 10),
      active_backlogs: parseInt(active_backlogs || 0, 10),
      department: department || 'Computer Science',
      skills: skills || [],
    });
    res.status(201).json(student);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/students/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const updated = await repo.updateStudent(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/students/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const success = await repo.deleteStudent(id);
    if (!success) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Skills ---
apiRouter.get('/skills', async (_req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const skills = await repo.getSkills();
    res.json(skills);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Companies ---
apiRouter.get('/companies', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const search = req.query.search as string;
    const industry = req.query.industry as string;
    const companies = await repo.getCompanies(search, industry);
    res.json(companies);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/companies/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const comp = await repo.getCompanyById(getId(req.params.id));
    if (!comp) return res.status(404).json({ error: 'Company not found' });
    res.json(comp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/companies', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const { company_name, industry, contact_email } = req.body;
    if (!company_name || !industry || !contact_email) {
      return res.status(400).json({ error: 'Missing company_name, industry, or contact_email' });
    }
    const comp = await repo.createCompany({ company_name, industry, contact_email });
    res.status(201).json(comp);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/companies/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const updated = await repo.updateCompany(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/companies/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const success = await repo.deleteCompany(id);
    if (!success) return res.status(404).json({ error: 'Company not found' });
    res.json({ message: 'Company removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Jobs ---
apiRouter.get('/jobs', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const search = req.query.search as string;
    const activeOnly = req.query.activeOnly === 'true';
    const jobs = await repo.getJobs(search, activeOnly);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const job = await repo.getJobById(getId(req.params.id));
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/jobs', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const { company_id, job_title, package_lpa, minimum_cgpa, maximum_backlogs, eligible_batches, mandatory_skills, is_active } = req.body;
    if (!company_id || !job_title || minimum_cgpa === undefined) {
      return res.status(400).json({ error: 'Missing required job parameters' });
    }
    const job = await repo.createJob({
      company_id: parseInt(company_id, 10),
      job_title,
      package_lpa: parseFloat(package_lpa || 0),
      minimum_cgpa: parseFloat(minimum_cgpa),
      maximum_backlogs: parseInt(maximum_backlogs || 0, 10),
      eligible_batches: eligible_batches || [2025],
      mandatory_skills: mandatory_skills || [],
      is_active: is_active || 'Y',
    });
    res.status(201).json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/jobs/:id/status', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const { is_active } = req.body;
    if (!['Y', 'N'].includes(is_active)) {
      return res.status(400).json({ error: "is_active must be 'Y' or 'N'" });
    }
    await repo.setJobStatus(id, is_active);
    res.json({ message: `Job active status updated to ${is_active}` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Eligibility Checker (Core PL/SQL Engine Feature) ---
apiRouter.get('/jobs/:id/eligibility', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const matrix = await repo.getJobEligibilityMatrix(id);
    res.json(matrix);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/eligibility/check', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const { student_id, job_id } = req.body;
    if (!student_id || !job_id) {
      return res.status(400).json({ error: 'Both student_id and job_id are required' });
    }
    const result = await repo.checkEligibility(parseInt(student_id, 10), parseInt(job_id, 10));
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Applications ---
apiRouter.get('/applications', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const status = req.query.status as string;
    const jobId = req.query.jobId ? parseInt(req.query.jobId as string, 10) : undefined;
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
    const apps = await repo.getApplications(status, jobId, studentId);
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/applications', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const { student_id, job_id } = req.body;
    if (!student_id || !job_id) {
      return res.status(400).json({ error: 'Both student_id and job_id are required' });
    }
    const app = await repo.createApplication(parseInt(student_id, 10), parseInt(job_id, 10));
    res.status(201).json(app);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch('/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const updated = await repo.updateApplicationStatus(id, status as ApplicationStatus);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/applications/:id/history', async (req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const id = getId(req.params.id);
    const history = await repo.getApplicationHistory(id);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Reports ---
apiRouter.get('/reports/placements', async (_req: Request, res: Response) => {
  try {
    const repo = getRepository();
    const summary = await repo.getPlacementSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Demo Reset ---
apiRouter.post('/demo/reset', async (_req: Request, res: Response) => {
  try {
    const repo = getRepository();
    await repo.resetDemoData();
    res.json({ message: 'Demo dataset reset to initial sample data successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
