import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KpiCard({ title, value, desc, icon: Icon, color, trend, path }) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => path && navigate(path)} 
      className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-sm border border-slate-200 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
          {title}
        </span>
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-black text-slate-900 leading-tight">{value}</div>
        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{desc}</span>
      </div>
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-400">Drilldown</span>
        <span className={`${color} flex items-center gap-0.5`}>
          {trend} <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
