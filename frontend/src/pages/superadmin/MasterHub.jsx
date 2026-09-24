import { useEffect, useState } from 'react';
import { userService } from '../../api';
import { 
  Users, 
  Search, 
  Phone, 
  IndianRupee, 
  Briefcase, 
  UserCircle 
} from 'lucide-react';

export default function MasterHub() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // API call ke time loading state handle karna
    userService.getAll()
      .then(res => {
        setUsers(res.data.data || []);
      })
      .catch(error => {
        console.error("Failed to fetch users:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Search filter logic
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      
      {/* Header Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Master Workforce Records</h1>
            <p className="text-sm text-slate-500">Manage and view your team directory</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, role, or mobile..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* Loading State */}
              {loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading records...
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State (No Data or Search No Match) */}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Users size={40} className="mb-3 opacity-50" />
                      <p className="text-base font-medium text-slate-600">No records found</p>
                      <p className="text-xs mt-1">Try adjusting your search terms</p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!loading && filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Name Column with Avatar-like Icon */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">ID: {u._id?.substring(0, 6)}...</div>
                      </div>
                    </div>
                  </td>

                  {/* Mobile Column */}
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      {u.mobile || 'Not provided'}
                    </div>
                  </td>

                  {/* Role Column */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium text-xs border border-blue-100">
                      <Briefcase size={12} />
                      {u.role || 'Unassigned'}
                    </span>
                  </td>

                  {/* Salary Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <IndianRupee size={14} className="text-slate-400" />
                      {(u.salary || 0).toLocaleString('en-IN')}
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
        
        {/* Table Footer / Pagination Info */}
        {!loading && filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Showing {filteredUsers.length} total records</span>
          </div>
        )}
      </div>
    </div>
  );
}