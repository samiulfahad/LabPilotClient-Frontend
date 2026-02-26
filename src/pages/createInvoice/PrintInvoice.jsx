import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Printer, Download, ArrowLeft, Phone, Mail, MapPin, User, FileText, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { pdf, Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import invoiceService from "../../api/invoice";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";

// ============================================================================
// PDF DOCUMENT DEFINITION
// ============================================================================
const pdfStyles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 9, color: "#111827" },
  // Header
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
  // Section
  section: { padding: "12 20", borderBottom: "1 solid #e5e7eb" },
  sectionLast: { padding: "12 20" },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 9, color: "#111827", marginBottom: 8 },
  // Patient
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
  // Table
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
  // Pricing
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
        {/* Header */}
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
              <Text style={pdfStyles.invoiceNumber}>#1234</Text>
            </View>
            <Text style={pdfStyles.dateText}>Date: {formatDate(invoiceData.createdAt)}</Text>
            <Text style={pdfStyles.dateText}>Time: {formatTime(invoiceData.createdAt)}</Text>
          </View>
        </View>

        {/* Patient Info */}
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

        {/* Tests */}
        <View style={pdfStyles.sectionLast}>
          <Text style={pdfStyles.sectionTitle}>Diagnostic Tests</Text>
          {/* Table Header */}
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.colNum, pdfStyles.colHeader]}>#</Text>
            <Text style={[pdfStyles.colName, pdfStyles.colHeader]}>Test Name</Text>
            <Text style={[pdfStyles.colPrice, pdfStyles.colHeader]}>Price</Text>
          </View>
          {/* Table Rows */}
          {invoiceData.tests?.map((test, index) => (
            <View key={index} style={index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowEven}>
              <Text style={pdfStyles.colNum}>{index + 1}</Text>
              <Text style={pdfStyles.colName}>{test.name}</Text>
              <Text style={pdfStyles.colPrice}>{formatCurrency(test.price)}</Text>
            </View>
          ))}

          {/* Pricing Summary */}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handlePrint = () => window.print();
  const handleDownload = () => window.print();

  // Generate PDF blob using @react-pdf/renderer
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

  const handleShare = async () => {
    try {
      setSharing(true);
      const pdfBlob = await generatePDFBlob();
      const fileName = `Invoice-${invoiceData.patientName?.replace(/\s+/g, "_") || "patient"}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        // Native share sheet on mobile — WhatsApp, Messenger, email, etc.
        await navigator.share({
          title: `Invoice - ${invoiceData.patientName}`,
          files: [pdfFile],
        });
      } else {
        // Desktop fallback: download the PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        setPopup({ type: "success", message: "PDF downloaded — attach it manually to share" });
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

  if (loading) return <LoadingScreen message="Loading invoice..." />;
  if (!invoiceData) return null;

  const referrerDiscountAmount =
    invoiceData.hasReferrerDiscount && invoiceData.referrerDiscountPercentage > 0
      ? invoiceData.totalAmount - invoiceData.priceAfterReferrerDiscount
      : 0;
  const showReferrerDiscount = invoiceData.hasReferrerDiscount && referrerDiscountAmount > 0;
  const showLabAdjustment = invoiceData.hasLabAdjustment && invoiceData.labAdjustmentAmount > 0;

  return (
    <>
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}

      {/* Action Buttons - Hidden on Print */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

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
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span className="text-sm font-medium">Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Container */}
      <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0 px-4 print:px-0">
        <div className="max-w-4xl mx-auto print:max-w-full">
          <div className="bg-white shadow-lg print:shadow-none rounded-lg print:rounded-none overflow-hidden print:text-sm">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 print:bg-none print:bg-blue-600 px-8 print:px-4 py-6 print:py-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 print:gap-2 mb-2 print:mb-1">
                    <div className="w-12 h-12 print:w-8 print:h-8 bg-white/20 backdrop-blur-sm rounded-xl print:rounded-lg flex items-center justify-center print:bg-white/30">
                      <span className="text-white font-bold text-lg print:text-sm">LP</span>
                    </div>
                    <div>
                      <h1 className="text-2xl print:text-base font-bold text-white">{labInfo.name}</h1>
                      <p className="text-blue-100 text-sm print:text-xs">Professional Diagnostic Services</p>
                    </div>
                  </div>
                  <div className="mt-4 print:mt-2 space-y-1 print:space-y-0.5 text-blue-50 text-sm print:text-xs">
                    <div className="flex items-center gap-2 print:gap-1">
                      <MapPin className="w-3.5 h-3.5 print:w-3 print:h-3" />
                      <span>{labInfo.address}</span>
                    </div>
                    <div className="flex items-center gap-4 print:gap-2">
                      <div className="flex items-center gap-2 print:gap-1">
                        <Phone className="w-3.5 h-3.5 print:w-3 print:h-3" />
                        <span>{labInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 print:gap-1">
                        <Mail className="w-3.5 h-3.5 print:w-3 print:h-3" />
                        <span>{labInfo.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 print:px-2 py-2 print:py-1 rounded-lg print:bg-white/30">
                    <p className="text-blue-100 text-xs print:text-[10px] uppercase tracking-wide font-medium">
                      Invoice
                    </p>
                    <p className="text-white text-xl print:text-sm font-bold">#{"1234"}</p>
                  </div>
                  <div className="mt-3 print:mt-1 text-blue-50 text-sm print:text-xs">
                    <p>Date: {formatDate(invoiceData.createdAt || new Date())}</p>
                    <p>Time: {formatTime(invoiceData.createdAt || new Date())}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Information with QR Code */}
            <div className="px-8 print:px-4 py-6 print:py-3 border-b border-gray-200">
              <div className="flex flex-col md:flex-row print:flex-row gap-6 print:gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 print:gap-1 mb-4 print:mb-2">
                    <div className="p-2 print:p-1 bg-blue-50 rounded-lg print:bg-gray-100">
                      <User className="w-4 h-4 print:w-3 print:h-3 text-blue-600 print:text-gray-700" />
                    </div>
                    <h2 className="text-lg print:text-sm font-semibold text-gray-900">Patient Information</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 print:gap-2">
                    <div>
                      <p className="text-xs print:text-[10px] text-gray-500 uppercase tracking-wide mb-1 print:mb-0">
                        Full Name
                      </p>
                      <p className="text-sm print:text-xs font-medium text-gray-900">{invoiceData.patientName}</p>
                    </div>
                    <div>
                      <p className="text-xs print:text-[10px] text-gray-500 uppercase tracking-wide mb-1 print:mb-0">
                        Gender
                      </p>
                      <p className="text-sm print:text-xs font-medium text-gray-900 capitalize">{invoiceData.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs print:text-[10px] text-gray-500 uppercase tracking-wide mb-1 print:mb-0">
                        Age
                      </p>
                      <p className="text-sm print:text-xs font-medium text-gray-900">{invoiceData.age} years</p>
                    </div>
                    <div>
                      <p className="text-xs print:text-[10px] text-gray-500 uppercase tracking-wide mb-1 print:mb-0">
                        Contact
                      </p>
                      <p className="text-sm print:text-xs font-medium text-gray-900">{invoiceData.contactNumber}</p>
                    </div>
                    {invoiceData.referredBy && (
                      <div className="col-span-2">
                        <p className="text-xs print:text-[10px] text-gray-500 uppercase tracking-wide mb-1 print:mb-0">
                          Referred By
                        </p>
                        <p className="text-sm print:text-xs font-medium text-gray-900">
                          {invoiceData.referredBy.name}
                          {invoiceData.referredBy.degree && (
                            <span className="text-gray-600 font-normal ml-2">({invoiceData.referredBy.degree})</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {qrCodeUrl && (
                  <div className="flex-shrink-0 print:flex-shrink-0 flex flex-col items-center gap-1">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for Report Download"
                      className="w-20 h-20 print:w-16 print:h-16"
                    />
                    <p className="text-xs print:text-[10px] text-gray-500 text-center">
                      Scan to download
                      <br />
                      your reports
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Test Details */}
            <div className="px-8 print:px-4 py-6 print:py-3">
              <div className="flex items-center gap-2 print:gap-1 mb-4 print:mb-2">
                <div className="p-2 print:p-1 bg-blue-50 rounded-lg print:bg-gray-100">
                  <FileText className="w-4 h-4 print:w-3 print:h-3 text-blue-600 print:text-gray-700" />
                </div>
                <h2 className="text-lg print:text-sm font-semibold text-gray-900">Diagnostic Tests</h2>
              </div>
              <div className="border border-gray-200 rounded-lg print:rounded overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="px-4 print:px-2 py-3 print:py-1 text-left text-xs print:text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                        #
                      </th>
                      <th className="px-4 print:px-2 py-3 print:py-1 text-left text-xs print:text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                        Test Name
                      </th>
                      <th className="px-4 print:px-2 py-3 print:py-1 text-right text-xs print:text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoiceData.tests?.map((test, index) => (
                      <tr key={test._id || index} className="hover:bg-gray-50 print:hover:bg-white">
                        <td className="px-4 print:px-2 py-3 print:py-1 text-sm print:text-xs text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 print:px-2 py-3 print:py-1 text-sm print:text-xs text-gray-900">
                          {test.name}
                        </td>
                        <td className="px-4 print:px-2 py-3 print:py-1 text-sm print:text-xs text-gray-900 text-right font-medium">
                          {formatCurrency(test.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 print:mt-3 flex justify-end">
                <div className="w-full md:w-80 space-y-2 print:space-y-1">
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoiceData.totalAmount || 0)}</span>
                  </div>
                  {showReferrerDiscount && (
                    <div className="flex justify-between text-sm print:text-xs">
                      <span className="text-gray-600">
                        Referrer Discount ({invoiceData.referrerDiscountPercentage}%)
                      </span>
                      <span className="text-red-600">- {formatCurrency(referrerDiscountAmount)}</span>
                    </div>
                  )}
                  {showLabAdjustment && (
                    <div className="flex justify-between text-sm print:text-xs">
                      <span className="text-gray-600">Lab Adjustment</span>
                      <span className="text-red-600">- {formatCurrency(invoiceData.labAdjustmentAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 print:pt-1 border-t-2 border-gray-300">
                    <span className="text-base print:text-sm font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl print:text-base font-bold text-blue-600">
                      {formatCurrency(invoiceData.finalPrice || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="print:hidden mt-6 text-center text-sm text-gray-500">
            <p>Click the print button above to print or save this invoice as PDF</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          nav, .lg\\:flex.w-64, .lg\\:hidden, header, footer { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
        }
      `}</style>
    </>
  );
};

export default PrintInvoice;
