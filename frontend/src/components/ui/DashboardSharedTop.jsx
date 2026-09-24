import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Edit, X, Sliders, ChevronLeft, ChevronRight, ArrowRight, Zap, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { advertisementService, rateService } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CalculatorLauncher from './CalculatorLauncher';
import ManageShowcaseModal from './ManageShowcaseModal';

export default function DashboardSharedTop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  
  const [rates, setRates] = useState({
    date: 'Loading...', gold999: '-', gold995: '-', silver999: '-', gold22k: '-', gold18k: '-', gold14k: '-'
  });
  
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [rateFormData, setRateFormData] = useState(rates);

  const defaultAds = [
    {
      badge: "ENTERPRISE WORKFORCE VELOCITY",
      title: "Autonomous Task Allocation & Sprint Delivery",
      subtitle: "Streamline departmental assignments, track subtasks in real time, and monitor SLA progress.",
      cta: "View Operational Dashboard",
      icon: "zap",
      isActive: true
    },
    {
      badge: "COMPLIANCE & GOVERNANCE",
      title: "Automated Indian Statutory Payroll Engine",
      subtitle: "Instant itemized payslips with EPF (12%), Professional Tax (₹200), and TDS calculation.",
      cta: "Explore Payroll Statements",
      icon: "shield-check",
      isActive: true
    },
    {
      badge: "OPERATIONAL TELEMETRY",
      title: "Live Biometric Attendance & Shift Control",
      subtitle: "Precise shift tracking, customizable idle pauses (Tea/Lunch/Restroom), and advance leave planning.",
      cta: "Inspect Duty Timesheets",
      icon: "clock",
      isActive: true
    }
  ];

  useEffect(() => {
    advertisementService.getAll()
      .then(res => {
        const activeAds = res.data.data.filter(a => a.isActive);
        setAds(activeAds.length > 0 ? activeAds : defaultAds);
      })
      .catch(err => {
        console.error(err);
        setAds(defaultAds);
      });
      
    rateService.get().then(res => {
      if (res.data.data) {
        setRates(res.data.data);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (ads.length > 0) {
      const timer = setInterval(() => {
        setCurrentAdIndex(prev => (prev + 1) % ads.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [ads]);

  
  const renderIcon = (iconName) => {
    switch(iconName) {
      case 'zap': return <Zap className="w-3.5 h-3.5 text-blue-400" />;
      case 'shield-check': return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'clock': return <Clock className="w-3.5 h-3.5 text-blue-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const nextAdSlide = () => {
    setCurrentAdIndex((prev) => (prev + 1) % ads.length);
  };

  const prevAdSlide = () => {
    setCurrentAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const openRatesEdit = () => {
    setRateFormData(rates);
    setIsEditingRates(true);
  };

  const handleRatesSave = async (e) => {
    e.preventDefault();
    try {
      const res = await rateService.update(rateFormData);
      setRates(res.data.data);
      setIsEditingRates(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating rates');
    }
  };

  const handleSaveAds = async (updatedSlides, selectedIndex) => {
    const slideToSave = updatedSlides[selectedIndex];
    if (slideToSave._id) {
      await advertisementService.update(slideToSave._id, slideToSave);
    } else {
      const res = await advertisementService.create(slideToSave);
      updatedSlides[selectedIndex]._id = res.data.data._id;
    }
    setAds([...updatedSlides]);
  };

  const [isEditingShowcase, setIsEditingShowcase] = useState(false);

  return (
    <div className="space-y-6 mb-6">
      <CalculatorLauncher />
      
      {/* ORIGINAL EXECUTIVE HERO BANNER SLIDESHOW */}
      {ads.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl shadow-xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -top-16 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {(user.role === 'SUPER_ADMIN') && (
              <button onClick={() => setIsEditingShowcase(true)} className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-blue-300 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs">
                <Sliders className="w-3.5 h-3.5" /> Manage Showcase
              </button>
            )}
            <div className="bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono tracking-tight text-slate-300 border border-slate-700/60">
              <span>{currentAdIndex + 1} / {ads.length}</span>
            </div>
          </div>

          <div className="relative min-h-[220px] sm:min-h-[235px] flex items-center transition-all duration-700 ease-in-out p-6 sm:p-10">
            <div className="max-w-2xl space-y-2.5 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-600/10 border border-blue-400/30 text-[10px] font-extrabold tracking-widest text-blue-300 uppercase">
                {renderIcon(ads[currentAdIndex].icon)}
                <span>{ads[currentAdIndex].badge}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                {ads[currentAdIndex].title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {ads[currentAdIndex].subtitle}
              </p>
              <div className="pt-2">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all">
                  <span>{ads[currentAdIndex].cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-6 sm:left-10 z-20 flex items-center gap-2">
            <button onClick={prevAdSlide} className="p-1.5 bg-slate-900/60 hover:bg-slate-800 text-white rounded-full border border-slate-700 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 mx-2">
              {ads.map((_, i) => (
                <span key={i} onClick={() => setCurrentAdIndex(i)} className={`${i === currentAdIndex ? 'w-6 h-1.5 bg-blue-600' : 'w-2 h-1.5 bg-slate-600'} rounded-full cursor-pointer transition-all`}></span>
              ))}
            </div>
            <button onClick={nextAdSlide} className="p-1.5 bg-slate-900/60 hover:bg-slate-800 text-white rounded-full border border-slate-700 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Daily Rates Bar */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row justify-between xl:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-700 shadow-sm border border-amber-200">
             <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Live Bullion Rates</h3>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{rates.date}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap flex-1 gap-2 xl:justify-center">
          {[
            { label: 'Gold 999', value: rates.gold999 },
            { label: 'Gold 99.5', value: rates.gold995 },
            { label: 'Silver 999', value: rates.silver999 },
            { label: '22K Gold', value: rates.gold22k },
            { label: '18K Gold', value: rates.gold18k },
            { label: '14K Gold', value: rates.gold14k }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-amber-200/60 px-3 py-1.5 rounded-2xl flex items-center gap-2 shadow-sm flex-1 min-w-[110px] xl:flex-none">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
              <span className="text-xs font-black text-amber-700 ml-auto xl:ml-0">₹{item.value}/g</span>
            </div>
          ))}
        </div>

        {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
           <button onClick={openRatesEdit} className="px-4 py-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap">
             <Edit className="w-3.5 h-3.5" /> Update Rates
           </button>
        )}
      </div>

      {/* Daily Rates Edit Modal */}
      {isEditingRates && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsEditingRates(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-lg text-amber-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                Update Bullion Rates
              </h3>
              <button onClick={() => setIsEditingRates(false)} className="text-amber-700/60 hover:text-amber-900 p-1.5 transition-colors bg-white rounded-2xl border border-amber-200 hover:bg-amber-100 shadow-sm"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleRatesSave}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Applicable Date</label>
                  <input required value={rateFormData.date} onChange={e => setRateFormData({...rateFormData, date: e.target.value})} placeholder="e.g. 23 September 2026" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium transition-all shadow-sm" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gold 999 (₹/g)</label>
                    <input required value={rateFormData.gold999} onChange={e => setRateFormData({...rateFormData, gold999: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gold 99.5 (₹/g)</label>
                    <input required value={rateFormData.gold995} onChange={e => setRateFormData({...rateFormData, gold995: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Silver 999 (₹/g)</label>
                    <input required value={rateFormData.silver999} onChange={e => setRateFormData({...rateFormData, silver999: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">22K Gold (₹/g)</label>
                    <input required value={rateFormData.gold22k} onChange={e => setRateFormData({...rateFormData, gold22k: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">18K Gold (₹/g)</label>
                    <input required value={rateFormData.gold18k} onChange={e => setRateFormData({...rateFormData, gold18k: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">14K Gold (₹/g)</label>
                    <input required value={rateFormData.gold14k} onChange={e => setRateFormData({...rateFormData, gold14k: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono tracking-tight font-bold transition-all shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setIsEditingRates(false)} className="px-5 py-2.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-sm shadow-amber-600/20 transition-all flex items-center gap-2 text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Manage Showcase Modal */}
      <ManageShowcaseModal
        open={isEditingShowcase}
        onClose={() => setIsEditingShowcase(false)}
        initialSlides={ads}
        onSave={handleSaveAds}
      />
    </div>
  );
}
