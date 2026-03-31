import React, { useEffect, useState } from "react";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import {
  User, Calendar, FileText, Send, RotateCcw,
  ArrowLeft, IndianRupee, LayoutDashboard, Zap
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const BASE = "http://10.1.21.13:8600";

const Request = () => {
  const [empList,        setEmpList      ] = useState([]);
  const [selectedEmp,    setSelectedEmp  ] = useState(null);
  const [date,           setDate         ] = useState(() => new Date().toISOString().split("T")[0]);
  const [amount,         setAmount       ] = useState("");
  const [remarks,        setRemarks      ] = useState("");
  const [isSubmitting,   setIsSubmitting ] = useState(false);
  const [eligibleAmt,    setEligibleAmt  ] = useState(null);
  const [loadingEligible,setLoadingEligible]= useState(false);
  const [submittedId,   setSubmittedId   ] = useState(null);
  const [isSendingMail, setIsSendingMail ] = useState(false);

  // ─── Fetch Employee List ───────────────────────────────
  useEffect(() => {
    fetch(`${BASE}/empwisesal/`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed")))
      .then((data) => {
        setEmpList(
          data.map((emp) => ({
            value: emp.code,
            label: `${emp.code} - ${emp.name}`,
            ...emp,
          }))
        );
      })
      .catch(() => toast.error("Failed to load employee directory"));
  }, []);

  // ─── Fetch Eligible Amount ─────────────────────────────
  useEffect(() => {
    if (!selectedEmp || !date) {
      setEligibleAmt(null);
      return;
    }

    const month = new Date(date).getMonth() + 1;
    const year  = new Date(date).getFullYear();

    setLoadingEligible(true);
    setEligibleAmt(null);

    fetch(`${BASE}/eligibleamt/?id=${selectedEmp.value}&mon=${month}&year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        console.log("✅ Eligible API response:", JSON.stringify(data));

        const row = Array.isArray(data) ? data[0] : data;

        const eligible = parseFloat(
          row?.Eligible  ??
          row?.eligible  ??
          row?.ELIGIBLE  ??
          0
        );

        setEligibleAmt(isNaN(eligible) ? 0 : eligible);
      })
      .catch((err) => {
        console.error("Eligible API error:", err);
        toast.error("Failed to load eligible amount");
        setEligibleAmt(0);
      })
      .finally(() => setLoadingEligible(false));

  }, [selectedEmp, date]);

  // ─── Derived Values ────────────────────────────────────
  const maxAllowed = eligibleAmt != null
    ? parseFloat((eligibleAmt * 0.7).toFixed(2))
    : 0;

  const isAmountExceeded =
    amount !== "" && eligibleAmt !== null && parseFloat(amount) > maxAllowed;

  // ─── Handlers ──────────────────────────────────────────

  const handleClear = () => {
    setSelectedEmp(null);
    setAmount("");
    setRemarks("");
    setDate(new Date().toISOString().split("T")[0]);
    setEligibleAmt(null);
  };

  const handleSubmit = async () => {
    // 1. Validation
    if (!selectedEmp || !amount || !remarks) {
      toast.warning("Please fill in all required fields");
      return;
    }
    if (parseFloat(amount) <= 0) {
      toast.warning("Amount must be greater than 0");
      return;
    }
    if (isAmountExceeded) {
      toast.error(`Only 70% allowed. Max: ₹${maxAllowed.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const month = new Date(date).getMonth() + 1;
      const year = new Date(date).getFullYear();

      const payload = {
        dt: date + " 00:00:00",
        empid: selectedEmp.value,
        amt: parseFloat(amount) || 0, // Fallback to 0 if NaN
        remarks: remarks,
        smon: month,
        syear: year,
        elig: eligibleAmt,
        status: null,
        status_dt: null,
        comments: "",
        mail_sent: false,
      };

      // ─── STEP 1: SAVE TO DATABASE ───────────────────────
      const response = await fetch(`${BASE}/request/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      // Handle specific error codes
      if (response.status === 400) {
        const err = await response.json();
        toast.error(err.error || "Advance already submitted for this month");
        setIsSubmitting(false); // MUST RESET STATE BEFORE RETURN
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const savedData = await response.json();
      const newEntryId = savedData.id;

      if (!newEntryId) {
        throw new Error("No ID returned from server");
      }

      // ─── STEP 2: SEND EMAIL ─────────────────────────────
      try {
        const mailRes = await fetch(`${BASE}/send-advance-mail/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryno: newEntryId }),
        });

        if (mailRes.ok) {
          toast.success("✅ Request Saved & Mail Sent!");
        } else {
          toast.warning("⚠️ Saved successfully, but email notification failed");
        }
      } catch (mailErr) {
        console.error("Mail Error:", mailErr);
        toast.warning("⚠️ Saved successfully, but email service unavailable");
      }

      // Success - clear form
      handleClear();

    } catch (err) {
      console.error("❌ Submit Error:", err);
      
      if (err.name === 'TypeError') {
        toast.error("❌ Network error - Check your connection");
      } else {
        toast.error(`❌ Save failed: ${err.message}`);
      }
    } finally {
      // Ensure button is re-enabled regardless of success or general error
      setIsSubmitting(false);
    }
  };

  const handleSendMail = async () => {
    if (!submittedId) return;
    setIsSendingMail(true);

    try {
      const res = await fetch(`${BASE}/send-advance-mail/`, {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ entryno: submittedId }),
      });

      if (!res.ok) throw new Error("Mail failed");

      toast.success("📧 Mail sent to manager!");
      setSubmittedId(null);
      handleClear();           // clear form only after mail sent

    } catch {
      toast.error("Failed to send mail");
    } finally {
      setIsSendingMail(false);
    }
  };

  // ─── Select Styles ─────────────────────────────────────
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius   : "12px",
      border         : `1.5px solid ${state.isFocused ? "#6366f1" : "#e2e8f0"}`,
      padding        : "2px",
      boxShadow      : state.isFocused ? "0 0 0 3px rgba(99,102,241,0.1)" : "none",
      backgroundColor: "white",
      minHeight      : "48px", // Fixed height for mobile
      "&:hover"      : { borderColor: "#6366f1" },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#6366f1" : state.isFocused ? "#f0f3ff" : "white",
      color          : state.isSelected ? "white" : "#1e293b",
      cursor         : "pointer",
      padding        : "12px 16px", // Better mobile touch targets
    }),
    menu: (base) => ({
      ...base,
      marginTop: "4px",
      borderRadius: "12px",
      boxShadow: "0 20px 25px -5px rgba(0, 0,0, 0.1), 0 10px 10px -5px rgba(0, 0,0, 0.04)",
    }),
    menuList: (base) => ({
      ...base,
      padding: "4px",
      maxHeight: "300px", // Limit height on mobile
    }),
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans">
      <ToastContainer 
        position="top-center" 
        theme="colored" 
        autoClose={4000}
        containerClassName="mt-16 md:mt-20" // Account for fixed header
      />

      {/* HEADER - Mobile Optimized */}
      <nav className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 z-50 sticky top-0 backdrop-blur-sm supports-[backdrop-filter:blur()]:bg-white/90">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 -ml-1"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter truncate">
              Hero Fashion
            </span>
            <span className="text-sm font-bold text-slate-800 leading-tight truncate">
              Advance Portal
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex flex-col items-end min-w-30">
            <span className="text-xs font-bold text-slate-600 truncate">
              {new Date().toLocaleDateString("en-IN", { weekday: "long" })}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {new Date().toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <LayoutDashboard size={18} />
          </div>
        </div>
      </nav>

      {/* BANNER - Mobile Responsive */}
      <div className="bg-[#66D0BC] px-4 sm:px-6 py-6 sm:py-8 shrink-0">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
            Create Request
          </h1>
          <p className="text-teal-50 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Employee Advance Disbursement System
          </p>
        </div>
      </div>

      {/* MAIN CONTENT - Perfect Mobile Flow */}
      <main className="flex-1 pb-20 sm:pb-6 relative px-4 sm:px-0">
        <div className="max-w-6xl mx-auto h-full pt-2 sm:-mt-6">
          {/* Mobile: Stacked Layout | Desktop: Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-full pb-6">
            
            {/* LEFT — Employee Picker — Full width on mobile */}
            <div className="lg:col-span-4 w-full flex flex-col min-h-0 mb-6 lg:mb-0">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-100 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 shrink-0">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                    1. Target Employee
                  </label>
                  <div className="relative">
                    <Select
                      options={empList}
                      value={selectedEmp}
                      onChange={(emp) => {
                        setSelectedEmp(emp);
                        setAmount("");
                        setEligibleAmt(null);
                      }}
                      placeholder="Search employee..."
                      styles={selectStyles}
                      isClearable
                      isSearchable
                      menuPlacement="auto"
                      menuPortalTarget={document.body}
                      classNamePrefix="mobile-select"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-25">
                  {selectedEmp ? (
                    <div className="w-full max-w-sm">
                      <div className="flex items-center gap-3 sm:gap-4 mb-6">
                        <img
                          src={
                            selectedEmp.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmp.name)}&background=6366f1&color=fff&size=128`
                          }
                          className="w-25 h-25 sm:w-24 sm:h-24 rounded-xl ring-4 ring-indigo-50 shrink-0"
                          alt="avatar"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <h3 className="font-bold text-slate-900 leading-tight text-base sm:text-lg truncate">
                            {selectedEmp.name}
                          </h3>
                          <p className="text-indigo-600 text-sm font-mono font-bold uppercase mt-1">
                            {selectedEmp.code}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Dept</span>
                          <span className="text-xs font-bold text-slate-700 truncate block mt-1">
                            {selectedEmp.dept || "N/A"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Role</span>
                          <span className="text-xs font-bold text-slate-700 truncate block mt-1">
                            {selectedEmp.designation || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center opacity-50 py-8">
                      <User size={48} className="mx-auto mb-4 text-slate-300" />
                      <p className="text-sm font-medium text-slate-400">Select an employee</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — Request Form — Full width on mobile */}
            <div className="lg:col-span-8 w-full flex flex-col min-h-0">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
                
                {/* Card Header */}
                <div className="px-4 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white shrink-0">
                      <FileText size={16} />
                    </div>
                    <h2 className="font-bold text-slate-800 text-base sm:text-lg">2. Request Details</h2>
                  </div>
                  {isSubmitting && (
                    <span className="text-[10px] font-bold text-indigo-600 animate-pulse hidden sm:inline">
                      PROCESSING...
                    </span>
                  )}
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
                  <div className="space-y-4 sm:space-y-6">
                    
                    {/* Date & Eligible Amount - Mobile Stacked */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      
                      {/* Date */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                          <Calendar size={12} className="text-indigo-500 shrink-0" />
                          Date of Request
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => {
                            setDate(e.target.value);
                            setAmount("");
                          }}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-base h-14"
                        />
                      </div>

                     {/* Eligible Amount Card */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                          <IndianRupee size={12} className="text-green-500 shrink-0" />
                          Eligible Amount
                        </label>

                        {loadingEligible ? (
                          <div className="bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm text-slate-400 animate-pulse">
                            Calculating...
                          </div>
                        ) : eligibleAmt !== null && eligibleAmt > 0 ? (
                          <>
                            {/* Full eligible — green block */}
                            <div className="bg-green-50 border border-green-200 px-4 py-3.5 rounded-xl">
                              <p className="text-[10px] text-green-600 font-bold uppercase">
                                Full Eligible
                              </p>
                              <p className="text-lg font-black text-green-700 mt-0.5">
                                ₹{parseFloat(eligibleAmt).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>

                            {/* Max advance — small line below */}
                            <div className="px-1 flex items-center justify-between">
                              <p className="text-[10px] text-orange-500 font-bold uppercase">
                                Max Advance (70%)
                              </p>
                              <p className="text-sm font-black text-orange-600">
                                ₹{maxAllowed.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </>
                        ) : eligibleAmt === 0 ? (
                          <div className="bg-red-50 border border-red-200 px-4 py-3.5 rounded-xl text-sm text-red-500 font-semibold">
                            ⚠️ No eligible amount for this month
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-dashed border-slate-200 px-4 py-3.5 rounded-xl text-sm text-slate-400 text-center">
                            {selectedEmp ? "Select date to calculate" : "Select employee first"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount Input - Full Width */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                          <IndianRupee size={12} className="text-indigo-500 shrink-0" />
                          Amount Requested
                        </label>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-4 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition-all font-bold text-xl h-16 ${
                          isAmountExceeded
                            ? "border-red-400 text-red-600 focus:ring-red-300 bg-red-50"
                            : "border-slate-200 text-indigo-600 focus:ring-indigo-500"
                        }`}
                      />
                      {isAmountExceeded && (
                        <p className="text-xs text-red-500 font-semibold mt-1 px-1">
                          ⚠️ Exceeds 70% limit. Maximum allowed: ₹{maxAllowed.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Remarks - Full Width with Better Mobile Sizing */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                        <FileText size={12} className="text-indigo-500 shrink-0" />
                        Justification
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Please provide a reason for the advance request..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none min-h-30 text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons - Mobile Optimized */}
                <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedEmp || !amount || !remarks || isAmountExceeded || loadingEligible}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-base h-14 min-h-0"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="hidden sm:inline">Processing...</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span className="hidden sm:inline">Submit & Notify Manager</span>
                          <span className="sm:hidden">Submit Request</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleClear}
                      className="flex-1 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 py-4 px-6 rounded-xl font-bold text-slate-500 transition-all flex items-center justify-center gap-2 text-base h-14 min-h-0"
                    >
                      <RotateCcw size={16} />
                      <span className="hidden sm:inline">Reset Form</span>
                      <span className="sm:hidden">Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Request;