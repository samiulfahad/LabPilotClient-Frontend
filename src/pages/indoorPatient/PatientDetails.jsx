// React Compiler active — no useCallback/useMemo
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
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
  days,
} from "./indoorPatientHelpers";

// ─── Collect Payment Modal ────────────────────────────────────────────────────

const CollectPaymentModal = ({ open, patientId, onClose, onSuccess }) => {
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
        <div className="flex gap-3 pt-1">
          <Btn variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="success" size="lg" className="flex-1" loading={loading} onClick={handleAdd}>
            Record Payment
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
  { id: "reports", label: "Reports" },
  { id: "history", label: "History" },
];

// ─── Patient Detail Page ──────────────────────────────────────────────────────

const PatientDetail = () => {
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

  const txSelectedSpace = spaces.find((s) => s._id === txForm.spaceId) ?? null;

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
                {/* Redirect to catalog-based add items page, pre-selecting this patient */}
                <Btn variant="primary" size="sm" onClick={() => navigate(`/ipd/add-items?patientId=${patientId}`)}>
                  ➕ Add Expenses
                </Btn>
                <Btn variant="success" size="sm" onClick={() => setShowCollectPayment(true)}>
                  💳 Collect Payment
                </Btn>
                <Btn variant="danger" size="sm" onClick={() => setReleaseConfirm(true)}>
                  Discharge
                </Btn>
              </div>
            )
          }
        />

        {/* Status strip */}
        <div className="flex items-center gap-2 mb-5">
          <Badge color={isAdmitted ? "blue" : "green"}>{isAdmitted ? "🏥 Admitted" : "✅ Released"}</Badge>
          {patient.dealType === "package" && <Badge color="purple">📦 Package Deal</Badge>}
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

            <SectionCard title="Billing Summary" icon="💰">
              {(() => {
                const exp = totalExpenses(patient.expenses);
                const paid = totalPayments(patient.payments);
                const d = days(patient.admittedAt, patient.releasedAt);
                const bedCharge = patient.dealType === "regular" ? patient.space.chargePerDay * d : 0;
                const total =
                  patient.dealType === "package" ? (patient.packageDeal?.totalAmount ?? 0) : exp + bedCharge;
                const due = total - paid;
                return (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Bill", value: fmt.currency(total), color: "text-slate-800" },
                      { label: "Paid", value: fmt.currency(paid), color: "text-emerald-700" },
                      {
                        label: "Due",
                        value: fmt.currency(Math.max(0, due)),
                        color: due > 0 ? "text-red-600" : "text-emerald-600",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</div>
                        <div className={`text-lg font-bold ${color}`}>{value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </SectionCard>
          </div>
        )}

        {/* ── Billing ── */}
        {activeTab === "billing" && (
          <div className="space-y-4">
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

        {/* ── Reports ── */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">Reports — Coming Soon</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Patient reports and lab documents will be available here.
            </p>
          </div>
        )}

        {/* ── History ── */}
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
      </div>

      {/* ── Modals ── */}
      <CollectPaymentModal
        open={showCollectPayment}
        patientId={patientId}
        onClose={() => setShowCollectPayment(false)}
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

export default PatientDetail;
