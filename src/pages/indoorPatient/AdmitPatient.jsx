// React Compiler active — no useCallback/useMemo
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import {
  BLOOD_GROUPS,
  Btn, BedSelector, ErrorMsg, Field, Input, PageHeader, Select, Sk, Textarea,
} from "./indoorPatientHelpers";

const DEFAULTS = {
  name: "", age: "", gender: "male", bloodGroup: "",
  contactNumber: "", address: "",
  guardianName: "", guardianRelation: "", guardianContact: "",
  description: "", medicalHistory: "",
  spaceId: "", bedNumber: null,
  doctorId: "",
  referrerId: "", useDoctorAsReferrer: true,
  dealType: "regular", packageDescription: "", packageAmount: "",
};

const AdmitPatient = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reqData, setReqData] = useState({ spaces: [], doctors: [], referrers: [] });
  const [reqLoading, setReqLoading] = useState(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedSpace = reqData.spaces.find((s) => s._id === form.spaceId) ?? null;

  useEffect(() => {
    indoorPatientService.getRequiredData()
      .then((res) => setReqData(res.data))
      .catch(() => {})
      .finally(() => setReqLoading(false));
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim())        return setError("Patient name is required");
    if (!form.age)                return setError("Age is required");
    if (!form.contactNumber)      return setError("Contact number is required");
    if (!form.spaceId)            return setError("Please select a ward/space");
    if (selectedSpace?.multiBed && form.bedNumber == null) return setError("Please select a bed");
    if (!form.doctorId)           return setError("Please select a supervisor doctor");
    if (form.dealType === "package" && !form.packageAmount) return setError("Package amount is required");

    let referrerId = null, referrerName = null, referrerType = null;
    if (form.useDoctorAsReferrer) {
      const doc = reqData.doctors.find((d) => d._id === form.doctorId);
      referrerName = doc?.name ?? null;
      referrerType = "doctor";
    } else if (form.referrerId) {
      referrerId = form.referrerId;
      const ref = reqData.referrers.find((r) => r._id === form.referrerId);
      referrerName = ref?.name ?? null;
      referrerType = ref?.type ?? null;
    }

    const payload = {
      patient: {
        name: form.name.trim(), age: parseInt(form.age), gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        contactNumber: form.contactNumber.trim(), address: form.address.trim(),
        guardian: {
          name: form.guardianName.trim(), relation: form.guardianRelation.trim(),
          contactNumber: form.guardianContact.trim(),
        },
      },
      spaceId: form.spaceId,
      bedNumber: selectedSpace?.multiBed ? form.bedNumber : null,
      doctorId: form.doctorId,
      referrerId, referrerName, referrerType,
      disease: { description: form.description.trim(), medicalHistory: form.medicalHistory.trim() },
      dealType: form.dealType,
      packageDeal: form.dealType === "package"
        ? { description: form.packageDescription.trim(), totalAmount: parseFloat(form.packageAmount) }
        : undefined,
    };

    setLoading(true);
    try {
      await indoorPatientService.admit(payload);
      navigate("/ipd/admitted");
    } catch (err) {
      setError(err?.response?.data?.error ?? "Failed to admit patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <PageHeader
          title="Admit Patient"
          subtitle="Register a new indoor patient"
          back={() => navigate("/ipd")}
        />

        {reqLoading ? (
          <div className="space-y-3">{[1,2,3,4].map((i) => <Sk key={i} cls="h-14 rounded-2xl" />)}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-7">
            <ErrorMsg msg={error} />

            {/* Patient Info */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Patient Information</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full Name" required>
                  <Input placeholder="Patient full name" value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Age" required>
                  <Input type="number" min="0" max="150" placeholder="Age in years" value={form.age} onChange={(e) => set("age", e.target.value)} />
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
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </Select>
                </Field>
                <Field label="Contact Number" required>
                  <Input placeholder="01XXXXXXXXX" value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} />
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
                  <Input placeholder="Full name" value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
                </Field>
                <Field label="Relation">
                  <Input placeholder="Father / Mother..." value={form.guardianRelation} onChange={(e) => set("guardianRelation", e.target.value)} />
                </Field>
                <Field label="Contact Number">
                  <Input placeholder="01XXXXXXXXX" value={form.guardianContact} onChange={(e) => set("guardianContact", e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Clinical */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Information</p>
              <div className="space-y-3">
                <Field label="Diagnosis / Disease Description">
                  <Textarea placeholder="Brief description of illness or diagnosis..." value={form.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
                <Field label="Medical History">
                  <Textarea rows={4} placeholder="Past history, allergies, previous surgeries..." value={form.medicalHistory} onChange={(e) => set("medicalHistory", e.target.value)} />
                </Field>
              </div>
            </div>

            {/* Ward */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ward / Bed Assignment</p>
              <Field label="Select Ward / Cabin / ICU" required>
                <Select
                  value={form.spaceId}
                  onChange={(e) => { set("spaceId", e.target.value); set("bedNumber", null); }}
                >
                  <option value="">— Select Space —</option>
                  {reqData.spaces.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — ৳{s.chargePerDay}/day
                      {s.multiBed ? ` (${s.multiBedConf?.totalNumberOfBed} beds)` : s.reserved ? " — Occupied" : " — Available"}
                    </option>
                  ))}
                </Select>
              </Field>
              {selectedSpace && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <BedSelector space={selectedSpace} value={form.bedNumber} onChange={(b) => set("bedNumber", b)} />
                  {!selectedSpace.multiBed && (
                    <div className="text-sm text-slate-600">
                      Single-bed space —{" "}
                      {selectedSpace.reserved
                        ? <span className="text-red-600 font-medium">Currently occupied</span>
                        : <span className="text-emerald-600 font-medium">Available</span>}
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
                  {reqData.doctors.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}{d.degree ? ` (${d.degree})` : ""}</option>
                  ))}
                </Select>
              </Field>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => set("useDoctorAsReferrer", !form.useDoctorAsReferrer)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${form.useDoctorAsReferrer ? "bg-blue-600" : "bg-slate-300"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.useDoctorAsReferrer ? "translate-x-[18px]" : "translate-x-0"}`} />
                  </div>
                  <span className="text-sm text-slate-700">Use supervisor doctor as referrer</span>
                </label>
                {!form.useDoctorAsReferrer && (
                  <Field label="Referrer">
                    <Select value={form.referrerId} onChange={(e) => set("referrerId", e.target.value)}>
                      <option value="">— No Referrer —</option>
                      {reqData.referrers.map((r) => (
                        <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            </div>

            {/* Billing Type */}
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
                    <Input placeholder="e.g. Full operation package" value={form.packageDescription} onChange={(e) => set("packageDescription", e.target.value)} />
                  </Field>
                  <Field label="Total Package Amount (BDT)" required>
                    <Input type="number" min="0" placeholder="e.g. 50000" value={form.packageAmount} onChange={(e) => set("packageAmount", e.target.value)} />
                  </Field>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Btn variant="secondary" size="lg" className="flex-1" onClick={() => navigate("/ipd")}>Cancel</Btn>
              <Btn variant="primary" size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>Admit Patient</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmitPatient;