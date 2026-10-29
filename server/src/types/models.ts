export interface Student {
  student_id: number;
  student_name: string;
  email: string;
  cgpa: number;
  graduation_year: number;
  active_backlogs: number;
  department?: string;
  created_at: string;
  skills?: string[];
  placement_status?: 'PLACED' | 'SEEKING' | 'OPTED_OUT';
}

export interface Skill {
  skill_id: number;
  skill_name: string;
}

export interface Company {
  company_id: number;
  company_name: string;
  industry: string;
  contact_email: string;
  created_at: string;
  total_openings_posted?: number;
  active_drives_count?: number;
}

export interface Job {
  job_id: number;
  company_id: number;
  company_name?: string;
  job_title: string;
  package_lpa: number;
  minimum_cgpa: number;
  maximum_backlogs: number;
  is_active: 'Y' | 'N';
  created_at: string;
  eligible_batches: number[];
  mandatory_skills: string[];
}

export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';

export interface Application {
  application_id: number;
  student_id: number;
  student_name?: string;
  student_email?: string;
  cgpa?: number;
  job_id: number;
  job_title?: string;
  company_name?: string;
  package_lpa?: number;
  application_status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationStatusHistory {
  history_id: number;
  application_id: number;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string;
}

export interface EligibilityResult {
  student_id: number;
  student_name: string;
  cgpa: number;
  graduation_year: number;
  active_backlogs: number;
  job_id: number;
  job_title: string;
  company_name: string;
  is_eligible: boolean;
  reasons: string;
  criteria_breakdown: {
    active_ok: boolean;
    cgpa_ok: boolean;
    backlogs_ok: boolean;
    batch_ok: boolean;
    skills_ok: boolean;
    missing_skills: string[];
  };
}

export interface PlacementSummary {
  total_students: number;
  final_year_students: number;
  total_companies: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  placed_students: number;
  total_offers: number;
  placement_percentage: number;
  highest_package_lpa: number;
  average_package_lpa: number;
  recruiter_breakdown: Array<{
    company_name: string;
    industry: string;
    total_openings: number;
    total_applicants: number;
    shortlisted_count: number;
    selected_count: number;
  }>;
}
