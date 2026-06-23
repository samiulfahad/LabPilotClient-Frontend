/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useState, useEffect } from "react";
import {
  Search,
  Printer,
  Upload,
  User,
  Phone,
  FlaskConical,
  FileText,
  CheckCircle2,
  Wallet,
  X,
  ChevronRight,
  Pencil,
  Calendar,
  ClipboardList,
  Check,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import Popup from "../../components/popup";
import invoiceService from "../../api/invoice";
import indoorPatientService from "../../api/indoorPatient";
import reportService from "../../api/report";

// ─── ID Format Detection ──────────────────────────────────────────────────────

const detectIdType = (id) => {
  if (/^IP[1-9]{3}[A-NP-Z]{2}$/i.test(id.trim())) return "indoor";
  if (/^[A-NP-Z]{3}[1-9]{4}$/i.test(id.trim())) return "outdoor";
  return null;
};

// ─── Data Normalizers ─────────────────────────────────────────────────────────

const normalizeOutdoor = (invoice) => ({
  _type: "outdoor",
  _patientId: null,
  displayId: invoice.invoiceId,
  createdAt: invoice.createdAt ?? null,
  patient: invoice.patient,
  amount: invoice.amount ?? null,
  space: null,
  supervisorDoctor: null,
  tests: (invoice.tests ?? []).map((t) => ({
    testId: t.testId,
    name: t.name,
    price: t.price ?? null,
    schemaId: t.schemaId ?? null,
    isCompleted: t.isCompleted ?? false,
    report: t.report ?? {},
  })),
});

const normalizeIndoor = (patient) => ({
  _type: "indoor",
  _patientId: String(patient._id),
  displayId: patient.admissionId,
  createdAt: patient.admittedAt ?? null,
  patient: patient.patient,
  amount: null,
  space: patient.space ?? null,
  supervisorDoctor: patient.supervisorDoctor ?? null,
  tests: (patient.reports ?? []).map((r) => ({
    testId: String(r.testId),
    name: r.name,
    price: null,
    schemaId: r.schemaId ?? null,
    isCompleted: r.isCompleted ?? false,
    report: r.report ?? {},
  })),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "0");

const formatDateTime = (ts) => {
  if (!ts) return { date: "—", time: "—" };
  const d = new Date(ts);
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const h = d.getHours();
  return {
    date: `${day}${suffix} ${d.toLocaleString("default", { month: "long" })}, ${d.getFullYear()}`,
    time: `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")}${h >= 12 ? "PM" : "AM"}`,
  };
};

const toInputDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const RecordSkeleton = () => (
  <div className="bg-white border border-[#E3E0D6] rounded-lg overflow-hidden animate-pulse">
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6]">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2 w-16 bg-[#ECE9DF] rounded-sm" />
          <div className="h-7 w-36 bg-[#ECE9DF] rounded-sm" />
          <div className="h-2 w-44 bg-[#ECE9DF] rounded-sm" />
        </div>
        <div className="h-6 w-20 bg-[#ECE9DF] rounded-sm" />
      </div>
    </div>
    <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
      <div className="h-2 w-16 bg-[#ECE9DF] rounded-sm mb-3" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2 w-12 bg-[#ECE9DF] rounded-sm" />
            <div className="h-3.5 w-28 bg-[#ECE9DF] rounded-sm" />
          </div>
        ))}
      </div>
    </div>
    <div className="px-6 sm:px-8 py-5 space-y-2">
      <div className="h-2 w-20 bg-[#ECE9DF] rounded-sm mb-3" />
      {[0, 1].map((i) => (
        <div key={i} className="border border-[#E3E0D6] rounded px-4 py-3 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#ECE9DF] shrink-0" />
          <div className="flex-1 h-3 bg-[#ECE9DF] rounded-sm" />
          <div className="h-7 w-16 bg-[#ECE9DF] rounded-sm" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Date Editor ──────────────────────────────────────────────────────────────

const DateEditor = ({ recordType, displayId, patientId, testId, initialSampleDate, initialReportDate, onSaved }) => {
  const [sampleDate, setSampleDate] = useState(toInputDate(initialSampleDate));
  const [reportDate, setReportDate] = useState(toInputDate(initialReportDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isDirty = toInputDate(initialSampleDate) !== sampleDate || toInputDate(initialReportDate) !== reportDate;

  const handleSave = async () => {
    if (!sampleDate && !reportDate) return;
    try {
      setSaving(true);
      setError(null);
      if (recordType === "indoor") {
        await reportService.updateIndoorDates({
          patientId,
          testId,
          sampleCollectionDate: sampleDate || null,
          reportDate: reportDate || null,
        });
      } else {
        await reportService.updateDates({
          invoiceId: displayId,
          testId,
          sampleCollectionDate: sampleDate || null,
          reportDate: reportDate || null,
        });
      }
      onSaved({ sampleCollectionDate: sampleDate || null, reportDate: reportDate || null });
    } catch {
      setError("তারিখ সেভ করা সম্ভব হয়নি");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#E3E0D6]">
      <div className="flex flex-wrap items-end gap-2.5">
        <DateField
          icon={Calendar}
          iconColor="text-[#0F6E5C]"
          label="Sample Date"
          value={sampleDate}
          onChange={setSampleDate}
        />
        <DateField
          icon={ClipboardList}
          iconColor="text-[#8A5C00]"
          label="Report Date"
          value={reportDate}
          onChange={setReportDate}
        />
        <button
          onClick={handleSave}
          disabled={saving || !isDirty || (!sampleDate && !reportDate)}
          className="flex items-center gap-1.5 px-3 py-[5px] font-['IBM_Plex_Mono'] text-[11px] font-semibold rounded-sm border transition-all disabled:opacity-35 disabled:cursor-not-allowed border-[#1C1F1E]/20 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white self-end"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#C0312B] mt-1.5">{error}</p>}
    </div>
  );
};

const DateField = ({ icon: Icon, iconColor, label, value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="flex items-center gap-1 font-['IBM_Plex_Mono'] text-[10px] font-medium text-[#6F756F] uppercase tracking-wide">
      <Icon className={`w-3 h-3 ${iconColor}`} />
      {label}
    </label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-[5px] font-['IBM_Plex_Mono'] text-xs border border-[#D8D5CB] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0F6E5C] focus:border-[#0F6E5C] bg-white text-[#1C1F1E] cursor-pointer"
    />
  </div>
);

// ─── Test Action Buttons ──────────────────────────────────────────────────────

const TestActions = ({ record, test }) => {
  const { _type, _patientId, displayId } = record;
  const { testId, name, isCompleted } = test;

  if (!isCompleted) {
    return (
      <Link
        to="/report-upload"
        state={
          _type === "indoor"
            ? { patientId: _patientId, testId, testName: name, type: "indoor" }
            : { invoiceId: displayId, testId, testName: name, invoice: record }
        }
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1F1E] text-white hover:bg-[#2D3330] font-['IBM_Plex_Mono'] text-[11px] font-semibold rounded-sm transition-colors"
      >
        <Upload className="w-3 h-3" /> Upload
      </Link>
    );
  }

  const printBase =
    _type === "indoor"
      ? `/report-download?patientId=${_patientId}&testId=${testId}&testName=${encodeURIComponent(name)}&type=indoor`
      : `/report-download?invoiceId=${displayId}&testId=${testId}&testName=${encodeURIComponent(name)}`;

  return (
    <div className="flex items-center gap-1.5">
      <Link
        to={`${printBase}&printType=PAD`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-1.5 border border-[#D8D5CB] text-[#6F756F] hover:border-[#1C1F1E] hover:text-[#1C1F1E] font-['IBM_Plex_Mono'] text-[11px] font-medium rounded-sm transition-colors"
      >
        <Printer className="w-3 h-3" />
        <span className="hidden sm:inline">Pad</span>
      </Link>
      <Link
        to={`${printBase}&printType=PLAIN`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-1.5 border border-[#D8D5CB] text-[#6F756F] hover:border-[#1C1F1E] hover:text-[#1C1F1E] font-['IBM_Plex_Mono'] text-[11px] font-medium rounded-sm transition-colors"
      >
        <Printer className="w-3 h-3" />
        <span className="hidden sm:inline">A4</span>
      </Link>
      <Link
        to="/report-upload"
        state={
          _type === "indoor"
            ? { patientId: _patientId, testId, testName: name, type: "indoor", isEdit: true }
            : { invoiceId: displayId, testId, testName: name, invoice: record, isEdit: true }
        }
        className="flex items-center gap-1 px-2.5 py-1.5 border border-[#D8D5CB] text-[#6F756F] hover:border-[#1C1F1E] hover:text-[#1C1F1E] font-['IBM_Plex_Mono'] text-[11px] font-medium rounded-sm transition-colors"
      >
        <Pencil className="w-3 h-3" />
        <span className="hidden sm:inline">Edit</span>
      </Link>
    </div>
  );
};

// ─── Record Detail Card ───────────────────────────────────────────────────────

const RecordDetail = ({ record, onDatesSaved }) => {
  const { date, time } = formatDateTime(record.createdAt);
  const amount = record.amount;
  const final = Number(amount?.final) || 0;
  const paid = Number(amount?.paid) || 0;
  const initial = Number(amount?.initial) || 0;
  const due = Math.max(0, final - paid);

  const isIndoor = record._type === "indoor";
  const onlineTests = record.tests.filter((t) => t.schemaId);
  const offlineTests = record.tests.filter((t) => !t.schemaId);
  const completedCount = onlineTests.filter((t) => t.isCompleted).length;

  return (
    <div className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_3px_rgba(28,31,30,0.06)] overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[#A8ACA3] mb-1">
              {isIndoor ? "Admission" : "Invoice"}
            </p>
            <h2 className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#1C1F1E] tracking-tight">
              #{record.displayId}
            </h2>
            <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] mt-1">
              {date} · {time}
            </p>
          </div>

          {/* Outdoor — amount + paid/due badge */}
          {!isIndoor && amount && (
            <div className="text-right shrink-0">
              <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[#A8ACA3] mb-1">Total</p>
              <p className="font-['IBM_Plex_Mono'] text-xl font-semibold text-[#1C1F1E]">৳{fmt(final)}</p>
              {final < initial && (
                <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] line-through">৳{fmt(initial)}</p>
              )}
              <div className="mt-1.5">
                {due === 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#0F6E5C]/30 bg-[#0F6E5C]/[0.05] text-[#0F6E5C] font-['IBM_Plex_Mono'] text-[11px] rounded-sm">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#C0312B]/30 bg-[#C0312B]/[0.04] text-[#C0312B] font-['IBM_Plex_Mono'] text-[11px] rounded-sm">
                    <Wallet className="w-3 h-3" /> Due ৳{fmt(due)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Indoor — admitted badge only */}
          {isIndoor && (
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#0F6E5C]/30 bg-[#0F6E5C]/[0.05] text-[#0F6E5C] font-['IBM_Plex_Mono'] text-[11px] rounded-sm">
                <CheckCircle2 className="w-3 h-3" /> Indoor Patient
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Patient ── */}
      <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6] bg-[#FAFAF8]">
        <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[#A8ACA3] mb-3">রোগীর তথ্য</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {[
            { label: "Name", val: record.patient?.name, icon: User },
            { label: "Contact", val: record.patient?.contactNumber, icon: Phone },
            { label: "Gender", val: record.patient?.gender, cap: true },
            { label: "Age", val: record.patient?.age ? `${record.patient.age} yrs` : "—" },
          ].map(({ label, val, icon: Icon, cap }) => (
            <div key={label} className="flex items-start gap-2.5 min-w-0">
              {Icon && (
                <div className="w-6 h-6 rounded-sm bg-[#ECE9DF] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 text-[#6F756F]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] uppercase tracking-wide">{label}</p>
                <p
                  className={`font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-semibold truncate ${cap ? "capitalize" : ""}`}
                >
                  {val || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Online Tests ── */}
      {onlineTests.length > 0 && (
        <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
          <div className="flex items-center justify-between mb-3.5">
            <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[#A8ACA3] flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-[#0F6E5C]" />
              অনলাইন টেস্ট
            </p>
            <div className="flex items-center gap-2">
              <div className="h-1 w-24 bg-[#ECE9DF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F6E5C] rounded-full transition-all"
                  style={{ width: `${onlineTests.length > 0 ? (completedCount / onlineTests.length) * 100 : 0}%` }}
                />
              </div>
              <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] tabular-nums">
                {completedCount}/{onlineTests.length}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {onlineTests.map((test, i) => (
              <div
                key={test.testId + i}
                className={`rounded border px-4 py-3.5 transition-colors ${
                  test.isCompleted ? "border-[#0F6E5C]/20 bg-[#0F6E5C]/[0.025]" : "border-[#E3E0D6] bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 pt-0.5">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                        test.isCompleted ? "bg-[#0F6E5C]" : "bg-[#D4A843]"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#1C1F1E] truncate leading-snug">
                        {test.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {test.isCompleted ? (
                          <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#0F6E5C] flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                          </span>
                        ) : (
                          <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#8A5C00]">Pending</span>
                        )}
                        {test.price != null && (
                          <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] tabular-nums">
                            · ৳{fmt(test.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <TestActions record={record} test={test} />
                  </div>
                </div>
                <DateEditor
                  recordType={record._type}
                  displayId={record.displayId}
                  patientId={record._patientId}
                  testId={test.testId}
                  initialSampleDate={test.report?.sampleCollectionDate}
                  initialReportDate={test.report?.reportDate}
                  onSaved={(dates) => onDatesSaved(test.testId, dates)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Offline Tests ── */}
      {offlineTests.length > 0 && (
        <div className="px-6 sm:px-8 py-5">
          <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[#A8ACA3] flex items-center gap-1.5 mb-3.5">
            <FileText className="w-3.5 h-3.5 text-[#A8ACA3]" /> অফলাইন টেস্ট
          </p>
          <div className="space-y-1.5">
            {offlineTests.map((test, i) => (
              <div key={test.testId + i} className="flex items-center gap-3">
                <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#C8C5BB] w-5 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-medium truncate">{test.name}</span>
                <span className="flex-1 border-b border-dotted border-[#D8D5CB]" />
                {test.price != null && (
                  <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums shrink-0">
                    ৳{fmt(test.price)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Report = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [record, setRecord] = useState(null);
  const [searching, setSearching] = useState(false);
  const [popup, setPopup] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [invalidId, setInvalidId] = useState(false);

  const location = useLocation();

  const fetchRecord = async (id) => {
    const type = detectIdType(id);
    if (!type) {
      setInvalidId(true);
      setRecord(null);
      setNotFound(false);
      return;
    }
    try {
      setSearching(true);
      setNotFound(false);
      setInvalidId(false);
      setRecord(null);
      if (type === "outdoor") {
        const res = await invoiceService.getReportSummary(id.trim().toUpperCase());
        setRecord(normalizeOutdoor(res.data));
      } else {
        const res = await indoorPatientService.getByAdmissionId(id.trim().toUpperCase());
        setRecord(normalizeIndoor(res.data));
      }
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else setPopup({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const id = location.state?.invoiceId ?? location.state?.admissionId;
    if (id) {
      const idStr = String(id);
      setSearchQuery(idStr);
      fetchRecord(idStr);
    }
  }, []);

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) fetchRecord(q);
  };

  const handleClear = () => {
    setSearchQuery("");
    setRecord(null);
    setNotFound(false);
    setInvalidId(false);
  };

  const handleDatesSaved = (testId, dates) => {
    setRecord((prev) => ({
      ...prev,
      tests: prev.tests.map((t) => (t.testId !== testId ? t : { ...t, report: { ...(t.report ?? {}), ...dates } })),
    }));
    setPopup({ type: "success", message: "Dates saved" });
  };

  return (
    <section className="min-h-screen manifest-bg px-4 py-6 font-noto">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        .manifest-bg {
          background-color: #F5F4EF;
          background-image: radial-gradient(circle, rgba(28,31,30,0.05) 1px, transparent 1px);
          background-size: 18px 18px;
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* ── Page heading ── */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] uppercase tracking-widest text-[#0F6E5C] mb-1">
              ল্যাব অপারেশন
            </p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-[26px] font-semibold text-[#1C1F1E] leading-tight">
              রিপোর্ট ম্যানেজমেন্ট
            </h1>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#767D78] mt-1.5">
              ইনভয়েস বা ভর্তি আইডি দিয়ে রিপোর্ট খুঁজুন
            </p>
          </div>
          <Link
            to="/lab-management"
            className="mt-1 px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-[11px] uppercase shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ফিরে যান
          </Link>
        </div>

        {/* ── Search ── */}
        <div className="bg-white border border-[#E3E0D6] rounded-lg p-4 mb-5 shadow-[0_1px_2px_rgba(28,31,30,0.04)]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8ACA3]" />
              <input
                type="text"
                placeholder="Invoice ID or Admission ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-9 py-2.5 font-['IBM_Plex_Mono'] text-sm border border-[#D8D5CB] rounded-sm focus:border-[#0F6E5C] focus:ring-1 focus:ring-[#0F6E5C] outline-none transition-all placeholder-[#C8C5BB] text-[#1C1F1E] bg-[#FAFAF8]"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8ACA3] hover:text-[#1C1F1E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="px-4 py-2.5 border border-[#1C1F1E]/20 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white font-['IBM_Plex_Mono'] text-[11px] uppercase font-semibold rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>
          <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] mt-2.5 flex items-center gap-2">
            <span>e.g.</span>
            <span className="text-[#6F756F] bg-[#F0EEE8] px-1.5 py-0.5 rounded-sm">APX8743</span>
            <span className="text-[#C8C5BB]">·</span>
            <span className="text-[#6F756F] bg-[#F0EEE8] px-1.5 py-0.5 rounded-sm">IP482XK</span>
          </p>
        </div>

        {/* ── States ── */}
        {searching && <RecordSkeleton />}

        {!searching && invalidId && (
          <div className="bg-white border border-[#E3E0D6] rounded-lg p-8 text-center shadow-[0_1px_2px_rgba(28,31,30,0.04)]">
            <div className="w-10 h-10 rounded-sm bg-[#FFF3E0] border border-[#8A5C00]/20 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5 text-[#8A5C00]" />
            </div>
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#1C1F1E] mb-1">Unrecognized ID format</p>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#6F756F] leading-relaxed">
              Invoice format: <span className="text-[#1C1F1E] bg-[#F0EEE8] px-1 rounded-sm">APX8743</span>
              {"  ·  "}
              Admission format: <span className="text-[#1C1F1E] bg-[#F0EEE8] px-1 rounded-sm">IP482XK</span>
            </p>
          </div>
        )}

        {!searching && notFound && (
          <div className="bg-white border border-[#E3E0D6] rounded-lg p-8 text-center shadow-[0_1px_2px_rgba(28,31,30,0.04)]">
            <div className="w-10 h-10 rounded-sm bg-[#ECE9DF] border border-[#D8D5CB] flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-[#A8ACA3]" />
            </div>
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#1C1F1E] mb-1">Not found</p>
            <p className="font-['IBM_Plex_Mono'] text-[12px] text-[#6F756F]">
              No record for{" "}
              <span className="text-[#1C1F1E] bg-[#F0EEE8] px-1 rounded-sm">#{searchQuery.toUpperCase()}</span>
            </p>
          </div>
        )}

        {!searching && record && <RecordDetail record={record} onDatesSaved={handleDatesSaved} />}

        <p className="font-['IBM_Plex_Mono'] text-center text-[11px] text-[#C8C5BB] mt-5 pb-6">
          শুধুমাত্র সক্রিয় রেকর্ড প্রদর্শিত হচ্ছে
        </p>
      </div>
    </section>
  );
};

export default Report;
