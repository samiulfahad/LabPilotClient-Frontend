// React Compiler active — no useCallback/useMemo
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import {
  Badge,
  Btn,
  EmptyState,
  Input,
  PageHeader,
  Sk,
  fmt,
  totalExpenses,
  totalPayments,
} from "./indoorPatientHelpers";
import Popup from "../../components/popup";
import ScanButton from "../../components/scanButton";

// ── Axios‑native network error detection (same as all other pages) ───────
const isNetworkError = (err) => err?.isAxiosError === true && !err.response;

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-teal-500 to-emerald-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];
const gradientFor = (seed = "") =>
  AVATAR_GRADIENTS[seed.charCodeAt(0) % AVATAR_GRADIENTS.length] || AVATAR_GRADIENTS[0];

const SearchPatient = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [networkError, setNetworkError] = useState(false);
  const [focused, setFocused] = useState(false);
  const searchTimer = useRef(null);

  const doSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await indoorPatientService.getPatients({ status: "all", search: q, page: 1, limit: 30 });
      setResults(res.data.patients ?? []);
      setSearched(true);
    } catch (err) {
      if (isNetworkError(err)) {
        setNetworkError(true);
      } else {
        setError("Search failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 400);
  };

  const handleScan = (text) => {
    clearTimeout(searchTimer.current);
    const q = text.trim();
    setQuery(q);
    doSearch(q);
  };

  const handleClear = () => {
    clearTimeout(searchTimer.current);
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
  };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Offline popup */}
      {networkError && <Popup type="offline" onClose={() => setNetworkError(false)} />}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fu { animation: fadeUp 0.35s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* Sticky search header */}
      <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-3">
          <PageHeader
            title="Search Patient"
            subtitle="Find by name, admission ID or phone"
            back={() => navigate("/ipd")}
          />

          <div
            className={`mt-3 w-full flex items-center gap-2.5 h-12 pl-4 pr-2 bg-white transition-all duration-200 ${
              focused
                ? "shadow-[0_2px_20px_rgba(59,130,246,0.16)] ring-2 ring-blue-500/70"
                : "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_1px_8px_rgba(15,23,42,0.04)] ring-1 ring-slate-200"
            }`}
          >
            <svg
              className={`w-4.5 h-4.5 shrink-0 transition-colors ${focused ? "text-blue-500" : "text-slate-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.25"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Name, admission ID or phone"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {loading && (
              <svg className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {!loading && query && (
              <button
                onClick={handleClear}
                className="shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-0.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            <div className="w-px h-5 bg-slate-200 shrink-0" />
            <ScanButton
              onScan={handleScan}
              className="!border-0 !bg-transparent !p-2 !rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {!searched && !loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/70">
            <EmptyState icon="🔍" title="Start typing to search" subtitle="Results will appear as you type" />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/70 p-4">
                <Sk cls="h-16" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-slate-200/70 py-14 text-center">
            <p className="text-rose-500 font-semibold text-sm">{error}</p>
            <p className="text-slate-400 text-xs mt-1">Please try again</p>
          </div>
        ) : !results.length ? (
          <div className="bg-white rounded-2xl border border-slate-200/70">
            <EmptyState icon="😶" title="No results found" subtitle={`No patients match "${query}"`} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 px-1 fu">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {results.length} {results.length === 1 ? "Result" : "Results"}
              </span>
            </div>

            <div className="grid gap-2.5">
              {results.map((p, idx) => {
                const paid = totalPayments(p.payments);
                const expTotal = totalExpenses(p.expenses);
                const balance = expTotal - paid;
                const isAdmitted = p.status === "admitted";
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/ipd/patient/${p._id}`)}
                    className="group fu bg-white rounded-2xl border border-slate-200/70 hover:border-blue-200 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] active:scale-[0.995] cursor-pointer transition-all p-4"
                    style={{ animationDelay: `${Math.min(idx, 10) * 25}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black text-white shrink-0 bg-gradient-to-br ${gradientFor(
                            p.patient?.name,
                          )} shadow-sm`}
                        >
                          {p.patient?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-800 truncate">{p.patient?.name}</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                isAdmitted
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {isAdmitted ? "🏥 Admitted" : "✅ Released"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 font-['IBM_Plex_Mono'] truncate">
                            {p.admissionId} · {p.patient?.age}y · {p.patient?.gender} · {p.patient?.contactNumber}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate">
                            {p.space?.spaceName}
                            {p.space?.bedNumber != null ? ` · Bed ${p.space.bedNumber}` : ""} ·{" "}
                            {p.supervisorDoctor?.name}
                          </div>
                        </div>
                      </div>

                      <svg
                        className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Billed</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800 font-['IBM_Plex_Mono']">
                          {fmt.currency(expTotal)}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            balance > 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {balance > 0 ? `Due ${fmt.currency(balance)}` : "Paid"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPatient;
