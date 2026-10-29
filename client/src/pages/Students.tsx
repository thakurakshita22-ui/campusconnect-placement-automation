import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  GraduationCap,
  Sparkles,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Student, Skill } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useApp } from '../context/AppContext';

export const Students: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [minCgpaFilter, setMinCgpaFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'cgpa' | 'student_name' | 'student_id'>('cgpa');
  const [sortAsc, setSortAsc] = useState(false);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    cgpa: '8.00',
    graduation_year: '2025',
    active_backlogs: '0',
    department: 'Computer Science',
    skills: [] as string[],
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getStudents(), api.getSkills()])
      .then(([studs, sks]) => {
        setStudents(studs);
        setSkillsList(sks);
      })
      .catch((err) => addToast({ type: 'error', title: 'Load Failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch =
          s.student_name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()) ||
          s.student_id.toString().includes(search);
        const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;
        const matchesBatch = selectedBatch === 'ALL' || s.graduation_year.toString() === selectedBatch;
        const matchesCgpa =
          minCgpaFilter === 'ALL'
            ? true
            : minCgpaFilter === '9'
            ? s.cgpa >= 9.0
            : minCgpaFilter === '8'
            ? s.cgpa >= 8.0
            : minCgpaFilter === '7'
            ? s.cgpa >= 7.0
            : true;

        return matchesSearch && matchesDept && matchesBatch && matchesCgpa;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [students, search, selectedDept, selectedBatch, minCgpaFilter, sortField, sortAsc]);

  const handleOpenAdd = () => {
    setFormData({
      student_name: '',
      email: '',
      cgpa: '8.00',
      graduation_year: '2025',
      active_backlogs: '0',
      department: 'Computer Science',
      skills: ['Oracle SQL'],
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      student_name: student.student_name,
      email: student.email,
      cgpa: student.cgpa.toString(),
      graduation_year: student.graduation_year.toString(),
      active_backlogs: student.active_backlogs.toString(),
      department: student.department || 'Computer Science',
      skills: student.skills || [],
    });
    setEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStudent({
        student_name: formData.student_name,
        email: formData.email,
        cgpa: parseFloat(formData.cgpa),
        graduation_year: parseInt(formData.graduation_year, 10),
        active_backlogs: parseInt(formData.active_backlogs, 10),
        department: formData.department,
        skills: formData.skills,
      });
      addToast({ type: 'success', title: 'Student Registered', message: `${formData.student_name} registered successfully.` });
      setAddModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: err.message });
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await api.updateStudent(selectedStudent.student_id, {
        student_name: formData.student_name,
        cgpa: parseFloat(formData.cgpa),
        graduation_year: parseInt(formData.graduation_year, 10),
        active_backlogs: parseInt(formData.active_backlogs, 10),
        department: formData.department,
        skills: formData.skills,
      });
      addToast({ type: 'success', title: 'Profile Updated', message: `Updated Student #${selectedStudent.student_id}.` });
      setEditModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    try {
      await api.deleteStudent(studentToDelete.student_id);
      addToast({ type: 'success', title: 'Student Removed', message: `Removed Student #${studentToDelete.student_id}.` });
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const toggleSkill = (skillName: string) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skillName);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skillName) : [...prev.skills, skillName],
      };
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student academic profiles, CGPA cutoffs, active backlogs, and verified technical skills.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/30 transition-all hover:shadow self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full sm:w-72 focus-within:border-indigo-400 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:border-indigo-400 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Data Science">Data Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Electrical">Electrical</option>
          </select>

          {/* Batch Year Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:border-indigo-400 focus:outline-none"
          >
            <option value="ALL">All Batches</option>
            <option value="2025">2025 (Final Year)</option>
            <option value="2024">2024 (Graduated)</option>
            <option value="2026">2026 (Pre-Final)</option>
          </select>

          {/* CGPA Filter */}
          <select
            value={minCgpaFilter}
            onChange={(e) => setMinCgpaFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:border-indigo-400 focus:outline-none"
          >
            <option value="ALL">All CGPA</option>
            <option value="9">CGPA ≥ 9.0</option>
            <option value="8">CGPA ≥ 8.0</option>
            <option value="7">CGPA ≥ 7.0</option>
          </select>

          {/* Sort Switcher */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            title="Toggle sort direction"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort: {sortField === 'cgpa' ? 'CGPA' : sortField === 'student_name' ? 'Name' : 'ID'} ({sortAsc ? 'Asc' : 'Desc'})</span>
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => setSortField('student_id')}
                >
                  ID
                </th>
                <th
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => setSortField('student_name')}
                >
                  Student Profile
                </th>
                <th className="px-5 py-3.5">Department</th>
                <th
                  className="px-5 py-3.5 cursor-pointer hover:text-slate-800"
                  onClick={() => setSortField('cgpa')}
                >
                  CGPA
                </th>
                <th className="px-5 py-3.5">Batch</th>
                <th className="px-5 py-3.5">Backlogs</th>
                <th className="px-5 py-3.5">Verified Skills</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No students match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">#{s.student_id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{s.student_name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-600">{s.department || 'Computer Science'}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          s.cgpa >= 8.5
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.cgpa >= 7.0
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {s.cgpa.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{s.graduation_year}</td>
                    <td className="px-5 py-3.5">
                      {s.active_backlogs === 0 ? (
                        <span className="text-emerald-600 font-semibold">0 Clean</span>
                      ) : (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          {s.active_backlogs} Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {(s.skills || []).slice(0, 2).map((sk) => (
                          <span
                            key={sk}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          >
                            {sk}
                          </span>
                        ))}
                        {(s.skills || []).length > 2 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{s.skills!.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.placement_status === 'PLACED' ? (
                        <Badge variant="success">Placed</Badge>
                      ) : (
                        <Badge variant="warning">Seeking</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(s);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedStudent ? selectedStudent.student_name : 'Student Details'}
        description={`Student ID: #${selectedStudent?.student_id}`}
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-900">{selectedStudent.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Department</span>
                <span className="font-semibold text-slate-900">{selectedStudent.department || 'Computer Science'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Academic CGPA</span>
                <span className="font-bold text-slate-900 text-sm">{selectedStudent.cgpa.toFixed(2)} / 10.0</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Graduation Year</span>
                <span className="font-semibold text-slate-900">{selectedStudent.graduation_year}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Active Backlogs</span>
                <span className={selectedStudent.active_backlogs > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                  {selectedStudent.active_backlogs}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Placement State</span>
                <Badge variant={selectedStudent.placement_status === 'PLACED' ? 'success' : 'warning'}>
                  {selectedStudent.placement_status || 'SEEKING'}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-2">Verified Technical Skills:</h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedStudent.skills || []).map((sk) => (
                  <span
                    key={sk}
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD STUDENT MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register New Student"
        description="Creates student record and enforces PL/SQL validation bounds."
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Student Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              required
              placeholder="rahul.s@campus.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CGPA (0.00 - 10.00) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Graduation Batch *</label>
              <select
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Backlogs *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.active_backlogs}
                onChange={(e) => setFormData({ ...formData, active_backlogs: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Data Science">Data Science</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">Technical Skills (Click to toggle):</label>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((sk) => {
                const isSelected = formData.skills.includes(sk.skill_name);
                return (
                  <button
                    type="button"
                    key={sk.skill_id}
                    onClick={() => toggleSkill(sk.skill_name)}
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
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
            >
              Save Student Record
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Student Academic Record"
        description={`Modifying Student ID: #${selectedStudent?.student_id}`}
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Student Name</label>
            <input
              type="text"
              required
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CGPA (0.00 - 10.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={formData.cgpa}
                onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Backlogs</label>
              <input
                type="number"
                min="0"
                required
                value={formData.active_backlogs}
                onChange={(e) => setFormData({ ...formData, active_backlogs: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">Technical Skills:</label>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((sk) => {
                const isSelected = formData.skills.includes(sk.skill_name);
                return (
                  <button
                    type="button"
                    key={sk.skill_id}
                    onClick={() => toggleSkill(sk.skill_name)}
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
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl"
            >
              Update Record
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Student Deletion"
        description="Are you sure you want to permanently delete this candidate?"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Relational Cascade Notice:</p>
              <p className="mt-0.5">
                Deleting Student #{studentToDelete?.student_id} ({studentToDelete?.student_name}) will cascade delete all linked skills and applications as per database foreign key constraints.
              </p>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs"
            >
              Yes, Delete Student
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
