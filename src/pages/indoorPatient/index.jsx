import { useState, useEffect, useRef } from "react";
import indoorPatientService from "../../api/indoorPatient"; // adjust path as needed

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EXPENSE_TYPES = [
  { value: "medicine", label: "Medicine" },
  { value: "test", label: "Lab/Test" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];


// ─── Formatting ───────────────────────────────────────────────────────────────

const fmt = {
  currency: (n) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(n ?? 0),
  date: (ts) =>
    ts ? new Date(ts).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  datetime: (ts) =>
    ts
      ? new Date(ts).toLocaleString("en-BD", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const totalExpenses = (expenses = []) => expenses.reduce((s, e) => s + (e.price ?? 0) * (e.quantity ?? 1), 0);

const totalPayments = (payments = []) => payments.reduce((s, p) => s + (p.amount ?? 0), 0);

const days = (admittedAt, releasedAt) => {
  const end = releasedAt ?? Date.now();
  return Math.max(1, Math.ceil((end - admittedAt) / (1000 * 60 * 60 * 24)));
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

const Sk = ({ cls = "" }) => <div className={`animate-pulse rounded bg-slate-200 ${cls}`} />;

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${colors[color]}`}
    >
      {children}
    </span>
  );
};

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all ${props.className ?? ""}`}
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all ${props.className ?? ""}`}
  >
    {children}
  </select>
);

const Textarea = ({ ...props }) => (
  <textarea
    {...props}
    rows={props.rows ?? 3}
    className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none ${props.className ?? ""}`}
  />
);

const Btn = ({ children, variant = "primary", size = "md", loading, ...props }) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200",
    ghost: "hover:bg-slate-100 text-slate-600",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
  };
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-sm px-5 py-3",
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${props.className ?? ""}`}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
};

const Modal = ({ open, onClose, title, children, width = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${width} my-6 bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, icon, children, action }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const ErrorMsg = ({ msg }) =>
  msg ? (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {msg}
    </div>
  ) : null;

// ─── Bed Selector ─────────────────────────────────────────────────────────────

const BedSelector = ({ space, value, onChange }) => {
  if (!space || !space.multiBed || !space.multiBedConf) return null;
  const { totalNumberOfBed, bedStartingNumber, booked = [], reserved = [] } = space.multiBedConf;
  const beds = Array.from({ length: totalNumberOfBed }, (_, i) => bedStartingNumber + i);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Bed</p>
      <div className="flex flex-wrap gap-2">
        {beds.map((bed) => {
          const isBooked = booked.includes(bed);
          const isReserved = reserved.some((r) => r.bedNumber === bed);
          const isSelected = value === bed;
          const isAvailable = !isBooked && !isReserved;
          return (
            <button
              key={bed}
              type="button"
              disabled={!isAvailable}
              onClick={() => onChange(isSelected ? null : bed)}
              className={`w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all ${
                isBooked
                  ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                  : isReserved
                    ? "bg-amber-50 border-amber-200 text-amber-400 cursor-not-allowed"
                    : isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              {bed}
            </button>
          );
        })}
      </div>
      <div className="flex gap-4 mt-2">
        {[
          { color: "bg-white border-slate-200", label: "Available" },
          { color: "bg-red-50 border-red-200", label: "Occupied" },
          { color: "bg-amber-50 border-amber-200", label: "Reserved" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${item.color}`} />
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Admit Form ───────────────────────────────────────────────────────────────

const ADMIT_DEFAULTS = {
  name: "",
  age: "",
  gender: "male",
  bloodGroup: "",
  contactNumber: "",
  address: "",
  guardianName: "",
  guardianRelation: "",
  guardianContact: "",
  description: "",
  medicalHistory: "",
  spaceId: "",
  bedNumber: null,
  doctorId: "",
  referrerId: "",
  referrerName: "",
  referrerType: "",
  useDoctorAsReferrer: true,
  dealType: "regular",
  packageDescription: "",
  packageAmount: "",
};

const AdmitForm = ({ spaces, doctors, referrers, onSuccess, onClose }) => {
  const [form, setForm] = useState(ADMIT_DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const selectedSpace = spaces.find((s) => s._id === form.spaceId) ?? null;

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Patient name is required");
    if (!form.age) return setError("Age is required");
    if (!form.contactNumber) return setError("Contact number is required");
    if (!form.spaceId) return setError("Please select a ward/space");
    if (selectedSpace?.multiBed && form.bedNumber == null) return setError("Please select a bed");
    if (!form.doctorId) return setError("Please select a supervisor doctor");
    if (form.dealType === "package" && !form.packageAmount) return setError("Package amount is required");

    let referrerId = null;
    let referrerName = null;
    let referrerType = null;

    if (form.useDoctorAsReferrer) {
      const doc = doctors.find((d) => d._id === form.doctorId);
      referrerName = doc?.name ?? null;
      referrerType = "doctor";
    } else if (form.referrerId) {
      referrerId = form.referrerId;
      const ref = referrers.find((r) => r._id === form.referrerId);
      referrerName = ref?.name ?? form.referrerName;
      referrerType = ref?.type ?? form.referrerType;
    }

    const payload = {
      patient: {
        name: form.name.trim(),
        age: parseInt(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        contactNumber: form.contactNumber.trim(),
        address: form.address.trim(),
        guardian: {
          name: form.guardianName.trim(),
          relation: form.guardianRelation.trim(),
          contactNumber: form.guardianContact.trim(),
        },
      },
      spaceId: form.spaceId,
      bedNumber: selectedSpace?.multiBed ? form.bedNumber : null,
      doctorId: form.doctorId,
      referrerId,
      referrerName,
      referrerType,
      disease: {
        description: form.description.trim(),
        medicalHistory: form.medicalHistory.trim(),
      },
      dealType: form.dealType,
      packageDeal:
        form.dealType === "package"
          ? { description: form.packageDescription.trim(), totalAmount: parseFloat(form.packageAmount) }
          : undefined,
    };

    setLoading(true);
    try {
      await indoorPatientService.admit(payload);
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to admit patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ErrorMsg msg={error} />

      {/* Patient Info */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Information</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" required>
            <Input placeholder="Patient full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Age" required>
            <Input
              type="number"
              min="0"
              max="150"
              placeholder="Age in years"
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </Field>
          <Field label="Gender" required>
            <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Blood Group">
            <Select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
              <option value="">— Select —</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Contact Number" required>
            <Input
              placeholder="01XXXXXXXXX"
              value={form.contactNumber}
              onChange={(e) => set("contactNumber", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <Input placeholder="Home address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Guardian */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Guardian Information</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Guardian Name">
            <Input
              placeholder="Full name"
              value={form.guardianName}
              onChange={(e) => set("guardianName", e.target.value)}
            />
          </Field>
          <Field label="Relation">
            <Input
              placeholder="Father / Mother / Spouse..."
              value={form.guardianRelation}
              onChange={(e) => set("guardianRelation", e.target.value)}
            />
          </Field>
          <Field label="Contact Number">
            <Input
              placeholder="01XXXXXXXXX"
              value={form.guardianContact}
              onChange={(e) => set("guardianContact", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Disease */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Information</p>
        <div className="space-y-3">
          <Field label="Disease / Diagnosis Description">
            <Textarea
              placeholder="Brief description of illness or diagnosis..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Medical History">
            <Textarea
              rows={4}
              placeholder="Past medical history, allergies, previous surgeries..."
              value={form.medicalHistory}
              onChange={(e) => set("medicalHistory", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Ward / Space */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ward / Bed Assignment</p>
        <Field label="Select Ward/Cabin/ICU" required>
          <Select
            value={form.spaceId}
            onChange={(e) => {
              set("spaceId", e.target.value);
              set("bedNumber", null);
            }}
          >
            <option value="">— Select Space —</option>
            {spaces.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — ৳{s.chargePerDay}/day
                {s.multiBed
                  ? ` (${s.multiBedConf?.totalNumberOfBed} beds)`
                  : s.reserved
                    ? " — Occupied"
                    : " — Available"}
              </option>
            ))}
          </Select>
        </Field>
        {selectedSpace && (
          <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <BedSelector space={selectedSpace} value={form.bedNumber} onChange={(bed) => set("bedNumber", bed)} />
            {!selectedSpace.multiBed && (
              <div className="text-sm text-slate-600">
                Single-bed space —{" "}
                {selectedSpace.reserved ? (
                  <span className="text-red-600 font-medium">Currently occupied</span>
                ) : (
                  <span className="text-emerald-600 font-medium">Available</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Doctor */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Medical Team</p>
        <Field label="Supervisor Doctor" required>
          <Select value={form.doctorId} onChange={(e) => set("doctorId", e.target.value)}>
            <option value="">— Select Doctor —</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
                {d.degree ? ` (${d.degree})` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => set("useDoctorAsReferrer", !form.useDoctorAsReferrer)}
              className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors ${form.useDoctorAsReferrer ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.useDoctorAsReferrer ? "translate-x-[18px]" : "translate-x-0"}`}
              />
            </div>
            <span className="text-sm text-slate-700">Use supervisor doctor as referrer</span>
          </label>

          {!form.useDoctorAsReferrer && (
            <Field label="Referrer">
              <Select value={form.referrerId} onChange={(e) => set("referrerId", e.target.value)}>
                <option value="">— No Referrer —</option>
                {referrers.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      </div>

      {/* Deal Type */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Billing Type</p>
        <div className="flex gap-3">
          {["regular", "package"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set("dealType", type)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                form.dealType === type
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {type === "regular" ? "🔢 Regular (Per Day)" : "📦 Package Deal"}
            </button>
          ))}
        </div>

        {form.dealType === "package" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Package Description">
              <Input
                placeholder="e.g. Full operation package"
                value={form.packageDescription}
                onChange={(e) => set("packageDescription", e.target.value)}
              />
            </Field>
            <Field label="Total Package Amount (BDT)" required>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 50000"
                value={form.packageAmount}
                onChange={(e) => set("packageAmount", e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" size="lg" className="flex-1" onClick={onClose}>
          Cancel
        </Btn>
        <Btn variant="primary" size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>
          Admit Patient
        </Btn>
      </div>
    </div>
  );
};

// ─── Patient List ─────────────────────────────────────────────────────────────

const PatientRow = ({ patient, onView }) => {
  const paid = totalPayments(patient.payments);
  const expensesTotal = totalExpenses(patient.expenses);
  const balance = expensesTotal - paid;
  const d = days(patient.admittedAt, patient.releasedAt);

  return (
    <tr
      className="hover:bg-blue-50/30 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
      onClick={() => onView(patient._id)}
    >
      <td className="px-4 py-3.5">
        <div className="font-semibold text-sm text-slate-800">{patient.patient?.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">{patient.admissionId}</div>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">
        <div>
          {patient.patient?.age}y · {patient.patient?.gender}
        </div>
        <div className="text-xs text-slate-400">{patient.patient?.contactNumber}</div>
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">
        <div className="font-medium">{patient.space?.spaceName}</div>
        {patient.space?.bedNumber != null && (
          <div className="text-xs text-slate-400">Bed {patient.space.bedNumber}</div>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600 hidden md:table-cell">{patient.supervisorDoctor?.name}</td>
      <td className="px-4 py-3.5 text-sm text-slate-600 hidden lg:table-cell">
        {fmt.date(patient.admittedAt)}
        <div className="text-xs text-slate-400">
          {d} day{d !== 1 ? "s" : ""}
        </div>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <div className="text-sm font-semibold text-slate-800">{fmt.currency(expensesTotal)}</div>
        <div className={`text-xs font-medium ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
          {balance > 0 ? `Due: ${fmt.currency(balance)}` : "Paid"}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <Badge color={patient.status === "admitted" ? "blue" : "green"}>
          {patient.status === "admitted" ? "🏥 Admitted" : "✅ Released"}
        </Badge>
      </td>
    </tr>
  );
};

// ─── Patient Detail Panel ─────────────────────────────────────────────────────

const AddExpenseForm = ({ patientId, onSuccess }) => {
  const [form, setForm] = useState({ type: "medicine", name: "", price: "", quantity: "1", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    setError("");
    if (!form.name.trim()) return setError("Item name required");
    if (!form.price) return setError("Price required");
    setLoading(true);
    try {
      await indoorPatientService.addExpense(patientId, {
        type: form.type,
        name: form.name.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 1,
        note: form.note.trim(),
      });
      setForm({ type: "medicine", name: "", price: "", quantity: "1", note: "" });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <ErrorMsg msg={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
            {EXPENSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Item Name">
          <Input placeholder="Medicine / Test name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Unit Price (BDT)">
          <Input
            type="number"
            min="0"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>
        <Field label="Quantity">
          <Input type="number" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
        </Field>
      </div>
      <Field label="Note (optional)">
        <Input placeholder="e.g. morning dose" value={form.note} onChange={(e) => set("note", e.target.value)} />
      </Field>
      <Btn variant="primary" loading={loading} onClick={handleAdd} className="w-full">
        Add Expense
      </Btn>
    </div>
  );
};

const AddPaymentForm = ({ patientId, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    setError("");
    if (!amount || parseFloat(amount) <= 0) return setError("Valid amount required");
    setLoading(true);
    try {
      await indoorPatientService.addPayment(patientId, { amount: parseFloat(amount), note: note.trim() });
      setAmount("");
      setNote("");
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <ErrorMsg msg={error} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (BDT)">
          <Input
            type="number"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Note (optional)">
          <Input placeholder="Cash / bKash / etc." value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <Btn variant="success" loading={loading} onClick={handleAdd} className="w-full">
        Record Payment
      </Btn>
    </div>
  );
};

const PatientDetailModal = ({ patientId, spaces, doctors, referrers, onClose, onRefreshList }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editInfo, setEditInfo] = useState(false);
  const [transferWard, setTransferWard] = useState(false);
  const [changeDoc, setChangeDoc] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Transfer ward form
  const [txForm, setTxForm] = useState({ spaceId: "", bedNumber: null, note: "" });
  // Change doctor form
  const [docForm, setDocForm] = useState({ doctorId: "", note: "" });
  // Edit patient form
  const [editForm, setEditForm] = useState({});

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const res = await indoorPatientService.getPatient(patientId);
      setPatient(res.data);
      const p = res.data.patient;
      setEditForm({
        name: p.name,
        age: p.age,
        gender: p.gender,
        bloodGroup: p.bloodGroup ?? "",
        contactNumber: p.contactNumber,
        address: p.address ?? "",
        guardianName: p.guardian?.name ?? "",
        guardianRelation: p.guardian?.relation ?? "",
        guardianContact: p.guardian?.contactNumber ?? "",
      });
    } catch {
      // silence
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const setEF = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));
  const setTX = (k, v) => setTxForm((f) => ({ ...f, [k]: v }));

  const handleSaveInfo = async () => {
    setActionError("");
    setActionLoading(true);
    try {
      await indoorPatientService.updateInfo(patientId, {
        patient: {
          name: editForm.name.trim(),
          age: parseInt(editForm.age),
          gender: editForm.gender,
          bloodGroup: editForm.bloodGroup || undefined,
          contactNumber: editForm.contactNumber.trim(),
          address: editForm.address?.trim() ?? "",
          guardian: {
            name: editForm.guardianName?.trim() ?? "",
            relation: editForm.guardianRelation?.trim() ?? "",
            contactNumber: editForm.guardianContact?.trim() ?? "",
          },
        },
      });
      setEditInfo(false);
      fetchPatient();
    } catch (err) {
      setActionError(err?.response?.data?.error ?? "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    setActionError("");
    if (!txForm.spaceId) return setActionError("Select a space");
    const sp = spaces.find((s) => s._id === txForm.spaceId);
    if (sp?.multiBed && txForm.bedNumber == null) return setActionError("Select a bed");
    setActionLoading(true);
    try {
      await indoorPatientService.transferWard(patientId, {
        spaceId: txForm.spaceId,
        bedNumber: sp?.multiBed ? txForm.bedNumber : null,
        note: txForm.note.trim(),
      });
      setTransferWard(false);
      setTxForm({ spaceId: "", bedNumber: null, note: "" });
      fetchPatient();
      onRefreshList();
    } catch (err) {
      setActionError(err?.response?.data?.error ?? "Transfer failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeDoc = async () => {
    setActionError("");
    if (!docForm.doctorId) return setActionError("Select a doctor");
    setActionLoading(true);
    try {
      await indoorPatientService.changeDoctor(patientId, { doctorId: docForm.doctorId, note: docForm.note });
      setChangeDoc(false);
      fetchPatient();
    } catch (err) {
      setActionError(err?.response?.data?.error ?? "Failed to change doctor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    setActionLoading(true);
    try {
      await indoorPatientService.release(patientId, {});
      onClose();
      onRefreshList();
    } catch (err) {
      setActionError(err?.response?.data?.error ?? "Failed to release");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "expenses", label: "Expenses" },
    { id: "payments", label: "Payments" },
    { id: "history", label: "History" },
  ];

  const txSelectedSpace = spaces.find((s) => s._id === txForm.spaceId) ?? null;

  return (
    <Modal open onClose={onClose} title="Indoor Patient Record" width="max-w-4xl">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Sk key={i} cls="h-14 rounded-xl" />
          ))}
        </div>
      ) : !patient ? (
        <div className="text-center py-10 text-slate-400">Patient not found</div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{patient.patient.name}</h3>
                <Badge color={patient.status === "admitted" ? "blue" : "green"}>
                  {patient.status === "admitted" ? "🏥 Admitted" : "✅ Released"}
                </Badge>
                {patient.dealType === "package" && <Badge color="purple">📦 Package</Badge>}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {patient.admissionId} · {patient.patient.age}y · {patient.patient.gender}
                {patient.patient.bloodGroup && ` · ${patient.patient.bloodGroup}`}
              </div>
            </div>
            {patient.status === "admitted" && (
              <Btn variant="danger" size="sm" onClick={() => setReleaseConfirm(true)}>
                Discharge Patient
              </Btn>
            )}
          </div>

          {/* Action error */}
          <ErrorMsg msg={actionError} />

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-1.5 px-3 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Patient Info */}
              <SectionCard
                title="Patient Information"
                icon="👤"
                action={
                  <Btn variant="ghost" size="sm" onClick={() => setEditInfo(!editInfo)}>
                    {editInfo ? "Cancel" : "Edit"}
                  </Btn>
                }
              >
                {!editInfo ? (
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    {[
                      ["Name", patient.patient.name],
                      ["Age / Gender", `${patient.patient.age}y / ${patient.patient.gender}`],
                      ["Blood Group", patient.patient.bloodGroup ?? "—"],
                      ["Contact", patient.patient.contactNumber],
                      ["Address", patient.patient.address || "—"],
                      [
                        "Guardian",
                        patient.patient.guardian?.name
                          ? `${patient.patient.guardian.name} (${patient.patient.guardian.relation}) — ${patient.patient.guardian.contactNumber}`
                          : "—",
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="text-xs text-slate-400 uppercase tracking-wide">{k}</span>
                        <div className="font-medium text-slate-700 mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name">
                        <Input value={editForm.name} onChange={(e) => setEF("name", e.target.value)} />
                      </Field>
                      <Field label="Age">
                        <Input type="number" value={editForm.age} onChange={(e) => setEF("age", e.target.value)} />
                      </Field>
                      <Field label="Gender">
                        <Select value={editForm.gender} onChange={(e) => setEF("gender", e.target.value)}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </Select>
                      </Field>
                      <Field label="Blood Group">
                        <Select value={editForm.bloodGroup} onChange={(e) => setEF("bloodGroup", e.target.value)}>
                          <option value="">—</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Contact">
                        <Input
                          value={editForm.contactNumber}
                          onChange={(e) => setEF("contactNumber", e.target.value)}
                        />
                      </Field>
                      <Field label="Address">
                        <Input value={editForm.address} onChange={(e) => setEF("address", e.target.value)} />
                      </Field>
                      <Field label="Guardian Name">
                        <Input value={editForm.guardianName} onChange={(e) => setEF("guardianName", e.target.value)} />
                      </Field>
                      <Field label="Relation">
                        <Input
                          value={editForm.guardianRelation}
                          onChange={(e) => setEF("guardianRelation", e.target.value)}
                        />
                      </Field>
                      <Field label="Guardian Contact">
                        <Input
                          value={editForm.guardianContact}
                          onChange={(e) => setEF("guardianContact", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Btn variant="primary" loading={actionLoading} onClick={handleSaveInfo} className="w-full">
                      Save Changes
                    </Btn>
                  </div>
                )}
              </SectionCard>

              {/* Space + Doctor */}
              <div className="grid grid-cols-2 gap-4">
                <SectionCard
                  title="Ward / Bed"
                  icon="🛏️"
                  action={
                    patient.status === "admitted" && (
                      <Btn variant="ghost" size="sm" onClick={() => setTransferWard(!transferWard)}>
                        {transferWard ? "Cancel" : "Transfer"}
                      </Btn>
                    )
                  }
                >
                  {!transferWard ? (
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold text-slate-800">{patient.space.spaceName}</div>
                      {patient.space.bedNumber != null && (
                        <div className="text-slate-500">Bed #{patient.space.bedNumber}</div>
                      )}
                      <div className="text-slate-500">{fmt.currency(patient.space.chargePerDay)}/day</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Field label="New Space">
                        <Select
                          value={txForm.spaceId}
                          onChange={(e) => {
                            setTX("spaceId", e.target.value);
                            setTX("bedNumber", null);
                          }}
                        >
                          <option value="">— Select —</option>
                          {spaces.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      {txSelectedSpace?.multiBed && (
                        <BedSelector
                          space={txSelectedSpace}
                          value={txForm.bedNumber}
                          onChange={(b) => setTX("bedNumber", b)}
                        />
                      )}
                      <Field label="Note">
                        <Input
                          placeholder="Reason for transfer..."
                          value={txForm.note}
                          onChange={(e) => setTX("note", e.target.value)}
                        />
                      </Field>
                      <Btn variant="primary" loading={actionLoading} onClick={handleTransfer} className="w-full">
                        Confirm Transfer
                      </Btn>
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title="Supervisor Doctor"
                  icon="👨‍⚕️"
                  action={
                    patient.status === "admitted" && (
                      <Btn variant="ghost" size="sm" onClick={() => setChangeDoc(!changeDoc)}>
                        {changeDoc ? "Cancel" : "Change"}
                      </Btn>
                    )
                  }
                >
                  {!changeDoc ? (
                    <div className="space-y-1 text-sm">
                      <div className="font-semibold text-slate-800">{patient.supervisorDoctor.name}</div>
                      {patient.supervisorDoctor.degree && (
                        <div className="text-slate-500">{patient.supervisorDoctor.degree}</div>
                      )}
                      {patient.referrer?.name && (
                        <div className="text-slate-400 text-xs mt-1">Referrer: {patient.referrer.name}</div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Field label="New Doctor">
                        <Select
                          value={docForm.doctorId}
                          onChange={(e) => setDocForm((f) => ({ ...f, doctorId: e.target.value }))}
                        >
                          <option value="">— Select —</option>
                          {doctors.map((d) => (
                            <option key={d._id} value={d._id}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Note">
                        <Input
                          placeholder="Reason..."
                          value={docForm.note}
                          onChange={(e) => setDocForm((f) => ({ ...f, note: e.target.value }))}
                        />
                      </Field>
                      <Btn variant="primary" loading={actionLoading} onClick={handleChangeDoc} className="w-full">
                        Confirm Change
                      </Btn>
                    </div>
                  )}
                </SectionCard>
              </div>

              {/* Disease */}
              <SectionCard title="Clinical Notes" icon="🩺">
                <div className="space-y-3 text-sm">
                  {patient.disease?.description && (
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Diagnosis / Description</div>
                      <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        {patient.disease.description}
                      </p>
                    </div>
                  )}
                  {patient.disease?.medicalHistory && (
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Medical History</div>
                      <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        {patient.disease.medicalHistory}
                      </p>
                    </div>
                  )}
                  {!patient.disease?.description && !patient.disease?.medicalHistory && (
                    <p className="text-slate-400 text-xs">No clinical notes added</p>
                  )}
                </div>
              </SectionCard>

              {/* Deal type */}
              {patient.dealType === "package" && patient.packageDeal && (
                <SectionCard title="Package Deal" icon="📦">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">{patient.packageDeal.description}</div>
                    <div className="text-xl font-bold text-slate-800">
                      {fmt.currency(patient.packageDeal.totalAmount)}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Billing Summary */}
              <SectionCard title="Billing Summary" icon="💰">
                <div className="grid grid-cols-3 gap-3">
                  {(() => {
                    const exp = totalExpenses(patient.expenses);
                    const paid = totalPayments(patient.payments);
                    const d = days(patient.admittedAt, patient.releasedAt);
                    const bedCharge = patient.dealType === "regular" ? patient.space.chargePerDay * d : 0;
                    const total =
                      patient.dealType === "package" ? (patient.packageDeal?.totalAmount ?? 0) : exp + bedCharge;
                    const due = total - paid;
                    return [
                      { label: "Total Bill", value: fmt.currency(total), color: "text-slate-800" },
                      { label: "Paid", value: fmt.currency(paid), color: "text-emerald-700" },
                      {
                        label: "Due",
                        value: fmt.currency(Math.max(0, due)),
                        color: due > 0 ? "text-red-600" : "text-emerald-600",
                      },
                    ];
                  })().map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-lg font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
                {/* Expenses link placeholder */}
                <div className="mt-3">
                  <button className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-xl border border-blue-200 transition-colors">
                    View Full Expense Report →
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-4">
              {patient.status === "admitted" && (
                <SectionCard title="Add Expense" icon="➕">
                  <AddExpenseForm patientId={patientId} onSuccess={fetchPatient} />
                </SectionCard>
              )}
              <SectionCard title={`Expense Log (${patient.expenses?.length ?? 0})`} icon="🧾">
                {!patient.expenses?.length ? (
                  <p className="text-slate-400 text-sm text-center py-4">No expenses recorded yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Type", "Item", "Price", "Qty", "Total", "Date", "By"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-2 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {patient.expenses.map((e, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-2 py-2.5">
                              <Badge color="slate">{e.type}</Badge>
                            </td>
                            <td className="px-2 py-2.5 font-medium text-slate-700">{e.name}</td>
                            <td className="px-2 py-2.5 text-slate-600">{fmt.currency(e.price)}</td>
                            <td className="px-2 py-2.5 text-slate-600">{e.quantity}</td>
                            <td className="px-2 py-2.5 font-semibold text-slate-800">
                              {fmt.currency(e.total ?? e.price * e.quantity)}
                            </td>
                            <td className="px-2 py-2.5 text-slate-400 text-xs">{fmt.date(e.addedAt)}</td>
                            <td className="px-2 py-2.5 text-slate-400 text-xs">{e.addedBy?.name}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200">
                          <td colSpan={4} className="px-2 py-2 text-sm font-bold text-slate-600">
                            Total
                          </td>
                          <td className="px-2 py-2 text-sm font-bold text-slate-900">
                            {fmt.currency(totalExpenses(patient.expenses))}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4">
              {patient.status === "admitted" && (
                <SectionCard title="Collect Payment" icon="💳">
                  <AddPaymentForm patientId={patientId} onSuccess={fetchPatient} />
                </SectionCard>
              )}
              <SectionCard title={`Payment History (${patient.payments?.length ?? 0})`} icon="🏦">
                {!patient.payments?.length ? (
                  <p className="text-slate-400 text-sm text-center py-4">No payments recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {patient.payments.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100"
                      >
                        <div>
                          <div className="text-sm font-semibold text-emerald-800">{fmt.currency(p.amount)}</div>
                          <div className="text-xs text-emerald-600 mt-0.5">
                            {p.collectedBy?.name} · {fmt.datetime(p.collectedAt)}
                            {p.note && ` · ${p.note}`}
                          </div>
                        </div>
                        <Badge color="green">Collected</Badge>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold">
                      <span className="text-slate-600">Total Collected</span>
                      <span className="text-emerald-700">{fmt.currency(totalPayments(patient.payments))}</span>
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <SectionCard title="Ward Transfer History" icon="🔄">
                {!patient.wardHistory?.length ? (
                  <p className="text-slate-400 text-sm text-center py-4">No ward transfers recorded</p>
                ) : (
                  <div className="space-y-3">
                    {patient.wardHistory.map((h, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-blue-800">{h.fromSpaceName}</span>
                          {h.fromBedNumber != null && ` (Bed ${h.fromBedNumber})`}
                          <span className="text-blue-500 mx-2">→</span>
                          <span className="font-medium text-blue-800">{h.toSpaceName}</span>
                          {h.toBedNumber != null && ` (Bed ${h.toBedNumber})`}
                        </div>
                        <div className="text-right text-xs text-blue-500">
                          <div>{fmt.date(h.movedAt)}</div>
                          <div>{h.movedBy?.name}</div>
                          {h.note && <div className="text-blue-400">{h.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Doctor Change History" icon="👨‍⚕️">
                {!patient.doctorHistory?.length ? (
                  <p className="text-slate-400 text-sm text-center py-4">No doctor changes recorded</p>
                ) : (
                  <div className="space-y-3">
                    {patient.doctorHistory.map((h, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 text-sm">
                        <div className="flex-1">
                          <span className="font-medium text-purple-800">{h.previousDoctorName}</span>
                          <span className="text-purple-500 mx-2">→</span>
                          <span className="font-medium text-purple-800">{h.newDoctorName}</span>
                        </div>
                        <div className="text-right text-xs text-purple-500">
                          <div>{fmt.date(h.changedAt)}</div>
                          <div>{h.changedBy?.name}</div>
                          {h.note && <div className="text-purple-400">{h.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}

          {/* Release Confirm */}
          {releaseConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-semibold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Confirm Patient Discharge?
              </div>
              <p className="text-sm text-red-700">
                This will release {patient.patient.name} and free up the assigned bed/ward. This action cannot be
                undone.
              </p>
              <div className="flex gap-3">
                <Btn variant="secondary" onClick={() => setReleaseConfirm(false)} className="flex-1">
                  Cancel
                </Btn>
                <Btn variant="danger" loading={actionLoading} onClick={handleRelease} className="flex-1">
                  Confirm Discharge
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ─── Main IPD Component ───────────────────────────────────────────────────────

const IndoorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("admitted");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requiredData, setRequiredData] = useState({ spaces: [], doctors: [], referrers: [] });
  const [reqLoading, setReqLoading] = useState(true);

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const searchTimer = useRef(null);

  const fetchRequiredData = async () => {
    try {
      const res = await indoorPatientService.getRequiredData();
      setRequiredData(res.data);
    } catch {
      // silence
    } finally {
      setReqLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await indoorPatientService.getPatients({ status: statusFilter, search, page, limit: 20 });
      setPatients(res.data.patients ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequiredData();
  }, []);
  useEffect(() => {
    fetchPatients();
  }, [statusFilter, search, page]);

  const handleSearchInput = (val) => {
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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Indoor Patients</h1>
            <p className="text-sm text-slate-500 mt-0.5">IPD Management — Wards, Beds & Billing</p>
          </div>
          <Btn variant="primary" size="lg" onClick={() => setShowAdmitModal(true)} disabled={reqLoading}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Admit Patient
          </Btn>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: "Admitted",
              value: statusFilter === "admitted" ? total : "—",
              color: "text-blue-700",
              bg: "bg-blue-50 border-blue-200",
            },
            {
              label: "Released",
              value: statusFilter === "released" ? total : "—",
              color: "text-emerald-700",
              bg: "bg-emerald-50 border-emerald-200",
            },
            {
              label: "Available Beds",
              value:
                requiredData.spaces.filter((s) => !s.multiBed && !s.reserved).length +
                requiredData.spaces.reduce(
                  (sum, s) =>
                    sum +
                    (s.multiBed && s.multiBedConf
                      ? Math.max(0, s.multiBedConf.totalNumberOfBed - (s.multiBedConf.booked?.length ?? 0))
                      : 0),
                  0,
                ),
              color: "text-slate-700",
              bg: "bg-white border-slate-200",
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 shadow-sm ${bg}`}>
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
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
              onChange={(e) => handleSearchInput(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {["admitted", "released", "all"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  statusFilter === s ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
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
              <div className="text-red-500 font-medium">{error}</div>
              <Btn variant="ghost" size="sm" className="mt-3" onClick={fetchPatients}>
                Retry
              </Btn>
            </div>
          ) : !patients.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg className="w-12 h-12 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="font-medium">No patients found</p>
              <p className="text-sm mt-1">
                {statusFilter === "admitted" ? "No patients are currently admitted" : "No records match your search"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    {["Patient", "Age/Gender", "Ward/Bed", "Doctor", "Admitted", "Billing", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${i >= 4 && i <= 4 ? "hidden lg:table-cell" : i === 3 ? "hidden md:table-cell" : i === 5 ? "hidden sm:table-cell" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <PatientRow key={p._id} patient={p} onView={setSelectedPatientId} />
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

      {/* Admit Modal */}
      <Modal open={showAdmitModal} onClose={() => setShowAdmitModal(false)} title="Admit New Patient" width="max-w-3xl">
        <AdmitForm
          spaces={requiredData.spaces}
          doctors={requiredData.doctors}
          referrers={requiredData.referrers}
          onSuccess={() => {
            setShowAdmitModal(false);
            fetchPatients();
          }}
          onClose={() => setShowAdmitModal(false)}
        />
      </Modal>

      {/* Patient Detail Modal */}
      {selectedPatientId && (
        <PatientDetailModal
          patientId={selectedPatientId}
          spaces={requiredData.spaces}
          doctors={requiredData.doctors}
          referrers={requiredData.referrers}
          onClose={() => setSelectedPatientId(null)}
          onRefreshList={fetchPatients}
        />
      )}
    </div>
  );
};

export default IndoorPatients;
