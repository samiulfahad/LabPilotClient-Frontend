// React Compiler active — no useCallback/useMemo
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import BillingSummary, { getBillingSummary } from "./BillingSummary";
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
          <div className="px-3 py-2.5 rounded-[3px] bg-amber-50 border-l-2 border-amber-400 text-[13px] text-amber-700">
            This patient has already paid in full. Recording an additional payment.
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
    if (txForm.spaceId === patient.space?.spaceId) return setActionError("Patient is already in this cabin");
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
    if (docForm.doctorId === patient.supervisorDoctor?.doctorId)
      return setActionError("Patient is already under this doctor");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
        <div className="max-w-4xl mx-auto">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto flex items-center justify-center">
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
  const isPackageFullyPaid = patient.dealType === "package" && due <= 0;
  const collectDefaultAmount = due > 0 ? String(Math.ceil(due)) : "";
  const txSelectedSpace = spaces.find((s) => s._id === txForm.spaceId) ?? null;
  const transferableSpaces = spaces.filter((s) => s._id !== patient.space?.spaceId);
  const transferableDoctors = doctors.filter((d) => d._id !== patient.supervisorDoctor?.doctorId);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 font-noto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <PageHeader
          title={patient.patient.name}
          subtitle={`${patient.admissionId} · ${patient.patient.age}y · ${patient.patient.gender}${patient.patient.bloodGroup ? ` · ${patient.patient.bloodGroup}` : ""}`}
          back={() => navigate(-1)}
        />

        {/* Status strip */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Badge color={isAdmitted ? "blue" : "green"}>{isAdmitted ? "Admitted" : "Released"}</Badge>
          {patient.dealType === "package" && <Badge color="purple">Package Deal</Badge>}
          {isPackageFullyPaid && <Badge color="green">Fully Paid</Badge>}
          <span className="text-xs text-slate-400 font-mono ml-1">Since {fmt.date(patient.admittedAt)}</span>
        </div>

        <ErrorMsg msg={actionError} />

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-[8px] mb-5 shadow-sm overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-max py-1.5 px-3 text-sm font-semibold rounded-[6px] transition-all whitespace-nowrap ${
                activeTab === t.id ? "bg-[#0F6E5C] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
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
                <div className="flex items-center gap-1.5">
                  <Btn variant="ghost" size="sm" onClick={() => setEditInfo(!editInfo)}>
                    {editInfo ? "Cancel" : "Edit"}
                  </Btn>
                  {isAdmitted && (
                    <Btn variant="danger" size="sm" onClick={() => setReleaseConfirm(true)}>
                      Discharge
                    </Btn>
                  )}
                </div>
              }
            >
              {!editInfo ? (
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  {[
                    ["Name", patient.patient.name],
                    ["Age / Gender", `${patient.patient.age}y / ${patient.patient.gender}`],
                    ["Blood Group", patient.patient.bloodGroup ?? "—"],
                    ["Contact", patient.patient.contactNumber, true],
                    ["Address", patient.patient.address || "—"],
                    [
                      "Guardian",
                      patient.patient.guardian?.name
                        ? `${patient.patient.guardian.name} (${patient.patient.guardian.relation}) — ${patient.patient.guardian.contactNumber}`
                        : "—",
                    ],
                  ].map(([k, v, mono]) => (
                    <div key={k}>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{k}</span>
                      <div className={`font-medium text-slate-700 mt-0.5 ${mono ? "font-mono text-[13px]" : ""}`}>
                        {v}
                      </div>
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
                  <div className="space-y-2 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-slate-800">{patient.space.spaceName}</span>
                      {patient.space.bedNumber != null && (
                        <span className="font-mono text-[11px] text-slate-400">Bed #{patient.space.bedNumber}</span>
                      )}
                    </div>
                    <div className="font-mono text-[12px] text-[#0F6E5C] font-semibold">
                      {fmt.currency(patient.space.chargePerDay)} / day
                    </div>
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
                        {transferableSpaces.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    {!transferableSpaces.length && (
                      <p className="text-[11px] text-slate-400 italic">No other cabins available to transfer to.</p>
                    )}
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
                  <div className="space-y-1.5 text-sm">
                    <div className="font-semibold text-slate-800">{patient.supervisorDoctor.name}</div>
                    {patient.supervisorDoctor.degree && (
                      <div className="font-mono text-[12px] text-slate-500">{patient.supervisorDoctor.degree}</div>
                    )}
                    {patient.referrer?.name && (
                      <div className="text-[11px] text-slate-400 mt-1">Referrer: {patient.referrer.name}</div>
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
                        {transferableDoctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    {!transferableDoctors.length && (
                      <p className="text-[11px] text-slate-400 italic">No other doctors available to assign.</p>
                    )}
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
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Diagnosis / Description
                    </div>
                    <p className="text-slate-700 bg-slate-50 rounded-[3px] p-3 border border-slate-100">
                      {patient.disease.description}
                    </p>
                  </div>
                )}
                {patient.disease?.medicalHistory && (
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                      Medical History
                    </div>
                    <p className="text-slate-700 bg-slate-50 rounded-[3px] p-3 border border-slate-100">
                      {patient.disease.medicalHistory}
                    </p>
                  </div>
                )}
                {!patient.disease?.description && !patient.disease?.medicalHistory && (
                  <p className="text-slate-400 text-xs">No clinical notes added</p>
                )}
              </div>
            </SectionCard>

            {/* Ward Transfer History */}
            <SectionCard title="Ward Transfer History" icon="🔄">
              {!patient.wardHistory?.length ? (
                <p className="text-slate-400 text-sm text-center py-4">No ward transfers recorded</p>
              ) : (
                <div className="space-y-1.5">
                  {patient.wardHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[3px] bg-white border border-slate-200 hover:border-slate-300 transition-colors text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">{h.fromSpaceName}</span>
                        {h.fromBedNumber != null && (
                          <span className="font-mono text-[11px] text-slate-400"> (Bed {h.fromBedNumber})</span>
                        )}
                        <span className="text-slate-300 mx-2">→</span>
                        <span className="font-semibold text-slate-700">{h.toSpaceName ?? "Discharged"}</span>
                        {h.toBedNumber != null && (
                          <span className="font-mono text-[11px] text-slate-400"> (Bed {h.toBedNumber})</span>
                        )}
                        {h.note && <div className="text-[11px] text-slate-400 italic mt-0.5">{h.note}</div>}
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                        <div>{fmt.date(h.movedAt)}</div>
                        <div>{h.movedBy?.name}</div>
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
                <div className="space-y-1.5">
                  {patient.doctorHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[3px] bg-white border border-slate-200 hover:border-slate-300 transition-colors text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-700">{h.previousDoctorName}</span>
                        <span className="text-slate-300 mx-2">→</span>
                        <span className="font-semibold text-slate-700">{h.newDoctorName}</span>
                        {h.note && <div className="text-[11px] text-slate-400 italic mt-0.5">{h.note}</div>}
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                        <div>{fmt.date(h.changedAt)}</div>
                        <div>{h.changedBy?.name}</div>
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
            <BillingSummary
              patient={patient}
              onCollect={() => setShowCollectPayment(true)}
              onExtra={() => setShowExtraPayment(true)}
              onAddExpenses={() => navigate(`/ipd/add-items?patientId=${patientId}`)}
              patientId={patientId}
              onRefresh={fetchPatient}
            />

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
                            className="text-left px-2 py-2 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider"
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
                          <td className="px-2 py-2.5 font-mono text-slate-600">{fmt.currency(e.price)}</td>
                          <td className="px-2 py-2.5 font-mono text-slate-600">{e.quantity}</td>
                          <td className="px-2 py-2.5 font-mono font-semibold text-slate-800">
                            {fmt.currency(e.total ?? e.price * e.quantity)}
                          </td>
                          <td className="px-2 py-2.5 font-mono text-slate-400 text-[11px]">{fmt.date(e.addedAt)}</td>
                          <td className="px-2 py-2.5 text-slate-400 text-[11px]">{e.addedBy?.name}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={4} className="px-2 py-2 text-sm font-bold text-slate-600">
                          Total
                        </td>
                        <td className="px-2 py-2 text-sm font-mono font-bold text-slate-900">
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
                <div className="space-y-1.5">
                  {(() => {
                    let runningTotal = 0;
                    return patient.payments.map((p, i) => {
                      runningTotal += p.amount;
                      const isExtraPayment = patient.dealType === "package" && runningTotal > total && p.note;
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[3px] bg-white border-l-2 border border-slate-200 ${
                            isExtraPayment ? "border-l-amber-400" : "border-l-[#0F6E5C]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-sm font-bold text-slate-800">
                              {fmt.currency(p.amount)}
                              {isExtraPayment && (
                                <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-amber-600">
                                  extra
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {p.collectedBy?.name} · <span className="font-mono">{fmt.datetime(p.collectedAt)}</span>
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
                  <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-200 text-sm font-bold">
                    <span className="text-slate-600">Total Collected</span>
                    <span className="font-mono text-[#0F6E5C]">{fmt.currency(totalPayments(patient.payments))}</span>
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
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Discharge {patient.patient.name}?</h3>
            <p className="text-sm text-slate-500">
              This will release the patient and free up{" "}
              <span className="font-semibold text-slate-700">{patient.space.spaceName}</span>
              {patient.space.bedNumber != null && <> · Bed {patient.space.bedNumber}</>}. This action cannot be undone.
            </p>
          </div>
          {due > 0 && (
            <div className="px-3 py-2.5 rounded-[3px] bg-amber-50 border-l-2 border-amber-400 text-[13px] text-amber-700">
              <span className="font-mono font-semibold">{fmt.currency(due)}</span> is still outstanding.
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
