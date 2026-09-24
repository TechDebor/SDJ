import { useEffect, useState } from 'react';
import { Kanban, Plus, X, Calendar, User, Edit, Clock, ArrowLeft, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { taskService, userService } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function TaskKanban() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    title: '', priority: 'MEDIUM', status: 'BACKLOG', dueDate: '', assignedTo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);

  const getMinDate = () => {
    const today = new Date();
    // Use local timezone offset to avoid UTC date boundaries causing 'today' to be wrong
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  };
  
  const minDate = getMinDate();
  
  const openCreateModal = () => {
    setIsEditing(false);
    setCreateFormData({
      title: '', priority: 'MEDIUM', status: 'BACKLOG', dueDate: '', 
      assignedTo: (user.role === 'EMPLOYEE' || user.role === 'ADMIN') ? user._id : ''
    });
    setShowCreateModal(true);
  };

  const openEditModal = (taskToEdit) => {
    const task = (taskToEdit && taskToEdit._id) ? taskToEdit : selectedTask;
    if (!task) return;
    setIsEditing(true);
    setCreateFormData({
      _id: task._id,
      title: task.title || '',
      priority: task.priority || 'MEDIUM',
      status: task.status || 'BACKLOG',
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      assignedTo: task.assignedTo?._id || ''
    });
    setShowCreateModal(true);
    setSelectedTask(null);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.delete(id);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await taskService.update(createFormData._id, createFormData);
      } else {
        await taskService.create(createFormData);
      }
      setShowCreateModal(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving task');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    fetchTasks();
    if (user.role !== 'EMPLOYEE') {
      userService.getAll().then(res => setUsers(res.data.data)).catch(console.error);
    }
  }, [user.role]);

  const fetchTasks = () => {
    taskService.getAll().then(res => {
      const sortedTasks = res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        setTasks(sortedTasks);
      } else {
        setTasks(sortedTasks.filter(t => t.assignedTo?._id === user._id));
      }
    }).catch(console.error);
  };

  const lanes = [
    { title: 'Backlog / To-Do', status: 'BACKLOG', badge: 'bg-slate-50 text-slate-700' },
    { title: 'In Progress', status: 'IN_PROGRESS', badge: 'bg-blue-100 text-blue-800' },
    { title: 'Under Review', status: 'UNDER_REVIEW', badge: 'bg-amber-100 text-amber-800' },
    { title: 'Completed', status: 'COMPLETED', badge: 'bg-emerald-100 text-emerald-800' }
  ];

  const renderTaskCard = (t) => (
    <div 
      key={t._id} 
      onClick={() => { setSelectedTask(t); setOpenMenuTaskId(null); }}
      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 hover:border-blue-500 transition-all cursor-pointer hover:shadow-sm border border-slate-200 relative group"
    >
      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            setOpenMenuTaskId(openMenuTaskId === t._id ? null : t._id); 
          }}
          className={`rounded-xl p-0.5 transition-all ${
            openMenuTaskId === t._id 
              ? 'bg-white text-slate-800 shadow-sm border border-slate-200' 
              : 'bg-transparent text-slate-300 border border-transparent hover:bg-white hover:text-slate-700 hover:shadow-sm hover:border-slate-200'
          }`}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {openMenuTaskId === t._id && (
          <div className="absolute right-0 top-7 w-36 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-20 py-1">
            <button onClick={(e) => { e.stopPropagation(); setSelectedTask(t); setOpenMenuTaskId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" /> View Details
            </button>
            <button onClick={(e) => { e.stopPropagation(); openEditModal(t); setOpenMenuTaskId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
              <Edit className="w-3.5 h-3.5" /> Edit Task
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(t._id); setOpenMenuTaskId(null); }} className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Delete Task
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] font-mono tracking-tight font-bold text-blue-600 pointer-events-none pr-8">
        <span>{t._id.slice(-6).toUpperCase()}</span>
        <span className={`font-sans px-1.5 py-0.5 rounded-lg text-[9px] uppercase ${
          t.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
          t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
          'bg-emerald-100 text-emerald-700'
        }`}>
          {t.priority}
        </span>
      </div>
      <h5 className="text-xs font-bold text-slate-900 leading-snug pointer-events-none">{t.title}</h5>
      <div className="text-[10px] text-slate-400 flex justify-between pointer-events-none">
        <span>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 ${
        user.role === 'SUPER_ADMIN' ? 'bg-blue-50 border-blue-200 text-blue-900' :
        user.role === 'ADMIN' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' :
        'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <span>
          <strong>{user.role === 'SUPER_ADMIN' ? 'Super Admin Mode: ' : user.role === 'ADMIN' ? 'Admin Mode: ' : 'Employee Workbench: '}</strong>
          {user.role === 'SUPER_ADMIN' ? 'Full visibility & assignment control over all tasks and personnel.' :
           user.role === 'ADMIN' ? 'You can create and assign tasks to yourself and team employees.' :
           'Showing personal tasks. You can create tasks assigned strictly to yourself.'}
        </span>
        <span className={`font-bold ${
          user.role === 'SUPER_ADMIN' ? 'text-blue-700' :
          user.role === 'ADMIN' ? 'text-indigo-700' :
          'text-slate-700'
        }`}>
          {user.role === 'SUPER_ADMIN' ? 'Enterprise Visibility' : user.role === 'ADMIN' ? 'Department Scope' : 'Personal Scope'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-sm border border-slate-200 shadow-blue-500/20">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Task Management Kanban Board</h2>
            <p className="text-xs text-slate-500 mt-0.5">Track deliverables across Backlog, In Progress, Under Review, and Completed.</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      {expandedStatus ? (
        <div className="bg-slate-50/70 p-5 rounded-2xl border-2 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setExpandedStatus(null)} className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {lanes.find(l => l.status === expandedStatus)?.title} Tasks
              </h3>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${lanes.find(l => l.status === expandedStatus)?.badge}`}>
              {tasks.filter(t => t.status === expandedStatus).length} Total
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.filter(t => t.status === expandedStatus).map(renderTaskCard)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {lanes.map(lane => {
            const laneTasks = tasks.filter(t => t.status === lane.status);
            const visibleTasks = laneTasks.slice(0, 3);
            const hasMore = laneTasks.length > 3;

            return (
              <div 
                key={lane.status}
                className="bg-slate-50/70 p-3.5 rounded-2xl border-2 border-slate-200 flex flex-col h-full min-h-[150px] md:min-h-[440px]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 pointer-events-none">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">{lane.title}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lane.badge}`}>{laneTasks.length}</span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {laneTasks.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs pointer-events-none">
                      <span>No tasks</span>
                    </div>
                  ) : (
                    <>
                      {visibleTasks.map(renderTaskCard)}
                      {hasMore && (
                        <button 
                          onClick={() => setExpandedStatus(lane.status)}
                          className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm"
                        >
                          View All ({laneTasks.length - 3} more)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) setSelectedTask(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                Task Details <span className="text-xs font-mono tracking-tight font-bold text-slate-400 ml-2">#{selectedTask._id.slice(-6).toUpperCase()}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={openEditModal} className="text-slate-600 hover:text-blue-600 bg-white shadow-sm border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-2xl p-1.5 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedTask.title}</h2>
                <div className="flex gap-2 mt-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-xl ${
                    selectedTask.status === 'BACKLOG' ? 'bg-slate-50 text-slate-700' :
                    selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    selectedTask.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-xl ${
                    selectedTask.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                    selectedTask.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedTask.priority} PRIORITY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Assignee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={selectedTask.assignedTo?.avatar || `https://ui-avatars.com/api/?name=${selectedTask.assignedTo?.name || 'Unassigned'}&background=random`} alt="Assignee" className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-bold text-slate-900">{selectedTask.assignedTo?.name || 'Unassigned'}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Reporter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={selectedTask.assignedBy?.avatar || `https://ui-avatars.com/api/?name=${selectedTask.assignedBy?.name || 'Unknown'}&background=random`} alt="Reporter" className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-bold text-slate-900">{selectedTask.assignedBy?.name || 'System'}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Due Date</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'No Due Date'}</span>
                </div>
                
                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Created</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{new Date(selectedTask.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />} 
                {isEditing ? 'Edit Enterprise Task' : 'Create Enterprise Task'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-2xl p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Task Title / Deliverable *</label>
                  <input required value={createFormData.title} onChange={e => {
                    let val = e.target.value;
                    if (val.length > 0) {
                      val = val.charAt(0).toUpperCase() + val.slice(1);
                    }
                    setCreateFormData({...createFormData, title: val})
                  }} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all focus:border-blue-500 transition-all shadow-sm font-medium text-sm" placeholder="What needs to be done?" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
                    <div className="relative">
                      <select required value={createFormData.priority} onChange={e => setCreateFormData({...createFormData, priority: e.target.value})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white shadow-sm font-medium text-sm">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{isEditing ? 'Status' : 'Initial Status'}</label>
                    <div className="relative">
                      <select required value={createFormData.status} onChange={e => setCreateFormData({...createFormData, status: e.target.value})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white shadow-sm font-medium text-sm">
                        <option value="BACKLOG">Backlog / To-Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">▼</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Due Date</label>
                  <input type="date" min={minDate} value={createFormData.dueDate} onChange={e => setCreateFormData({...createFormData, dueDate: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all transition-all shadow-sm font-medium text-sm text-slate-700" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Assignee</label>
                  <div className="relative">
                    <select value={createFormData.assignedTo} onChange={e => setCreateFormData({...createFormData, assignedTo: e.target.value})} className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white shadow-sm font-medium text-sm" disabled={user.role === 'EMPLOYEE'}>
                      <option value="">-- Unassigned --</option>
                      {user.role === 'EMPLOYEE' ? (
                        <option value={user._id}>{user.name} (Me)</option>
                      ) : (
                        users.map(u => (
                          <option key={u._id} value={u._id}>{u.name} {u._id === user._id ? '(Me)' : ''}</option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">▼</div>
                  </div>
                  {user.role === 'EMPLOYEE' && <p className="text-[10px] text-slate-500 mt-1">Employees can only assign tasks to themselves.</p>}
                </div>
              </div>

              <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-colors disabled:opacity-70">
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
