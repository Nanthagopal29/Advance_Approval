import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { 
  Users, 
  FileText, 
  LogOut, 
  Edit, 
  Trash2, 
  RefreshCw,
  ShieldCheck,
  Menu,
  X
} from "lucide-react"; 

const BASE_URL = "http://10.1.21.13:8600";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    screen_per: "",
    app_n: "",
  });

  // Logic remains the same...
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/login/`);
      const filtered = res.data.filter((u) => u.screen_per !== "Admin");
      setUsers(filtered);
    } catch (err) {
      toast.error("Failed to fetch users.");
    }
  };

  const createUser = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.screen_per || !form.app_n.toString().trim()) {
      toast.error("Please fill all fields!");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${BASE_URL}/login/`, { ...form, action: "register" });
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        toast.success("User registered successfully!");
        setForm({ username: "", password: "", screen_per: "", app_n: "" });
        await fetchUsers();
      }
    } catch (err) {
      toast.error("Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setForm({ username: user.username, password: "", screen_per: user.screen_per, app_n: user.app_n });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setForm({ username: "", password: "", screen_per: "", app_n: "" });
  };

  const updateUser = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${BASE_URL}/login/`, {
        id: editingUser.id,
        username: form.username,
        password: form.password,
        screen_per: form.screen_per,
        app_n: form.app_n,
      });
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        toast.success("User updated successfully!");
        cancelEdit();
        await fetchUsers();
      }
    } catch (err) {
      toast.error("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/login/`, { data: { id } });
      toast.success("User deleted.");
      await fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/request/`);
      setLogs(res.data);
    } catch (err) {
      toast.error("Failed to fetch logs.");
    }
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Delete this log?")) return;
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/request/`, { data: { id } });
      toast.success("Log deleted.");
      await fetchLogs();
    } catch (err) {
      toast.error("Failed to delete log.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:h-screen md:sticky md:top-0 shrink-0
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">AdminPanel</span>
          </div>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span className="font-semibold">User Management</span>
          </button>
          <button 
            onClick={() => { setActiveTab("logs"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText size={20} />
            <span className="font-semibold">System Logs</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all font-bold"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 uppercase tracking-tight">
              {activeTab === 'users' ? 'Users' : 'Logs'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-700">Admin</p>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Master</p>
            </div>
            <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">AD</div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start">
              {/* Form Section */}
              <div className="w-full xl:w-96 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-xl font-black text-slate-800">
                    {editingUser ? "Update Profile" : "Register User"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1">Username</label>
                    <input
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1">Password</label>
                    <input
                      type="password"
                      placeholder={editingUser ? "Keep empty to skip" : ""}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1">Permission</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Admin", "Action", "Request", "Statement"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, screen_per: p })}
                          className={`py-2 rounded-lg border text-[10px] font-bold ${form.screen_per === p ? "bg-slate-800 text-white" : "bg-white text-slate-600 border-slate-200"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1">App Number</label>
                    <input
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      value={form.app_n}
                      onChange={(e) => setForm({ ...form, app_n: e.target.value })}
                    />
                  </div>

                  <button
                    onClick={editingUser ? updateUser : createUser}
                    disabled={loading}
                    className="w-full py-4 mt-4 rounded-xl text-white font-black text-sm uppercase bg-indigo-600 shadow-lg"
                  >
                    {loading ? "Syncing..." : editingUser ? "Save" : "Create"}
                  </button>
                  {editingUser && (
                    <button onClick={cancelEdit} className="w-full text-slate-400 text-xs font-bold underline">Cancel</button>
                  )}
                </div>
              </div>

              {/* User List Table */}
              <div className="w-full flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">User</th>
                        <th className="hidden sm:table-cell px-6 py-4 text-[10px] font-black text-slate-400 uppercase">App ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{u.username}</div>
                            <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{u.screen_per}</span>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 font-mono text-sm text-slate-500">{u.app_n}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => startEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16} /></button>
                              <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB - Mobile Card View / Desktop Table */}
          {activeTab === "logs" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xl font-black text-slate-800">Audit Database</h3>
                 <button onClick={fetchLogs} className="p-2 bg-slate-900 text-white rounded-lg"><RefreshCw size={18} /></button>
              </div>

              {/* Card View for Mobile */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {logs.map((log) => (
                  <div key={log.entryno} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Trace ID: {log.entryno}</p>
                        <h4 className="font-bold text-slate-800 text-lg">{log.empid}</h4>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black border ${log.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                        {log.status || "PENDING"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black text-slate-700">₹{log.amt}</span>
                      <button onClick={() => deleteLog(log.entryno)} className="p-2 text-red-400 bg-red-50 rounded-xl">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table View for Desktop */}
              <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-400 text-[10px] font-black uppercase">
                      <th className="px-8 py-4">Trace ID</th>
                      <th className="px-8 py-4">Employee</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Outcome</th>
                      <th className="px-8 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr key={log.entryno} className="hover:bg-slate-50">
                        <td className="px-8 py-4 font-mono text-xs text-slate-400">{log.entryno}</td>
                        <td className="px-8 py-4 font-black text-slate-700">{log.empid}</td>
                        <td className="px-8 py-4 font-bold text-slate-600">₹{log.amt}</td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${log.status === "APPROVED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                            {log.status || "PENDING"}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button onClick={() => deleteLog(log.entryno)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;