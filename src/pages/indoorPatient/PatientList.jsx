// React Compiler active — no useCallback/useMemo
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import { Badge, Btn, EmptyState, ErrorMsg, EXPENSE_TYPES, Field, Input, Modal, PageHeader, Select, Sk, fmt, totalExpenses, totalPayments, days } from "./indoorPatientHelpers";

// ─── Add Expense Modal ────────────────────────────────────────────────────────

const AddExpenseModal = ({ open, patientId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ type: "medicine", name: "", price: "", quantity: "1", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    setError("");
    if (!form.name.trim()) return setError("Item name required");
    if (!form.price)       return setError("Price required");
    setLoading(true);
    try {
      await indoorPatientService.addExpense(patientId, {
        type: form.type, name: form.name.trim(),
        price: parseFloat(form.price), quantity: parseInt(form.quantity) || 1, note: form.note.trim(),
      });
      setForm({ type: "medicine", name: "", price: "", quantity: "1", note: "" });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" width="max-w-lg">
      <div className="space-y-3">
        <ErrorMsg msg={error} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {EXPENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Item Name">
            <Input placeholder="Medicine / Test name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Unit Price (BDT)">
            <Input type="number" min="0" placeholder="0.00" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="Quantity">
            <Input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
          </Field>
        </div>
        <Field label="Note (optional)">
          <Input placeholder="e.g. morning dose" value={form.note} onChange={(e) => set("note", e.target.value)} />
        </Field>
        <div className="flex gap-3 pt-1">
          <Btn variant="secondary" size="lg" className="flex-1" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" size="lg" className="flex-1" loading={loading} onClick={handleAdd}>Add Expense</Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── Collect Payment Modal ────────────────────────────────────────────────────

const CollectPaymentModal = ({ open, patientId, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleAdd = async () => {
    setError("");
    if (!amount || parseFloat(amount) <= 0) return setError("Valid amount required");
    setLoading(true);
    try {
      await indoorPatientService.addPayment(patientId, { amount: parseFloat(amount), note: note.trim() });
      setAmount(""); setNote("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Collect Payment" width="max-w-md">
      <div className="space-y-3">
        <ErrorMsg msg={error} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (BDT)">
            <Input type="number" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Note (optional)">
            <Input placeholder="Cash / bKash / etc." value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-3 pt-1">
          <Btn variant="secondary" size="lg" className="flex-1" onClick={onClose}>Cancel</Btn>
          <Btn variant="success" size="lg" className="flex-1" loading={loading} onClick={handleAdd}>Record Payment</Btn>
        </div>
      </div>
    </Modal>
  );
};



const PatientRow = ({ patient, onAddExpense, onCollectPayment }) => {
  const navigate = useNavigate();
  const paid     = totalPayments(patient.payments);
  const expTotal = totalExpenses(patient.expenses);
  const balance  = expTotal - paid;
  const d        = days(patient.admittedAt, patient.releasedAt);
  const isAdmitted = patient.status === "admitted";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3.5 cursor-pointer" onClick={() => navigate(`/ipd/patient/${patient._id}`)}>
        <div className="font-semibold text-sm text-slate-800">{patient.patient?.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{patient.admissionId}</div>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 cursor-pointer" onClick={() => navigate(`/ipd/patient/${patient._id}`)}>
        <div>{patient.patient?.age}y · {patient.patient?.gender}</div>
        <div className="text-xs text-slate-400">{patient.patient?.contactNumber}</div>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 cursor-pointer" onClick={() => navigate(`/ipd/patient/${patient._id}`)}>
        <div className="font-medium">{patient.space?.spaceName}</div>
        {patient.space?.bedNumber != null && (
          <div className="text-xs text-slate-400">Bed {patient.space.bedNumber}</div>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 hidden md:table-cell cursor-pointer" onClick={() => navigate(`/ipd/patient/${patient._id}`)}>
        {patient.supervisorDoctor?.name}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 hidden lg:table-cell cursor-pointer" onClick={() => navigate(`/ipd/patient/${patient._id}`)}>
        {fmt.date(patient.admittedAt)}
        <div className="text-xs text-slate-400">{d} day{d !== 1 ? "s" : ""}</div>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell cursor-pointer" onClick={() => navigate(`/ipd/patient/${patient._id}`)}>
        <div className="text-sm font-semibold text-slate-800">{fmt.currency(expTotal)}</div>
        <div className={`text-xs font-medium ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
          {balance > 0 ? `Due: ${fmt.currency(balance)}` : "Paid"}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge color={isAdmitted ? "blue" : "green"}>
          {isAdmitted ? "🏥 Admitted" : "✅ Released"}
        </Badge>
      </td>
      {isAdmitted && (
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <Btn size="sm" variant="secondary" onClick={() => onAddExpense(patient._id)}>➕ Expense</Btn>
            <Btn size="sm" variant="success" onClick={() => onCollectPayment(patient._id)}>💳 Payment</Btn>
          </div>
        </td>
      )}
      {!isAdmitted && <td className="px-4 py-3.5" />}
    </tr>
  );
};

const FILTERS = [
  { value: "admitted", label: "Admitted" },
  { value: "released", label: "Released" },
  { value: "all",      label: "All"      },
];

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [status, setStatus]         = useState("admitted");
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const searchTimer                 = useRef(null);
  const [activePatientId, setActivePatientId] = useState(null);
  const [showAddExpense, setShowAddExpense]    = useState(false);
  const [showCollectPayment, setShowCollectPayment] = useState(false);

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

  useEffect(() => { fetchPatients(); }, [status, search, page]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const handleFilterChange = (val) => { setStatus(val); setPage(1); };

  const openAddExpense = (id) => { setActivePatientId(id); setShowAddExpense(true); };
  const openCollectPayment = (id) => { setActivePatientId(id); setShowCollectPayment(true); };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <PageHeader
          title="Patients"
          subtitle="IPD — Wards, Beds & Billing"
          back={() => navigate("/ipd")}
          action={
            <Btn variant="primary" size="md" onClick={() => navigate("/ipd/admit")}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Admit Patient
            </Btn>
          }
        />

        {/* Filters row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Status toggle */}
          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  status === f.value
                    ? f.value === "admitted" ? "bg-blue-600 text-white shadow-sm"
                    : f.value === "released" ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <Input
              className="pl-9"
              placeholder="Search name, ID, phone..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
          </div>

          {/* Count + Refresh */}
          <span className="text-xs text-slate-400 font-medium">{total} record{total !== 1 ? "s" : ""}</span>
          <Btn variant="ghost" size="sm" onClick={fetchPatients}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Btn>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map((i) => <Sk key={i} cls="h-16" />)}
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="text-red-500 font-medium">{error}</div>
              <Btn variant="ghost" size="sm" className="mt-3" onClick={fetchPatients}>Retry</Btn>
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
                      { label: "Patient",    cls: "" },
                      { label: "Age/Gender", cls: "" },
                      { label: "Ward/Bed",   cls: "" },
                      { label: "Doctor",     cls: "hidden md:table-cell" },
                      { label: "Admitted",   cls: "hidden lg:table-cell" },
                      { label: "Billing",    cls: "hidden sm:table-cell" },
                      { label: "Status",     cls: "" },
                      { label: "Actions",    cls: "" },
                    ].map(({ label, cls }) => (
                      <th key={label} className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${cls}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => <PatientRow key={p._id} patient={p} onAddExpense={openAddExpense} onCollectPayment={openCollectPayment} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Btn variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</Btn>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <Btn variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Btn>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpense}
        patientId={activePatientId}
        onClose={() => { setShowAddExpense(false); setActivePatientId(null); }}
        onSuccess={fetchPatients}
      />

      {/* Collect Payment Modal */}
      <CollectPaymentModal
        open={showCollectPayment}
        patientId={activePatientId}
        onClose={() => { setShowCollectPayment(false); setActivePatientId(null); }}
        onSuccess={fetchPatients}
      />
    </div>
  );
};

export default PatientList;