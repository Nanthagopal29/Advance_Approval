import React, { useEffect, useState } from 'react';
import { Filter, X, ArrowLeft, TrendingUp, CheckCircle, Clock, XCircle, Search, Download } from 'lucide-react';

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
  const pending  = data.filter(i => i.status === 'P').length;
  const rejected = data.filter(i => i.status === 'N').length;

  const StatusBadge = ({ status }) => {
    const cfg = {
      Y: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
      N: { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
      P: { label: 'Pending',  cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    };
    const { label, cls } = cfg[status] || cfg.P;
    return (
      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${cls} uppercase tracking-wider`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] overflow-hidden text-slate-900">
      
      {/* TOP NAV BAR */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Advance Statement</h1>
            <p className="text-xs font-medium text-slate-400">{data.length} Transactions Found</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
            <Download size={16} /> Export
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden p-2 rounded-lg ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 shrink-0">
        {[
          { label: 'Total Volume', val: `₹${totalAmt.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved', val: approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', val: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Rejected', val: rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-800">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          
          {/* FILTER BAR (Desktop always visible) */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block border-b border-slate-100 p-4 bg-slate-50/50`}>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-37.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Status</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={filters.status}
                  onChange={e => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="Y">Approved</option>
                  <option value="P">Pending</option>
                  <option value="N">Rejected</option>
                </select>
              </div>

              <div className="flex-1 min-w-37.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Employee</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={filters.empid}
                  onChange={e => setFilters({...filters, empid: e.target.value})}
                >
                  <option value="">All Staff</option>
                  {empList.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-37.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">From Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={filters.from_date}
                  onChange={e => setFilters({...filters, from_date: e.target.value})}
                />
              </div>

              <div className="flex-1 min-w-37.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">To Date</label>
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={filters.to_date}
                  onChange={e => setFilters({...filters, to_date: e.target.value})}
                />
              </div>

              <button 
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* TABLE CONTAINER - This part is scrollable */}
          <div className="flex-1 overflow-auto relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : null}

            <table className="w-full text-left border-collapse min-w-200">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transaction Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remarks & Description</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {new Date(item.dt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-slate-100 group-hover:bg-white px-2 py-1 rounded text-slate-700 border border-slate-200 transition-colors">
                        {item.empid}
                      </span>
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

            {!loading && data.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No matching records found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Statement;