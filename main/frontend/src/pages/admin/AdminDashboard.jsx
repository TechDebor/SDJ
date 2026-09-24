import { useEffect, useState } from 'react';
import { Users, Layers, Inbox, PlayCircle, ShieldAlert, CheckCircle, Zap, Award, Clock, Coffee, CalendarPlus, Wallet, PlusCircle, Download } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import DashboardSharedTop from '../../components/ui/DashboardSharedTop';
import { taskService, userService, payrollService } from '../../api';

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [payroll, setPayroll] = useState([]);
  
  useEffect(() => {
    taskService.getAll().then(res => setTasks(res.data.data));
    userService.getAll().then(res => setUsers(res.data.data));
    payrollService.getAll().then(res => setPayroll(res.data.data));
  }, []);

  const todo = tasks.filter(t => t.status === 'BACKLOG').length;
  const inProg = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const underRev = tasks.filter(t => t.status === 'UNDER_REVIEW').length;
  const done = tasks.filter(t => t.status === 'COMPLETED').length;
  
  const netTotal = payroll.reduce((a, c) => a + c.net, 0);

  const kpis = [
    { title: "Active Workforce", value: `${users.length} Staff`, desc: "Team On Duty", icon: Users, color: "text-blue-600", trend: "Verified", path: '/tasks' },
    { title: "Total Tasks Queue", value: `${tasks.length} Items`, desc: "Current Sprint Pipeline", icon: Layers, color: "text-amber-600", trend: "In Sprint", path: '/tasks' },
    { title: "Backlog / To-Do", value: `${todo} Tasks`, desc: "Pending Triage", icon: Inbox, color: "text-slate-600", trend: "Queued", path: '/tasks' },
    { title: "In Progress", value: `${inProg} Tasks`, desc: "Active Sprints", icon: PlayCircle, color: "text-blue-600", trend: "High Priority", path: '/tasks' },
    { title: "Under Review", value: `${underRev} Tasks`, desc: "QA & Verification", icon: ShieldAlert, color: "text-amber-600", trend: "Inspection", path: '/tasks' },
    { title: "Completed Done", value: `${done} Tasks`, desc: "Passed Acceptance", icon: CheckCircle, color: "text-emerald-600", trend: "Delivered", path: '/tasks' },
    { title: "Sprint Delivery SLA", value: "96.4%", desc: "Milestones On-Time", icon: Zap, color: "text-emerald-600", trend: "High Velocity", path: '/tasks' },
    { title: "QA Acceptance Rate", value: "99.2%", desc: "Bug-Free Releases", icon: Award, color: "text-emerald-600", trend: "Certified", path: '/tasks' },
    { title: "Shift Attendance %", value: "97.5%", desc: "Present Today", icon: Clock, color: "text-teal-600", trend: "On Time", path: '/attendance' },
    { title: "Total Idle Time", value: "115 mins", desc: "Team Breaks Cumulated", icon: Coffee, color: "text-slate-700", trend: "Monitored", path: '/attendance' },
    { title: "Pending Leaves", value: `3 Pending`, desc: "Advance Requests", icon: CalendarPlus, color: "text-amber-700", trend: "Review", path: '/attendance' },
    { title: "Disbursed Payroll", value: `₹${netTotal.toLocaleString('en-IN')}`, desc: "Monthly Total (₹)", icon: Wallet, color: "text-emerald-700", trend: "Direct NEFT", path: '/payroll' }
  ];

  return (
    <div className="space-y-6">
      <DashboardSharedTop />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Departmental Operations & Task Delivery</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">12 Operational KPIs Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Operational management over employee tasks, active sprints, and floor attendance.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-5 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Operations & Team Task Delivery Metrics (12 KPIs)</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>
    </div>
  );
}
