import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  CheckCircle,
  FileCheck2,
  BarChart3,
  Settings,
  GraduationCap,
  Sparkles,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { role, systemMode } = useApp();

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users, adminOnly: true },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Job Opportunities', href: '/jobs', icon: Briefcase },
    { name: 'Eligibility Checker', href: '/eligibility', icon: CheckCircle },
    { name: 'Applications', href: '/applications', icon: FileCheck2 },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNav = navigation.filter((item) => (role === 'STUDENT' ? !item.adminOnly : true));

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight leading-tight text-base">CampusConnect</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Placement Portal</span>
          </div>
        )}
      </div>

      {/* Role & System Mode Ribbon */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="uppercase tracking-wider font-semibold text-[10px]">
                {systemMode === 'oracle' ? 'Oracle DB' : 'Demo Mode'}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                role === 'ADMIN'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              {role === 'ADMIN' ? 'ADMIN' : 'STUDENT'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/60">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 text-xs">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PL/SQL Engine</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Automated 5-criteria eligibility evaluation via PLACEMENT_PKG.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
