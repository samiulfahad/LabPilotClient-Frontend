// React Compiler active — no useCallback/useMemo
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import BedChargeSection, { calcBedAccrual } from "./BedChargeSection";
import {
  BLOOD_GROUPS,
  Badge,
  BedSelector,
  Btn,
  ErrorMsg,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  Sk,
  fmt,
  totalExpenses,
  totalPayments,
} from "./indoorPatientHelpers";

// ─── Collect Payment Modal ────────────────────────────────────────────────────

const CollectPaymentModal = ({ open, patientId, onClose, onSuccess, isExtra = false, defaultAmount = "" }) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
      setNote("");
      setError("");
    }
  }, [open, defaultAmount]);

  const handleAdd = async () => {
    setError("");
    if (!amount || parseFloat(amount) <= 0) return setError("Valid amount required");
    if (isExtra && !note.trim()) return setError("A note is required for extra payments");
    setLoading(true);
    try {
      await indoorPatientService.addPayment(patientId, { amount: parseFloat(amount), note: note.trim() });
      setAmount("");
      setNote("");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isExtra ? "Collect Extra Payment" : "Collect Payment"} width="max-w-md">
      <div className="space-y-3">
        {isExtra && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
            <span className="mt-0.5">ℹ️</span>
            <span>This patient has already paid in full. Recording an additional payment.</span>
          </div>
        )}
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
          <Field label={isExtra ? "Note (required)" : "Note (optional)"}>
            <Input
              placeholder={isExtra ? "Reason for extra payment…" : "Cash / bKash / etc."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex gap-3 pt-1">
          <Btn variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant={isExtra ? "primary" : "success"}
            size="lg"
            className="flex-1"
            loading={loading}
            onClick={handleAdd}
          >
            {isExtra ? "Record Extra Payment" : "Record Payment"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "billing", label: "Billing" },
];

// ─── Bill breakdown ───────────────────────────────────────────────────────────

function calcBillBreakdown(patient) {
  const expenses = patient.expenses ?? [];
  const testBill = expenses.filter((e) => e.type === "test").reduce((s, e) => s + (e.total ?? e.price * e.quantity), 0);
  const medicineBill = expenses
    .filter((e) => e.type === "medicine")
    .reduce((s, e) => s + (e.total ?? e.price * e.quantity), 0);
  const otherBill = expenses
    .filter((e) => ["product", "service", "other"].includes(e.type))
    .reduce((s, e) => s + (e.total ?? e.price * e.quantity), 0);
  const bedBill = patient.dealType === "regular" ? calcBedAccrual(patient).total : 0;
  return { testBill, medicineBill, otherBill, bedBill, total: testBill + medicineBill + otherBill + bedBill };
}

function getBillingSummary(patient) {
  const { total: breakdownTotal } = calcBillBreakdown(patient);
  const paid = totalPayments(patient.payments);
  const total = patient.dealType === "package" ? (patient.packageDeal?.totalAmount ?? 0) : breakdownTotal;
  return { total, paid, due: total - paid };
}

// ─── Bill Summary Strip ───────────────────────────────────────────────────────

function BillSummaryStrip({ patient }) {
  const { testBill, medicineBill, otherBill, bedBill } = calcBillBreakdown(patient);
  const items = [
    { label: "Test Bill", value: testBill, icon: "🧪", color: "text-violet-700" },
    { label: "Medicine Bill", value: medicineBill, icon: "💊", color: "text-blue-700" },
    { label: "Other Bill", value: otherBill, icon: "🧾", color: "text-slate-700" },
    { label: "Bed Charge", value: bedBill, icon: "🛏️", color: "text-indigo-700" },
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {items.map(({ label, value, icon, color }) => (
          <div key={label} className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{icon}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <p className={`text-lg font-black ${color}`}>{fmt.currency(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Patient Detail Page ──────────────────────────────────────────────────────

const PatientDetails = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [spaces, setSpaces] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [editInfo, setEditInfo] = useState(false);
  const [transferWard, setTransferWard] = useState(false);
  const [changeDoc, setChangeDoc] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(false);
  const [showCollectPayment, setShowCollectPayment] = useState(false);
  const [showExtraPayment, setShowExtraPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [txForm, setTxForm] = useState({ spaceId: "", bedNumber: null, note: "" });
  const [docForm, setDocForm] = useState({ doctorId: "", note: "" });
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
    indoorPatientService
      .getRequiredData()
      .then((res) => {
        setSpaces(res.data.spaces ?? []);
        setDoctors(res.data.doctors ?? []);
      })
      .catch(() => {});
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
      navigate("/ipd/patients");
    } catch (err) {
      setActionError(err?.response?.data?.error ?? "Failed to release");
      setActionLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50/50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-40 h-5 bg-slate-200 rounded animate-pulse" />
              <div className="w-24 h-3.5 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Sk key={i} cls="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-full bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold text-slate-500">Patient not found</p>
          <Btn variant="ghost" size="sm" className="mt-3" onClick={() => navigate("/ipd")}>
            Back to IPD
          </Btn>
        </div>
      </div>
    );
  }

  const isAdmitted = patient.status === "admitted";
  const { total, paid, due } = getBillingSummary(patient);
  const { testBill, medicineBill, otherBill, bedBill } = calcBillBreakdown(patient);
  const isPackageFullyPaid = patient.dealType === "package" && due <= 0;
  const extraPaid = patient.dealType === "package" ? Math.max(0, paid - total) : 0;
  const collectDefaultAmount = due > 0 ? String(Math.ceil(due)) : "";
  const txSelectedSpace = spaces.find((s) => s._id === txForm.spaceId) ?? null;

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <PageHeader
          title={patient.patient.name}
          subtitle={`${patient.admissionId} · ${patient.patient.age}y · ${patient.patient.gender}${patient.patient.bloodGroup ? ` · ${patient.patient.bloodGroup}` : ""}`}
          back={() => navigate(-1)}
          action={
            isAdmitted && (
              <div className="flex items-center gap-2 flex-wrap">
                <Btn variant="primary" size="sm" onClick={() => navigate(`/ipd/add-items?patientId=${patientId}`)}>
                  ➕ Add Expenses
                </Btn>
                {due > 0 && (
                  <Btn variant="success" size="sm" onClick={() => setShowCollectPayment(true)}>
                    💳 Collect Payment
                  </Btn>
                )}
                {isPackageFullyPaid && (
                  <Btn variant="secondary" size="sm" onClick={() => setShowExtraPayment(true)}>
                    ➕ Collect Extra
                  </Btn>
                )}
                <Btn variant="danger" size="sm" onClick={() => setReleaseConfirm(true)}>
                  Discharge
                </Btn>
              </div>
            )
          }
        />

        {/* Status strip */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Badge color={isAdmitted ? "blue" : "green"}>{isAdmitted ? "🏥 Admitted" : "✅ Released"}</Badge>
          {patient.dealType === "package" && <Badge color="purple">📦 Package Deal</Badge>}
          {isPackageFullyPaid && <Badge color="green">✅ Fully Paid</Badge>}
          <span className="text-xs text-slate-400 ml-1">Since {fmt.date(patient.admittedAt)}</span>
        </div>

        <ErrorMsg msg={actionError} />

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl mb-5 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-max py-1.5 px-3 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === t.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
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
                      <Input value={editForm.contactNumber} onChange={(e) => setEF("contactNumber", e.target.value)} />
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

            <div className="grid grid-cols-2 gap-4">
              <SectionCard
                title="Ward / Bed"
                icon="🛏️"
                action={
                  isAdmitted && (
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
                  isAdmitted && (
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
              <div className="space-y-3">
                {patient.dealType === "regular" && (
                  <div className="space-y-1.5 text-sm pb-3 border-b border-slate-100">
                    {[
                      ["Test bill", testBill],
                      ["Medicine bill", medicineBill],
                      ["Other bill", otherBill],
                      ["Bed charges (accrued)", bedBill],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-slate-500">
                        <span>{label}</span>
                        <span>{fmt.currency(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {patient.dealType === "package" && (
                  <div className="space-y-1.5 text-sm pb-3 border-b border-slate-100">
                    <div className="flex justify-between text-slate-500">
                      <span>Package: {patient.packageDeal?.description}</span>
                      <span>{fmt.currency(patient.packageDeal?.totalAmount ?? 0)}</span>
                    </div>
                    {extraPaid > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Extra collected</span>
                        <span className="text-amber-600">+{fmt.currency(extraPaid)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Bill", value: fmt.currency(total), color: "text-slate-800" },
                    { label: "Paid", value: fmt.currency(paid), color: "text-emerald-700" },
                    {
                      label: isPackageFullyPaid ? "Status" : "Due",
                      value: isPackageFullyPaid ? "Fully Paid ✅" : fmt.currency(Math.max(0, due)),
                      color: isPackageFullyPaid ? "text-emerald-600" : due > 0 ? "text-red-600" : "text-emerald-600",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-lg font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>

                {isAdmitted && (
                  <div className="flex gap-2 pt-1">
                    {due > 0 && (
                      <Btn variant="success" size="sm" className="flex-1" onClick={() => setShowCollectPayment(true)}>
                        💳 Collect {fmt.currency(due)}
                      </Btn>
                    )}
                    {isPackageFullyPaid && (
                      <Btn variant="secondary" size="sm" className="flex-1" onClick={() => setShowExtraPayment(true)}>
                        ➕ Collect Extra
                      </Btn>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Ward Transfer History */}
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
                        <span className="font-medium text-blue-800">{h.toSpaceName ?? "Discharged"}</span>
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

            {/* Doctor Change History */}
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

        {/* ── Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            {patient.dealType === "regular" && (
              <>
                <BillSummaryStrip patient={patient} />
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  {[
                    { label: "Total Bill", value: fmt.currency(total), color: "text-slate-800" },
                    { label: "Collected", value: fmt.currency(paid), color: "text-emerald-700" },
                    {
                      label: "Due",
                      value: fmt.currency(Math.max(0, due)),
                      color: due > 0 ? "text-red-600" : "text-emerald-700",
                    },
                  ].map(({ label, value, color }, i, arr) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between px-5 py-3 ${i < arr.length - 1 ? "border-b border-slate-100" : ""}`}
                    >
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                      <span className={`text-base font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <BedChargeSection patient={patient} onSuccess={fetchPatient} />
              </>
            )}

            {patient.dealType === "package" && (
              <SectionCard title="Package Deal" icon="📦">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">{patient.packageDeal?.description}</div>
                    <div className="text-xl font-bold text-slate-800">
                      {fmt.currency(patient.packageDeal?.totalAmount ?? 0)}
                    </div>
                  </div>
                  {isPackageFullyPaid ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-lg">✅</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-emerald-700">Package Fully Paid</p>
                        <p className="text-xs text-emerald-600">
                          {fmt.currency(paid)} collected{extraPaid > 0 && ` · ${fmt.currency(extraPaid)} extra`}
                        </p>
                      </div>
                      {isAdmitted && (
                        <Btn variant="secondary" size="sm" onClick={() => setShowExtraPayment(true)}>
                          ➕ Collect Extra
                        </Btn>
                      )}
                    </div>
                  ) : (
                    due > 0 &&
                    isAdmitted && (
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                        <span className="text-lg">⚠️</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-700">{fmt.currency(due)} remaining</p>
                          <p className="text-xs text-red-500">Out of {fmt.currency(total)} package amount</p>
                        </div>
                        <Btn variant="success" size="sm" onClick={() => setShowCollectPayment(true)}>
                          💳 Collect
                        </Btn>
                      </div>
                    )
                  )}
                </div>
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

            <SectionCard title={`Payment History (${patient.payments?.length ?? 0})`} icon="🏦">
              {!patient.payments?.length ? (
                <p className="text-slate-400 text-sm text-center py-4">No payments recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    let runningTotal = 0;
                    return patient.payments.map((p, i) => {
                      runningTotal += p.amount;
                      const isExtraPayment = patient.dealType === "package" && runningTotal > total && p.note;
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            isExtraPayment ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
                          }`}
                        >
                          <div>
                            <div
                              className={`text-sm font-semibold ${isExtraPayment ? "text-amber-800" : "text-emerald-800"}`}
                            >
                              {fmt.currency(p.amount)}
                              {isExtraPayment && <span className="ml-2 text-xs font-normal text-amber-600">extra</span>}
                            </div>
                            <div className={`text-xs mt-0.5 ${isExtraPayment ? "text-amber-600" : "text-emerald-600"}`}>
                              {p.collectedBy?.name} · {fmt.datetime(p.collectedAt)}
                              {p.note && ` · ${p.note}`}
                            </div>
                          </div>
                          <Badge color={isExtraPayment ? "amber" : "green"}>
                            {isExtraPayment ? "Extra" : "Collected"}
                          </Badge>
                        </div>
                      );
                    });
                  })()}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold">
                    <span className="text-slate-600">Total Collected</span>
                    <span className="text-emerald-700">{fmt.currency(totalPayments(patient.payments))}</span>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <CollectPaymentModal
        open={showCollectPayment}
        patientId={patientId}
        defaultAmount={collectDefaultAmount}
        onClose={() => setShowCollectPayment(false)}
        onSuccess={fetchPatient}
      />
      <CollectPaymentModal
        open={showExtraPayment}
        patientId={patientId}
        isExtra={true}
        defaultAmount=""
        onClose={() => setShowExtraPayment(false)}
        onSuccess={fetchPatient}
      />

      <Modal open={releaseConfirm} onClose={() => setReleaseConfirm(false)} title="Confirm Discharge" width="max-w-md">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 mx-auto">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800 mb-1">Discharge {patient.patient.name}?</h3>
            <p className="text-sm text-slate-500">
              This will release the patient and free up{" "}
              <span className="font-semibold text-slate-700">{patient.space.spaceName}</span>
              {patient.space.bedNumber != null && <> · Bed {patient.space.bedNumber}</>}. This action cannot be undone.
            </p>
          </div>
          {due > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <span>⚠️</span>
              <span>{fmt.currency(due)} is still outstanding.</span>
            </div>
          )}
          <ErrorMsg msg={actionError} />
          <div className="flex gap-3 pt-1">
            <Btn variant="secondary" size="lg" className="flex-1" onClick={() => setReleaseConfirm(false)}>
              Cancel
            </Btn>
            <Btn variant="danger" size="lg" className="flex-1" loading={actionLoading} onClick={handleRelease}>
              Confirm Discharge
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientDetails;
