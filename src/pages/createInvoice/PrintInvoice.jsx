import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Printer, Download, Phone, Mail, MapPin, FileText, Share2, Wallet, CheckCircle } from "lucide-react";
import QRCode from "qrcode";
import { pdf, Document, Page, View, Text, Image, StyleSheet, Link, Svg, Path } from "@react-pdf/renderer";
import invoiceService from "../../api/invoice";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";

// ============================================================================
// CONSTANTS
// ============================================================================

const LAB_INFO = {
  name: "LabPilot Pro Diagnostics",
  address: "123 Medical Center Road, Dhaka 1207, Bangladesh",
  phone: "+880 1234-567890",
  email: "info@labpilotpro.com",
};

// ============================================================================
// HELPERS
// ============================================================================

const formatDateTime = (createdAt) => {
  const date = new Date(createdAt);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return {
    date: `${day}${suffix} ${month}, ${year}`,
    time: `${displayHour}:${minutes}${ampm}`,
  };
};

const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "BDT 0";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  }).format(num);
};

/**
 * Normalise raw data from either router state or API response.
 * Both sources send flat patient fields (name, gender, age, contactNumber).
 * We group them into a `patient` object here for consistent internal use.
 */
const processInvoiceData = (data) => ({
  invoiceId: data.invoiceId || "",
  createdAt: data.createdAt || Date.now(),
  // ── patient grouped ──
  patient: {
    name: data.patient.name || "N/A",
    gender: data.patient?.gender || "N/A",
    age: data.patient?.age || "N/A",
    contactNumber: data.patient?.contactNumber || "N/A",
  },
  referrer: data.referrer || null,
  tests: Array.isArray(data.tests) ? data.tests : [],
  totalAmount: Number(data.totalAmount) || 0,
  priceAfterReferrerDiscount: Number(data.priceAfterReferrerDiscount) || Number(data.totalAmount) || 0,
  labAdjustmentAmount: Number(data.labAdjustmentAmount) || 0,
  finalPrice: Number(data.finalPrice) || Number(data.totalAmount) || 0,
  paidAmount: Number(data.paidAmount) || 0,
  reportLink: data.reportLink || data.link || "https://labpilotpro.com",
});

const getPricingFlags = (invoiceData) => {
  const referrerDiscount = Number(invoiceData.referrer?.discount) || 0;
  const showReferrerDiscount = referrerDiscount > 0;
  const showLabAdjustment = Number(invoiceData.labAdjustmentAmount) > 0;
  const showSubtotal = showReferrerDiscount || showLabAdjustment;
  const showReferredBy = Boolean(invoiceData.referrer?.name) && invoiceData.referrer?.type !== "agent";
  const paidAmount = Number(invoiceData.paidAmount) || 0;
  const dueAmount = Math.max(0, invoiceData.finalPrice - paidAmount);
  const isFullyPaid = dueAmount === 0;
  return {
    referrerDiscount,
    showReferrerDiscount,
    showLabAdjustment,
    showSubtotal,
    showReferredBy,
    paidAmount,
    dueAmount,
    isFullyPaid,
  };
};

// ============================================================================
// PDF STYLES
// ============================================================================

const pdfStyles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 9, color: "#111827" },
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
  section: { padding: "12 20", borderBottom: "1 solid #e5e7eb" },
  sectionLast: { padding: "12 20" },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#111827", marginBottom: 8 },
  patientRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  patientGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  patientField: { width: "50%", marginBottom: 6 },
  patientFieldFull: { width: "100%", marginBottom: 6 },
  fieldLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1.5 },
  fieldValue: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#111827" },
  qrContainer: { alignItems: "center", marginLeft: 16 },
  qrImage: { width: 60, height: 60 },
  qrLabel: { fontSize: 6.5, color: "#6b7280", textAlign: "center", marginTop: 3 },
  downloadBtnWrapper: { marginTop: 6, position: "relative" },
  downloadBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 5,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  downloadBtnInner: { flexDirection: "row", alignItems: "center" },
  downloadBtnIcon: { width: 8, height: 8, marginRight: 4 },
  downloadBtnOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  downloadBtnText: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 7 },
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
  pricingBox: { marginTop: 10, alignItems: "flex-end" },
  pricingInner: { width: 220 },
  pricingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  pricingLabel: { fontSize: 8, color: "#6b7280" },
  pricingValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#111827" },
  pricingDiscount: { fontSize: 8, color: "#dc2626" },
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

// ============================================================================
// PDF DOCUMENT
// ============================================================================

const InvoicePDFDocument = ({ invoiceData, qrCodeUrl, invoiceDate, invoiceTime }) => {
  const { patient } = invoiceData;
  const {
    referrerDiscount,
    showReferrerDiscount,
    showLabAdjustment,
    showSubtotal,
    showReferredBy,
    paidAmount,
    dueAmount,
    isFullyPaid,
  } = getPricingFlags(invoiceData);

  return (
    <Document>
      <Page size="A5" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <View style={pdfStyles.logoRow}>
              <View style={pdfStyles.logoBox}>
                <Text style={pdfStyles.logoText}>LP</Text>
              </View>
              <View>
                <Text style={pdfStyles.labName}>{LAB_INFO.name}</Text>
                <Text style={pdfStyles.labSub}>Professional Diagnostic Services</Text>
              </View>
            </View>
            <Text style={pdfStyles.headerMeta}>{LAB_INFO.address}</Text>
            <Text style={pdfStyles.headerMeta}>
              {LAB_INFO.phone} • {LAB_INFO.email}
            </Text>
          </View>
          <View style={pdfStyles.headerRight}>
            <View style={pdfStyles.invoiceBadge}>
              <Text style={pdfStyles.invoiceLabel}>Invoice</Text>
              <Text style={pdfStyles.invoiceId}>#{invoiceData.invoiceId || "N/A"}</Text>
            </View>
            <Text style={pdfStyles.dateText}>Date: {invoiceDate}</Text>
            <Text style={pdfStyles.dateText}>Time: {invoiceTime}</Text>
          </View>
        </View>

        {/* Patient Info */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.patientRow}>
            <View style={pdfStyles.patientGrid}>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Full Name</Text>
                <Text style={pdfStyles.fieldValue}>{patient.name}</Text>
              </View>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Gender</Text>
                <Text style={pdfStyles.fieldValue}>{patient.gender}</Text>
              </View>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Age</Text>
                <Text style={pdfStyles.fieldValue}>{patient.age} years</Text>
              </View>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Contact</Text>
                <Text style={pdfStyles.fieldValue}>{patient.contactNumber}</Text>
              </View>
              {showReferredBy && (
                <View style={pdfStyles.patientFieldFull}>
                  <Text style={pdfStyles.fieldLabel}>Referred By</Text>
                  <Text style={pdfStyles.fieldValue}>{invoiceData.referrer.name}</Text>
                </View>
              )}
            </View>
            {qrCodeUrl && (
              <View style={pdfStyles.qrContainer}>
                <Image style={pdfStyles.qrImage} src={qrCodeUrl} />
                <Text style={pdfStyles.qrLabel}>Scan to download Reports</Text>
                <View style={pdfStyles.downloadBtnWrapper}>
                  <View style={pdfStyles.downloadBtn}>
                    <View style={pdfStyles.downloadBtnInner}>
                      <Svg style={pdfStyles.downloadBtnIcon} viewBox="0 0 24 24">
                        <Path d="M12 16l-6-6h4V4h4v6h4l-6 6z" fill="#ffffff" />
                        <Path d="M20 18H4v2h16v-2z" fill="#ffffff" />
                      </Svg>
                      <Text style={pdfStyles.downloadBtnText}>Click to Download Reports</Text>
                    </View>
                  </View>
                  <Link src={invoiceData.reportLink} style={pdfStyles.downloadBtnOverlay}>
                    <Text> </Text>
                  </Link>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Tests & Pricing */}
        <View style={pdfStyles.sectionLast}>
          <Text style={pdfStyles.sectionTitle}>Diagnostic Tests</Text>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.colNum, pdfStyles.colHeader]}>#</Text>
            <Text style={[pdfStyles.colName, pdfStyles.colHeader]}>Test Name</Text>
            <Text style={[pdfStyles.colPrice, pdfStyles.colHeader]}>Price</Text>
          </View>
          {invoiceData.tests.map((test, i) => (
            <View key={i} style={i % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowEven}>
              <Text style={pdfStyles.colNum}>{i + 1}</Text>
              <Text style={pdfStyles.colName}>{test.name}</Text>
              <Text style={pdfStyles.colPrice}>{formatCurrency(test.price)}</Text>
            </View>
          ))}
          <View style={pdfStyles.pricingBox}>
            <View style={pdfStyles.pricingInner}>
              {showSubtotal && (
                <View style={pdfStyles.pricingRow}>
                  <Text style={pdfStyles.pricingLabel}>Subtotal</Text>
                  <Text style={pdfStyles.pricingValue}>{formatCurrency(invoiceData.totalAmount)}</Text>
                </View>
              )}
              {showReferrerDiscount && (
                <View style={pdfStyles.pricingRow}>
                  <Text style={pdfStyles.pricingLabel}>Referrer Discount</Text>
                  <Text style={pdfStyles.pricingDiscount}>- {formatCurrency(referrerDiscount)}</Text>
                </View>
              )}
              {showLabAdjustment && (
                <View style={pdfStyles.pricingRow}>
                  <Text style={pdfStyles.pricingLabel}>Lab Adjustment</Text>
                  <Text style={pdfStyles.pricingDiscount}>- {formatCurrency(invoiceData.labAdjustmentAmount)}</Text>
                </View>
              )}
              <View style={pdfStyles.divider} />
              <View style={pdfStyles.totalRow}>
                <Text style={pdfStyles.totalLabel}>Total Amount</Text>
                <Text style={pdfStyles.totalValue}>{formatCurrency(invoiceData.finalPrice)}</Text>
              </View>
              <View style={pdfStyles.dashedDivider} />
              <View style={pdfStyles.pricingRow}>
                <Text style={pdfStyles.pricingLabel}>Paid Amount</Text>
                <Text style={pdfStyles.pricingPaid}>{formatCurrency(paidAmount)}</Text>
              </View>
              {!isFullyPaid && (
                <View style={pdfStyles.pricingRow}>
                  <Text style={pdfStyles.pricingLabel}>Due Amount</Text>
                  <Text style={pdfStyles.pricingDue}>{formatCurrency(dueAmount)}</Text>
                </View>
              )}
              {isFullyPaid && (
                <View style={pdfStyles.paidBadge}>
                  <Text style={pdfStyles.paidBadgeText}>✓ FULLY PAID</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ============================================================================
// INVOICE SCREEN CARD
// ============================================================================

const InvoiceCard = ({ invoiceData, qrCodeUrl, invoiceDate, invoiceTime }) => {
  const { patient } = invoiceData;
  const {
    referrerDiscount,
    showReferrerDiscount,
    showLabAdjustment,
    showSubtotal,
    showReferredBy,
    paidAmount,
    dueAmount,
    isFullyPaid,
  } = getPricingFlags(invoiceData);

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
              <p className="text-white text-lg font-bold">#{invoiceData.invoiceId || "N/A"}</p>
            </div>
            <div className="mt-2 text-blue-50 text-xs space-y-0.5">
              <p>Date: {invoiceDate}</p>
              <p>Time: {invoiceTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Full Name</p>
              <p className="text-sm font-medium text-gray-900">{patient.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Gender</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{patient.gender}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Age</p>
              <p className="text-sm font-medium text-gray-900">{patient.age} years</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Contact</p>
              <p className="text-sm font-medium text-gray-900">{patient.contactNumber}</p>
            </div>
            {showReferredBy && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Referred By</p>
                <p className="text-sm font-medium text-gray-900">{invoiceData.referrer.name}</p>
              </div>
            )}
          </div>
          {qrCodeUrl && (
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
              <p className="text-[9px] text-gray-500 text-center leading-tight">Scan to download Reports</p>

              <a
                href={invoiceData.reportLink}
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

      {/* Tests & Pricing */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-blue-50 rounded-lg">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Diagnostic Tests</h2>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-8">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Test Name</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoiceData.tests.map((test, i) => (
                <tr key={test._id || i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-900">{test.name}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(test.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex justify-end">
          <div className="w-64 space-y-1.5">
            {showSubtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoiceData.totalAmount)}</span>
              </div>
            )}
            {showReferrerDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Referrer Discount</span>
                <span className="text-red-600">- {formatCurrency(referrerDiscount)}</span>
              </div>
            )}
            {showLabAdjustment && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Lab Adjustment</span>
                <span className="text-red-600">- {formatCurrency(invoiceData.labAdjustmentAmount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t-2 border-gray-200">
              <span className="text-base font-semibold text-gray-900">Total Amount</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(invoiceData.finalPrice)}</span>
            </div>
            <div className="pt-2 border-t border-dashed border-gray-300 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-green-600" /> Paid Amount
                </span>
                <span className="font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              {!isFullyPaid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Amount</span>
                  <span className="font-semibold text-red-600">{formatCurrency(dueAmount)}</span>
                </div>
              )}
              {isFullyPaid && (
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PrintInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { invoiceId } = useParams();

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [popup, setPopup] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  useEffect(() => {
    const load = async () => {
      try {
        let raw = null;
        if (location.state?.invoiceData) {
          raw = location.state.invoiceData;
        } else if (invoiceId) {
          const res = await invoiceService.getInvoiceByInvoiceId(invoiceId);
          raw = res.data;
        } else {
          setPopup({ type: "error", message: "No invoice data available" });
          setTimeout(() => navigate("/invoice/new"), 2000);
          return;
        }

        const processed = processInvoiceData(raw);
        setInvoiceData(processed);

        const qrDataUrl = await QRCode.toDataURL(processed.reportLink, {
          width: 200,
          margin: 1,
          color: { dark: "#2563eb", light: "#ffffff" },
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error("Error loading invoice:", error);
        setPopup({ type: "error", message: "Failed to load invoice data" });
        setTimeout(() => navigate("/invoice/new"), 2000);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []); // eslint-disable-line

  // ── PDF utils ──────────────────────────────────────────────────────────────

  const generatePDFBlob = async () => {
    const { date: invoiceDate, time: invoiceTime } = formatDateTime(invoiceData.createdAt);
    return pdf(
      <InvoicePDFDocument
        invoiceData={invoiceData}
        qrCodeUrl={qrCodeUrl}
        invoiceDate={invoiceDate}
        invoiceTime={invoiceTime}
      />,
    ).toBlob();
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileName = () => `Invoice-${invoiceData.patient.name?.replace(/\s+/g, "_") || "patient"}.pdf`;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    try {
      setDownloading(true);
      downloadBlob(await generatePDFBlob(), getFileName());
    } catch {
      setPopup({ type: "error", message: "Could not generate PDF" });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            URL.revokeObjectURL(url);
          }, 60000);
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
      const { date: invoiceDate } = formatDateTime(invoiceData.createdAt);
      const message =
        `Hello ${invoiceData.patient.name},\n\n` +
        `Your diagnostic reports from ${LAB_INFO.name} are ready!\n\n` +
        `Tests: ${invoiceData.tests?.length || 0} test(s)\n` +
        `Total: ${formatCurrency(invoiceData.finalPrice)}\n` +
        `Date: ${invoiceDate}\n\n` +
        `Download your reports here:\n${invoiceData.reportLink}\n\n` +
        `For queries: ${LAB_INFO.phone}\n— ${LAB_INFO.name}`;

      const pdfBlob = await generatePDFBlob();
      const fileName = getFileName();
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.share) {
        const canShareFile = navigator.canShare?.({ files: [pdfFile] });
        await navigator.share({
          title: `Invoice – ${invoiceData.patient.name}`,
          text: message,
          ...(canShareFile ? { files: [pdfFile] } : {}),
        });
        if (!canShareFile) downloadBlob(pdfBlob, fileName);
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
        downloadBlob(pdfBlob, fileName);
      }
    } catch (error) {
      if (error.name !== "AbortError") setPopup({ type: "error", message: "Could not share invoice" });
    } finally {
      setSharing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingScreen message="Loading invoice..." />;
  if (!invoiceData) return null;

  const { date: invoiceDate, time: invoiceTime } = formatDateTime(invoiceData.createdAt);

  return (
    <>
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="py-4 flex justify-center">
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors border border-gray-300"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">{sharing ? "Preparing..." : "Share"}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors border border-gray-300"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">{downloading ? "Generating..." : "Download"}</span>
            </button>
            {!isMobile && (
              <button
                onClick={handlePrint}
                disabled={printing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="text-sm font-medium">{printing ? "Generating..." : "Print"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <InvoiceCard
            invoiceData={invoiceData}
            qrCodeUrl={qrCodeUrl}
            invoiceDate={invoiceDate}
            invoiceTime={invoiceTime}
          />
        </div>
      </div>
    </>
  );
};

export default PrintInvoice;
