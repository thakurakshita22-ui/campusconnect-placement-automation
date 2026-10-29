import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  FileCheck2,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { DashboardMetrics, Application } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { role, refreshKey } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getDashboard()
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading CampusConnect placement dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart data: Status Distribution
  const pieData = Object.entries(metrics.statusCounts || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const PIE_COLORS: Record<string, string> = {
    APPLIED: '#f59e0b',
    SHORTLISTED: '#3b82f6',
    SELECTED: '#10b981',
    REJECTED: '#ef4444',
    WITHDRAWN: '#94a3b8',
  };

  // Chart data: Company Activity
  const barData = (metrics.recruiter_breakdown || []).slice(0, 5).map((r) => ({
    name: r.company_name.split(' ')[0],
    applicants: r.total_applicants,
    selected: r.selected_count,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Executive Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time campus recruitment KPIs, eligibility validation, and application lifecycle metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/eligibility')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200/80 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verify Eligibility</span>
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/30 transition-all hover:shadow"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Drives</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Enrolled</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.total_students}</span>
            <span className="text-xs text-slate-500">candidates</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{metrics.final_year_students}</span>
            <span>final year (2025 batch)</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Recruiters</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.total_companies}</span>
            <span className="text-xs text-slate-500">companies</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-indigo-600 font-semibold">{metrics.active_jobs}</span>
            <span>active job openings</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Placed Candidates</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.placed_students}</span>
            <span className="text-xs text-emerald-600 font-semibold">({metrics.placement_percentage}% placed)</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-700 font-semibold">{metrics.total_offers} total offer letters</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Highest Package</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{metrics.highest_package_lpa}</span>
            <span className="text-xs font-bold text-slate-600">LPA</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Avg: </span>
            <span className="font-semibold text-slate-800">{metrics.average_package_lpa} LPA</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recruiter Activity & Selection Funnel</h2>
              <p className="text-xs text-slate-500 mt-0.5">Applicant flow vs. accepted offer letters by company</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Full Report <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="applicants" fill="#6366f1" name="Total Applicants" radius={[6, 6, 0, 0]} />
                <Bar dataKey="selected" fill="#10b981" name="Final Selections" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Status Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Applications by Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live state breakdown across 15 submissions</p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[d.name] }}></span>
                <span className="text-slate-600 font-medium capitalize">{d.name.toLowerCase()}:</span>
                <span className="font-bold text-slate-900 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Applications & Active Placement Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Application Submissions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tracking candidate progression and lifecycle state</p>
            </div>
            <button
              onClick={() => navigate('/applications')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              View All ({metrics.total_applications}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Job & Recruiter</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.recentApplications.map((app: Application) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{app.student_name}</div>
                      <div className="text-[11px] text-slate-400">{app.student_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{app.job_title}</div>
                      <div className="text-[11px] text-slate-400">{app.company_name}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {app.package_lpa ? `${app.package_lpa} LPA` : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Active Drives (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">Active Placement Drives</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Open Now
              </span>
            </div>

            <div className="space-y-3.5">
              {metrics.topOpportunities.map((job) => (
                <div
                  key={job.job_id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all cursor-pointer"
                  onClick={() => navigate('/jobs')}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{job.job_title}</h4>
                      <p className="text-[11px] text-indigo-600 font-medium">{job.company_name}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                      {job.package_lpa} LPA
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Min CGPA: <strong>{job.minimum_cgpa.toFixed(1)}</strong></span>
                    <span>•</span>
                    <span>Max Backlogs: <strong>{job.maximum_backlogs}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/jobs')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 transition-colors"
          >
            Explore All Placement Drives
          </button>
        </div>
      </div>
    </div>
  );
};
