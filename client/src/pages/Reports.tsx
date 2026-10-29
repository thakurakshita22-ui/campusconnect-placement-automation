import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Building2,
  Trophy,
  Users,
  Briefcase,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { PlacementSummary } from '../types';
import { useApp } from '../context/AppContext';

export const Reports: React.FC = () => {
  const { addToast } = useApp();
  const [summary, setSummary] = useState<PlacementSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getPlacementSummary()
      .then((data) => setSummary(data))
      .catch((err) => addToast({ type: 'error', title: 'Load Failed', message: err.message }))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Recruiter Funnel Data
  const recruiterData = summary.recruiter_breakdown.map((r) => ({
    name: r.company_name.split(' ')[0],
    openings: r.total_openings,
    applicants: r.total_applicants,
    shortlisted: r.shortlisted_count,
    selected: r.selected_count,
  }));

  const exportRecruiterCSV = () => {
    const headers = ['Company Name', 'Industry', 'Total Openings', 'Total Applicants', 'Shortlisted', 'Selected Offer Letters'];
    const rows = summary.recruiter_breakdown.map((r) => [
      `"${r.company_name}"`,
      `"${r.industry}"`,
      r.total_openings,
      r.total_applicants,
      r.shortlisted_count,
      r.selected_count,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'CampusConnect_Recruiter_Placement_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ type: 'success', title: 'Export Complete', message: 'Recruiter statistics exported to CSV.' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placement Analytics & Executive Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aggregated metrics derived from VW_OVERALL_PLACEMENT_STATS and VW_COMPANY_APPLICATION_STATS.
          </p>
        </div>
        <button
          onClick={exportRecruiterCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary CSV</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Placement Rate
          </span>
          <div className="text-2xl font-bold text-emerald-600">{summary.placement_percentage}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.placed_students} of {summary.final_year_students} final year candidates
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Offers
          </span>
          <div className="text-2xl font-bold text-indigo-600">{summary.total_offers}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Offer letters issued</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Highest Package
          </span>
          <div className="text-2xl font-bold text-slate-900">{summary.highest_package_lpa} LPA</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Offered by Google Cloud</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Average Package
          </span>
          <div className="text-2xl font-bold text-slate-900">{summary.average_package_lpa} LPA</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across all placements</span>
        </div>
      </div>

      {/* Recruiter Activity Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Recruiter Selection Funnel</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-6">Applicants vs Shortlisted vs Final Selections</p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recruiterData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <Bar dataKey="applicants" fill="#6366f1" name="Applications" radius={[6, 6, 0, 0]} />
              <Bar dataKey="shortlisted" fill="#38bdf8" name="Shortlisted" radius={[6, 6, 0, 0]} />
              <Bar dataKey="selected" fill="#10b981" name="Selected" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Company Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Company-wise Placement Statistics</h2>
            <p className="text-xs text-slate-500 mt-0.5">Database view: VW_COMPANY_APPLICATION_STATS</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{summary.recruiter_breakdown.length} Recruiters</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Company Name</th>
                <th className="px-5 py-3.5">Industry</th>
                <th className="px-5 py-3.5 text-center">Openings</th>
                <th className="px-5 py-3.5 text-center">Applications</th>
                <th className="px-5 py-3.5 text-center">Shortlisted</th>
                <th className="px-5 py-3.5 text-center">Selected</th>
                <th className="px-5 py-3.5 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary.recruiter_breakdown.map((r) => {
                const convRate = r.total_applicants > 0 ? ((r.selected_count / r.total_applicants) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={r.company_name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.company_name}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-600">{r.industry}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-slate-800">{r.total_openings}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-indigo-600">{r.total_applicants}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-sky-600">{r.shortlisted_count}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{r.selected_count}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">{convRate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
