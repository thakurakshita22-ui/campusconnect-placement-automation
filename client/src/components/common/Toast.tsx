import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-white shadow-emerald-500/5',
          error: 'border-rose-200 bg-white shadow-rose-500/5',
          info: 'border-indigo-200 bg-white shadow-indigo-500/5',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${borders[toast.type]} transition-all animate-in slide-in-from-bottom-5 duration-200`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-slate-900">{toast.title}</h4>
              {toast.message && <p className="text-slate-600 mt-0.5 leading-snug">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
