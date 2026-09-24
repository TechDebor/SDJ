import { useEffect, useState } from 'react';
import { announcementService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    type: 'Policy Update',
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: ''
  });

  const [toastMsg, setToastMsg] = useState(null);

  const fetchAnnouncements = () => {
    announcementService.getAll()
      .then(res => {
        const today = new Date().toISOString().split('T')[0];
        const active = res.data.data.filter(a => !a.date || a.date >= today);
        setAnnouncements(active);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementService.create(formData);
      setIsModalOpen(false);
      setFormData({ type: 'Policy Update', date: new Date().toISOString().split('T')[0], title: '', description: '' });
      fetchAnnouncements();
      window.dispatchEvent(new Event('announcement-updated'));
      setToastMsg('Announcement posted successfully!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-2xl text-xs font-bold shadow-xl border bg-slate-900 text-white border-slate-800 flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Company Announcements & Notices</h2>
          <p className="text-xs text-slate-500 mt-0.5">Official administrative circulars, policy updates, and organizational broadcasts.</p>
        </div>
        {canCreate && (
          <div>
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
              + Post Announcement
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {announcements.map(a => (
          <div key={a._id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-bold text-blue-600">
              <span>{a.type}</span>
              <span className="text-slate-400">{a.date || new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
            <p className="text-xs text-slate-600">{a.description}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
            No active announcements available.
          </div>
        )}
      </div>

      {isModalOpen && canCreate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Announcement</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3.5 py-2.5 border rounded-xl outline-none font-semibold"
                  >
                    <option value="Policy Update">Policy Update</option>
                    <option value="General Notice">General Notice</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3.5 py-2.5 border rounded-xl outline-none font-semibold" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required 
                  className="w-full px-3.5 py-2.5 border rounded-xl outline-none" 
                  placeholder="e.g., Q3 Enterprise Performance Bonus" 
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  rows="4"
                  maxLength="1500"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required 
                  className="w-full px-3.5 py-2.5 border rounded-xl outline-none" 
                  placeholder="Details about the announcement (max 300 words)..."
                ></textarea>
              </div>
              
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs">Post Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
