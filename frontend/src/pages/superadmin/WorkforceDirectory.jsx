import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Edit, Eye, Shield, User as UserIcon, Check, X, Ban, Upload, Trash2, Download, Briefcase, Activity, Users, ShieldAlert } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function WorkforceDirectory() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', mobile: '', password: '', role: 'EMPLOYEE', designation: '', department: '', salary: '', pan: '', uan: '', isActive: true
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetching all (unpaginated or very large limit) to support dynamic frontend stats and proper export
      const res = await api.get('/workforce', { params: { limit: 1000 } });
      setUsers(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching workforce');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(k => {
      if (formData[k] !== undefined && formData[k] !== '') {
        data.append(k, formData[k]);
      }
    });
    if (avatarFile) data.append('avatar', avatarFile);

    try {
      if (editingId) {
        await api.put(`/workforce/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/workforce', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (id === authUser._id) {
      return alert("You cannot deactivate your own account.");
    }
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this personnel?`)) return;
    try {
      await api.patch(`/workforce/${id}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const deleteUser = async (id) => {
    if (id === authUser._id) {
      return alert("You cannot delete your own account.");
    }
    if (!window.confirm("Are you sure you want to delete this personnel? This action cannot be undone.")) return;
    try {
      await api.delete(`/workforce/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting personnel');
    }
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    setFormData({
      name: u.name, mobile: u.mobile, password: '', role: u.role, 
      designation: u.designation || '', department: u.department || '', 
      salary: u.salary || '', pan: u.pan || '', uan: u.uan || '', isActive: u.isActive
    });
    setAvatarFile(null);
    setAvatarPreview(u.avatar || null);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '', mobile: '', password: '', role: 'EMPLOYEE', designation: '', department: '', salary: '', pan: '', uan: '', isActive: true
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setShowModal(true);
  };

  const handleExport = () => {
    const headers = ['Name,Mobile,Role,Designation,Department,Salary,Status'];
    const csvData = users.map(u => 
      `"${u.name}","${u.mobile}","${u.role}","${u.designation || ''}","${u.department || ''}","${u.salary || ''}","${u.isActive ? 'Active' : 'Inactive'}"`
    );
    const blob = new Blob([headers.concat(csvData).join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Workforce_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Compute dynamic stats based on ALL fetched users
  const totalHeadcount = users.length;
  const activeStaff = users.filter(u => u.isActive).length;
  const employeeCount = users.filter(u => u.role === 'EMPLOYEE').length;
  const adminCount = users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length;
  
  // Filter for display
  const filteredUsers = users.filter(u => {
    const matchesSearch = search === '' || 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.mobile.includes(search) ||
      (u.designation && u.designation.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    const matchesDept = departmentFilter === '' || u.department === departmentFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Workforce Governance & Personnel Registry</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Super Admin Unrestricted Access</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Super Admin Authority: You can onboard and manage Admins and Employees across all business units.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export Directory
          </button>
          <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
            <UserPlus className="w-4 h-4" /> Add Admin / Employee
          </button>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl"><Users className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Headcount</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{totalHeadcount}</h3>
              <span className="text-sm font-medium text-slate-500">Personnel</span>
            </div>
            <p className="text-xs font-semibold text-emerald-600 mt-1">100% Onboarded</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-xl"><Activity className="w-6 h-6 text-emerald-600" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Active Staff</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{activeStaff}</h3>
              <span className="text-sm font-medium text-slate-500">Active</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">Present Today</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-xl"><Briefcase className="w-6 h-6 text-orange-600" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employees</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{employeeCount}</h3>
              <span className="text-sm font-medium text-slate-500">Staff</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">Colleagues</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl"><Shield className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Super & Admins</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900">{adminCount}</h3>
              <span className="text-sm font-medium text-slate-500">Roles</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1">Executive Governance</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-3.5 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search colleague by name, mobile or designation..." 
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            className="border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-medium text-sm text-slate-700 shadow-sm bg-white"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="Engineering & Operations">Engineering & Operations</option>
            <option value="DevOps & Systems">DevOps & Systems</option>
            <option value="Product & Design">Product & Design</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Executive Board">Executive Board</option>
          </select>
          <select 
            className="border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-medium text-sm text-slate-700 shadow-sm bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Loading personnel registry...</div>
        ) : error ? (
          <div className="text-center py-12 text-rose-500 font-bold">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Personnel Profile</th>
                  <th className="px-5 py-4">Contact Info</th>
                  <th className="px-5 py-4">Role & Privilege</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Monthly CTC (₹)</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Governed Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const isMe = u._id === authUser._id;
                  return (
                    <tr key={u._id} className={`hover:bg-slate-50/50 transition-colors ${isMe ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=f1f5f9&color=64748b`} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" alt="avatar" />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {u.name} 
                              {isMe && <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-lg">Your Account</span>}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{u.designation || 'No Designation'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-medium text-slate-700">{u.mobile}</div>
                        <div className="text-xs text-slate-500">{u.pan ? `PAN: ${u.pan}` : 'No PAN'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-xl tracking-wide ${
                          u.role === 'SUPER_ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                          u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-700'
                        }`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {u.department || '-'}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {u.salary ? `₹${u.salary.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="px-5 py-4">
                        {u.isActive ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-xl flex items-center gap-1 w-max shadow-sm"><Check className="w-3 h-3"/> Active</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-xl flex items-center gap-1 w-max shadow-sm"><X className="w-3 h-3"/> Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors" title="Edit Profile">
                            <Edit className="w-4 h-4" />
                          </button>
                          {!isMe && (
                            <>
                              <button onClick={() => toggleStatus(u._id, u.isActive)} className={`p-1.5 rounded-2xl transition-colors ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                                {u.isActive ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button onClick={() => deleteUser(u._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors" title="Delete Personnel">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-slate-400">
                        <Users className="w-12 h-12 mb-3 text-slate-200" />
                        <p className="font-medium">No personnel found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm font-medium text-slate-500 bg-slate-50/50">
          <span>Showing: {filteredUsers.length} records</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-blue-600" /> <span>Onboard New Personnel</span></h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Super Admin Scope: You can create new system administrators or employees here.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-2xl p-1.5 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="workforce-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Avatar Section */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Profile Picture / Avatar</h4>
                  <div className="flex items-center gap-4">
                    <img 
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=e2e8f0&color=64748b`} 
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50 shadow-sm border border-slate-200"
                      alt="Avatar Preview"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors border border-slate-200 shadow-sm">
                        <Upload className="w-4 h-4 text-slate-500" /> Choose Image
                        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleAvatarChange} />
                      </label>
                      {avatarPreview && (
                        <button type="button" onClick={clearAvatar} className="bg-white text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors border border-rose-200 shadow-sm">
                          <Trash2 className="w-4 h-4" /> Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Legal Name *</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered 10-Digit Mobile *</label>
                    <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="e.g. 9876543210" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned Role Privilege *</label>
                    <div className="relative">
                      <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 appearance-none bg-white shadow-sm font-medium text-sm" disabled={formData.role === 'SUPER_ADMIN' || (editingId && formData.role === 'SUPER_ADMIN')}>
                        {formData.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
                        <option value="EMPLOYEE">Staff Employee</option>
                        <option value="ADMIN">Staff Admin</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Functional Designation *</label>
                    <input required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="e.g. Senior Developer" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
                    <div className="relative">
                      <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 appearance-none bg-white shadow-sm font-medium text-sm">
                        <option value="" disabled>Select Department</option>
                        <option value="Engineering & Operations">Engineering & Operations</option>
                        <option value="DevOps & Systems">DevOps & Systems</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Executive Board">Executive Board</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Monthly Gross CTC (₹) *</label>
                    <input type="number" required value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="e.g. 50000" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">PAN Card Number</label>
                    <input value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="e.g. ABCDE1234F" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">EPF UAN</label>
                      <input value={formData.uan} onChange={e => setFormData({...formData, uan: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="e.g. 100123456789" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                      <div className="relative">
                        <select value={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 appearance-none bg-white shadow-sm font-medium text-sm" disabled={editingId && formData.role === 'SUPER_ADMIN'}>
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">▼</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 mt-2">Account Password {editingId && <span className="text-slate-400 font-medium">(Leave blank to keep current password)</span>}</label>
                    <input type="password" required={!editingId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full md:w-1/2 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="Enter secure password" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" form="workforce-form" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-colors">
                <Check className="w-4 h-4" /> {editingId ? 'Commit Updates' : 'Commit to Directory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
