// React Compiler active — no useCallback/useMemo
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import indoorPatientService from "../../api/indoorPatient";
import {
  BLOOD_GROUPS,
  Btn,
  BedSelector,
  ErrorMsg,
  Field,
  Input,
  PageHeader,
  Select,
  Sk,
  Textarea,
} from "./indoorPatientHelpers";

const DEFAULTS = {
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
  useDoctorAsReferrer: true,
  dealType: "regular",
  packageDescription: "",
  packageAmount: "",
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
    indoorPatientService
      .getRequiredData()
      .then((res) => setReqData(res.data))
      .catch(() => {})
      .finally(() => setReqLoading(false));
  }, []);

  // ── occupied bed numbers for the selected space ──
  const occupiedBedNumbers = selectedSpace?.multiBed
    ? (selectedSpace.multiBedConf?.beds || [])
        .filter((b) => b.reserved === true || b.isOccupied === true)
        .map((b) => b.bedNumber)
    : [];

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("রোগীর নাম প্রয়োজন");
    if (!form.age) return setError("বয়স প্রয়োজন");
    if (!form.contactNumber) return setError("মোবাইল নম্বর প্রয়োজন");
    if (!form.spaceId) return setError("ওয়ার্ড/কেবিন নির্বাচন করুন");

    const space = reqData.spaces.find((s) => s._id === form.spaceId);
    if (space && !space.multiBed && space.reserved) {
      return setError("এই স্থানটি বর্তমানে দখলকৃত। অন্য একটি নির্বাচন করুন।");
    }
    if (space?.multiBed && form.bedNumber == null) {
      return setError("বেড নির্বাচন করুন");
    }
    if (space?.multiBed && occupiedBedNumbers.includes(form.bedNumber)) {
      return setError("নির্বাচিত বেডটি ইতিমধ্যে দখলকৃত। অন্য বেড নির্বাচন করুন।");
    }

    if (!form.doctorId) return setError("তত্ত্বাবধায়ক ডাক্তার নির্বাচন করুন");
    if (form.dealType === "package" && !form.packageAmount) return setError("প্যাকেজের পরিমাণ প্রয়োজন");

    let referrerId = null,
      referrerName = null,
      referrerType = null;
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
      bedNumber: space?.multiBed ? form.bedNumber : null,
      doctorId: form.doctorId,
      referrerId,
      referrerName,
      referrerType,
      disease: { description: form.description.trim(), medicalHistory: form.medicalHistory.trim() },
      dealType: form.dealType,
      packageDeal:
        form.dealType === "package"
          ? { description: form.packageDescription.trim(), totalAmount: parseFloat(form.packageAmount) }
          : undefined,
    };

    setLoading(true);
    try {
      await indoorPatientService.admit(payload);
      navigate("/ipd/admitted");
    } catch (err) {
      setError(err?.response?.data?.error ?? "রোগী ভর্তি করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 font-noto">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="রোগী ভর্তি" subtitle="নতুন ইনডোর রোগী নিবন্ধন করুন" back={() => navigate("/ipd")} />

        {reqLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Sk key={i} cls="h-14 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-7">
            <ErrorMsg msg={error} />

            {/* Patient Info */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">রোগীর তথ্য</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="পুরো নাম" required>
                  <Input placeholder="রোগীর পুরো নাম" value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="বয়স (বছর)" required>
                  <Input
                    type="number"
                    min="0"
                    max="150"
                    placeholder="বয়স"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                  />
                </Field>
                <Field label="লিঙ্গ" required>
                  <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="male">পুরুষ</option>
                    <option value="female">মহিলা</option>
                    <option value="other">অন্যান্য</option>
                  </Select>
                </Field>
                <Field label="ব্লাড গ্রুপ">
                  <Select value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                    <option value="">— নির্বাচন করুন —</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="মোবাইল নম্বর" required>
                  <Input
                    placeholder="০১XXXXXXXXX"
                    value={form.contactNumber}
                    onChange={(e) => set("contactNumber", e.target.value)}
                  />
                </Field>
                <Field label="ঠিকানা">
                  <Input
                    placeholder="বর্তমান ঠিকানা"
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Guardian */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">অভিভাবকের তথ্য</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="অভিভাবকের নাম">
                  <Input
                    placeholder="পুরো নাম"
                    value={form.guardianName}
                    onChange={(e) => set("guardianName", e.target.value)}
                  />
                </Field>
                <Field label="সম্পর্ক">
                  <Input
                    placeholder="পিতা/মাতা/স্বামী..."
                    value={form.guardianRelation}
                    onChange={(e) => set("guardianRelation", e.target.value)}
                  />
                </Field>
                <Field label="মোবাইল নম্বর">
                  <Input
                    placeholder="০১XXXXXXXXX"
                    value={form.guardianContact}
                    onChange={(e) => set("guardianContact", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Clinical */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">চিকিৎসা সংক্রান্ত তথ্য</p>
              <div className="space-y-3">
                <Field label="রোগ নির্ণয় / বিবরণ">
                  <Textarea
                    placeholder="রোগের সংক্ষিপ্ত বিবরণ..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </Field>
                <Field label="পূর্ববর্তী চিকিৎসা ইতিহাস">
                  <Textarea
                    rows={4}
                    placeholder="অতীতের অসুস্থতা, এলার্জি, অপারেশন ইত্যাদি..."
                    value={form.medicalHistory}
                    onChange={(e) => set("medicalHistory", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {/* Ward */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ওয়ার্ড / বেড বরাদ্দ</p>
              <Field label="ওয়ার্ড / কেবিন / আইসিইউ নির্বাচন" required>
                <Select
                  value={form.spaceId}
                  onChange={(e) => {
                    set("spaceId", e.target.value);
                    set("bedNumber", null);
                  }}
                >
                  <option value="">— স্থান নির্বাচন —</option>
                  {reqData.spaces.map((s) => {
                    const isOccupied = !s.multiBed && s.reserved === true;
                    return (
                      <option key={s._id} value={s._id} disabled={isOccupied}>
                        {s.name} — ৳{s.chargePerDay}/দিন
                        {s.multiBed ? ` (${s.multiBedConf?.totalNumberOfBed}টি বেড)` : ""}
                        {isOccupied ? " — 🔒 দখলকৃত" : ""}
                      </option>
                    );
                  })}
                </Select>
              </Field>
              {selectedSpace && (
                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <BedSelector
                    space={selectedSpace}
                    value={form.bedNumber}
                    onChange={(b) => set("bedNumber", b)}
                    disabledBedNumbers={occupiedBedNumbers}
                  />
                  {!selectedSpace.multiBed && (
                    <div className="text-sm text-slate-600 mt-2">
                      একক বেডের স্থান —
                      {selectedSpace.reserved ? (
                        <span className="text-red-600 font-medium ml-1">বর্তমানে দখলকৃত (অনুপলব্ধ)</span>
                      ) : (
                        <span className="text-emerald-600 font-medium ml-1">শূন্য</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctor */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">চিকিৎসক দল</p>
              <Field label="তত্ত্বাবধায়ক ডাক্তার" required>
                <Select value={form.doctorId} onChange={(e) => set("doctorId", e.target.value)}>
                  <option value="">— ডাক্তার নির্বাচন —</option>
                  {reqData.doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                      {d.degree ? ` (${d.degree})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => set("useDoctorAsReferrer", !form.useDoctorAsReferrer)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${form.useDoctorAsReferrer ? "bg-blue-600" : "bg-slate-300"}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.useDoctorAsReferrer ? "translate-x-[18px]" : "translate-x-0"}`}
                    />
                  </div>
                  <span className="text-sm text-slate-700">তত্ত্বাবধায়ক ডাক্তারকেই রেফারার হিসেবে ব্যবহার করুন</span>
                </label>
                {!form.useDoctorAsReferrer && (
                  <Field label="রেফারার">
                    <Select value={form.referrerId} onChange={(e) => set("referrerId", e.target.value)}>
                      <option value="">— রেফারার নেই —</option>
                      {reqData.referrers.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name} ({r.type})
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            </div>

            {/* Billing Type */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">বিলিংয়ের ধরন</p>
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
                    {type === "regular" ? "🔢 সাধারণ (প্রতিদিন)" : "📦 প্যাকেজ ডিল"}
                  </button>
                ))}
              </div>
              {form.dealType === "package" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="প্যাকেজের বিবরণ">
                    <Input
                      placeholder="যেমন: সম্পূর্ণ অপারেশন প্যাকেজ"
                      value={form.packageDescription}
                      onChange={(e) => set("packageDescription", e.target.value)}
                    />
                  </Field>
                  <Field label="মোট প্যাকেজ মূল্য (টাকা)" required>
                    <Input
                      type="number"
                      min="0"
                      placeholder="যেমন: ৫০০০০"
                      value={form.packageAmount}
                      onChange={(e) => set("packageAmount", e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Btn variant="secondary" size="lg" className="flex-1" onClick={() => navigate("/ipd")}>
                বাতিল
              </Btn>
              <Btn variant="primary" size="lg" className="flex-1" loading={loading} onClick={handleSubmit}>
                রোগী ভর্তি করুন
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmitPatient;
