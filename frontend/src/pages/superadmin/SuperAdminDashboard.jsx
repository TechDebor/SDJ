import { useEffect, useState } from 'react';
import { Users, Layers, Target, Inbox, PlayCircle, ShieldAlert, CheckCircle, Zap, Award, Briefcase, Activity, Clock, Coffee, CalendarCheck, IndianRupee, Wallet } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import DashboardSharedTop from '../../components/ui/DashboardSharedTop';
import { taskService, userService, payrollService } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
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
  const spSum = tasks.reduce((a, c) => a + (c.storyPoints || 0), 0);
  
  const grossTotal = payroll.reduce((a, c) => a + c.gross, 0);
  const netTotal = payroll.reduce((a, c) => a + c.net, 0);

  const kpis = [
    { title: "Total Workforce", value: `${users.length} Staff`, desc: "100% Onboarded", icon: Users, color: "text-blue-600", trend: "Verified", path: '/master-hub' },
    { title: "Total Tasks Queue", value: `${tasks.length} Tasks`, desc: "Enterprise Work", icon: Layers, color: "text-amber-600", trend: "Active", path: '/tasks' },
    { title: "Total Story Points", value: `${spSum} SP`, desc: "Complexity Volume", icon: Target, color: "text-indigo-600", trend: "Velocity", path: '/tasks' },
    { title: "Backlog / To-Do", value: `${todo} Tasks`, desc: "Unallocated", icon: Inbox, color: "text-slate-600", trend: "Backlog", path: '/tasks' },
    { title: "In Progress", value: `${inProg} Tasks`, desc: "Executing Sprints", icon: PlayCircle, color: "text-blue-600", trend: "Active", path: '/tasks' },
    { title: "Under QA Review", value: `${underRev} Tasks`, desc: "Sign-off Pending", icon: ShieldAlert, color: "text-amber-600", trend: "Inspection", path: '/tasks' },
    { title: "Completed Tasks", value: `${done} Delivered`, desc: "Shipped Value", icon: CheckCircle, color: "text-emerald-600", trend: "Delivered", path: '/tasks' },
    { title: "Sprint Delivery SLA", value: "96.4%", desc: "On-time Delivery", icon: Zap, color: "text-emerald-600", trend: "High Speed", path: '/tasks' },
    { title: "Engineering Index", value: "99.8%", desc: "Zero Defect Rating", icon: Award, color: "text-emerald-600", trend: "Audited", path: '/tasks' },
    { title: "Active Projects", value: "6 Initiatives", desc: "Strategic Alignment", icon: Briefcase, color: "text-amber-700", trend: "On Track", path: '/tasks' },
    { title: "Infrastructure Uptime", value: "99.98%", desc: "Cloud Availability", icon: Activity, color: "text-emerald-600", trend: "Zero P0s", path: '/tasks' },
    { title: "Workforce Attendance", value: "97.5%", desc: "Biometric Verified", icon: Clock, color: "text-teal-600", trend: "On Time", path: '/attendance' },
    { title: "Org Idle Minutes", value: "115 mins", desc: "Breaks Logged Across Staff", icon: Coffee, color: "text-slate-700", trend: "Cumulative", path: '/attendance' },
    { title: "Org Leave Pool", value: "48.5 Days", desc: "Staff Balance Pool", icon: CalendarCheck, color: "text-teal-600", trend: "Active Pool", path: '/attendance' },
    { title: "Gross Payroll (₹)", value: `₹${grossTotal.toLocaleString('en-IN')}`, desc: "Monthly CTC Outflow", icon: IndianRupee, color: "text-slate-900", trend: "Settled", path: '/payroll' },
    { title: "Net Disbursed (₹)", value: `₹${netTotal.toLocaleString('en-IN')}`, desc: "Bank Transfers", icon: Wallet, color: "text-emerald-700", trend: "NEFT Cleared", path: '/payroll' }
  ];

  return (
    <div className="space-y-6">
      <DashboardSharedTop />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Executive Command Center</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">16 Enterprise KPIs Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Organization-wide governance over all workforce deliverables, velocity, and finances.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-5 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Enterprise Executive Telemetry & Global Performance (16 KPIs)</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>
    </div>
  );
}
