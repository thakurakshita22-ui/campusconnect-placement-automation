import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Briefcase,
  Search,
  Filter,
  Download,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Job, EligibilityResult } from '../types';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';

export const EligibilityChecker: React.FC = () => {
  const { addToast } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [matrix, setMatrix] = useState<{
    job: Job;
    eligibleStudents: EligibilityResult[];
    ineligibleStudents: EligibilityResult[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'INELIGIBLE'>('ALL');
  const [search, setSearch] = useState('');

  // Load jobs list on mount
  useEffect(() => {
    api
      .getJobs()
      .then((data) => {
        setJobs(data);
        if (data.length > 0 && !selectedJobId) {
          // Default to Google Cloud (201) or first job
          const defaultJob = data.find((j) => j.job_id === 201) || data[0];
          setSelectedJobId(defaultJob.job_id);
        }
      })
      .catch((err) => addToast({ type: 'error', title: 'Load Failed', message: err.message }));
  }, []);

  // Fetch eligibility matrix when job changes
  useEffect(() => {
    if (!selectedJobId) return;
    setLoading(true);
    api
      .getJobEligibilityMatrix(selectedJobId)
      .then((res) => setMatrix(res))
      .catch((err) => addToast({ type: 'error', title: 'Evaluation Failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [selectedJobId]);

  const allEvaluations = useMemo(() => {
    if (!matrix) return [];
    const combined = [...matrix.eligibleStudents, ...matrix.ineligibleStudents];

    return combined.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ELIGIBLE'
          ? item.is_eligible
          : !item.is_eligible;

      const matchesSearch =
        item.student_name.toLowerCase().includes(search.toLowerCase()) ||
        item.student_id.toString().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [matrix, statusFilter, search]);

  const exportCSV = () => {
    if (!matrix || allEvaluations.length === 0) return;
    const headers = ['Student ID', 'Student Name', 'CGPA', 'Batch', 'Backlogs', 'Eligibility Decision', 'Detailed Diagnostic Reasons'];
    const rows = allEvaluations.map((r) => [
      r.student_id,
      `"${r.student_name}"`,
      r.cgpa.toFixed(2),
      r.graduation_year,
      r.active_backlogs,
      r.is_eligible ? 'ELIGIBLE' : 'INELIGIBLE',
      `"${r.reasons.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Eligibility_${matrix.job.job_title.replace(/\s+/g, '_')}_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ type: 'success', title: 'Export Successful', message: 'Eligibility roster downloaded as CSV.' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automated Eligibility Engine Workbench</h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulate and verify student qualifications against PL/SQL package business rules across all academic parameters.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!matrix}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Export Matrix (CSV)</span>
        </button>
      </div>

      {/* Target Job Selector & Criteria Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>Select Target Recruitment Drive for Evaluation:</span>
          </label>

          <select
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none w-full sm:w-80"
          >
            {jobs.map((j) => (
              <option key={j.job_id} value={j.job_id}>
                #{j.job_id} - {j.job_title} ({j.company_name})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Job Criteria Breakdown */}
        {matrix && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-0.5">Minimum Academic Cutoff</span>
              <span className="font-bold text-slate-900 text-sm">CGPA ≥ {matrix.job.minimum_cgpa.toFixed(2)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-0.5">Max Permitted Backlogs</span>
              <span className="font-bold text-slate-900 text-sm">{matrix.job.maximum_backlogs} allowed</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-0.5">Permitted Passing Batches</span>
              <span className="font-bold text-slate-900 text-sm">{matrix.job.eligible_batches.join(', ')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[11px] mb-0.5">Recruitment Status</span>
              <Badge variant={matrix.job.is_active === 'Y' ? 'success' : 'neutral'}>
                {matrix.job.is_active === 'Y' ? 'Active Drive' : 'Inactive'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Pills */}
      {matrix && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800">Qualified Candidates</span>
              <div className="text-2xl font-bold text-emerald-950 mt-1">{matrix.eligibleStudents.length}</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-800">Disqualified Candidates</span>
              <div className="text-2xl font-bold text-rose-950 mt-1">{matrix.ineligibleStudents.length}</div>
            </div>
            <XCircle className="w-8 h-8 text-rose-500 opacity-80" />
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-800">Qualification Rate</span>
              <div className="text-2xl font-bold text-indigo-950 mt-1">
                {(
                  (matrix.eligibleStudents.length /
                    (matrix.eligibleStudents.length + matrix.ineligibleStudents.length || 1)) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-indigo-500 opacity-80" />
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-64 focus-within:border-indigo-400 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search candidate name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Filter:</span>
          {(['ALL', 'ELIGIBLE', 'INELIGIBLE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Candidates' : st === 'ELIGIBLE' ? 'Eligible Only' : 'Ineligible Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Candidate-by-Candidate Evaluation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Evaluating eligibility rules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Candidate</th>
                  <th className="px-5 py-3.5">CGPA</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Backlogs</th>
                  <th className="px-5 py-3.5">Engine Decision</th>
                  <th className="px-5 py-3.5">Diagnostic Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {allEvaluations.map((item) => (
                  <tr key={item.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <div>{item.student_name}</div>
                      <span className="text-[10px] text-slate-400">ID #{item.student_id}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{item.cgpa.toFixed(2)}</td>
                    <td className="px-5 py-3.5">{item.graduation_year}</td>
                    <td className="px-5 py-3.5">
                      <span className={item.active_backlogs > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                        {item.active_backlogs}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.is_eligible ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>QUALIFIED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>DISQUALIFIED</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-md">
                      <p
                        className={`text-[11px] leading-relaxed ${
                          item.is_eligible ? 'text-emerald-700 font-medium' : 'text-rose-700 font-normal'
                        }`}
                      >
                        {item.reasons}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
