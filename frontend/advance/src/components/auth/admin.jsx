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
  ShieldCheck
} from "lucide-react"; 

const BASE_URL = "http://10.1.21.13:8600";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    screen_per: "",
    app_n: "",
  });

  // ==============================
  // LOGIC (UNCHANGED)
  // ==============================
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
    setForm({
      username: user.username,
      password: "",
      screen_per: user.screen_per,
      app_n: user.app_n,
    });
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
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col sticky h-screen top-0 shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">AdminPanel</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span className="font-semibold">User Management</span>
          </button>
          <button 
            onClick={() => setActiveTab("logs")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
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
        {/* Fixed Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
            {activeTab === 'users' ? 'User Directory' : 'Activity Stream'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">Administrator</p>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">Master Access</p>
            </div>
            <div className="h-10 w-10 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 font-bold">AD</div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="flex flex-col xl:flex-row gap-8 items-start">
              {/* Form Section */}
              <div className="w-full xl:w-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-800">
                    {editingUser ? "Update Profile" : "Register User"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Configure credentials and roles</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                    <input
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                    <input
                      placeholder={editingUser ? "Leave empty to keep current" : ""}
                      type="password"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Screen Permission</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Admin", "Action", "Request", "Statement"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, screen_per: p })}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            form.screen_per === p 
                            ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">App Number</label>
                    <input
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      value={form.app_n}
                      onChange={(e) => setForm({ ...form, app_n: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <button
                      onClick={editingUser ? updateUser : createUser}
                      disabled={loading}
                      className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 disabled:bg-slate-200 active:scale-95"
                    >
                      {loading ? "Syncing..." : editingUser ? "Save Changes" : "Create Account"}
                    </button>
                    {editingUser && (
                      <button onClick={cancelEdit} className="text-slate-400 text-xs font-bold hover:text-slate-600 underline decoration-slate-200 underline-offset-4">
                        Cancel Editing
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* User List Table */}
              <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">App ID</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-800">{u.username}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{u.screen_per}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-mono text-sm text-slate-500">
                            {u.app_n}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEdit(u)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => deleteUser(u.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 size={18} />
                              </button>
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

          {/* LOGS TAB - Fixed Header with Scroll Body */}
          {activeTab === "logs" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[700px]">
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Audit Database</h3>
                </div>
                <button onClick={fetchLogs} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
                  Reload Logs
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-md shadow-sm z-10">
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      <th className="px-8 py-4 border-b border-slate-100">Trace ID</th>
                      <th className="px-8 py-4 border-b border-slate-100">Employee</th>
                      <th className="px-8 py-4 border-b border-slate-100">Amount</th>
                      <th className="px-8 py-4 border-b border-slate-100">Outcome</th>
                      <th className="px-8 py-4 border-b border-slate-100 text-right">Purge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <tr key={log.entryno} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 font-mono text-xs text-slate-400 italic">{log.entryno}</td>
                        <td className="px-8 py-4 font-black text-slate-700">{log.empid}</td>
                        <td className="px-8 py-4 font-bold text-slate-600 tracking-tight">₹{log.amt}</td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                            log.status === "APPROVED" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {log.status || "PENDING"}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button onClick={() => deleteLog(log.entryno)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
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