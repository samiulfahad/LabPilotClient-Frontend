// React Compiler active — no useCallback/useMemo
import { useState, useEffect, useRef } from "react";
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

// ─── Row ──────────────────────────────────────────────────────────────────────

const PatientRow = ({ patient }) => {
  const navigate = useNavigate();
  const expTotal = totalExpenses(patient.expenses);
  const paid = totalPayments(patient.payments);
  const balance = expTotal - paid;

  const goToDetail = () => navigate(`/ipd/patient/${patient._id}`);

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3.5 cursor-pointer" onClick={goToDetail}>
        <div className="font-semibold text-sm text-slate-800">{patient.patient?.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{patient.admissionId}</div>
        <div className="text-xs text-slate-400">
          {patient.patient?.age}y · {patient.patient?.gender} · {patient.patient?.contactNumber}
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 cursor-pointer" onClick={goToDetail}>
        <div className="font-medium">{patient.space?.spaceName}</div>
        {patient.space?.bedNumber != null && (
          <div className="text-xs text-slate-400">Bed {patient.space.bedNumber}</div>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 hidden md:table-cell cursor-pointer" onClick={goToDetail}>
        {patient.supervisorDoctor?.name}
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell cursor-pointer" onClick={goToDetail}>
        <div className="text-sm font-semibold text-slate-800">{fmt.currency(expTotal)}</div>
        <div className={`text-xs font-medium ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
          {balance > 0 ? `Due: ${fmt.currency(balance)}` : "Paid"}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge color={patient.status === "admitted" ? "blue" : "green"}>
          {patient.status === "admitted" ? "🏥 Admitted" : "✅ Released"}
        </Badge>
      </td>
      <td className="px-4 py-3.5">
        <Btn
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ipd/patient/${patient._id}/reports`);
          }}
        >
          📋 Reports
        </Btn>
      </td>
      <td className="px-4 py-3.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ipd/patient/${patient._id}`);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </td>
    </tr>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: "admitted", label: "Admitted", activeClass: "bg-blue-600 text-white" },
  { value: "released", label: "Released", activeClass: "bg-emerald-600 text-white" },
  { value: "all", label: "All", activeClass: "bg-slate-800 text-white" },
];

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("admitted");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const searchTimer = useRef(null);

  const fetchPatients = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await indoorPatientService.getPatients({ status, search, page, limit: 20 });
      setPatients(res.data.patients ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [status, search, page]);

  const handleSearch = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <PageHeader
          title="Patients"
          subtitle="IPD — Wards, Beds & Billing"
          back={() => navigate("/ipd")}
          action={
            <Btn variant="primary" onClick={() => navigate("/ipd/admit")}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Admit Patient
            </Btn>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  status === f.value ? f.activeClass : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <Input
              className="pl-9"
              placeholder="Search name, ID, phone..."
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-slate-400">
            {total} record{total !== 1 ? "s" : ""}
          </span>
          <Btn variant="ghost" size="sm" onClick={fetchPatients}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </Btn>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Sk key={i} cls="h-16" />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-red-500 font-medium">{error}</p>
              <Btn variant="ghost" size="sm" className="mt-3" onClick={fetchPatients}>
                Retry
              </Btn>
            </div>
          ) : !patients.length ? (
            <EmptyState
              icon="🏥"
              title="No patients found"
              subtitle={search ? `No records match "${search}"` : `No ${status === "all" ? "" : status} patients`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    {[
                      ["Patient", ""],
                      ["Ward/Bed", ""],
                      ["Doctor", "hidden md:table-cell"],
                      ["Billing", "hidden sm:table-cell"],
                      ["Status", ""],
                      ["Reports", ""],
                      ["", "w-12"],
                    ].map(([label, cls]) => (
                      <th
                        key={label}
                        className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${cls}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <PatientRow key={p._id} patient={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Btn variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Prev
            </Btn>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <Btn variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
