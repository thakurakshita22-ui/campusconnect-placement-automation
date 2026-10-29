import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Info,
  Server,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';

export const Settings: React.FC = () => {
  const { role, setRole, systemMode, systemMessage, addToast, triggerRefresh } = useApp();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetConfirm = async () => {
    setResetting(true);
    try {
      await api.resetDemoData();
      addToast({
        type: 'success',
        title: 'Demo Data Reset',
        message: 'Sample data reloaded to initial state (10 students, 5 companies, 8 jobs, 15 applications).',
      });
      setResetModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Reset Failed', message: err.message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Environment Configuration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect database connectivity, toggle user roles, reset test data, and review deployment parameters.
        </p>
      </div>

      {/* Database Mode & Connection Status Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Database Layer Status</h3>
              <p className="text-xs text-slate-500">Repository abstraction & PL/SQL execution engine</p>
            </div>
          </div>
          <Badge variant={systemMode === 'oracle' ? 'success' : 'info'}>
            {systemMode === 'oracle' ? 'Live Oracle Mode' : 'Demo Emulation Mode'}
          </Badge>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Active Mode:</span>
            <strong className="text-slate-800 uppercase tracking-wide">{systemMode}</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Status Message:</span>
            <span className="text-slate-700 font-medium">{systemMessage}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Business Logic Architecture:</span>
            <span className="text-indigo-600 font-semibold">Oracle PL/SQL Package (PLACEMENT_PKG)</span>
          </div>
        </div>

        {/* FreeSQL vs Local Oracle Explanation */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Oracle FreeSQL Environment Note</h4>
            <p className="text-amber-800 leading-relaxed">
              Oracle FreeSQL operates in the web browser worksheet and does not provide an external TCP port for direct Node.js driver connections. CampusConnect features a clean repository layer: in <strong>Demo Mode</strong>, it emulates all Oracle PL/SQL package procedures, 5-criteria eligibility rules, and trigger audits.
            </p>
            <p className="text-amber-800 font-medium pt-1">
              To connect to a live Oracle Database (Oracle XE, 21c/23c Free, or Cloud Autonomous), set <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-900 font-mono">DB_MODE=oracle</code> in <code className="bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-900 font-mono">server/.env</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Role Switcher Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">User Role & Experience Mode</h3>
            <p className="text-xs text-slate-500">Toggle between administrator portal and student job-seeking experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div
            onClick={() => setRole('ADMIN')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              role === 'ADMIN'
                ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-400/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">Placement Officer (Admin)</span>
              {role === 'ADMIN' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <p className="text-slate-500 leading-relaxed">
              Manage students, add companies, post openings, check eligibility matrices, advance application lifecycles, and view reports.
            </p>
          </div>

          <div
            onClick={() => setRole('STUDENT')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              role === 'STUDENT'
                ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-400/20'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-sm">Candidate / Student Portal</span>
              {role === 'STUDENT' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </div>
            <p className="text-slate-500 leading-relaxed">
              Explore placement drives, see dynamic eligibility labels (Eligible vs Ineligible with reasons), submit applications, and track progress.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Data Reset Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset Sample Data</h3>
              <p className="text-xs text-slate-500">Restore the clean 10-student, 5-company, 8-job baseline dataset</p>
            </div>
          </div>
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Reset Dataset
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Use this action to refresh all records back to the initial sample dataset defined in <strong>02_sample_data.sql</strong>.
        </p>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Confirm Dataset Reset"
        description="Are you sure you want to reset all test data?"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            This will discard any newly created students, companies, or applications and reset the database back to the standard sample dataset.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleResetConfirm}
              disabled={resetting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {resetting ? 'Resetting...' : 'Yes, Reset Data'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
