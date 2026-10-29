import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Student } from '../types';
import { api } from '../services/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeStudent: Student | null;
  setActiveStudent: (student: Student | null) => void;
  studentsList: Student[];
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  systemMode: 'demo' | 'oracle';
  systemMessage: string;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [systemMode, setSystemMode] = useState<'demo' | 'oracle'>('demo');
  const [systemMessage, setSystemMessage] = useState<string>('Initializing...');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch health check on mount
  useEffect(() => {
    api
      .getHealth()
      .then((res) => {
        setSystemMode(res.mode as 'demo' | 'oracle');
        setSystemMessage(res.message);
      })
      .catch((err) => {
        setSystemMessage(`API Error: ${err.message}`);
      });
  }, [refreshKey]);

  // Load students list for student switcher
  useEffect(() => {
    api
      .getStudents()
      .then((data) => {
        setStudentsList(data);
        if (!activeStudent && data.length > 0) {
          // Default to Diya Patel (1002) or Aarav (1001)
          setActiveStudent(data[1] || data[0]);
        }
      })
      .catch((err) => console.error('Failed to load students:', err));
  }, [refreshKey]);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeStudent,
        setActiveStudent,
        studentsList,
        toasts,
        addToast,
        removeToast,
        systemMode,
        systemMessage,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
