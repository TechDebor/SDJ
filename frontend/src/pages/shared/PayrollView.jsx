import { useEffect, useState } from 'react';
import { IndianRupee, Eye, Edit as EditIcon, X } from 'lucide-react';
import { payrollService, userService } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PayrollView() {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals state
  const [inspectRecord, setInspectRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);

  // Edit Form State (retaining old structure for Edit specifically)
  const [editFormData, setEditFormData] = useState({
    month: '', employee: '', gross: 0, deductions: 0, paidOn: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayroll();
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      userService.getAll().then(res => setUsers(res.data.data)).catch(console.error);
    }
  }, [user.role, user._id]);

  const fetchPayroll = () => {
    payrollService.getAll().then(res => {
      setPayroll(res.data.data);
    }).catch(console.error);
  };

  const openInspect = (p) => setInspectRecord(p);
  const closeInspect = () => setInspectRecord(null);

  const openEdit = (p) => {
    setEditFormData({
      month: p.month || '',
      employee: p.employee?._id || '',
      gross: p.gross || 0,
      deductions: (p.epf || 0) + (p.pt || 0) + (p.tds || 0),
      paidOn: p.paidOn ? p.paidOn.substring(0, 10) : ''
    });
    setEditRecord(p);
  };
  const closeEdit = () => setEditRecord(null);

  // Calculated values for dynamic Net Pay (Edit)
  const totalEditDeductions = Number(editFormData.deductions) || 0;
  const calculatedEditNetPay = Number(editFormData.gross || 0) - totalEditDeductions;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (calculatedEditNetPay < 0) {
      alert("Total deductions cannot exceed Gross Pay. Net Pay must be >= 0.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...editFormData,
        epf: editFormData.deductions,
        pt: 0,
        tds: 0,
        net: calculatedEditNetPay
      };
      await payrollService.update(editRecord._id, payload);
      closeEdit();
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating payroll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl"><IndianRupee className="w-6 h-6" /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Payroll Statements (INR ₹)</h2>
            <p className="text-xs text-slate-500">Statutory salary breakdown & tax statements.</p>
          </div>
        </div>
        </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">Voucher</th>
              <th className="p-4">Month</th>
              <th className="p-4">Employee</th>
              <th className="p-4">Role</th>
              <th className="p-4">Gross (₹)</th>
              <th className="p-4">Deductions (₹)</th>
              <th className="p-4">Net Pay (₹)</th>
              <th className="p-4">Date</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payroll.map(p => {
              const deductions = (p.epf || 0) + (p.pt || 0) + (p.tds || 0);
              return (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono tracking-tight font-bold text-blue-600 text-[11px]">PAY-{p._id.slice(-6).toUpperCase()}</td>
                  <td className="p-4 font-bold text-slate-800">{p.month}</td>
                  <td className="p-4 font-bold text-slate-900">{p.employee?.name || 'Unknown'}</td>
                  <td className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{p.employee?.role || 'N/A'}</td>
                  <td className="p-4 font-mono tracking-tight text-slate-700">{p.gross.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono tracking-tight text-rose-600">-{deductions.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono tracking-tight font-black text-emerald-600">{p.net.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-slate-500 font-medium">{p.paidOn ? new Date(p.paidOn).toLocaleDateString() : 'Pending'}</td>
                  <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openInspect(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors border border-transparent hover:border-blue-200 shadow-sm bg-white" title="Inspect">
                            <Eye className="w-4 h-4" />
                          </button>
                          {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                            <button onClick={() => openEdit(p)} className="px-2.5 py-1 text-slate-700 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-300 shadow-sm bg-white" title="Update">
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                </tr>
              );
            })}
            {payroll.length === 0 && (
              <tr><td colSpan="8" className="text-center p-8 text-slate-500 font-medium">No payroll records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal (Read-Only) */}
      {inspectRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) closeInspect() }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                Inspect Payroll <span className="text-xs font-mono tracking-tight font-bold text-slate-400 ml-2">#PAY-{inspectRecord._id.slice(-6).toUpperCase()}</span>
              </h3>
              <button onClick={closeInspect} className="text-slate-400 hover:text-slate-900 p-1.5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Month</label><p className="font-bold text-slate-800 text-sm">{inspectRecord.month}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date</label><p className="font-bold text-slate-800 text-sm">{inspectRecord.paidOn ? new Date(inspectRecord.paidOn).toLocaleDateString() : 'Pending'}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Employee</label><p className="font-bold text-slate-800 text-sm">{inspectRecord.employee?.name || 'Unknown'}</p></div>
                <div><label className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Role</label><p className="font-bold text-slate-800 text-sm">{inspectRecord.employee?.role || 'N/A'}</p></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Gross Pay (₹)</label>
                  <p className="font-mono tracking-tight font-bold text-slate-800 text-xl">₹{inspectRecord.gross.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 border border-rose-200 bg-rose-50 rounded-xl">
                  <label className="text-[10px] uppercase font-bold text-rose-400 block mb-1">Total Deductions (₹)</label>
                  <p className="font-mono tracking-tight font-bold text-rose-600 text-xl">-₹{((inspectRecord.epf||0) + (inspectRecord.pt||0) + (inspectRecord.tds||0)).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-4 text-xs shadow-sm">
                <div><span className="text-slate-500 font-bold block mb-1">EPF</span><span className="font-mono tracking-tight font-medium text-slate-700">₹{(inspectRecord.epf||0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-slate-500 font-bold block mb-1">PT</span><span className="font-mono tracking-tight font-medium text-slate-700">₹{(inspectRecord.pt||0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-slate-500 font-bold block mb-1">TDS</span><span className="font-mono tracking-tight font-medium text-slate-700">₹{(inspectRecord.tds||0).toLocaleString('en-IN')}</span></div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex justify-between items-center shadow-sm">
                <span className="font-bold text-emerald-800 uppercase tracking-wider text-xs">Net Pay</span>
                <span className="font-mono tracking-tight font-black text-3xl text-emerald-600">₹{inspectRecord.net.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) closeEdit() }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                Update Payroll <span className="text-xs font-mono tracking-tight font-bold text-slate-400 ml-2">#PAY-{editRecord._id.slice(-6).toUpperCase()}</span>
              </h3>
              <button onClick={closeEdit} className="text-slate-400 hover:text-slate-900 p-1.5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Month</label>
                    <input required value={editFormData.month} onChange={e => setEditFormData({...editFormData, month: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 text-sm font-medium transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Date</label>
                    <input type="date" value={editFormData.paidOn} onChange={e => setEditFormData({...editFormData, paidOn: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 text-sm font-medium transition-all shadow-sm text-slate-700" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee</label>
                    <div className="relative">
                      <select required value={editFormData.employee} onChange={e => setEditFormData({...editFormData, employee: e.target.value})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 text-sm font-medium bg-white appearance-none transition-all shadow-sm">
                        <option value="">Select Employee</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">▼</div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 pt-5 grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gross Pay (₹)</label>
                    <input required type="number" min="0" value={editFormData.gross} onChange={e => setEditFormData({...editFormData, gross: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Deductions (₹)</label>
                    <input required type="number" min="0" value={editFormData.deductions} onChange={e => setEditFormData({...editFormData, deductions: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 text-sm font-mono tracking-tight text-rose-600 font-bold transition-all shadow-sm" />
                  </div>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-2 shadow-sm">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Calculated Net Pay</label>
                  <div className="font-mono tracking-tight font-black text-2xl text-emerald-600">₹{calculatedEditNetPay.toLocaleString('en-IN')}</div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex justify-between">
                    <span>Net Pay = Gross - Deductions</span>
                    <span className="text-rose-500">-₹{totalEditDeductions.toLocaleString('en-IN')} Deductions</span>
                  </p>
                </div>

              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={closeEdit} className="px-5 py-2.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 disabled:opacity-70 transition-all flex items-center gap-2">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
