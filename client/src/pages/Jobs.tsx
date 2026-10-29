import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api';
import { Job, Company, Skill, Application } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';

export const Jobs: React.FC = () => {
  const { role, activeStudent, addToast, refreshKey, triggerRefresh } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [studentApplications, setStudentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [minCgpaFilter, setMinCgpaFilter] = useState('ALL');

  // Modals
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [addJobModalOpen, setAddJobModalOpen] = useState(false);
  const [eligibilityModalOpen, setEligibilityModalOpen] = useState(false);
  const [jobEligibilityReason, setJobEligibilityReason] = useState<{ isElig: boolean; reason: string }>({
    isElig: false,
    reason: '',
  });

  // New Job Form State
  const [formData, setFormData] = useState({
    company_id: '',
    job_title: '',
    package_lpa: '12.00',
    minimum_cgpa: '7.00',
    maximum_backlogs: '0',
    eligible_batches: [2025],
    mandatory_skills: ['Java', 'Oracle SQL'],
    is_active: 'Y' as 'Y' | 'N',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getJobs(),
      api.getCompanies(),
      api.getSkills(),
      activeStudent ? api.getApplications(undefined, undefined, activeStudent.student_id) : Promise.resolve([]),
    ])
      .then(([jobsData, compData, skData, appData]) => {
        setJobs(jobsData);
        setCompanies(compData);
        setSkillsList(skData);
        setStudentApplications(appData);
        if (compData.length > 0 && !formData.company_id) {
          setFormData((prev) => ({ ...prev, company_id: compData[0].company_id.toString() }));
        }
      })
      .catch((err) => addToast({ type: 'error', title: 'Load Failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey, activeStudent]);

  // Compute eligibility for active student
  const studentEligibilityMap = useMemo(() => {
    if (!activeStudent) return new Map<number, { isElig: boolean; reason: string; alreadyApplied: boolean }>();

    const map = new Map<number, { isElig: boolean; reason: string; alreadyApplied: boolean }>();
    const appliedJobIds = new Set(studentApplications.map((a) => a.job_id));

    jobs.forEach((job) => {
      const alreadyApplied = appliedJobIds.has(job.job_id);
      const reasons: string[] = [];
      let isElig = true;

      if (job.is_active !== 'Y') {
        isElig = false;
        reasons.push('Job opportunity is currently INACTIVE.');
      }
      if (activeStudent.cgpa < job.minimum_cgpa) {
        isElig = false;
        reasons.push(`CGPA (${activeStudent.cgpa.toFixed(2)}) is below minimum cutoff (${job.minimum_cgpa.toFixed(2)}).`);
      }
      if (activeStudent.active_backlogs > job.maximum_backlogs) {
        isElig = false;
        reasons.push(`Active backlogs (${activeStudent.active_backlogs}) exceed limit (${job.maximum_backlogs}).`);
      }
      if (!job.eligible_batches.includes(activeStudent.graduation_year)) {
        isElig = false;
        reasons.push(`Graduation year (${activeStudent.graduation_year}) not in eligible batches (${job.eligible_batches.join(', ')}).`);
      }
      const missingSkills = job.mandatory_skills.filter((sk) => !(activeStudent.skills || []).includes(sk));
      if (missingSkills.length > 0) {
        isElig = false;
        reasons.push(`Missing mandatory skill(s): ${missingSkills.join(', ')}.`);
      }

      map.set(job.job_id, {
        isElig,
        reason: isElig ? 'Candidate satisfies all academic, backlog, batch, and skill criteria.' : reasons.join(' '),
        alreadyApplied,
      });
    });

    return map;
  }, [jobs, activeStudent, studentApplications]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.job_title.toLowerCase().includes(search.toLowerCase()) ||
        (j.company_name && j.company_name.toLowerCase().includes(search.toLowerCase()));
      const matchesActive = activeOnly ? j.is_active === 'Y' : true;
      const matchesCgpa =
        minCgpaFilter === 'ALL'
          ? true
          : minCgpaFilter === '8.5'
          ? j.minimum_cgpa >= 8.5
          : minCgpaFilter === '7.5'
          ? j.minimum_cgpa >= 7.5
          : minCgpaFilter === '6.5'
          ? j.minimum_cgpa >= 6.5
          : true;

      return matchesSearch && matchesActive && matchesCgpa;
    });
  }, [jobs, search, activeOnly, minCgpaFilter]);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    const evalData = studentEligibilityMap.get(job.job_id);
    if (!evalData?.isElig) {
      setJobEligibilityReason({ isElig: false, reason: evalData?.reason || 'Ineligible' });
      setEligibilityModalOpen(true);
      return;
    }
    setApplyModalOpen(true);
  };

  const handleConfirmApply = async () => {
    if (!selectedJob || !activeStudent) return;
    try {
      await api.createApplication(activeStudent.student_id, selectedJob.job_id);
      addToast({
        type: 'success',
        title: 'Application Submitted!',
        message: `Successfully applied to ${selectedJob.job_title} at ${selectedJob.company_name}. Status: APPLIED`,
      });
      setApplyModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Application Rejected', message: err.message });
      setApplyModalOpen(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createJob({
        company_id: parseInt(formData.company_id, 10),
        job_title: formData.job_title,
        package_lpa: parseFloat(formData.package_lpa),
        minimum_cgpa: parseFloat(formData.minimum_cgpa),
        maximum_backlogs: parseInt(formData.maximum_backlogs, 10),
        eligible_batches: formData.eligible_batches,
        mandatory_skills: formData.mandatory_skills,
        is_active: formData.is_active,
      });
      addToast({ type: 'success', title: 'Opening Created', message: `${formData.job_title} posted successfully.` });
      setAddJobModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Job Creation Failed', message: err.message });
    }
  };

  const toggleRequiredSkill = (skillName: string) => {
    setFormData((prev) => {
      const exists = prev.mandatory_skills.includes(skillName);
      return {
        ...prev,
        mandatory_skills: exists
          ? prev.mandatory_skills.filter((s) => s !== skillName)
          : [...prev.mandatory_skills, skillName],
      };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Job Opportunities</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore corporate campus drives with automated 5-criteria eligibility verification.
          </p>
        </div>
        {role === 'ADMIN' && (
          <button
            onClick={() => setAddJobModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/30 transition-all hover:shadow self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job Opening</span>
          </button>
        )}
      </div>

      {/* Student Banner when in Student Mode */}
      {role === 'STUDENT' && activeStudent && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {activeStudent.student_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Evaluating as Student</span>
              <h4 className="font-bold text-slate-900 text-sm">
                {activeStudent.student_name} ({activeStudent.department})
              </h4>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 font-medium">
              CGPA: <strong>{activeStudent.cgpa.toFixed(2)}</strong>
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 font-medium">
              Backlogs: <strong>{activeStudent.active_backlogs}</strong>
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-100 font-medium">
              Batch: <strong>{activeStudent.graduation_year}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full sm:w-72 focus-within:border-indigo-400 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 text-xs">
          <select
            value={minCgpaFilter}
            onChange={(e) => setMinCgpaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
          >
            <option value="ALL">All Cutoffs</option>
            <option value="8.5">Min CGPA ≥ 8.5</option>
            <option value="7.5">Min CGPA ≥ 7.5</option>
            <option value="6.5">Min CGPA ≥ 6.5</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Active Drives Only</span>
          </label>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredJobs.map((job) => {
          const evalData = studentEligibilityMap.get(job.job_id);

          return (
            <div
              key={job.job_id}
              className={`bg-white p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                job.is_active === 'N' ? 'border-slate-200/60 bg-slate-50/40 opacity-80' : 'border-slate-200/80'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {job.company_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">{job.job_title}</h3>
                      <p className="text-xs text-indigo-600 font-medium">{job.company_name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80">
                    {job.package_lpa} LPA
                  </span>
                </div>

                {/* Eligibility Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {job.is_active === 'N' ? (
                    <Badge variant="neutral">Drive Closed</Badge>
                  ) : role === 'STUDENT' && evalData ? (
                    evalData.alreadyApplied ? (
                      <Badge variant="info">Already Applied</Badge>
                    ) : evalData.isElig ? (
                      <Badge variant="success">Eligible to Apply</Badge>
                    ) : (
                      <Badge variant="danger">Not Eligible</Badge>
                    )
                  ) : (
                    <Badge variant="success">Active Drive</Badge>
                  )}
                </div>

                {/* Criteria Box */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs text-slate-600 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Min CGPA Required:</span>
                    <span className="font-semibold text-slate-800">{job.minimum_cgpa.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Max Permitted Backlogs:</span>
                    <span className="font-semibold text-slate-800">{job.maximum_backlogs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Eligible Batch(es):</span>
                    <span className="font-semibold text-slate-800">{job.eligible_batches.join(', ')}</span>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="text-xs mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Mandatory Skills:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {job.mandatory_skills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                {role === 'STUDENT' ? (
                  evalData?.alreadyApplied ? (
                    <button
                      disabled
                      className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed"
                    >
                      Application Submitted
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyClick(job)}
                      disabled={job.is_active === 'N'}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                        job.is_active === 'N'
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : evalData?.isElig
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{evalData?.isElig ? 'Apply Now' : 'Check Ineligibility'}</span>
                    </button>
                  )
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Job ID: #{job.job_id}</span>
                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setEligibilityModalOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Verify Candidates →
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIRM APPLICATION MODAL */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Confirm Application Submission"
        description="Your eligibility has been verified against the PL/SQL engine criteria."
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">Eligibility Confirmed</h4>
              <p className="text-emerald-700 mt-1">
                You satisfy all academic cutoff, backlog, graduation year, and technical skill requirements for{' '}
                <strong>{selectedJob?.job_title}</strong> at <strong>{selectedJob?.company_name}</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
            <div className="flex justify-between">
              <span>Candidate Name:</span>
              <strong>{activeStudent?.student_name}</strong>
            </div>
            <div className="flex justify-between">
              <span>CGPA:</span>
              <strong>{activeStudent?.cgpa.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Compensation:</span>
              <strong className="text-indigo-600">{selectedJob?.package_lpa} LPA</strong>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApply}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              Submit Application
            </button>
          </div>
        </div>
      </Modal>

      {/* INELIGIBILITY DIAGNOSTIC MODAL */}
      <Modal
        isOpen={eligibilityModalOpen}
        onClose={() => setEligibilityModalOpen(false)}
        title="Automated Eligibility Diagnostic"
        description="Detailed evaluation report generated by PLACEMENT_PKG."
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900 text-sm">Application Blocked: Ineligible</h4>
              <p className="text-rose-700 mt-1">{jobEligibilityReason.reason}</p>
            </div>
          </div>

          <p className="text-slate-500 text-[11px]">
            The database business rules engine requires candidates to satisfy all 5 criteria before permitting application insertion.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setEligibilityModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Dismiss
            </button>
          </div>
        </div>
      </Modal>

      {/* CREATE JOB MODAL (ADMIN) */}
      <Modal
        isOpen={addJobModalOpen}
        onClose={() => setAddJobModalOpen(false)}
        title="Post New Campus Placement Opening"
        description="Adds job opening into JOBS, JOB_ELIGIBLE_YEARS, and JOB_REQUIRED_SKILLS."
      >
        <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recruiting Company *</label>
            <select
              required
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            >
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.company_name} ({c.industry})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Position / Job Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Associate Cloud Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Package (LPA) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={formData.package_lpa}
                onChange={(e) => setFormData({ ...formData, package_lpa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Minimum CGPA Cutoff *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={formData.minimum_cgpa}
                onChange={(e) => setFormData({ ...formData, minimum_cgpa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Allowed Backlogs *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.maximum_backlogs}
                onChange={(e) => setFormData({ ...formData, maximum_backlogs: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Status</label>
              <select
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value as 'Y' | 'N' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              >
                <option value="Y">Active (Open to Applications)</option>
                <option value="N">Inactive (Draft/Closed)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">Mandatory Prerequisite Skills:</label>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((sk) => {
                const isSelected = formData.mandatory_skills.includes(sk.skill_name);
                return (
                  <button
                    type="button"
                    key={sk.skill_id}
                    onClick={() => toggleRequiredSkill(sk.skill_name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sk.skill_name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddJobModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
            >
              Create Job Opening
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
