import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { Company, Job } from '../types';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';

export const Companies: React.FC = () => {
  const { addToast, refreshKey, triggerRefresh } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');

  // Modals
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    industry: 'Information Technology',
    contact_email: '',
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCompanies(), api.getJobs()])
      .then(([compData, jobData]) => {
        setCompanies(compData);
        setJobs(jobData);
      })
      .catch((err) => addToast({ type: 'error', title: 'Load Failed', message: err.message }))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase()) ||
        c.contact_email.toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = selectedIndustry === 'ALL' || c.industry === selectedIndustry;
      return matchesSearch && matchesIndustry;
    });
  }, [companies, search, selectedIndustry]);

  const handleOpenAdd = () => {
    setFormData({
      company_name: '',
      industry: 'Information Technology',
      contact_email: '',
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setSelectedCompany(comp);
    setFormData({
      company_name: comp.company_name,
      industry: comp.industry,
      contact_email: comp.contact_email,
    });
    setEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCompany(formData);
      addToast({ type: 'success', title: 'Company Added', message: `${formData.company_name} registered successfully.` });
      setAddModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: err.message });
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      await api.updateCompany(selectedCompany.company_id, formData);
      addToast({ type: 'success', title: 'Company Updated', message: `${formData.company_name} updated successfully.` });
      setEditModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;
    try {
      await api.deleteCompany(companyToDelete.company_id);
      addToast({ type: 'success', title: 'Company Removed', message: `${companyToDelete.company_name} deleted.` });
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
      triggerRefresh();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const companyJobs = selectedCompany ? jobs.filter((j) => j.company_id === selectedCompany.company_id) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Corporate Recruiters Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage partner enterprises, recruitment contacts, posted positions, and hiring drives.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/30 transition-all hover:shadow self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full sm:w-72 focus-within:border-indigo-400 focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search company or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:border-indigo-400 focus:outline-none"
        >
          <option value="ALL">All Industries</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Cloud & E-Commerce">Cloud & E-Commerce</option>
          <option value="IT Services & Consulting">IT Services & Consulting</option>
          <option value="IT Solutions">IT Solutions</option>
        </select>
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((c) => {
          const associatedJobs = jobs.filter((j) => j.company_id === c.company_id);
          const activeJobs = associatedJobs.filter((j) => j.is_active === 'Y');

          return (
            <div
              key={c.company_id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {c.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ID #{c.company_id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight">{c.company_name}</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                  {c.industry}
                </span>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{c.contact_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong>{associatedJobs.length}</strong> Openings ({activeJobs.length} active)
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedCompany(c);
                    setViewModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Openings
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCompanyToDelete(c);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIEW COMPANY DETAILS & JOBS MODAL */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedCompany?.company_name || 'Company Profile'}
        description={`Industry: ${selectedCompany?.industry} • Contact: ${selectedCompany?.contact_email}`}
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-800 text-sm">Recruitment Openings ({companyJobs.length})</h4>

          {companyJobs.length === 0 ? (
            <p className="text-slate-400 py-4 text-center">No openings posted yet by this recruiter.</p>
          ) : (
            <div className="space-y-2.5">
              {companyJobs.map((j) => (
                <div key={j.job_id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{j.job_title}</h5>
                      <span className="text-indigo-600 font-semibold">{j.package_lpa} LPA</span>
                    </div>
                    <Badge variant={j.is_active === 'Y' ? 'success' : 'neutral'}>
                      {j.is_active === 'Y' ? 'Active Drive' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                    <span>Min CGPA: <strong>{j.minimum_cgpa.toFixed(2)}</strong></span>
                    <span>Max Backlogs: <strong>{j.maximum_backlogs}</strong></span>
                    <span>Batches: <strong>{j.eligible_batches.join(', ')}</strong></span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400 self-center">Skills:</span>
                    {j.mandatory_skills.map((sk) => (
                      <span key={sk} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ADD COMPANY MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Register Recruiting Company"
        description="Creates company profile in COMPANIES table."
      >
        <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Cisco Systems"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Industry Sector *</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            >
              <option value="Information Technology">Information Technology</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="Cloud & E-Commerce">Cloud & E-Commerce</option>
              <option value="IT Services & Consulting">IT Services & Consulting</option>
              <option value="IT Solutions">IT Solutions</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Contact Email *</label>
            <input
              type="email"
              required
              placeholder="campus-recruiting@company.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
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
              Register Company
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT COMPANY MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Recruiter Profile"
        description={`Modifying Company ID: #${selectedCompany?.company_id}`}
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Industry</label>
            <input
              type="text"
              required
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-400 focus:outline-none"
            />
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
              Update Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Company Deletion"
        description="Are you sure you want to delete this company?"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Relational Cascade Notice:</p>
              <p className="mt-0.5">
                Deleting {companyToDelete?.company_name} will cascade delete all posted job opportunities and associated student applications.
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
              Yes, Delete Company
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
