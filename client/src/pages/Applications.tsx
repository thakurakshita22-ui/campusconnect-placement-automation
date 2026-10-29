import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  History,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Application, ApplicationStatus, ApplicationStatusHistory } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';

export const Applications: React.FC = () => {
  const { role, activeStudent, addToast, refreshKey, triggerRefresh } = useApp();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Audit History Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [historyList, setHistoryList] = useState<ApplicationStatusHistory[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Status Update Confirmation Modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('SHORTLISTED');

  useEffect(() => {
    setLoading(true);
    const studentFilter = role === 'STUDENT' && activeStudent ? activeStudent.student_id : undefined;

    api
      .getApplications(undefined, undefined, studentFilter)
      .then((data) => setApplications(data))
      .catch((err) => addToast({ type: 'error', title: 'Load Failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey, role, activeStudent]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        (app.student_name && app.student_name.toLowerCase().includes(search.toLowerCase())) ||
        (app.job_title && app.job_title.toLowerCase().includes(search.toLowerCase())) ||
        (app.company_name && app.company_name.toLowerCase().includes(search.toLowerCase())) ||
        app.application_id.toString().includes(search);
      const matchesStatus = statusFilter === 'ALL' || app.application_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const handleOpenHistory = async (app: Application) => {
    setSelectedApp(app);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const history = await api.getApplicationHistory(app.application_id);
      setHistoryList(history);
    } catch (err: any) {
      addToast({ type: 'error', title: 'History Fetch Failed', message: err.message });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenStatusTransition = (app: Application, nextState: ApplicationStatus) => {
    setSelectedApp(app);
    setTargetStatus(nextState);
    setUpdateModalOpen(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedApp) return;
    try {
      await api.updateApplicationStatus(selectedApp.application_id, targetStatus);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Application #${selectedApp.application_id} transitioned to ${targetStatus}. Trigger audit row recorded.`,
      });
      setUpdateModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Transition Rejected', message: err.message });
      setUpdateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Application Lifecycle & Audit Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforcing state machine rules: APPLIED → SHORTLISTED → SELECTED with automated trigger audit logging.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full sm:w-72 focus-within:border-indigo-400 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search student, job, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Status Pills Filter */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'WITHDRAWN'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">App ID</th>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-5 py-3.5">Position & Recruiter</th>
                <th className="px-5 py-3.5">Package</th>
                <th className="px-5 py-3.5">Current Status</th>
                <th className="px-5 py-3.5">Submission Date</th>
                <th className="px-5 py-3.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                    No applications match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">#{app.application_id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{app.student_name}</div>
                      <div className="text-[11px] text-slate-400">{app.student_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{app.job_title}</div>
                      <div className="text-[11px] text-slate-400">{app.company_name}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {app.package_lpa ? `${app.package_lpa} LPA` : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Audit Trail Button */}
                        <button
                          onClick={() => handleOpenHistory(app)}
                          className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                          title="View Audit Trail"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </button>

                        {/* Allowed State Machine Transitions */}
                        {role === 'ADMIN' && (
                          <>
                            {app.application_status === 'APPLIED' && (
                              <button
                                onClick={() => handleOpenStatusTransition(app, 'SHORTLISTED')}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg border border-indigo-200 transition-colors"
                              >
                                Shortlist →
                              </button>
                            )}

                            {app.application_status === 'SHORTLISTED' && (
                              <button
                                onClick={() => handleOpenStatusTransition(app, 'SELECTED')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors"
                              >
                                Select Candidate ✓
                              </button>
                            )}

                            {['APPLIED', 'SHORTLISTED'].includes(app.application_status) && (
                              <button
                                onClick={() => handleOpenStatusTransition(app, 'REJECTED')}
                                className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                              >
                                Reject
                              </button>
                            )}

                            {['REJECTED', 'WITHDRAWN', 'SELECTED'].includes(app.application_status) && (
                              <span className="text-[11px] text-slate-400 italic">Terminal State</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT LOG MODAL (From APPLICATION_STATUS_HISTORY) */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Application Status History & Audit Trail"
        description={`Application #${selectedApp?.application_id} for ${selectedApp?.student_name}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900">
            <span className="font-semibold block mb-0.5">Automated Database Trigger: TRG_APP_STATUS_AUDIT</span>
            <p className="text-[11px] text-indigo-700">
              Every status modification is captured immutably in the APPLICATION_STATUS_HISTORY table with timestamp and user.
            </p>
          </div>

          {loadingHistory ? (
            <p className="text-center py-4 text-slate-400">Loading audit history...</p>
          ) : historyList.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No status transitions recorded yet. Initial state: APPLIED.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-indigo-200 ml-4 space-y-4 my-2">
              {historyList.map((h) => (
                <div key={h.history_id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100"></div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {h.old_status ? `${h.old_status} → ${h.new_status}` : h.new_status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.changed_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Operator / Role: {h.changed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* STATUS UPDATE CONFIRMATION MODAL */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="Confirm Application Status Transition"
        description="Enforces PL/SQL package transition rules and fires database triggers."
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Candidate:</span>
              <strong className="text-slate-900">{selectedApp?.student_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Opportunity:</span>
              <strong className="text-slate-900">{selectedApp?.job_title} ({selectedApp?.company_name})</strong>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-500">Status Change:</span>
              <div className="flex items-center gap-2 font-bold">
                <StatusBadge status={selectedApp?.application_status || ''} />
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <StatusBadge status={targetStatus} />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setUpdateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmStatusUpdate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
            >
              Confirm State Transition
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
