import React, { useEffect, useState } from 'react';
import { Filter, ArrowLeft, TrendingUp, CheckCircle, Clock, XCircle, Search, Calendar, User, Info } from 'lucide-react';

const Statement = () => {
  const [data, setData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ empid: '', status: '', from_date: '', to_date: '' });
  const [empList, setEmpList] = useState([]);
  const [loading, setLoading] = useState(false);

  const clearFilters = () => setFilters({ empid: '', status: '', from_date: '', to_date: '' });

  const Api = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`http://10.1.21.13:8600/state/?${query}`);
      const result = await res.json();
      setData(result);
      setEmpList([...new Set(result.map(item => item.empid))]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { Api(); }, [filters]);

  const totalAmt = data.reduce((s, i) => s + Number(i.amt || 0), 0);
  const approved = data.filter(i => i.status === 'Y').length;
  const pending = data.filter(i => i.status === null || i.status === 'P').length;
  const rejected = data.filter(i => i.status === 'N').length;

  const StatusBadge = ({ status }) => {
    const cfg = {
      Y: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      N: { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
      P: { label: 'Pending', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    };
    const { label, cls } = cfg[status] || cfg.P;
    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${cls} uppercase tracking-wider`}>
        {label}
      </span>
    );
  };

  // Mobile Card Component
  const MobileCard = ({ item }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <User size={14} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{item.empid}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Calendar size={10} /> {new Date(item.dt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      
      <div className="bg-slate-50 rounded-lg p-3 mb-3">
        <p className="text-[12px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
          <Info size={10} /> Remarks
        </p>
        <p className="text-sm text-slate-600">{item.remarks || 'No remarks provided'}</p>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
        <span className="text-[11px] font-bold text-slate-400 uppercase">Amount</span>
        <span className="text-lg font-black text-slate-900">₹{Number(item.amt).toLocaleString('en-IN')}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden text-slate-900">
      
      {/* TOP NAV BAR */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-800">Advance Statement</h1>
            <p className="text-[10px] md:text-xs font-medium text-slate-400">{data.length} Records</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg md:hidden transition-all ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          <Filter size={20} />
        </button>
      </header>

      {/* SUMMARY CARDS - Scrollable on mobile */}
      <div className="flex md:grid md:grid-cols-4 gap-3 p-4 md:p-6 overflow-x-auto shrink-0 no-scrollbar">
        {[
          { label: 'Volume', val: `₹${totalAmt.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved', val: approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', val: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Rejected', val: rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="min-w-35 flex-1 bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className={`p-2 md:p-3 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-sm md:text-xl font-black text-slate-800">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col px-4 md:px-6 pb-6 overflow-hidden">
        <div className="bg-white md:bg-white rounded-2xl md:border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          
          {/* FILTER BAR */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block border-b border-slate-100 p-4 bg-slate-50/50`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-end gap-3">
              <div className="flex-1 min-w-30">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Status</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={filters.status}
                  onChange={e => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="Y">Approved</option>
                  <option value="P">Pending</option>
                  <option value="N">Rejected</option>
                </select>
              </div>

              <div className="flex-1 min-w-30">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Employee</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                  value={filters.empid}
                  onChange={e => setFilters({...filters, empid: e.target.value})}
                >
                  <option value="">All Staff</option>
                  {empList.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-30">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">From</label>
                <input type="date" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.from_date} onChange={e => setFilters({...filters, from_date: e.target.value})} />
              </div>

              <div className="flex-1 min-w-30">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">To</label>
                <input type="date" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.to_date} onChange={e => setFilters({...filters, to_date: e.target.value})} />
              </div>

              <button onClick={clearFilters} className="w-full md:w-auto px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                Reset
              </button>
            </div>
          </div>

          {/* DATA VIEW */}
          <div className="flex-1 overflow-auto relative p-1 md:p-0">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-20">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Employee</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Remarks</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase text-right">Amount</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((item, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                        {new Date(item.dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">{item.empid}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-500 truncate max-w-xs">{item.remarks || '---'}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-800">₹{Number(item.amt).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden p-2">
              {data.map((item, i) => <MobileCard key={i} item={item} />)}
            </div>

            {/* EMPTY STATE */}
            {!loading && data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No records found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Statement;