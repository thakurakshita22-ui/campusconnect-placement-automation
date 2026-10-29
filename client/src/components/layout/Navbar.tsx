import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { role, setRole, activeStudent, setActiveStudent, studentsList, systemMode } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const notifications = [
    { id: 1, title: 'Google Cloud Drive Active', time: '10m ago', unread: true },
    { id: 2, title: 'New Application Submitted: Diya Patel', time: '1h ago', unread: true },
    { id: 3, title: 'Eligibility verified for Microsoft SDE', time: '3h ago', unread: false },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Hamburger & Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 text-slate-400 text-xs w-64 border border-transparent focus-within:border-indigo-400 focus-within:bg-white focus-within:text-slate-800 transition-all">
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Search students, jobs, companies..."
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right: Role Switcher & Profile */}
      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>{systemMode === 'oracle' ? 'Live Oracle DB' : 'Demo Mode (FreeSQL/Local)'}</span>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setRole('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'ADMIN'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => setRole('STUDENT')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              role === 'STUDENT'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
        </div>

        {/* Student Persona Selector (When role === 'STUDENT') */}
        {role === 'STUDENT' && (
          <div className="relative">
            <button
              onClick={() => setShowStudentPicker(!showStudentPicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-colors"
            >
              <span>Persona: <strong>{activeStudent?.student_name || 'Select Student'}</strong></span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showStudentPicker && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                  Switch Active Student Profile
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {studentsList.map((s) => (
                    <button
                      key={s.student_id}
                      onClick={() => {
                        setActiveStudent(s);
                        setShowStudentPicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeStudent?.student_id === s.student_id
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{s.student_name}</span>
                      <span className="text-[10px] opacity-80">CGPA {s.cgpa.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">Placement Alerts</span>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer">Mark all read</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-50/70 hover:bg-slate-50 transition-colors text-xs">
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold flex items-center justify-center text-xs shadow-sm">
            {role === 'ADMIN' ? 'AD' : activeStudent ? activeStudent.student_name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
        </div>
      </div>
    </header>
  );
};
