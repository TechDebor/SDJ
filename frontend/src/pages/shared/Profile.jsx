import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Edit, X, Upload, Trash2, Shield, 
  Building, Phone, CreditCard, Wallet, 
  Briefcase, Camera, ChevronDown, CheckCircle
} from 'lucide-react';
import api from '../../api';

export default function Profile() {
  const { user, login } = useAuth();
  
  // Only handle the logged-in user
  const [viewedUser, setViewedUser] = useState(user);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const openEdit = () => {
    setFormData({
      name: viewedUser.name || '',
      mobile: viewedUser.mobile || '',
      password: '',
      role: viewedUser.role || 'EMPLOYEE',
      designation: viewedUser.designation || '',
      department: viewedUser.department || '',
      salary: viewedUser.salary || '',
      pan: viewedUser.pan || '',
      uan: viewedUser.uan || '',
      isActive: viewedUser.isActive !== undefined ? viewedUser.isActive : true
    });
    setAvatarFile(null);
    setAvatarPreview(viewedUser.avatar || null);
    setShowModal(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const clearAvatar = () => {
    setAvatarFile('REMOVE');
    setAvatarPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      if (avatarFile === 'REMOVE') {
        data.append('removeAvatar', 'true');
      } else if (avatarFile) {
        data.append('avatar', avatarFile);
      }
      
      let res;
      if (user.role === 'SUPER_ADMIN') {
        res = await api.put(`/workforce/${viewedUser._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        
        const updatedUser = res.data.data;
        setViewedUser(updatedUser);
        
        // Refresh AuthContext globally
        if (updatedUser._id === user._id) {
          login(updatedUser, localStorage.getItem('token'));
        }

        setShowModal(false);
        alert('Profile updated successfully');
      } else {
        alert('Unauthorized to edit profiles from this section.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">User Profile</h1>
      </div>

      {/* Profile Card View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Background */}
        <div className="h-32 md:h-40 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          {user.role === 'SUPER_ADMIN' && (
            <button 
              onClick={openEdit} 
              className="absolute top-4 right-4 md:top-6 md:right-6 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 border border-white/20 shadow-sm"
            >
              <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-6 md:px-10 pb-8 relative">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 md:-mt-16 mb-6">
            <div className="relative inline-block">
              <img 
                src={viewedUser.avatar || `https://ui-avatars.com/api/?name=${viewedUser.name}&background=e2e8f0&color=475569&size=200`} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-white shadow-lg bg-white" 
                alt="Avatar" 
              />
              {viewedUser.isActive && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm" title="Active">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 pb-2">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                {viewedUser.name}
                {!viewedUser.isActive && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Inactive</span>}
              </h3>
              <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> {viewedUser.designation || 'No Designation'} 
                <span className="text-slate-300">•</span> 
                <Building className="w-4 h-4" /> {viewedUser.department || 'No Department'}
              </p>
            </div>
            
            <div className="pb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${viewedUser.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-700' : viewedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-50 text-slate-700'}`}>
                <Shield className="w-4 h-4" /> {viewedUser.role}
              </span>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-sm border border-slate-200 transition-shadow-sm border border-slate-200">
              <div className="text-slate-400 mb-1"><Phone className="w-5 h-5" /></div>
              <div className="text-xs text-slate-500 font-medium mb-1">Mobile Number</div>
              <div className="font-bold text-slate-900">{viewedUser.mobile || 'Not Provided'}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-sm border border-slate-200 transition-shadow-sm border border-slate-200">
              <div className="text-slate-400 mb-1"><Wallet className="w-5 h-5" /></div>
              <div className="text-xs text-slate-500 font-medium mb-1">Monthly CTC</div>
              <div className="font-bold text-slate-900">₹{(viewedUser.salary || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-sm border border-slate-200 transition-shadow-sm border border-slate-200">
              <div className="text-slate-400 mb-1"><CreditCard className="w-5 h-5" /></div>
              <div className="text-xs text-slate-500 font-medium mb-1">PAN Number</div>
              <div className="font-bold text-slate-900 uppercase">{viewedUser.pan || 'N/A'}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-sm border border-slate-200 transition-shadow-sm border border-slate-200">
              <div className="text-slate-400 mb-1"><Building className="w-5 h-5" /></div>
              <div className="text-xs text-slate-500 font-medium mb-1">EPF UAN</div>
              <div className="font-bold text-slate-900">{viewedUser.uan || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> 
                Update Profile Details
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full p-2 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="profile-edit-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Avatar Edit Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="relative">
                    <img 
                      src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=e2e8f0&color=64748b`} 
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-sm"
                      alt="Preview"
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm border border-slate-200 cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h4 className="text-sm font-bold text-slate-800">Profile Picture</h4>
                    <p className="text-xs text-slate-500 mb-3">Upload a new avatar. Recommended size 400x400px.</p>
                    {avatarPreview && (
                      <button type="button" onClick={clearAvatar} className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 mx-auto sm:mx-0">
                        <Trash2 className="w-3.5 h-3.5" /> Remove Image
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Full Name</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium transition-all" placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Mobile Number</label>
                    <input required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium transition-all" placeholder="10-digit mobile number" />
                  </div>
                  
                  {/* Security */}
                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Reset Password (Optional)</label>
                    <input type="password" placeholder="Leave blank to keep current password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium transition-all placeholder:text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Designation / Job Title</label>
                    <input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium transition-all" placeholder="e.g. Frontend Developer" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Department</label>
                    <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium transition-all" placeholder="e.g. Engineering" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Role & Privilege</label>
                    <div className="relative">
                      <select 
                        disabled={viewedUser.role === 'SUPER_ADMIN'}
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium appearance-none transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="EMPLOYEE">Employee</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Account Status</label>
                    <div className="relative">
                      <select 
                        disabled={viewedUser.role === 'SUPER_ADMIN'}
                        value={formData.isActive.toString()} 
                        onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-medium appearance-none transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="true">Active (Access Granted)</option>
                        <option value="false">Inactive (Access Revoked)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-6">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Monthly CTC (₹)</label>
                    <input type="number" min="0" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-mono tracking-tight font-bold transition-all" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">PAN Number</label>
                    <input value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-mono tracking-tight font-bold uppercase transition-all" placeholder="ABCDE1234F" />
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">EPF UAN</label>
                    <input value={formData.uan} onChange={e => setFormData({...formData, uan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:bg-white text-sm font-mono tracking-tight font-bold transition-all" placeholder="12-digit UAN" />
                  </div>
                </div>

              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50 rounded-b-3xl">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" form="profile-edit-form" disabled={isSubmitting} className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/30 disabled:opacity-70 transition-all flex items-center gap-2">
                {isSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}