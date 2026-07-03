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
  Hash,
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
    addedAt: t.addedAt ?? null,
    completedAt: t.completedAt ?? null,
    completedBy: t.completedBy ?? null,
    updatedAt: t.updatedAt ?? null,
    updatedBy: t.updatedBy ?? null,
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
    addedAt: r.addedAt ?? null,
    completedAt: r.completedAt ?? null,
    completedBy: r.completedBy ?? null,
    updatedAt: r.updatedAt ?? null,
    updatedBy: r.updatedBy ?? null,
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
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm animate-pulse">
    <div className="h-1 bg-gray-100" />
    <div className="px-6 pt-6 pb-5 border-b border-gray-100">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-2 w-16 bg-gray-100 rounded-full" />
          <div className="h-7 w-36 bg-gray-200 rounded-lg" />
          <div className="h-2 w-44 bg-gray-100 rounded-full" />
        </div>
        <div className="h-7 w-20 bg-gray-100 rounded-full" />
      </div>
    </div>
    <div className="px-6 py-5 border-b border-gray-100">
      <div className="h-2 w-16 bg-gray-100 rounded-full mb-4" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-2 w-10 bg-gray-100 rounded-full" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="px-6 py-5 space-y-2.5">
      <div className="h-2 w-20 bg-gray-100 rounded-full mb-4" />
      {[0, 1].map((i) => (
        <div key={i} className="border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 bg-gray-200 rounded" />
            <div className="h-2 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Date Editor ──────────────────────────────────────────────────────────────

const DateEditor = ({
  recordType,
  displayId,
  patientId,
  testId,
  addedAt,
  initialSampleDate,
  initialReportDate,
  onSaved,
}) => {
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
          addedAt,
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
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex flex-wrap items-end gap-2.5">
        <DateField
          icon={Calendar}
          iconColor="text-emerald-600"
          label="Sample Date"
          value={sampleDate}
          onChange={setSampleDate}
        />
        <DateField
          icon={ClipboardList}
          iconColor="text-amber-600"
          label="Report Date"
          value={reportDate}
          onChange={setReportDate}
        />
        <button
          onClick={handleSave}
          disabled={saving || !isDirty || (!sampleDate && !reportDate)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 self-end"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-500 font-medium mt-1.5">{error}</p>}
    </div>
  );
};

const DateField = ({ icon: Icon, iconColor, label, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wide">
      <Icon className={`w-3 h-3 ${iconColor}`} />
      {label}
    </label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 focus:bg-white text-gray-800 cursor-pointer transition-all"
    />
  </div>
);

// ─── Upload / Edit Meta (who + when) ───────────────────────────────────────────

const UploadMeta = ({ completedAt, completedBy, updatedAt, updatedBy }) => {
  if (!completedAt) return null;
  const completed = formatDateTime(completedAt);
  const updated = updatedAt ? formatDateTime(updatedAt) : null;

  return (
    <div className="flex flex-col gap-0.5 mt-1.5 text-[10px] text-gray-400 font-medium">
      <span className="truncate">
        Uploaded by <span className="font-bold text-gray-500">{completedBy?.name ?? "—"}</span> · {completed.date}
      </span>
      {updated && (
        <span className="truncate">
          Edited by <span className="font-bold text-gray-500">{updatedBy?.name ?? "—"}</span> · {updated.date}
        </span>
      )}
    </div>
  );
};

// ─── Test Action Buttons ──────────────────────────────────────────────────────

const TestActions = ({ record, test }) => {
  const { _type, _patientId, displayId } = record;
  const { testId, name, isCompleted, addedAt } = test;

  if (!isCompleted) {
    return (
      <Link
        to="/report-upload"
        state={
          _type === "indoor"
            ? { patientId: _patientId, testId, testName: name, type: "indoor", addedAt }
            : { invoiceId: displayId, testId, testName: name, invoice: record }
        }
        className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white hover:bg-gray-700 text-xs font-bold rounded-xl transition-all shadow-sm"
      >
        <Upload className="w-3 h-3" /> Upload
      </Link>
    );
  }

  const printBase =
    _type === "indoor"
      ? `/report-download?patientId=${_patientId}&testId=${testId}&testName=${encodeURIComponent(name)}&type=indoor&addedAt=${addedAt}`
      : `/report-download?invoiceId=${displayId}&testId=${testId}&testName=${encodeURIComponent(name)}`;

  return (
    <div className="flex items-center gap-1.5">
      <Link
        to={`${printBase}&printType=PAD`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-2 border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 text-xs font-semibold rounded-xl transition-all"
      >
        <Printer className="w-3 h-3" />
        <span className="hidden sm:inline">Pad</span>
      </Link>
      <Link
        to={`${printBase}&printType=PLAIN`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-2 border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 text-xs font-semibold rounded-xl transition-all"
      >
        <Printer className="w-3 h-3" />
        <span className="hidden sm:inline">A4</span>
      </Link>
      <Link
        to="/report-upload"
        state={
          _type === "indoor"
            ? { patientId: _patientId, testId, testName: name, type: "indoor", isEdit: true, addedAt }
            : { invoiceId: displayId, testId, testName: name, invoice: record, isEdit: true }
        }
        className="flex items-center gap-1 px-2.5 py-2 border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 text-xs font-semibold rounded-xl transition-all"
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

  const stripColor = isIndoor
    ? "from-indigo-500 to-purple-500"
    : due > 0
      ? "from-rose-500 to-pink-500"
      : "from-emerald-500 to-teal-500";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      {/* ── Accent strip ── */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${stripColor}`} />

      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
              {isIndoor ? "Admission" : "Invoice"}
            </p>
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-gray-300" />
              <h2 className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-gray-900 tracking-tight">
                {record.displayId}
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 font-medium">
              {date} · {time}
            </p>
          </div>

          {!isIndoor && amount && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Total</p>
              <p className="font-['IBM_Plex_Mono'] text-2xl font-semibold text-gray-900">৳{fmt(final)}</p>
              {final < initial && (
                <p className="font-['IBM_Plex_Mono'] text-xs text-gray-400 line-through">৳{fmt(initial)}</p>
              )}
              <div className="mt-2">
                {due === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Wallet className="w-3 h-3" /> Due ৳{fmt(due)}
                  </span>
                )}
              </div>
            </div>
          )}

          {isIndoor && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Indoor Patient
            </span>
          )}
        </div>
      </div>

      {/* ── Patient Info ── */}
      <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/60">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">রোগীর তথ্য</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
          {[
            { label: "Name", val: record.patient?.name },
            { label: "Contact", val: record.patient?.contactNumber },
            { label: "Gender", val: record.patient?.gender, cap: true },
            { label: "Age", val: record.patient?.age ? `${record.patient.age} yrs` : "—" },
          ].map(({ label, val, cap }) => (
            <div key={label} className="flex items-start gap-3 min-w-0">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className={`text-sm font-bold text-gray-800 truncate ${cap ? "capitalize" : ""}`}>{val || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Online Tests ── */}
      {onlineTests.length > 0 && (
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
              অনলাইন টেস্ট
            </p>
            <div className="flex items-center gap-2.5">
              <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${onlineTests.length > 0 ? (completedCount / onlineTests.length) * 100 : 0}%` }}
                />
              </div>
              <span className="font-['IBM_Plex_Mono'] text-[11px] font-medium text-gray-400 tabular-nums">
                {completedCount}/{onlineTests.length}
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            {onlineTests.map((test, i) => (
              <div
                key={(test.testId ?? "") + (test.addedAt ?? i)}
                className={`rounded-xl border px-4 py-3.5 transition-all ${
                  test.isCompleted
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 pt-0.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        test.isCompleted ? "bg-emerald-100" : "bg-amber-50"
                      }`}
                    >
                      <FlaskConical
                        className={`w-3.5 h-3.5 ${test.isCompleted ? "text-emerald-600" : "text-amber-500"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate leading-snug">{test.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {test.isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                        {test.price != null && (
                          <span className="font-['IBM_Plex_Mono'] text-[10px] text-gray-400 tabular-nums">
                            ৳{fmt(test.price)}
                          </span>
                        )}
                      </div>
                      {test.isCompleted && (
                        <UploadMeta
                          completedAt={test.completedAt}
                          completedBy={test.completedBy}
                          updatedAt={test.updatedAt}
                          updatedBy={test.updatedBy}
                        />
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
                  addedAt={test.addedAt}
                  initialSampleDate={test.report?.sampleCollectionDate}
                  initialReportDate={test.report?.reportDate}
                  onSaved={(dates) => onDatesSaved(test.testId, test.addedAt, dates)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Offline Tests ── */}
      {offlineTests.length > 0 && (
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-4">
            <FileText className="w-3.5 h-3.5 text-gray-400" /> অফলাইন টেস্ট
          </p>
          <div className="space-y-2">
            {offlineTests.map((test, i) => (
              <div
                key={(test.testId ?? "") + (test.addedAt ?? i)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-slate-50/60 transition-all"
              >
                <span className="font-['IBM_Plex_Mono'] text-[10px] font-bold text-gray-300 w-5 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-gray-700 truncate flex-1">{test.name}</span>
                {test.price != null && (
                  <span className="font-['IBM_Plex_Mono'] text-xs font-medium text-gray-400 tabular-nums shrink-0">
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
        console.log(res.data);
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

  // addedAt added as second arg to pinpoint the exact entry
  const handleDatesSaved = (testId, addedAt, dates) => {
    setRecord((prev) => ({
      ...prev,
      tests: prev.tests.map((t) =>
        t.testId !== testId || t.addedAt !== addedAt ? t : { ...t, report: { ...(t.report ?? {}), ...dates } },
      ),
    }));
    setPopup({ type: "success", message: "Dates saved" });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-6">
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.4s cubic-bezier(.22,1,.36,1) both; }
        .fu1 { animation-delay: 60ms; }
        .fu2 { animation-delay: 120ms; }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* ── Page heading ── */}
        <div className="flex items-start justify-between mb-5 fu">
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">রিপোর্ট ম্যানেজমেন্ট</h1>
            <p className="text-xs text-gray-400 font-medium mt-1">ইনভয়েস বা ভর্তি আইডি দিয়ে রিপোর্ট খুঁজুন</p>
          </div>
          <Link
            to="/lab-management"
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-semibold shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> ফিরে যান
          </Link>
        </div>

        {/* ── Search ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm fu fu1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Invoice ID or Admission ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-9 pr-9 py-2.5 text-sm font-medium border border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-300 text-gray-800 bg-gray-50 focus:bg-white font-['IBM_Plex_Mono']"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
              className="px-4 py-2.5 bg-gray-900 text-white hover:bg-gray-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[11px] text-gray-400 font-medium">e.g.</span>
            <span className="font-['IBM_Plex_Mono'] text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
              APX8743
            </span>
            <span className="text-gray-300">·</span>
            <span className="font-['IBM_Plex_Mono'] text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">
              IP482XK
            </span>
          </div>
        </div>

        {/* ── States ── */}
        {searching && <RecordSkeleton />}

        {!searching && invalidId && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm fu fu2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm font-black text-gray-800 mb-1.5">Unrecognized ID format</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Invoice:{" "}
              <span className="font-['IBM_Plex_Mono'] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-lg">
                APX8743
              </span>
              {"  ·  "}
              Admission:{" "}
              <span className="font-['IBM_Plex_Mono'] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-lg">
                IP482XK
              </span>
            </p>
          </div>
        )}

        {!searching && notFound && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm fu fu2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-black text-gray-800 mb-1.5">No record found</p>
            <p className="text-xs text-gray-500">
              Nothing matched{" "}
              <span className="font-['IBM_Plex_Mono'] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-lg">
                #{searchQuery.toUpperCase()}
              </span>
            </p>
          </div>
        )}

        {!searching && record && (
          <div className="fu fu2">
            <RecordDetail record={record} onDatesSaved={handleDatesSaved} />
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 font-medium mt-5 pb-6">
          শুধুমাত্র সক্রিয় রেকর্ড প্রদর্শিত হচ্ছে
        </p>
      </div>
    </section>
  );
};

export default Report;
