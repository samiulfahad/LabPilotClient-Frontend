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
    <div className="h-[3px] bg-[#E3E0D6]" />
    <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6] space-y-2">
      <div className="h-2 w-20 bg-[#ECE9DF] rounded-sm" />
      <div className="h-6 w-40 bg-[#ECE9DF] rounded-sm" />
      <div className="h-2 w-52 bg-[#ECE9DF] rounded-sm" />
    </div>
    <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6] space-y-3">
      <div className="h-2 w-16 bg-[#ECE9DF] rounded-sm" />
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 bg-[#ECE9DF] rounded-sm" />
          <div className="space-y-1.5 flex-1">
            <div className="h-2 w-24 bg-[#ECE9DF] rounded-sm" />
            <div className="h-3 w-36 bg-[#ECE9DF] rounded-sm" />
          </div>
        </div>
      ))}
    </div>
    <div className="px-6 sm:px-8 py-5 space-y-3">
      <div className="h-2 w-24 bg-[#ECE9DF] rounded-sm" />
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3 border border-[#E3E0D6] rounded px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ECE9DF]" />
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
    <div className="mt-2 pt-2 border-t border-[#E3E0D6]">
      <div className="flex flex-wrap items-end gap-3">
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
          className="flex items-center gap-1.5 px-3 py-1 font-['IBM_Plex_Mono'] text-xs font-semibold rounded-sm border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-[#1C1F1E]/20 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white self-end"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#C0312B] mt-1">{error}</p>}
    </div>
  );
};

const DateField = ({ icon: Icon, iconColor, label, value, onChange }) => (
  <div className="flex flex-col gap-0.5">
    <label className="flex items-center gap-1 font-['IBM_Plex_Mono'] text-[10px] font-medium text-[#6F756F] uppercase tracking-wide">
      <Icon className={`w-3 h-3 ${iconColor}`} />
      {label}
    </label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 font-['IBM_Plex_Mono'] text-xs border border-[#D8D5CB] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0F6E5C] focus:border-[#0F6E5C] bg-white text-[#1C1F1E] cursor-pointer"
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
        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1C1F1E]/20 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white font-['IBM_Plex_Mono'] text-xs font-semibold rounded-sm transition-colors"
      >
        <Upload className="w-3.5 h-3.5" /> Upload
      </Link>
    );
  }

  const printBase =
    _type === "indoor"
      ? `/report-download?patientId=${_patientId}&testId=${testId}&testName=${encodeURIComponent(name)}&type=indoor`
      : `/report-download?invoiceId=${displayId}&testId=${testId}&testName=${encodeURIComponent(name)}`;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Link
        to={`${printBase}&printType=PAD`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#D8D5CB] text-[#6F756F] hover:border-[#1C1F1E] hover:text-[#1C1F1E] font-['IBM_Plex_Mono'] text-xs font-semibold rounded-sm transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Pad</span>
      </Link>
      <Link
        to={`${printBase}&printType=PLAIN`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#D8D5CB] text-[#6F756F] hover:border-[#1C1F1E] hover:text-[#1C1F1E] font-['IBM_Plex_Mono'] text-xs font-semibold rounded-sm transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">A4</span>
      </Link>
      <Link
        to="/report-upload"
        state={
          _type === "indoor"
            ? { patientId: _patientId, testId, testName: name, type: "indoor", isEdit: true }
            : { invoiceId: displayId, testId, testName: name, invoice: record, isEdit: true }
        }
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#D8D5CB] text-[#6F756F] hover:border-[#1C1F1E] hover:text-[#1C1F1E] font-['IBM_Plex_Mono'] text-xs font-semibold rounded-sm transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
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
    <div className="bg-white border border-[#E3E0D6] rounded-lg shadow-[0_1px_2px_rgba(28,31,30,0.04)] overflow-hidden">
      {/* Header band */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-[#E3E0D6]">
        <div>
          <h2 className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-[#1C1F1E]">#{record.displayId}</h2>
         

          {/* Outdoor — amount */}
          {!isIndoor && amount && (
            <div className="mt-3">
              <div className="mt-2">
                {due === 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#0F6E5C]/30 text-[#0F6E5C] font-['IBM_Plex_Mono'] text-xs rounded-sm">
                    <CheckCircle2 className="w-3 h-3" /> Fully Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#C0312B]/30 text-[#C0312B] font-['IBM_Plex_Mono'] text-xs rounded-sm">
                    <Wallet className="w-3 h-3" /> Due ৳{fmt(due)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Indoor — simple badge */}
          {isIndoor && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#0F6E5C]/30 text-[#0F6E5C] font-['IBM_Plex_Mono'] text-xs rounded-sm">
                <CheckCircle2 className="w-3 h-3" /> Admitted Patient
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Patient */}
      <div className="px-6 sm:px-8 py-4 border-b border-[#E3E0D6]">
        <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] mb-2.5 tracking-wide">রোগীর তথ্য</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] uppercase tracking-wide">Name</p>
            <p className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-semibold truncate">
              {record.patient?.name}
            </p>
          </div>
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] uppercase tracking-wide">Contact</p>
            <p className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-semibold truncate">
              {record.patient?.contactNumber}
            </p>
          </div>
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] uppercase tracking-wide">Gender</p>
            <p className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-semibold capitalize">
              {record.patient?.gender}
            </p>
          </div>
          <div>
            <p className="font-['IBM_Plex_Mono'] text-[10px] text-[#A8ACA3] uppercase tracking-wide">Age</p>
            <p className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-semibold">{record.patient?.age} yrs</p>
          </div>
        </div>
      </div>

      {/* Online Tests */}
      {onlineTests.length > 0 && (
        <div className="px-6 sm:px-8 py-5 border-b border-[#E3E0D6]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] flex items-center gap-1.5 tracking-wide">
              <FlaskConical className="w-3.5 h-3.5 text-[#0F6E5C]" />
              অনলাইন টেস্ট
            </p>
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F] tabular-nums">
              {completedCount}/{onlineTests.length} done
            </p>
          </div>
          <div className="space-y-2">
            {onlineTests.map((test, i) => (
              <div
                key={test.testId + i}
                className={`border rounded px-4 py-3 transition-colors ${
                  test.isCompleted ? "border-[#0F6E5C]/20 bg-[#0F6E5C]/[0.03]" : "border-[#E3E0D6]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${test.isCompleted ? "bg-[#0F6E5C]" : "bg-[#8A5C00]"}`}
                    />
                    <div className="min-w-0">
                      <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#1C1F1E] truncate">
                        {test.name}
                      </p>
                      {test.price != null && (
                        <p className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] tabular-nums">৳{fmt(test.price)}</p>
                      )}
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

      {/* Offline Tests */}
      {offlineTests.length > 0 && (
        <div className="px-6 sm:px-8 py-5">
          <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#6F756F] flex items-center gap-1.5 mb-3 tracking-wide">
            <FileText className="w-3.5 h-3.5 text-[#A8ACA3]" /> অফলাইন টেস্ট
          </p>
          <div className="space-y-1.5">
            {offlineTests.map((test, i) => (
              <div key={test.testId + i} className="flex items-center gap-3">
                <span className="font-['IBM_Plex_Mono'] text-xs text-[#A8ACA3] w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-['IBM_Plex_Mono'] text-sm text-[#1C1F1E] font-medium truncate">{test.name}</span>
                <span className="flex-1 border-b border-dotted border-[#D8D5CB] translate-y-[-3px]" />
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
        {/* Page heading */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-['IBM_Plex_Mono'] text-xs uppercase text-[#0F6E5C] mb-1 tracking-wide">ল্যাব অপারেশন</p>
            <h1 className="font-['IBM_Plex_Sans'] text-2xl sm:text-3xl font-semibold text-[#1C1F1E]">
              রিপোর্ট ম্যানেজমেন্ট
            </h1>
            <p className="text-sm text-[#767D78] mt-1">ইনভয়েস বা ভর্তি আইডি দিয়ে রিপোর্ট আপলোড ও ডাউনলোড করুন।</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/lab-management"
              className="px-3 py-2 rounded-sm border border-[#1C1F1E]/15 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white transition-colors flex items-center gap-1.5 font-['IBM_Plex_Mono'] text-xs uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ফিরে যান
            </Link>
          </div>
        </div>

        {/* Search */}
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
                className="w-full pl-9 pr-9 py-2 font-['IBM_Plex_Mono'] text-sm border border-[#D8D5CB] rounded-sm focus:border-[#0F6E5C] focus:ring-1 focus:ring-[#0F6E5C] outline-none transition-all placeholder-[#A8ACA3] text-[#1C1F1E]"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8ACA3] hover:text-[#1C1F1E] p-0.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="px-4 py-2 border border-[#1C1F1E]/20 text-[#1C1F1E] hover:bg-[#1C1F1E] hover:text-white font-['IBM_Plex_Mono'] text-xs uppercase font-semibold rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>
          <p className="font-['IBM_Plex_Mono'] text-[11px] text-[#A8ACA3] mt-2">
            e.g. <span className="text-[#1C1F1E]">APX8743</span> (invoice) ·{" "}
            <span className="text-[#1C1F1E]">IP482XK</span> (admission)
          </p>
        </div>

        {searching && <RecordSkeleton />}

        {!searching && invalidId && (
          <div className="bg-white border border-[#E3E0D6] rounded-lg p-8 text-center">
            <AlertCircle className="w-8 h-8 text-[#8A5C00] mx-auto mb-3" />
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#1C1F1E] mb-1">Unrecognized ID format</p>
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F]">
              Use invoice format <span className="text-[#1C1F1E]">APX8743</span> or admission format{" "}
              <span className="text-[#1C1F1E]">IP482XK</span>
            </p>
          </div>
        )}

        {!searching && notFound && (
          <div className="bg-white border border-[#E3E0D6] rounded-lg p-8 text-center">
            <Search className="w-8 h-8 text-[#A8ACA3] mx-auto mb-3" />
            <p className="font-['IBM_Plex_Mono'] text-sm font-semibold text-[#1C1F1E] mb-1">Not found</p>
            <p className="font-['IBM_Plex_Mono'] text-xs text-[#6F756F]">
              No record for <span className="text-[#1C1F1E]">#{searchQuery.toUpperCase()}</span>
            </p>
          </div>
        )}

        {!searching && record && <RecordDetail record={record} onDatesSaved={handleDatesSaved} />}

        <p className="font-['IBM_Plex_Mono'] text-center text-xs text-[#A8ACA3] mt-4 pb-6">
          শুধুমাত্র সক্রিয় (ডিলিট না হওয়া) রেকর্ড প্রদর্শিত হচ্ছে
        </p>
      </div>
    </section>
  );
};

export default Report;
