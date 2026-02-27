import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Printer, Download, Phone, Mail, MapPin, User, FileText, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { pdf, Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import invoiceService from "../../api/invoice";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";

// ============================================================================
// PDF DOCUMENT DEFINITION
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
  invoiceNumber: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 13 },
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
  divider: { borderTop: "1.5 solid #d1d5db", marginVertical: 5 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  totalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  totalValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#2563eb" },
});

const InvoicePDFDocument = ({ invoiceData, qrCodeUrl, labInfo, formatCurrency, formatDate, formatTime }) => {
  const referrerDiscountAmount =
    invoiceData.hasReferrerDiscount && invoiceData.referrerDiscountPercentage > 0
      ? invoiceData.totalAmount - invoiceData.priceAfterReferrerDiscount
      : 0;
  const showReferrerDiscount = invoiceData.hasReferrerDiscount && referrerDiscountAmount > 0;
  const showLabAdjustment = invoiceData.hasLabAdjustment && invoiceData.labAdjustmentAmount > 0;

  return (
    <Document>
      <Page size="A5" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.headerLeft}>
            <View style={pdfStyles.logoRow}>
              <View style={pdfStyles.logoBox}>
                <Text style={pdfStyles.logoText}>LP</Text>
              </View>
              <View>
                <Text style={pdfStyles.labName}>{labInfo.name}</Text>
                <Text style={pdfStyles.labSub}>Professional Diagnostic Services</Text>
              </View>
            </View>
            <Text style={pdfStyles.headerMeta}>{labInfo.address}</Text>
            <Text style={pdfStyles.headerMeta}>
              {labInfo.phone} • {labInfo.email}
            </Text>
          </View>
          <View style={pdfStyles.headerRight}>
            <View style={pdfStyles.invoiceBadge}>
              <Text style={pdfStyles.invoiceLabel}>Invoice</Text>
              <Text style={pdfStyles.invoiceNumber}>#{invoiceData.invoiceNumber || "1234"}</Text>
            </View>
            <Text style={pdfStyles.dateText}>Date: {formatDate(invoiceData.createdAt)}</Text>
            <Text style={pdfStyles.dateText}>Time: {formatTime(invoiceData.createdAt)}</Text>
          </View>
        </View>
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Patient Information</Text>
          <View style={pdfStyles.patientRow}>
            <View style={pdfStyles.patientGrid}>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Full Name</Text>
                <Text style={pdfStyles.fieldValue}>{invoiceData.patientName}</Text>
              </View>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Gender</Text>
                <Text style={pdfStyles.fieldValue}>{invoiceData.gender}</Text>
              </View>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Age</Text>
                <Text style={pdfStyles.fieldValue}>{invoiceData.age} years</Text>
              </View>
              <View style={pdfStyles.patientField}>
                <Text style={pdfStyles.fieldLabel}>Contact</Text>
                <Text style={pdfStyles.fieldValue}>{invoiceData.contactNumber}</Text>
              </View>
              {invoiceData.referredBy && (
                <View style={pdfStyles.patientFieldFull}>
                  <Text style={pdfStyles.fieldLabel}>Referred By</Text>
                  <Text style={pdfStyles.fieldValue}>
                    {invoiceData.referredBy.name}
                    {invoiceData.referredBy.degree ? ` (${invoiceData.referredBy.degree})` : ""}
                  </Text>
                </View>
              )}
            </View>
            {qrCodeUrl && (
              <View style={pdfStyles.qrContainer}>
                <Image style={pdfStyles.qrImage} src={qrCodeUrl} />
                <Text style={pdfStyles.qrLabel}>Scan to download{"\n"}your reports</Text>
              </View>
            )}
          </View>
        </View>
        <View style={pdfStyles.sectionLast}>
          <Text style={pdfStyles.sectionTitle}>Diagnostic Tests</Text>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.colNum, pdfStyles.colHeader]}>#</Text>
            <Text style={[pdfStyles.colName, pdfStyles.colHeader]}>Test Name</Text>
            <Text style={[pdfStyles.colPrice, pdfStyles.colHeader]}>Price</Text>
          </View>
          {invoiceData.tests?.map((test, index) => (
            <View key={index} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowEven}>
              <Text style={pdfStyles.colNum}>{index + 1}</Text>
              <Text style={pdfStyles.colName}>{test.name}</Text>
              <Text style={pdfStyles.colPrice}>{formatCurrency(test.price)}</Text>
            </View>
          ))}
          <View style={pdfStyles.pricingBox}>
            <View style={pdfStyles.pricingInner}>
              <View style={pdfStyles.pricingRow}>
                <Text style={pdfStyles.pricingLabel}>Subtotal</Text>
                <Text style={pdfStyles.pricingValue}>{formatCurrency(invoiceData.totalAmount)}</Text>
              </View>
              {showReferrerDiscount && (
                <View style={pdfStyles.pricingRow}>
                  <Text style={pdfStyles.pricingLabel}>
                    Referrer Discount ({invoiceData.referrerDiscountPercentage}%)
                  </Text>
                  <Text style={pdfStyles.pricingDiscount}>- {formatCurrency(referrerDiscountAmount)}</Text>
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
            </View>
          </View>
        </View>
      </Page>
    </Document>
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
  const [popup, setPopup] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const labInfo = {
    name: "LabPilot Pro Diagnostics",
    address: "123 Medical Center Road, Dhaka 1207, Bangladesh",
    phone: "+880 1234-567890",
    email: "info@labpilotpro.com",
    website: "www.labpilotpro.com",
  };

  const generateQRCode = async (url) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: { dark: "#2563eb", light: "#ffffff" },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, []); // eslint-disable-line

  const loadInvoiceData = async () => {
    try {
      let data = null;
      if (location.state?.invoiceData) {
        data = location.state.invoiceData;
      } else if (invoiceId) {
        const response = await invoiceService.getInvoiceById(invoiceId);
        data = response.data;
      } else {
        setPopup({ type: "error", message: "No invoice data available" });
        setTimeout(() => navigate("/invoice/new"), 2000);
        setLoading(false);
        return;
      }

      const processedData = {
        _id: data._id || "",
        invoiceNumber: data.invoiceNumber || "",
        patientName: data.patientName || "N/A",
        gender: data.gender || "N/A",
        age: data.age || "N/A",
        contactNumber: data.contactNumber || "N/A",
        referredBy: data.referredBy || null,
        tests: Array.isArray(data.tests) ? data.tests : [],
        totalAmount: Number(data.totalAmount) || 0,
        hasReferrerDiscount: data.hasReferrerDiscount || false,
        referrerDiscountPercentage: Number(data.referrerDiscountPercentage) || 0,
        priceAfterReferrerDiscount: Number(data.priceAfterReferrerDiscount) || Number(data.totalAmount) || 0,
        hasLabAdjustment: data.hasLabAdjustment || false,
        labAdjustmentAmount: Number(data.labAdjustmentAmount) || 0,
        finalPrice: Number(data.finalPrice) || Number(data.totalAmount) || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        reportLink: data.reportLink || data.link || "https://labpilotpro.com",
      };

      setInvoiceData(processedData);
      await generateQRCode(processedData.reportLink);
      setLoading(false);
    } catch (error) {
      console.error("Error loading invoice:", error);
      setPopup({ type: "error", message: "Failed to load invoice data" });
      setTimeout(() => navigate("/invoice/new"), 2000);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "BDT 0";
    return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 }).format(
      numAmount,
    );
  };
  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };
  const formatTime = (date) => {
    if (!date) return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const getFileName = () => `Invoice-${invoiceData.patientName?.replace(/\s+/g, "_") || "patient"}.pdf`;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileName();
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
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

      // Use a hidden iframe so no new window opens
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
    } catch (err) {
      console.error("Print error:", err);
      setPopup({ type: "error", message: "Could not generate PDF for printing" });
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      const pdfBlob = await generatePDFBlob();
      const fileName = `Invoice-${invoiceData.patientName?.replace(/\s+/g, "_") || "patient"}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
      const message =
        `Hello ${invoiceData.patientName},\n\n` +
        `Your diagnostic reports from ${labInfo.name} are ready!\n\n` +
        `Tests: ${invoiceData.tests?.length || 0} test(s)\n` +
        `Total: ${formatCurrency(invoiceData.finalPrice)}\n` +
        `Date: ${formatDate(invoiceData.createdAt)}\n\n` +
        `Download your reports here:\n${invoiceData.reportLink}\n\n` +
        `For queries: ${labInfo.phone}\n— ${labInfo.name}`;

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({ title: `Invoice – ${invoiceData.patientName}`, text: message, files: [pdfFile] });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share error:", error);
        setPopup({ type: "error", message: "Could not share invoice" });
      }
    } finally {
      setSharing(false);
    }
  };

  const generatePDFBlob = async () => {
    const doc = (
      <InvoicePDFDocument
        invoiceData={invoiceData}
        qrCodeUrl={qrCodeUrl}
        labInfo={labInfo}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        formatTime={formatTime}
      />
    );
    return await pdf(doc).toBlob();
  };

  if (loading) return <LoadingScreen message="Loading invoice..." />;
  if (!invoiceData) return null;

  const referrerDiscountAmount =
    invoiceData.hasReferrerDiscount && invoiceData.referrerDiscountPercentage > 0
      ? invoiceData.totalAmount - invoiceData.priceAfterReferrerDiscount
      : 0;
  const showReferrerDiscount = invoiceData.hasReferrerDiscount && referrerDiscountAmount > 0;
  const showLabAdjustment = invoiceData.hasLabAdjustment && invoiceData.labAdjustmentAmount > 0;

  const sharedProps = {
    invoiceData,
    qrCodeUrl,
    labInfo,
    formatCurrency,
    formatDate,
    formatTime,
    showReferrerDiscount,
    showLabAdjustment,
    referrerDiscountAmount,
  };

  return (
    <>
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {/* ── Toolbar ── */}
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
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">{printing ? "Generating..." : "Print"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Screen view (Tailwind, responsive) ── */}
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <ScreenInvoiceCard {...sharedProps} />
          <p className="mt-4 text-center text-sm text-gray-500">
            Use Download for an A5 PDF, or Print to open it ready to print.
          </p>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// SCREEN CARD — Tailwind, mobile-friendly stacked layout
// ============================================================================
const ScreenInvoiceCard = ({
  invoiceData,
  qrCodeUrl,
  labInfo,
  formatCurrency,
  formatDate,
  formatTime,
  showReferrerDiscount,
  showLabAdjustment,
  referrerDiscountAmount,
}) => (
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
              <h1 className="text-lg font-bold text-white leading-tight">{labInfo.name}</h1>
              <p className="text-blue-100 text-xs">Professional Diagnostic Services</p>
            </div>
          </div>
          <div className="mt-2 space-y-1 text-blue-50 text-xs">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{labInfo.address}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 shrink-0" />
                <span>{labInfo.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 shrink-0" />
                <span>{labInfo.email}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="inline-block bg-white/20 px-3 py-1.5 rounded-lg">
            <p className="text-blue-100 text-[10px] uppercase tracking-wide font-medium">Invoice</p>
            <p className="text-white text-lg font-bold">#{invoiceData.invoiceNumber || "1234"}</p>
          </div>
          <div className="mt-2 text-blue-50 text-xs space-y-0.5">
            <p>Date: {formatDate(invoiceData.createdAt)}</p>
            <p>Time: {formatTime(invoiceData.createdAt)}</p>
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
            <p className="text-sm font-medium text-gray-900">{invoiceData.patientName}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Gender</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{invoiceData.gender}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Age</p>
            <p className="text-sm font-medium text-gray-900">{invoiceData.age} years</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Contact</p>
            <p className="text-sm font-medium text-gray-900">{invoiceData.contactNumber}</p>
          </div>
          {invoiceData.referredBy && (
            <div className="col-span-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Referred By</p>
              <p className="text-sm font-medium text-gray-900">
                {invoiceData.referredBy.name}
                {invoiceData.referredBy.degree && (
                  <span className="text-gray-600 font-normal ml-1.5">({invoiceData.referredBy.degree})</span>
                )}
              </p>
            </div>
          )}
        </div>
        {qrCodeUrl && (
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20" />
            <p className="text-[9px] text-gray-500 text-center leading-tight">
              Scan to download
              <br />
              your reports
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Tests */}
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
            {invoiceData.tests?.map((test, i) => (
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
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoiceData.totalAmount)}</span>
          </div>
          {showReferrerDiscount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Referrer Discount ({invoiceData.referrerDiscountPercentage}%)</span>
              <span className="text-red-600">- {formatCurrency(referrerDiscountAmount)}</span>
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
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// (PrintOnlyInvoice removed — PDF is now generated directly via @react-pdf/renderer)
// ============================================================================
const _PrintOnlyInvoice_UNUSED = ({
  invoiceData,
  qrCodeUrl,
  labInfo,
  formatCurrency,
  formatDate,
  formatTime,
  showReferrerDiscount,
  showLabAdjustment,
  referrerDiscountAmount,
}) => {
  return (
    <div
      style={{
        width: "148mm",
        height: "210mm",
        backgroundColor: "#fff",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "9pt",
        color: "#111827",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          backgroundColor: "#2563eb",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                backgroundColor: "rgba(255,255,255,0.22)",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10pt",
                fontWeight: "bold",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              LP
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: "bold", fontSize: "11pt", lineHeight: 1.2 }}>{labInfo.name}</div>
              <div style={{ color: "#bfdbfe", fontSize: "7.5pt" }}>Professional Diagnostic Services</div>
            </div>
          </div>
          <div style={{ color: "#dbeafe", fontSize: "7pt", marginTop: "2px" }}>{labInfo.address}</div>
          <div style={{ color: "#dbeafe", fontSize: "7pt", marginTop: "2px" }}>
            {labInfo.phone} &bull; {labInfo.email}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: "5px",
              padding: "3px 10px",
              display: "inline-block",
              textAlign: "center",
              marginBottom: "5px",
            }}
          >
            <div style={{ color: "#bfdbfe", fontSize: "6.5pt", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Invoice
            </div>
            <div style={{ color: "#fff", fontWeight: "bold", fontSize: "13pt", lineHeight: 1.1 }}>
              #{invoiceData.invoiceNumber || "1234"}
            </div>
          </div>
          <div style={{ color: "#dbeafe", fontSize: "7pt" }}>Date: {formatDate(invoiceData.createdAt)}</div>
          <div style={{ color: "#dbeafe", fontSize: "7pt" }}>Time: {formatTime(invoiceData.createdAt)}</div>
        </div>
      </div>

      {/* ── Patient Information ── */}
      <div
        style={{
          padding: "8px 14px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        {/* Fields grid + QR side by side */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", flex: 1 }}>
            <div>
              <div
                style={{
                  fontSize: "6.5pt",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: "1px",
                }}
              >
                Full Name
              </div>
              <div style={{ fontWeight: "bold", fontSize: "8pt", color: "#111827" }}>{invoiceData.patientName}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "6.5pt",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: "1px",
                }}
              >
                Gender
              </div>
              <div style={{ fontWeight: "bold", fontSize: "8pt", color: "#111827" }}>{invoiceData.gender}</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "6.5pt",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: "1px",
                }}
              >
                Age
              </div>
              <div style={{ fontWeight: "bold", fontSize: "8pt", color: "#111827" }}>{invoiceData.age} years</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "6.5pt",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: "1px",
                }}
              >
                Contact
              </div>
              <div style={{ fontWeight: "bold", fontSize: "8pt", color: "#111827" }}>{invoiceData.contactNumber}</div>
            </div>
            {invoiceData.referredBy && (
              <div style={{ gridColumn: "1 / -1" }}>
                <div
                  style={{
                    fontSize: "6.5pt",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    marginBottom: "1px",
                  }}
                >
                  Referred By
                </div>
                <div style={{ fontWeight: "bold", fontSize: "8pt", color: "#111827" }}>
                  {invoiceData.referredBy.name}
                  {invoiceData.referredBy.degree && (
                    <span style={{ fontWeight: "normal", color: "#6b7280", marginLeft: "5px" }}>
                      ({invoiceData.referredBy.degree})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          {qrCodeUrl && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
              <img src={qrCodeUrl} alt="QR" style={{ width: "68px", height: "68px", display: "block" }} />
              <div style={{ fontSize: "6pt", color: "#6b7280", textAlign: "center", lineHeight: 1.3 }}>
                Scan to download
                <br />
                your reports
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Diagnostic Tests ── */}
      <div style={{ padding: "8px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              backgroundColor: "#eff6ff",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "6px",
              flexShrink: 0,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span style={{ fontWeight: "bold", fontSize: "9pt", color: "#111827" }}>Diagnostic Tests</span>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th
                style={{
                  padding: "4px 6px",
                  fontSize: "6.5pt",
                  fontWeight: "bold",
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                  width: "22px",
                }}
              >
                #
              </th>
              <th
                style={{
                  padding: "4px 6px",
                  fontSize: "6.5pt",
                  fontWeight: "bold",
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Test Name
              </th>
              <th
                style={{
                  padding: "4px 6px",
                  fontSize: "6.5pt",
                  fontWeight: "bold",
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  textAlign: "right",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.tests?.map((test, i) => (
              <tr key={test._id || i} style={i % 2 === 1 ? { backgroundColor: "#f9fafb" } : {}}>
                <td
                  style={{
                    padding: "3.5px 6px",
                    fontSize: "7.5pt",
                    color: "#9ca3af",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {i + 1}
                </td>
                <td
                  style={{
                    padding: "3.5px 6px",
                    fontSize: "7.5pt",
                    color: "#111827",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {test.name}
                </td>
                <td
                  style={{
                    padding: "3.5px 6px",
                    fontSize: "7.5pt",
                    color: "#111827",
                    fontWeight: "bold",
                    textAlign: "right",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  {formatCurrency(test.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pricing summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
          <div style={{ width: "185px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "7.5pt" }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span style={{ fontWeight: "bold", color: "#111827" }}>{formatCurrency(invoiceData.totalAmount)}</span>
            </div>
            {showReferrerDiscount && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "7.5pt" }}>
                <span style={{ color: "#6b7280" }}>Referrer Discount ({invoiceData.referrerDiscountPercentage}%)</span>
                <span style={{ color: "#dc2626" }}>- {formatCurrency(referrerDiscountAmount)}</span>
              </div>
            )}
            {showLabAdjustment && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "7.5pt" }}>
                <span style={{ color: "#6b7280" }}>Lab Adjustment</span>
                <span style={{ color: "#dc2626" }}>- {formatCurrency(invoiceData.labAdjustmentAmount)}</span>
              </div>
            )}
            <div style={{ borderTop: "1.5px solid #d1d5db", margin: "5px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: "bold", fontSize: "9pt", color: "#111827" }}>Total Amount</span>
              <span style={{ fontWeight: "bold", fontSize: "12pt", color: "#2563eb" }}>
                {formatCurrency(invoiceData.finalPrice)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;
