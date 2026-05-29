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

const SearchPatient = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
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
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val) => {
    setQuery(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 400);
  };

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <PageHeader
          title="Search Patient"
          subtitle="Find by name, admission ID or phone"
          back={() => navigate("/ipd")}
        />

        {/* Search input */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Type name, admission ID or phone number..."
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {loading && (
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {!searched && !loading ? (
            <EmptyState icon="🔍" title="Start typing to search" subtitle="Results will appear as you type" />
          ) : loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Sk key={i} cls="h-20" />
              ))}
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-500 font-medium">{error}</div>
          ) : !results.length ? (
            <EmptyState icon="😶" title="No results found" subtitle={`No patients match "${query}"`} />
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((p) => {
                const paid = totalPayments(p.payments);
                const expTotal = totalExpenses(p.expenses);
                const balance = expTotal - paid;
                return (
                  <div
                    key={p._id}
                    className="flex items-center justify-between px-5 py-4 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/ipd/patient/${p._id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                          p.status === "admitted" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {p.patient?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800">{p.patient?.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {p.admissionId} · {p.patient?.age}y · {p.patient?.gender} · {p.patient?.contactNumber}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {p.space?.spaceName}
                          {p.space?.bedNumber != null ? ` · Bed ${p.space.bedNumber}` : ""} · {p.supervisorDoctor?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-slate-800">{fmt.currency(expTotal)}</div>
                        <div className={`text-xs font-medium ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                          {balance > 0 ? `Due: ${fmt.currency(balance)}` : "Paid"}
                        </div>
                      </div>
                      <Badge color={p.status === "admitted" ? "blue" : "green"}>
                        {p.status === "admitted" ? "🏥 Admitted" : "✅ Released"}
                      </Badge>
                      <svg
                        className="w-4 h-4 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPatient;
