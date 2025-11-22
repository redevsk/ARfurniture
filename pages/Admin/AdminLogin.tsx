import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../App';
import { UserRole } from '../../types';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        setError('Access denied: Not an administrator account.');
      }
    } catch (err) {
      setError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 p-3 bg-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-600/20">
           <Hexagon className="w-8 h-8 text-white fill-current" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ARniture Admin</h1>
        <p className="text-slate-500">Secure Portal Access</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 p-4 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium">
          <ShieldCheck className="w-5 h-5" />
          <span>Please authenticate to continue</span>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="admin@arniture.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
                 Hint: Use <strong>admin@arniture.com</strong> / <strong>admin123</strong>
             </p>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-sm">
          &copy; 2024 ARniture Inc. Internal System.
      </p>
    </div>
  );
};