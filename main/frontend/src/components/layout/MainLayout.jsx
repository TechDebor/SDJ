import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Layers, Key, Shield, Eye, User, LayoutDashboard, Kanban, Clock, IndianRupee, Bell, Database, DownloadCloud } from 'lucide-react';
import { announcementService } from '../../api';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = () => {
    announcementService.getAll()
      .then(res => {
        const today = new Date().toISOString().split('T')[0];
        const active = res.data.data.filter(a => !a.date || a.date >= today);
        setAnnouncements(active);
      })
      .catch(err => console.error("Error fetching announcements", err));
  };

  useEffect(() => {
    fetchAnnouncements();
    window.addEventListener('announcement-updated', fetchAnnouncements);
    return () => window.removeEventListener('announcement-updated', fetchAnnouncements);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600', path: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] },
    { id: 'tasks', label: 'Task Kanban Board', icon: Kanban, color: 'text-slate-500', path: '/tasks', roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] },
    { id: 'attendance', label: 'Attendance & Breaks', icon: Clock, color: 'text-slate-500', path: '/attendance', roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] },
    { id: 'payroll', label: 'Payroll & Slips (₹)', icon: IndianRupee, color: 'text-emerald-600', path: '/payroll', roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] },
    { id: 'announcements', label: 'Bulletins', icon: Bell, color: 'text-slate-500', path: '/announcements', roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] },
    { id: 'master-hub', label: 'Master Hub', icon: Database, color: 'text-blue-600', path: '/master-hub', roles: ['SUPER_ADMIN'] },
    { id: 'workforce', label: 'Workforce Directory', icon: User, color: 'text-emerald-600', path: '/workforce', roles: ['SUPER_ADMIN'] },
    { id: 'profile', label: 'Profile', icon: User, color: 'text-slate-500', path: '/profile', roles: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] },
  ];

  return (
    <div className="bg-slate-50/70 text-slate-900 min-h-screen flex flex-col selection:bg-blue-600/20">
      
      {/* Ticker */}
      <div className="bg-slate-950 text-slate-200 text-xs py-2 px-4 border-b border-slate-800 overflow-hidden relative shadow-sm flex items-center">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-lg mr-3 z-10 whitespace-nowrap border border-blue-900/50">
          Notice
        </div>
        <div className="overflow-hidden w-full flex">
          <div className="marquee-container cursor-pointer font-medium text-slate-300">
            <div className="flex shrink-0 items-center justify-around">
              {announcements.map((a, i) => (
                <span key={`orig-${a._id || i}`} className="inline-flex items-center mr-8 font-semibold">
                  <span className="text-blue-400 font-bold mr-2">[{a.type}]</span> {a.title} &bull; <span className="text-slate-400 font-normal ml-1 truncate max-w-md">{a.description}</span>
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center justify-around">
              {announcements.map((a, i) => (
                <span key={`clone-${a._id || i}`} className="inline-flex items-center mr-8 font-semibold">
                  <span className="text-blue-400 font-bold mr-2">[{a.type}]</span> {a.title} &bull; <span className="text-slate-400 font-normal ml-1 truncate max-w-md">{a.description}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-sm border border-slate-200 shadow-blue-600/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg block leading-tight tracking-tight">Debor Enterprise</span>
              <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">Workforce & Task Governance</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
              user.role === 'SUPER_ADMIN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
              'bg-slate-50 text-slate-700 border border-slate-200'
            }`}>
              {user.role === 'SUPER_ADMIN' ? <Shield className="w-3 h-3" /> : user.role === 'ADMIN' ? <Eye className="w-3 h-3" /> : <User className="w-3 h-3" />}
              {user.role === 'SUPER_ADMIN' ? 'Super Admin (16 Enterprise KPIs)' : user.role === 'ADMIN' ? 'Admin Scope (12 Operational KPIs)' : 'Employee Scope (8 Personal KPIs)'}
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Avatar" className="w-9 h-9 rounded-full ring-2 ring-blue-600 object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 ring-2 ring-white rounded-full"></span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                  user.role === 'SUPER_ADMIN' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                  'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <button onClick={handleLogout} title="Logout" className="p-2 text-slate-400 hover:text-blue-600 rounded-2xl hover:bg-slate-50 transition-colors">
                <Key className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="border-t border-slate-100 bg-slate-50/90 px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex gap-1 sm:gap-2 py-1.5">
            {tabs.filter(t => t.roles.includes(user.role)).map(tab => {
              const active = location.pathname.startsWith(tab.path);
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-2xl transition-all ${
                    active 
                      ? 'font-bold text-blue-700 bg-white shadow-xs border border-slate-200' 
                      : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : tab.color}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

    </div>
  );
}
