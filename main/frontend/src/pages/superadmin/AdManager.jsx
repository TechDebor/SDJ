import { useEffect, useState } from 'react';
import { advertisementService } from '../../api';

export default function AdManager() {
  const [ads, setAds] = useState([]);
  const [formData, setFormData] = useState({ badge: '', title: '', subtitle: '', cta: '', image: '', icon: 'zap', isActive: true });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = () => {
    advertisementService.getAll().then(res => setAds(res.data.data));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await advertisementService.update(editingId, formData);
      } else {
        await advertisementService.create(formData);
      }
      setEditingId(null);
      setFormData({ badge: '', title: '', subtitle: '', cta: '', image: '', icon: 'zap', isActive: true });
      fetchAds();
    } catch (error) {
      alert('Error saving advertisement');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this banner?')) {
      await advertisementService.delete(id);
      fetchAds();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto">
        <h3 className="font-bold text-slate-900 text-lg mb-4">{editingId ? 'Edit Banner' : 'Create New Banner'}</h3>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Image URL</label>
            <input type="url" required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Badge Tagline</label>
            <input type="text" required value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Headline Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Supporting Description</label>
            <textarea required rows="2" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none"></textarea>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Call-To-Action (CTA)</label>
            <input type="text" value={formData.cta} onChange={e => setFormData({ ...formData, cta: e.target.value })} className="w-full px-3 py-2 border rounded-xl outline-none" />
          </div>
          <div className="flex gap-2">
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ badge: '', title: '', subtitle: '', cta: '', image: '', icon: 'zap', isActive: true }); }} className="px-4 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>}
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">{editingId ? 'Update Banner' : 'Add Banner'}</button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.map(ad => (
          <div key={ad._id} className="bg-slate-900 text-white rounded-xl overflow-hidden relative min-h-[150px] p-4 flex flex-col justify-end">
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${ad.image})` }}></div>
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded-full font-bold">{ad.badge}</span>
              <h4 className="font-bold text-sm">{ad.title}</h4>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditingId(ad._id); setFormData(ad); }} className="text-xs bg-white text-slate-900 px-3 py-1 rounded-lg font-bold">Edit</button>
                <button onClick={() => handleDelete(ad._id)} className="text-xs bg-rose-600 text-white px-3 py-1 rounded-lg font-bold">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
