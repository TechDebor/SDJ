import { useEffect, useState } from 'react';
import { Layers, Target, PlayCircle, CheckCircle, Zap, Coffee, CalendarCheck, Wallet } from 'lucide-react';
import KpiCard from '../../components/ui/KpiCard';
import DashboardSharedTop from '../../components/ui/DashboardSharedTop';
import { taskService, attendanceService, leaveService, payrollService } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [payroll, setPayroll] = useState([]);
  
  useEffect(() => {
    taskService.getAll().then(res => setTasks(res.data.data.filter(t => t.assignedTo?._id === user._id)));
    payrollService.getAll().then(res => setPayroll(res.data.data.filter(p => p.employee?._id === user._id)));
  }, [user._id]);

  const todo = tasks.filter(t => t.status === 'BACKLOG').length;
  const inProg = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const done = tasks.filter(t => t.status === 'COMPLETED').length;
  const spSum = tasks.reduce((a, c) => a + (c.storyPoints || 0), 0);
  
  const currentMonthPayroll = payroll[payroll.length - 1];
  const netTakeHome = currentMonthPayroll ? `₹${currentMonthPayroll.net.toLocaleString('en-IN')}` : `₹${(user.salary * 0.88).toLocaleString('en-IN')}`;

  const kpis = [
    { title: "Assigned Tasks", value: `${tasks.length} Items`, desc: "Active Queue", icon: Layers, color: "text-blue-600", trend: "+1 New", path: '/tasks' },
    { title: "Sprint Story Points", value: `${spSum} SP`, desc: "Personal Workload Weight", icon: Target, color: "text-indigo-600", trend: "Complexity", path: '/tasks' },
    { title: "In Progress", value: `${inProg} Tasks`, desc: "Active Under Execution", icon: PlayCircle, color: "text-blue-600", trend: "High Priority", path: '/tasks' },
    { title: "Completed Tasks", value: `${done} Done`, desc: "Tested & Verified", icon: CheckCircle, color: "text-emerald-600", trend: "Finished", path: '/tasks' },
    { title: "Delivery SLA %", value: tasks.length > 0 ? `${Math.round((done / tasks.length) * 100)}%` : "100%", desc: "On-Time Completion", icon: Zap, color: "text-emerald-600", trend: "Benchmark", path: '/tasks' },
    { title: "Today's Idle Time", value: `35 mins`, desc: "Tea, Lunch & Breaks", icon: Coffee, color: "text-amber-600", trend: "Tracked", path: '/attendance' },
    { title: "Leave Balance", value: "18.0 Days", desc: "Available Quota Pool", icon: CalendarCheck, color: "text-teal-600", trend: "FY 26-27", path: '/attendance' },
    { title: "Net Take-Home Pay", value: netTakeHome, desc: "Monthly Net Deposit (₹)", icon: Wallet, color: "text-emerald-700", trend: "Direct NEFT", path: '/payroll' }
  ];

  return (
    <div className="space-y-6">
      <DashboardSharedTop />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{user.name}'s Personal Workspace</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-800 border">8 Personal KPIs Active</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Personal sprint deliverables, biometric shifts, idle duration, and compensation statements.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-5 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Employee Personal Performance & Duty Telemetry (8 KPIs)</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
      </div>
    </div>
  );
}
