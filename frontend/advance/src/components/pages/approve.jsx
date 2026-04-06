import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Approve = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [mailing, setMailing] = useState(false); // New: Tracks API submission status
  const [popup, setPopup] = useState(null);
  const [params] = useSearchParams();
  const entrynoFromUrl = params.get("entryno");
  const statusFromUrl = params.get("status");
  const [isSuccess, setIsSuccess] = useState(false); // New state
  

  // Helper to format date to Indian Format (DD-MM-YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, empRes] = await Promise.all([
        fetch("http://10.1.21.13:8600/request/"),
        fetch("http://10.1.21.13:8600/empwisesal/"),
      ]);
      const reqData = await reqRes.json();
      const empData = await empRes.json();

      const filteredRequests = reqData
        .filter((r) => r.status === null)
        .sort((a, b) => b.entryno - a.entryno);

      const empMap = {};
      empData.forEach((emp) => {
        empMap[emp.code] = emp;
      });

      setEmployees(empMap);
      setRequests(filteredRequests);

      // AUTO OPEN FROM EMAIL
      if (entrynoFromUrl && statusFromUrl) {
      const found = filteredRequests.find(
        (r) => String(r.entryno) === String(entrynoFromUrl)
      );

      if (found) {
        setPopup({ request: found, statusValue: statusFromUrl });
      }
    }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
  if (!popup) return;

  setMailing(true);
  const { request, statusValue } = popup;
  const emp = employees[request.empid] || {};
  const now = new Date().toISOString();

  const payload = {
    id: request.entryno,
    status: statusValue,
    status_dt: now,
    name: emp.name || "",
    dept: emp.dept || "",
    code: request.empid,
    amount: request.amt,
    remarks: request.remarks,
  };

  try {
    const res = await fetch("http://10.1.21.13:8600/ad_approve/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Update failed");

    try {
      await fetch("http://10.1.21.13:8600/approve_mail/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryno: request.entryno, status: statusValue }),
      });
    } catch (mailErr) {
      console.error("Mail failed", mailErr);
    }

    // Success Sequence
    setIsSuccess(true); 
    setRequests((prev) => prev.filter((r) => r.entryno !== request.entryno));
    
    // Optional: Auto-close after 2 seconds
    setTimeout(() => {
      setPopup(null);
      setIsSuccess(false);
      setMailing(false);
    }, 2000);

  } catch (err) {
    alert("Server error");
    setMailing(false);
  }
};

  const openPopup = (request, statusValue) => {
    setPopup({ request, statusValue });
  };

  const isApprove = popup?.statusValue === "Y";

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* ── Fixed Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex shrink-0 items-center justify-between z-20">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight"> Action Approvals Portal</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
              Status
            </p>
            <p className="text-sm sm:text-base font-bold text-indigo-600 uppercase">
              {requests.length} Pending
            </p>
          </div>

          <button
            onClick={() => window.history.back()}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition active:scale-95 shadow-sm"
          >
            ‹ Back
          </button>
        </div>
      </header>

      {/* ── Table Container ── */}
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-6 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <div>Entry No</div>
            <div>Date</div>
            <div className="col-span-1">Employee</div>
            <div>Department</div>
            <div>Amount & Remarks</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" />
                <p className="text-gray-500 font-medium">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-20 text-center">
                <p className="text-gray-400 text-lg">✨ Everything is approved!</p>
              </div>
            ) : (
              requests.map((req) => {
                const empRow = employees[req.empid] || {};
                return (
                  <div key={req.entryno} className="grid grid-cols-1 sm:grid-cols-6 gap-4 px-6 py-5 items-center hover:bg-indigo-50/20 transition">
                    <div className="flex sm:block items-center justify-between">
                      <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase">Entry No</span>
                      <span className="font-mono text-sm font-bold text-gray-700">{req.entryno}</span>
                    </div>

                    <div className="flex sm:block items-center justify-between">
                      <span className="sm:hidden text-[10px] font-bold text-gray-400 uppercase">Date</span>
                      <span className="text-sm text-gray-600">{formatDate(req.dt)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={`https://app.herofashion.com/staff_images/${req.empid}.jpg`}
                        className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-100 object-cover"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${req.empid}&background=e0e7ff&color=4f46e5`; }}
                        alt="emp"
                      />
                      <div className="truncate">
                        <p className="text-sm font-bold text-gray-800 truncate">{empRow.name || `ID: ${req.empid}`}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{req.empid}</p>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {empRow.dept || "General"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-green-600 mb-1">₹{req.amt || 0}</p>
                      <p className="text-xs text-gray-500 italic line-clamp-1">{req.remarks || "No remarks provided"}</p>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openPopup(req, "Y")}
                        className="bg-green-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openPopup(req, "N")}
                        className="bg-white text-red-600 border border-red-200 text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ── Confirmation Modal with Mailing State ── */}
      {popup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl transition-all">
      
      {/* ── Dynamic Icon ── */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors duration-500 ${
        isSuccess ? "bg-green-100 text-green-600" :
        mailing ? "bg-indigo-50 text-indigo-600" : 
        isApprove ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
      }`}>
        {isSuccess ? (
          <svg className="w-10 h-10 animate-[bounce_0.5s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        ) : mailing ? (
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-3xl font-bold">{isApprove ? "✓" : "✕"}</span>
        )}
      </div>

      {/* ── Text Content ── */}
      <h2 className="text-center text-xl font-black text-gray-900 mb-2">
        {isSuccess ? "Success!" : mailing ? "Processing..." : isApprove ? "Confirm Approval" : "Confirm Rejection"}
      </h2>
      
      <p className="text-center text-sm text-gray-500 mb-8 leading-relaxed">
        {isSuccess 
          ? `The request for #${popup.request.entryno} has been updated and the email was triggered.` 
          : mailing 
          ? "We are updating the records and notifying the employee. Please don't close this window." 
          : `Are you sure you want to ${isApprove ? 'approve' : 'reject'} the request for ${employees[popup.request.empid]?.name || 'this employee'}?`
        }
      </p>

      {/* ── Action Buttons ── */}
      {!isSuccess ? (
        <div className="flex gap-3">
          <button 
            disabled={mailing} 
            onClick={() => setPopup(null)} 
            className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition disabled:opacity-0"
          >
            Cancel
          </button>
          <button 
            disabled={mailing}
            onClick={handleAction} 
            className={`flex-2 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-95 ${
              isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            } disabled:bg-gray-300 disabled:shadow-none`}
          >
            {mailing ? "Sending..." : "Confirm & Send"}
          </button>
        </div>
      ) : (
        <button 
          onClick={() => { setPopup(null); setIsSuccess(false); setMailing(false); }}
          className="w-full py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-gray-800 transition"
        >
          Done
        </button>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default Approve;