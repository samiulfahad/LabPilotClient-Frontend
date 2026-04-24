/**
 * useCallback / useMemo are intentionally absent throughout this file.
 * babel-plugin-react-compiler handles all memoization automatically.
 */
import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Printer, Download, Phone, Mail, MapPin, Share2, Wallet, CheckCircle } from "lucide-react";
import QRCode from "qrcode";
import { pdf, Document, Page, View, Text, Image, StyleSheet, Link, Svg, Path } from "@react-pdf/renderer";
import invoiceService from "../../api/invoice";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";

// ─── Constants ────────────────────────────────────────────────────────────────

const LAB_INFO = {
  name: "LabPilot Pro Diagnostics",
  address: "123 Medical Center Road, Dhaka 1207, Bangladesh",
  phone: "+880 1234-567890",
  email: "info@labpilotpro.com",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(
    isNaN(Number(n)) ? 0 : Number(n),
  );

const formatDateTime = (ts) => {
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

/** Normalise raw data from either router state or API response into a consistent shape. */
const normaliseInvoice = (raw) => ({
  invoiceId: raw.invoiceId || "",
  createdAt: raw.createdAt || Date.now(),
  patient: {
    name: raw.patient?.name || "N/A",
    gender: raw.patient?.gender || "N/A",
    age: raw.patient?.age || "N/A",
    contactNumber: raw.patient?.contactNumber || "N/A",
  },
  referrer: raw.referrer || null,
  tests: Array.isArray(raw.tests) ? raw.tests : [],
  products: Array.isArray(raw.products) ? raw.products : [],
  amount: {
    initial: Number(raw.amount?.initial) || 0,
    referrerDiscount: Number(raw.amount?.referrerDiscount) || 0,
    labAdjustment: Number(raw.amount?.labAdjustment) || 0,
    afterLabAdjustmentAndReferrerDiscount: Number(raw.amount?.afterLabAdjustmentAndReferrerDiscount) || 0,
    final: Number(raw.amount?.final) || 0,
    paid: Number(raw.amount?.paid) || 0,
  },
  reportLink: raw.reportLink || raw.link || "https://labpilotpro.com",
});

/** Derive display flags from the normalised invoice. */
const getPricingFlags = ({ amount, referrer }) => {
  const due = Math.max(0, amount.final - amount.paid);
  return {
    showReferrerDiscount: amount.referrerDiscount > 0,
    showLabAdjustment: amount.labAdjustment > 0,
    showSubtotal: amount.referrerDiscount > 0 || amount.labAdjustment > 0,
    showReferredBy: Boolean(referrer?.name) && referrer?.type !== "agent",
    due,
    isFullyPaid: due === 0,
  };
};

// ─── PDF styles ───────────────────────────────────────────────────────────────

const pdf$ = StyleSheet.create({
  page: { backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 9, color: "#111827" },
  // header
  header: {
    backgroundColor: "#2563eb",
    padding: "16 20",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: { flex: 1 },
  logoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logoBox: {
    width: 28,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 11 },
  labName: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 13 },
  labSub: { color: "#bfdbfe", fontSize: 8 },
  headerMeta: { color: "#dbeafe", fontSize: 7.5, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  invoiceBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    padding: "4 10",
    alignItems: "center",
    marginBottom: 6,
  },
  invoiceLabel: { color: "#bfdbfe", fontSize: 7, textTransform: "uppercase", letterSpacing: 0.5 },
  invoiceId: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 13 },
  dateText: { color: "#dbeafe", fontSize: 7.5 },
  // sections
  section: { padding: "12 20", borderBottom: "1 solid #e5e7eb" },
  sectionLast: { padding: "12 20" },
  // patient grid
  patientRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  patientGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  patientField: { width: "50%", marginBottom: 6 },
  patientFieldFull: { width: "100%", marginBottom: 6 },
  fieldLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1.5 },
  fieldValue: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#111827" },
  // QR
  qrContainer: { alignItems: "center", marginLeft: 16 },
  qrImage: { width: 60, height: 60 },
  qrLabel: { fontSize: 6.5, color: "#6b7280", textAlign: "center", marginTop: 3 },
  dlBtnWrapper: { marginTop: 6, position: "relative" },
  dlBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 5,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  dlBtnInner: { flexDirection: "row", alignItems: "center" },
  dlBtnIcon: { width: 8, height: 8, marginRight: 4 },
  dlBtnOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  dlBtnText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7 },
  // table
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "5 8", borderBottom: "1 solid #e5e7eb" },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottom: "1 solid #f3f4f6" },
  tableRowEven: { flexDirection: "row", padding: "5 8", borderBottom: "1 solid #f3f4f6", backgroundColor: "#fafafa" },
  colNum: { width: "8%", fontSize: 8, color: "#6b7280" },
  colName: { flex: 1, fontSize: 8 },
  colPrice: { width: "25%", fontSize: 8, textAlign: "right", fontFamily: "Helvetica-Bold" },
  colHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  // pricing
  pricingBox: { marginTop: 10, alignItems: "flex-end" },
  pricingInner: { width: 220 },
  pricingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  pricingLabel: { fontSize: 8, color: "#6b7280" },
  pricingValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111827" },
  pricingNeg: { fontSize: 8, color: "#dc2626" },
  pricingPaid: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  pricingDue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#dc2626" },
  divider: { borderTop: "1.5 solid #d1d5db", marginVertical: 5 },
  dashedDivider: { borderTop: "1 dashed #d1d5db", marginVertical: 5 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  totalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#2563eb" },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 6,
    padding: "4 8",
    backgroundColor: "#dcfce7",
    borderRadius: 4,
  },
  paidBadgeText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#16a34a" },
});

// ─── PDF Document ─────────────────────────────────────────────────────────────

const InvoicePDF = ({ invoice, qrCodeUrl, date, time }) => {
  const { patient, amount, referrer, tests, products, reportLink, invoiceId } = invoice;
  const flags = getPricingFlags(invoice);
  const hasProducts = products.length > 0;

  return (
    <Document>
      <Page size="A5" style={pdf$.page}>
        {/* Header */}
        <View style={pdf$.header}>
          <View style={pdf$.headerLeft}>
            <View style={pdf$.logoRow}>
              <View style={pdf$.logoBox}>
                <Text style={pdf$.logoText}>LP</Text>
              </View>
              <View>
                <Text style={pdf$.labName}>{LAB_INFO.name}</Text>
                <Text style={pdf$.labSub}>Professional Diagnostic Services</Text>
              </View>
            </View>
            <Text style={pdf$.headerMeta}>{LAB_INFO.address}</Text>
            <Text style={pdf$.headerMeta}>
              {LAB_INFO.phone} • {LAB_INFO.email}
            </Text>
          </View>
          <View style={pdf$.headerRight}>
            <View style={pdf$.invoiceBadge}>
              <Text style={pdf$.invoiceLabel}>Invoice</Text>
              <Text style={pdf$.invoiceId}>#{invoiceId || "N/A"}</Text>
            </View>
            <Text style={pdf$.dateText}>Date: {date}</Text>
            <Text style={pdf$.dateText}>Time: {time}</Text>
          </View>
        </View>

        {/* Patient */}
        <View style={pdf$.section}>
          <View style={pdf$.patientRow}>
            <View style={pdf$.patientGrid}>
              <PDFField label="Full Name" value={patient.name} style={pdf$.patientField} />
              <PDFField label="Gender" value={patient.gender} style={pdf$.patientField} />
              <PDFField label="Age" value={`${patient.age} years`} style={pdf$.patientField} />
              <PDFField label="Contact" value={patient.contactNumber} style={pdf$.patientField} />
              {flags.showReferredBy && (
                <PDFField label="Referred By" value={referrer.name} style={pdf$.patientFieldFull} />
              )}
            </View>
            {qrCodeUrl && (
              <View style={pdf$.qrContainer}>
                <Image style={pdf$.qrImage} src={qrCodeUrl} />
                <Text style={pdf$.qrLabel}>Scan to download Reports</Text>
                <View style={pdf$.dlBtnWrapper}>
                  <View style={pdf$.dlBtn}>
                    <View style={pdf$.dlBtnInner}>
                      <Svg style={pdf$.dlBtnIcon} viewBox="0 0 24 24">
                        <Path d="M12 16l-6-6h4V4h4v6h4l-6 6z" fill="#ffffff" />
                        <Path d="M20 18H4v2h16v-2z" fill="#ffffff" />
                      </Svg>
                      <Text style={pdf$.dlBtnText}>Click to Download Reports</Text>
                    </View>
                  </View>
                  <Link src={reportLink} style={pdf$.dlBtnOverlay}>
                    <Text> </Text>
                  </Link>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Tests & Products & Pricing */}
        <View style={pdf$.sectionLast}>
          {/* Unified table header */}
          <View style={pdf$.tableHeader}>
            <Text style={[pdf$.colNum, pdf$.colHeader]}>#</Text>
            <Text style={[pdf$.colName, pdf$.colHeader]}>Item</Text>
            <Text style={[pdf$.colPrice, pdf$.colHeader]}>Price</Text>
          </View>

          {/* Tests category label — only when products also exist */}
          {hasProducts && (
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#eff6ff",
                padding: "3 8",
                borderBottom: "1 solid #e5e7eb",
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: "Helvetica-Bold",
                  color: "#2563eb",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Diagnostic Tests
              </Text>
            </View>
          )}
          {tests.map((t, i) => (
            <View key={i} style={i % 2 === 0 ? pdf$.tableRow : pdf$.tableRowEven}>
              <Text style={pdf$.colNum}>{i + 1}</Text>
              <Text style={pdf$.colName}>{t.name}</Text>
              <Text style={pdf$.colPrice}>{fmt(t.price)}</Text>
            </View>
          ))}

          {/* Products */}
          {hasProducts && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#f0fdf4",
                  padding: "3 8",
                  borderBottom: "1 solid #e5e7eb",
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    fontFamily: "Helvetica-Bold",
                    color: "#16a34a",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Products
                </Text>
              </View>
              {products.map((p, i) => {
                const qty = p.quantity ?? 1;
                const unitPrice = p.price ?? 0;
                const lineTotal = unitPrice * qty;
                const label = qty > 1 ? `${p.name} (${qty} × ${fmt(unitPrice)})` : p.name;
                return (
                  <View key={i} style={i % 2 === 0 ? pdf$.tableRow : pdf$.tableRowEven}>
                    <Text style={pdf$.colNum}>{i + 1}</Text>
                    <Text style={pdf$.colName}>{label}</Text>
                    <Text style={pdf$.colPrice}>{fmt(lineTotal)}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Pricing summary */}
          <View style={pdf$.pricingBox}>
            <View style={pdf$.pricingInner}>
              {flags.showSubtotal && (
                <PDFPricingRow label="Subtotal" value={fmt(amount.initial)} valueStyle={pdf$.pricingValue} />
              )}
              {flags.showReferrerDiscount && (
                <PDFPricingRow
                  label="Referrer Discount"
                  value={`- ${fmt(amount.referrerDiscount)}`}
                  valueStyle={pdf$.pricingNeg}
                />
              )}
              {flags.showLabAdjustment && (
                <PDFPricingRow
                  label="Lab Adjustment"
                  value={`- ${fmt(amount.labAdjustment)}`}
                  valueStyle={pdf$.pricingNeg}
                />
              )}
              <View style={pdf$.divider} />
              <View style={pdf$.totalRow}>
                <Text style={pdf$.totalLabel}>Total Amount</Text>
                <Text style={pdf$.totalValue}>{fmt(amount.final)}</Text>
              </View>
              <View style={pdf$.dashedDivider} />
              <PDFPricingRow label="Paid Amount" value={fmt(amount.paid)} valueStyle={pdf$.pricingPaid} />
              {!flags.isFullyPaid && (
                <PDFPricingRow label="Due Amount" value={fmt(flags.due)} valueStyle={pdf$.pricingDue} />
              )}
              {flags.isFullyPaid && (
                <View style={pdf$.paidBadge}>
                  <Text style={pdf$.paidBadgeText}>✓ FULLY PAID</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Small stateless helpers used only inside the PDF
const PDFField = ({ label, value, style }) => (
  <View style={style}>
    <Text style={pdf$.fieldLabel}>{label}</Text>
    <Text style={pdf$.fieldValue}>{value}</Text>
  </View>
);

const PDFPricingRow = ({ label, value, valueStyle }) => (
  <View style={pdf$.pricingRow}>
    <Text style={pdf$.pricingLabel}>{label}</Text>
    <Text style={valueStyle}>{value}</Text>
  </View>
);

// ─── Invoice screen card ──────────────────────────────────────────────────────

const InvoiceCard = ({ invoice, qrCodeUrl, date, time }) => {
  const { patient, amount, referrer, tests, products, reportLink, invoiceId } = invoice;
  const flags = getPricingFlags(invoice);
  const hasProducts = products.length > 0;

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 shrink-0 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-white leading-tight">{LAB_INFO.name}</h1>
                <p className="text-blue-100 text-xs">Professional Diagnostic Services</p>
              </div>
            </div>
            <div className="mt-2 space-y-1 text-blue-50 text-xs">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{LAB_INFO.address}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{LAB_INFO.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span>{LAB_INFO.email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="inline-block bg-white/20 px-3 py-1.5 rounded-lg">
              <p className="text-blue-100 text-[10px] uppercase tracking-wide font-medium">Invoice</p>
              <p className="text-white text-lg font-bold">#{invoiceId || "N/A"}</p>
            </div>
            <div className="mt-2 text-blue-50 text-xs space-y-0.5">
              <p>Date: {date}</p>
              <p>Time: {time}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
            <PatientField label="Full Name" value={patient.name} />
            <PatientField label="Gender" value={<span className="capitalize">{patient.gender}</span>} />
            <PatientField label="Age" value={`${patient.age} years`} />
            <PatientField label="Contact" value={patient.contactNumber} />
            {flags.showReferredBy && (
              <div className="col-span-2">
                <PatientField label="Referred By" value={referrer.name} />
              </div>
            )}
          </div>
          {qrCodeUrl && (
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
              <p className="text-[9px] text-gray-500 text-center leading-tight">Scan to download Reports</p>
              <a
                href={reportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded-md transition-colors"
              >
                <Download className="w-2.5 h-2.5" />
                Click to Download Reports
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tests & Products & Pricing */}
      <div className="px-6 py-4">
        {/* Unified items table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-8">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hasProducts && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-1 bg-blue-50 text-[10px] font-semibold text-blue-600 uppercase tracking-wider"
                  >
                    Diagnostic Tests
                  </td>
                </tr>
              )}
              {tests.map((t, i) => (
                <tr key={t._id || i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-900">{t.name}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-900 text-right font-medium">{fmt(t.price)}</td>
                </tr>
              ))}
              {hasProducts && (
                <>
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-1 bg-green-50 text-[10px] font-semibold text-green-700 uppercase tracking-wider"
                    >
                      Products
                    </td>
                  </tr>
                  {products.map((p, i) => {
                    const qty = p.quantity ?? 1;
                    const unitPrice = p.price ?? 0;
                    const lineTotal = unitPrice * qty;
                    const label =
                      qty > 1 ? (
                        <>
                          {p.name}{" "}
                          <span className="text-gray-400 font-normal">
                            ({qty} × {fmt(unitPrice)})
                          </span>
                        </>
                      ) : (
                        p.name
                      );
                    return (
                      <tr key={p._id || p.productId || i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-900">{label}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-900 text-right font-medium">{fmt(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pricing summary */}
        <div className="mt-3 flex justify-end">
          <div className="w-64 space-y-1.5">
            {flags.showSubtotal && <PricingRow label="Subtotal" value={fmt(amount.initial)} />}
            {flags.showReferrerDiscount && (
              <PricingRow
                label="Referrer Discount"
                value={`- ${fmt(amount.referrerDiscount)}`}
                valueClass="text-red-600"
              />
            )}
            {flags.showLabAdjustment && (
              <PricingRow label="Lab Adjustment" value={`- ${fmt(amount.labAdjustment)}`} valueClass="text-red-600" />
            )}
            <div className="flex justify-between pt-2 border-t-2 border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total Amount</span>
              <span className="text-lg font-bold text-blue-600">{fmt(amount.final)}</span>
            </div>
            <div className="pt-2 border-t border-dashed border-gray-300 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-green-600" /> Paid Amount
                </span>
                <span className="font-semibold text-green-600">{fmt(amount.paid)}</span>
              </div>
              {!flags.isFullyPaid && (
                <PricingRow label="Due Amount" value={fmt(flags.due)} valueClass="font-semibold text-red-600" />
              )}
              {flags.isFullyPaid && (
                <div className="flex items-center justify-end gap-1.5 py-1 px-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-700 text-xs font-semibold tracking-wide uppercase">Fully Paid</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small stateless helpers used only inside InvoiceCard
const PatientField = ({ label, value }) => (
  <div>
    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value}</p>
  </div>
);

const PricingRow = ({ label, value, valueClass = "font-medium text-gray-900" }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">{label}</span>
    <span className={valueClass}>{value}</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const PrintInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [popup, setPopup] = useState(null);

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  useEffect(() => {
    const load = async () => {
      try {
        let raw = location.state?.invoiceData ?? null;
        if (!raw) {
          if (!invoiceId) {
            setPopup({ type: "error", message: "No invoice data available" });
            setTimeout(() => navigate("/invoice/new"), 2000);
            return;
          }
          raw = (await invoiceService.getInvoiceByInvoiceId(invoiceId)).data;
        }

        const normalised = normaliseInvoice(raw);
        setInvoice(normalised);

        setQrCodeUrl(
          await QRCode.toDataURL(normalised.reportLink, {
            width: 200,
            margin: 1,
            color: { dark: "#2563eb", light: "#ffffff" },
          }),
        );
      } catch {
        setPopup({ type: "error", message: "Failed to load invoice data" });
        setTimeout(() => navigate("/invoice/new"), 2000);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  // ── PDF helpers ────────────────────────────────────────────────────────────

  const buildPDF = () => {
    const { date, time } = formatDateTime(invoice.createdAt);
    return pdf(<InvoicePDF invoice={invoice} qrCodeUrl={qrCodeUrl} date={date} time={time} />).toBlob();
  };

  const triggerDownload = (blob, name) => {
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: name, style: "display:none" }).dispatchEvent(
      new MouseEvent("click"),
    );
    URL.revokeObjectURL(url);
  };

  const pdfName = () => `Invoice-${invoice.patient.name?.replace(/\s+/g, "_") || "patient"}.pdf`;

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleDownload = async () => {
    try {
      setDownloading(true);
      triggerDownload(await buildPDF(), pdfName());
    } catch {
      setPopup({ type: "error", message: "Could not generate PDF" });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const url = URL.createObjectURL(await buildPDF());
      const iframe = Object.assign(document.createElement("iframe"), {
        src: url,
        style: "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;",
      });
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 60_000);
        }, 500);
      };
    } catch {
      setPopup({ type: "error", message: "Could not generate PDF for printing" });
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      const { date } = formatDateTime(invoice.createdAt);
      const message =
        `Hello ${invoice.patient.name},\n\n` +
        `Your diagnostic reports from ${LAB_INFO.name} are ready!\n\n` +
        `Tests: ${invoice.tests.length} test(s)\n` +
        (invoice.products.length > 0 ? `Products: ${invoice.products.length} item(s)\n` : "") +
        `Total: ${fmt(invoice.amount.final)}\n` +
        `Date: ${date}\n\n` +
        `Download your reports here:\n${invoice.reportLink}\n\n` +
        `For queries: ${LAB_INFO.phone}\n— ${LAB_INFO.name}`;

      const blob = await buildPDF();
      const name = pdfName();
      const file = new File([blob], name, { type: "application/pdf" });

      if (navigator.share) {
        const canShare = navigator.canShare?.({ files: [file] });
        await navigator.share({
          title: `Invoice – ${invoice.patient.name}`,
          text: message,
          ...(canShare ? { files: [file] } : {}),
        });
        if (!canShare) triggerDownload(blob, name);
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
        triggerDownload(blob, name);
      }
    } catch (err) {
      if (err.name !== "AbortError") setPopup({ type: "error", message: "Could not share invoice" });
    } finally {
      setSharing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingScreen message="Loading invoice..." />;
  if (!invoice) return null;

  const { date, time } = formatDateTime(invoice.createdAt);

  return (
    <>
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {/* Action bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="py-4 flex justify-center">
          <div className="flex items-center gap-3">
            <ActionButton
              onClick={handleShare}
              disabled={sharing}
              icon={Share2}
              label="Share"
              busy={sharing}
              busyLabel="Preparing..."
            />
            <ActionButton
              onClick={handleDownload}
              disabled={downloading}
              icon={Download}
              label="Download"
              busy={downloading}
              busyLabel="Generating..."
            />
            {!isMobile && (
              <ActionButton
                onClick={handlePrint}
                disabled={printing}
                icon={Printer}
                label="Print"
                busy={printing}
                busyLabel="Generating..."
                primary
              />
            )}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <InvoiceCard invoice={invoice} qrCodeUrl={qrCodeUrl} date={date} time={time} />
        </div>
      </div>
    </>
  );
};

const ActionButton = ({ onClick, disabled, icon: Icon, label, busy, busyLabel, primary = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
      primary
        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
    }`}
  >
    <Icon className="w-4 h-4" />
    {busy ? busyLabel : label}
  </button>
);

export default PrintInvoice;
