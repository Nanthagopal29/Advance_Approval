import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FileText, 
  CheckCircle, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight,
  ClipboardList
} from "lucide-react"; // npm install lucide-react

const Home = () => {
  const [cards, setCards] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const user = location.state;

  useEffect(() => {
    if (!user) return;

    const role = user.screen_per?.toLowerCase();
    if (user.app_n !== 2 && user.app_n !== null) return;

    // Mapping icons and specific styles to roles
    const iconMap = {
      Request: <ClipboardList className="w-6 h-6 text-blue-500" />,
      Statement: <FileText className="w-6 h-6 text-purple-500" />,
      Approve: <CheckCircle className="w-6 h-6 text-emerald-500" />,
    };

    if (role === "request") {
      setCards([
        { name: "Request", path: "/request", icon: iconMap.Request, color: "border-t-blue-500" },
        { name: "Statement", path: "/statement", icon: iconMap.Statement, color: "border-t-purple-500" },
      ]);
    } else if (role === "action") {
      setCards([
        { name: "Approve", path: "/approve", icon: iconMap.Approve, color: "border-t-emerald-500" },
        { name: "Statement", path: "/statement", icon: iconMap.Statement, color: "border-t-purple-500" },
      ]);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* --- Top Navigation --- */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 italic">Advance<span className="text-indigo-600">Protal</span></h1>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-12">
        {/* --- Header Section --- */}
        <header className="mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, <span className="text-indigo-600">{user?.name || "User"}</span> 👋
          </h2>
          <p className="text-slate-500 mt-2 text-lg">
            Here's what you can do today based on your <span className="font-medium text-slate-700">"{user?.screen_per}"</span> permissions.
          </p>
        </header>

        {/* --- Error State --- */}
        {!user && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-8 flex items-center gap-3">
             <p className="text-amber-800 font-medium">No session data found. Please login to continue.</p>
          </div>
        )}

        {/* --- Dashboard Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.path)}
              className={`group relative cursor-pointer bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 border-t-4 ${card.color} hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 group-hover:scale-110 transition-all duration-300">
                  {card.icon}
                </div>
                <div className="bg-slate-100 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ChevronRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {card.name}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                Click here to view and manage your {card.name.toLowerCase()} entries and records.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-indigo-600 font-bold text-sm uppercase tracking-wider">
                Explore Portal
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;