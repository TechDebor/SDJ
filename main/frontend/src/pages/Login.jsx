import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Layers } from 'lucide-react';
import { authService } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.login({ mobile, password });
      login(res.data.user, res.data.token);
      
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Error logging in');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600"></div>
        
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
            <Layers className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Debor Enterprise</h1>
          <p className="text-xs text-slate-500 font-medium">Workforce & Task Governance Gateway</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Mobile Number *</label>
            <div className="relative">
              <div className="absolute left-3.5 top-2.5 text-slate-400 font-mono tracking-tight font-bold">+91</div>
              <input 
                type="tel" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                maxLength="10"
                pattern="[0-9]{10}"
                required
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono tracking-tight text-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-600 text-sm" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Password *</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono tracking-tight text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-600" 
            />
          </div>

          <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
