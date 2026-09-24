import { useEffect, useState, useMemo } from 'react';
import { CalendarPlus, Coffee, Filter, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { attendanceService, leaveService } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AttendanceLeave() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({ type: 'Casual Leave (CL)', fromDate: '', toDate: '', reason: '' });
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Super Admin Leave State
  const [leaveRoleFilter, setLeaveRoleFilter] = useState('ALL');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('ALL');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [inspectLeave, setInspectLeave] = useState(null);
  const [isUpdatingLeave, setIsUpdatingLeave] = useState(false);
  const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);
  const leaveRecordsPerPage = 5;

  const processedLeaves = useMemo(() => {
    let filtered = leaves.filter(l => {
      if ((l.user?._id || l.user) === user._id) return false;
      if (leaveRoleFilter !== 'ALL' && l.user?.role !== leaveRoleFilter) return false;
      if (leaveStatusFilter !== 'ALL' && l.status !== leaveStatusFilter) return false;
      if (leaveSearch) {
        const q = leaveSearch.toLowerCase();
        const name = (l.user?.name || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        if (!name.includes(q) && !reason.includes(q)) return false;
      }
      return true;
    });
    return filtered;
  }, [leaves, leaveRoleFilter, leaveStatusFilter, leaveSearch]);

  const handleUpdateLeaveStatus = (leaveId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this leave request?`)) return;
    setIsUpdatingLeave(true);
    leaveService.update(leaveId, { status })
      .then(() => {
        setInspectLeave(null);
        fetchLeaves();
      })
      .catch(e => alert(e.response?.data?.message || 'Error updating leave'))
      .finally(() => setIsUpdatingLeave(false));
  };

  
  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Break Modal
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakType, setBreakType] = useState('Lunch Break');

  // Sorting & Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);

  useEffect(() => {
    fetchAttendance();
    fetchLeaves();
  }, []);
  
  const fetchLeaves = () => {
    leaveService.getAll().then(res => setLeaves(res.data.data)).catch(console.error);
  };
  
  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (new Date(leaveFormData.toDate) < new Date(leaveFormData.fromDate)) {
      return alert('To Date cannot be before From Date');
    }
    setIsSubmittingLeave(true);
    leaveService.create(leaveFormData)
      .then(() => {
        setShowLeaveModal(false);
        setLeaveFormData({ type: 'Casual Leave (CL)', fromDate: '', toDate: '', reason: '' });
        fetchLeaves();
      })
      .catch(e => alert(e.response?.data?.message || 'Error applying leave'))
      .finally(() => setIsSubmittingLeave(false));
  };

  const fetchAttendance = () => {
    attendanceService.getAll().then(res => {
      setAttendance(res.data.data);
    }).catch(e => console.error(e));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOwn = useMemo(() => {
    return attendance.find(a => a.user?._id === user._id && a.date === todayStr) || null;
  }, [attendance, user._id, todayStr]);

  const [liveIdle, setLiveIdle] = useState(0);
  const [liveNetDuty, setLiveNetDuty] = useState(0);

  useEffect(() => {
    if (!todayOwn) return;
    
    const updateLiveStats = () => {
      let currentIdle = todayOwn.totalIdleMinutes || 0;
      let currentNet = todayOwn.netDutyMinutes || 0;
      
      if (todayOwn.punchIn && !todayOwn.punchOut) {
        const gross = Math.floor((new Date() - new Date(todayOwn.punchIn)) / 60000);
        if (todayOwn.activeBreakStart) {
          currentIdle += Math.floor((new Date() - new Date(todayOwn.activeBreakStart)) / 60000);
        }
        currentNet = Math.max(0, gross - currentIdle);
      }
      
      setLiveIdle(currentIdle);
      setLiveNetDuty(currentNet);
    };

    updateLiveStats();
    const interval = setInterval(updateLiveStats, 60000);
    return () => clearInterval(interval);
  }, [todayOwn]);

  const handlePunch = (type) => {
    const apiCall = type === 'in' ? attendanceService.clockIn : attendanceService.clockOut;
    apiCall()
      .then(() => fetchAttendance())
      .catch(e => {
        alert(e.response?.data?.message || `Error punching ${type}`);
      });
  };

  const handleStartBreak = (e) => {
    e.preventDefault();
    attendanceService.startBreak({ breakType })
      .then(() => {
        setShowBreakModal(false);
        fetchAttendance();
      })
      .catch(e => {
        alert(e.response?.data?.message || 'Error starting break');
      });
  };

  const handleEndBreak = () => {
    attendanceService.endBreak()
      .then(() => fetchAttendance())
      .catch(e => {
        alert(e.response?.data?.message || 'Error ending break');
      });
  };

  const formatMinutes = (mins) => {
    if (!mins || isNaN(mins)) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedAttendance = useMemo(() => {
    // 1. Filter
    let filtered = attendance.filter(a => {
      if (roleFilter !== 'ALL' && a.user?.role !== roleFilter) return false;
      if (dateFilter) {
        if (a.date !== dateFilter) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (a.user?.name || '').toLowerCase();
        const role = (a.user?.role || '').toLowerCase();
        if (!name.includes(q) && !role.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let valA, valB;
      switch(sortConfig.key) {
        case 'date': valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
        case 'employee': valA = (a.user?.name || '').toLowerCase(); valB = (b.user?.name || '').toLowerCase(); break;
        case 'in': valA = a.punchIn ? new Date(a.punchIn).getTime() : 0; valB = b.punchIn ? new Date(b.punchIn).getTime() : 0; break;
        case 'out': valA = a.punchOut ? new Date(a.punchOut).getTime() : 0; valB = b.punchOut ? new Date(b.punchOut).getTime() : 0; break;
        case 'idle': valA = a.totalIdleMinutes || 0; valB = b.totalIdleMinutes || 0; break;
        case 'netDuty': valA = a.netDutyMinutes || 0; valB = b.netDutyMinutes || 0; break;
        case 'status': valA = a.status || ''; valB = b.status || ''; break;
        default: valA = 0; valB = 0;
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [attendance, roleFilter, dateFilter, searchQuery, sortConfig]);

  // 3. Pagination
  const totalPages = Math.ceil(processedAttendance.length / recordsPerPage) || 1;
  const validPage = Math.min(currentPage, totalPages) || 1;
  const paginatedAttendance = processedAttendance.slice((validPage - 1) * recordsPerPage, validPage * recordsPerPage);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <div className="w-3 h-3 ml-1 inline-block opacity-0" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline-block" /> : <ChevronDown className="w-3 h-3 ml-1 inline-block" />;
  };

  const Th = ({ label, columnKey, className = "" }) => (
    <th 
      className={`p-4 cursor-pointer hover:bg-slate-200 transition-colors select-none ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center">
        {label} <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Attendance & Leaves</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user.role === 'SUPER_ADMIN' 
              ? 'Read-only monitoring view for recent attendance records.' 
              : 'Record shifts, pause for breaks, inspect past logs, and apply advance leaves.'}
          </p>
        </div>
        
        {user.role !== 'SUPER_ADMIN' && (
          <div className="flex flex-wrap gap-2 items-center">
            
            {!todayOwn?.punchIn && (
              <button onClick={() => handlePunch('in')} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs">
                Clock In
              </button>
            )}

            {todayOwn?.punchIn && !todayOwn?.punchOut && !todayOwn?.activeBreakStart && (
              <>
                <button onClick={() => handlePunch('out')} className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs">
                  Clock Out
                </button>
                <button onClick={() => setShowBreakModal(true)} className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5" /> Start Break
                </button>
              </>
            )}

            {todayOwn?.activeBreakStart && (
              <button onClick={handleEndBreak} className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 animate-pulse">
                <Coffee className="w-3.5 h-3.5" /> End {todayOwn.activeBreakType}
              </button>
            )}

            <button onClick={() => setShowLeaveModal(true)} className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 ml-2">
              <CalendarPlus className="w-3.5 h-3.5" /> Apply Leave
            </button>
          </div>
        )}
      </div>

      {/* Own Today Summary (For Admin/Employee) */}
      {user.role !== 'SUPER_ADMIN' && todayOwn && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-bold text-slate-700">Today</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
              <p className="text-sm font-black text-slate-800">{todayOwn.status}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Punch In</p>
            <p className="text-sm font-bold text-slate-700">{todayOwn.punchIn ? new Date(todayOwn.punchIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Punch Out</p>
            <p className="text-sm font-bold text-slate-700">{todayOwn.punchOut ? new Date(todayOwn.punchOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Idle Time</p>
            <p className="text-sm font-bold text-amber-600">{formatMinutes(liveIdle)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Net Duty</p>
            <p className="text-sm font-bold text-emerald-600">{formatMinutes(liveNetDuty)}</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Role:
                </span>
                <div className="flex bg-slate-200/50 p-1 rounded-2xl">
                  {['ALL', 'EMPLOYEE', 'ADMIN'].map(role => (
                    <button
                      key={role}
                      onClick={() => { setRoleFilter(role); setCurrentPage(1); }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                        roleFilter === role 
                          ? 'bg-white text-blue-700 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {role === 'ALL' ? 'All' : role === 'EMPLOYEE' ? 'Employee' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</label>
              <input 
                type="date" 
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
                className="text-xs font-bold border border-slate-200 rounded-2xl px-3 py-1.5 outline-none focus:border-blue-500 text-slate-700"
              />
              {dateFilter && (
                <button onClick={() => { setDateFilter(''); setCurrentPage(1); }} className="text-[10px] text-blue-600 hover:underline font-bold">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="w-full lg:w-64 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-blue-500 transition-colors shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs font-medium outline-none text-slate-700 bg-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <Th label="Date" columnKey="date" />
                <Th label="Employee" columnKey="employee" />
                <Th label="In" columnKey="in" />
                <Th label="Out" columnKey="out" />
                <Th label="Idle" columnKey="idle" />
                <Th label="Net Duty" columnKey="netDuty" />
                <Th label="Status" columnKey="status" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAttendance.map(a => (
                <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{a.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img src={a.user?.avatar || `https://ui-avatars.com/api/?name=${a.user?.name}&background=random`} className="w-6 h-6 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-900">{a.user?.name || 'Unknown'}</p>
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider">{a.user?.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono tracking-tight font-medium text-slate-600">
                    {a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                  </td>
                  <td className="p-4 font-mono tracking-tight font-medium text-slate-600">
                    {a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                  </td>
                  <td className="p-4 font-mono tracking-tight font-medium text-amber-600">
                    {formatMinutes(a.totalIdleMinutes)}
                  </td>
                  <td className="p-4 font-mono tracking-tight font-black text-emerald-600">
                    {formatMinutes(a.netDutyMinutes)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                      a.status === 'Present' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      a.status === 'Absent' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      a.status === 'On Leave' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedAttendance.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-500 font-medium">No attendance records found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-500">
              Showing {(validPage - 1) * recordsPerPage + 1} to {Math.min(validPage * recordsPerPage, processedAttendance.length)} of {processedAttendance.length} records
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={validPage === 1}
                className="p-1.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-transparent bg-slate-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm">
                Page {validPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={validPage === totalPages}
                className="p-1.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-transparent bg-slate-50 transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-600" /> Start Break
              </h3>
              <button onClick={() => setShowBreakModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleStartBreak} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Break Type</label>
                <select 
                  value={breakType} 
                  onChange={e => setBreakType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-white"
                >
                  <option value="Lunch Break">Lunch Break (45 mins)</option>
                  <option value="Tea & Refreshment">Tea & Refreshment (15 mins)</option>
                  <option value="Restroom Pause">Restroom Pause</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm border border-slate-200 transition-colors flex items-center justify-center gap-2">
                Confirm & Pause Shift
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Leave Applications Table for Admin/Employee */}
      {user.role !== 'SUPER_ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-700">My Leave Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">From Date</th>
                  <th className="p-4">To Date</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.filter(l => (l.user?._id || l.user) === user._id).map(l => (
                  <tr key={l._id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{l.type}</td>
                    <td className="p-4 font-mono tracking-tight font-medium text-slate-600">{new Date(l.fromDate).toLocaleDateString()}</td>
                    <td className="p-4 font-mono tracking-tight font-medium text-slate-600">{new Date(l.toDate).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-slate-700">{l.days}</td>
                    <td className="p-4 font-medium text-slate-600 max-w-[200px] truncate" title={l.reason}>{l.reason}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        l.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        l.status === 'Cancelled' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No leave applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {Math.ceil(processedLeaves.length / leaveRecordsPerPage) > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500">
                Showing {(leaveCurrentPage - 1) * leaveRecordsPerPage + 1} to {Math.min(leaveCurrentPage * leaveRecordsPerPage, processedLeaves.length)} of {processedLeaves.length} records
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setLeaveCurrentPage(p => Math.max(1, p - 1))}
                  disabled={leaveCurrentPage === 1}
                  className="p-1.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-transparent bg-slate-50 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  Page {leaveCurrentPage} of {Math.ceil(processedLeaves.length / leaveRecordsPerPage)}
                </div>
                <button 
                  onClick={() => setLeaveCurrentPage(p => Math.min(Math.ceil(processedLeaves.length / leaveRecordsPerPage), p + 1))}
                  disabled={leaveCurrentPage === Math.ceil(processedLeaves.length / leaveRecordsPerPage)}
                  className="p-1.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-50 disabled:hover:bg-transparent bg-slate-50 transition-colors shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-blue-600" /> Apply Advance Leave
              </h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Leave Category *</label>
                <select 
                  required
                  value={leaveFormData.type} 
                  onChange={e => setLeaveFormData({...leaveFormData, type: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-white"
                >
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Medical / Sick Leave">Medical / Sick Leave</option>
                  <option value="Privilege Leave (PL)">Privilege Leave (PL)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">From Date *</label>
                  <input 
                    required
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={leaveFormData.fromDate} 
                    onChange={e => setLeaveFormData({...leaveFormData, fromDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">To Date *</label>
                  <input 
                    required
                    type="date"
                    min={leaveFormData.fromDate || new Date().toISOString().split('T')[0]}
                    value={leaveFormData.toDate} 
                    onChange={e => setLeaveFormData({...leaveFormData, toDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Reason *</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Explain the reason for your leave request..."
                  value={leaveFormData.reason} 
                  onChange={e => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium bg-white resize-none"
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-5 py-2.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingLeave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                  {isSubmittingLeave ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Leave Applications Table for Super Admin */}
      {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-6">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-700">Team Leave Requests</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role:</span>
                <div className="flex bg-slate-200/50 p-1 rounded-2xl">
                  {['ALL', 'EMPLOYEE', 'ADMIN'].map(role => (
                    <button
                      key={role}
                      onClick={() => setLeaveRoleFilter(role)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                        leaveRoleFilter === role 
                          ? 'bg-white text-blue-700 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {role === 'ALL' ? 'All' : role === 'EMPLOYEE' ? 'Employee' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select 
                  value={leaveStatusFilter} 
                  onChange={e => setLeaveStatusFilter(e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-2xl px-2 py-1.5 outline-none focus:border-blue-500 text-slate-700"
                >
                  <option value="ALL">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 focus-within:border-blue-500 transition-colors shadow-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search name or reason..." 
                  value={leaveSearch}
                  onChange={e => setLeaveSearch(e.target.value)}
                  className="w-full text-xs font-medium outline-none text-slate-700 bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedLeaves.slice((leaveCurrentPage - 1) * leaveRecordsPerPage, leaveCurrentPage * leaveRecordsPerPage).map(l => (
                  <tr key={l._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img src={l.user?.avatar || `https://ui-avatars.com/api/?name=${l.user?.name}&background=random`} className="w-6 h-6 rounded-full object-cover" />
                        <span className="font-bold text-slate-900">{l.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">{l.user?.role}</td>
                    <td className="p-4 font-bold text-slate-800">{l.type}</td>
                    <td className="p-4 font-mono tracking-tight font-medium text-slate-600">{new Date(l.fromDate).toLocaleDateString()}</td>
                    <td className="p-4 font-mono tracking-tight font-medium text-slate-600">{new Date(l.toDate).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-slate-700">{l.days}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        l.status === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                        l.status === 'Cancelled' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setInspectLeave(l)} className="px-3 py-1.5 bg-slate-50 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-colors">
                        Inspect
                      </button>
                      {l.status === 'Pending' && (
                        <>
                          <button disabled={isUpdatingLeave} onClick={() => handleUpdateLeaveStatus(l._id, 'Approved')} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-2xl font-bold transition-colors disabled:opacity-50">
                            Approve
                          </button>
                          <button disabled={isUpdatingLeave} onClick={() => handleUpdateLeaveStatus(l._id, 'Rejected')} className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-2xl font-bold transition-colors disabled:opacity-50">
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {processedLeaves.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500 font-medium">No leave applications found matching filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Leave Modal */}
      {inspectLeave && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                Leave Details
              </h3>
              <button onClick={() => setInspectLeave(null)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <img src={inspectLeave.user?.avatar || `https://ui-avatars.com/api/?name=${inspectLeave.user?.name}&background=random`} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="font-bold text-slate-900 text-base">{inspectLeave.user?.name}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">{inspectLeave.user?.role}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Leave Type</p>
                  <p className="font-bold text-slate-800 text-sm">{inspectLeave.type}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <p className={`font-bold text-sm ${
                    inspectLeave.status === 'Approved' ? 'text-emerald-600' :
                    inspectLeave.status === 'Rejected' ? 'text-rose-600' :
                    'text-amber-600'
                  }`}>{inspectLeave.status}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                  <p className="font-bold text-slate-800 text-sm">{new Date(inspectLeave.fromDate).toLocaleDateString()} - {new Date(inspectLeave.toDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Days</p>
                  <p className="font-bold text-slate-800 text-sm">{inspectLeave.days} Days</p>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reason</p>
                <p className="font-medium text-slate-700 text-sm whitespace-pre-wrap">{inspectLeave.reason}</p>
              </div>
            </div>
            {inspectLeave.status === 'Pending' && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button disabled={isUpdatingLeave} onClick={() => handleUpdateLeaveStatus(inspectLeave._id, 'Rejected')} className="px-5 py-2.5 font-bold text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50">
                  Reject Request
                </button>
                <button disabled={isUpdatingLeave} onClick={() => handleUpdateLeaveStatus(inspectLeave._id, 'Approved')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50">
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}