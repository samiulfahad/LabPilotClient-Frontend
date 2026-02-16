import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Printer, Download, ArrowLeft, Phone, Mail, MapPin, Calendar, User, FileText, Share2 } from "lucide-react";
import QRCode from "qrcode";
import invoiceService from "../../api/invoice";
import LoadingScreen from "../../components/loadingPage";
import Popup from "../../components/popup";

const PrintInvoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // Lab/Organization Details - Replace with your actual data or fetch from API
  const labInfo = {
    name: "LabPilot Pro Diagnostics",
    address: "123 Medical Center Road, Dhaka 1207, Bangladesh",
    phone: "+880 1234-567890",
    email: "info@labpilotpro.com",
    website: "www.labpilotpro.com",
  };

  // Generate QR Code
  const generateQRCode = async (url) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        color: {
          dark: "#2563eb", // Blue color
          light: "#ffffff", // White background
        },
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

      // First, check if data was passed via navigation state
      if (location.state?.invoiceData) {
        data = location.state.invoiceData;
      }
      // If no state data, fetch from API using invoiceId
      else if (invoiceId) {
        const response = await invoiceService.getInvoiceById(invoiceId);
        data = response.data;
      } else {
        setPopup({
          type: "error",
          message: "No invoice data available",
        });
        setTimeout(() => navigate("/invoice/new"), 2000);
        setLoading(false);
        return;
      }

      // Ensure data has required structure with safe defaults
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
        hasDiscount: data.hasDiscount || false,
        discountPercentage: Number(data.discountPercentage) || 0,
        priceAfterDiscount: Number(data.priceAfterDiscount) || Number(data.totalAmount) || 0,
        hasAdjustment: data.hasAdjustment || false,
        adjustmentAmount: Number(data.adjustmentAmount) || 0,
        finalPrice: Number(data.finalPrice) || Number(data.totalAmount) || 0,
        createdAt: data.createdAt || new Date().toISOString(),
        reportLink: data.reportLink || data.link || "https://labpilotpro.com", // Dynamic link from backend
      };

      setInvoiceData(processedData);

      // Generate QR code with the report link
      await generateQRCode(processedData.reportLink);

      setLoading(false);
    } catch (error) {
      console.error("Error loading invoice:", error);
      setPopup({
        type: "error",
        message: "Failed to load invoice data",
      });
      setTimeout(() => navigate("/invoice/new"), 2000);
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger print which allows user to save as PDF
    window.print();
  };

  const handleWhatsAppShare = () => {
    // Create a message with invoice details
    const message = `
🏥 *LabPilot Pro - Invoice*

📋 Invoice #: ${"123"}
👤 Patient: ${invoiceData.patientName}
📅 Date: ${formatDate(invoiceData.createdAt)}
💰 Total Amount: ${formatCurrency(invoiceData.finalPrice || 0)}

🔗 View/Download Report: ${invoiceData.reportLink || "https://labpilotpro.com"}

Thank you for choosing LabPilot Pro! 🙏
    `.trim();

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp without specific number - user can choose recipient
    // For mobile, this will open WhatsApp app
    // For desktop, this will open WhatsApp Web
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  const formatCurrency = (amount) => {
    // Safely handle undefined/null/NaN values
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "BDT 0";

    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (date) => {
    if (!date)
      return new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date)
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return <LoadingScreen message="Loading invoice..." />;
  }

  if (!invoiceData) {
    return null;
  }

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
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors border border-green-700"
                title="Share via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-medium">Share via WhatsApp</span>
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
          {/* Print-optimized Invoice */}
          <div className="bg-white shadow-lg print:shadow-none rounded-lg print:rounded-none overflow-hidden print:text-sm">
            {/* Invoice Header - Compact for printing */}
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
                {/* Patient Information - Left Side */}
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

                {/* QR Code - Right Side - Always beside patient info even on print */}
                <div className="flex-shrink-0 print:flex-shrink-0">
                  <div className="flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50 to-indigo-50 print:bg-white p-5 print:p-3 rounded-xl border-2 border-blue-200 print:border-gray-300">
                    {qrCodeUrl && (
                      <>
                        <div className="mb-3 print:mb-2">
                          <img
                            src={qrCodeUrl}
                            alt="QR Code for Report Download"
                            className="w-32 h-32 print:w-24 print:h-24 mx-auto rounded-lg shadow-sm"
                          />
                        </div>
                        <div>
                          <p className="text-sm print:text-xs font-bold text-gray-900 mb-1">Scan to Download</p>
                          <p className="text-xs print:text-[10px] text-gray-600">Your Test Report</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Details - Compact */}
            <div className="px-8 print:px-4 py-6 print:py-3">
              <div className="flex items-center gap-2 print:gap-1 mb-4 print:mb-2">
                <div className="p-2 print:p-1 bg-blue-50 rounded-lg print:bg-gray-100">
                  <FileText className="w-4 h-4 print:w-3 print:h-3 text-blue-600 print:text-gray-700" />
                </div>
                <h2 className="text-lg print:text-sm font-semibold text-gray-900">Diagnostic Tests</h2>
              </div>

              {/* Tests Table - Compact */}
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

              {/* Pricing Summary */}
              <div className="mt-6 print:mt-3 flex justify-end">
                <div className="w-full md:w-80 space-y-2 print:space-y-1">
                  <div className="flex justify-between text-sm print:text-xs">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoiceData.totalAmount || 0)}</span>
                  </div>

                  {invoiceData.hasDiscount && invoiceData.discountPercentage > 0 && (
                    <>
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-600">Discount ({invoiceData.discountPercentage}%)</span>
                        <span className="text-red-600">
                          - {formatCurrency((invoiceData.totalAmount || 0) - (invoiceData.priceAfterDiscount || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm print:text-xs pt-2 print:pt-1 border-t border-gray-200">
                        <span className="text-gray-600">After Discount</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(invoiceData.priceAfterDiscount || 0)}
                        </span>
                      </div>
                    </>
                  )}

                  {invoiceData.hasAdjustment && invoiceData.adjustmentAmount > 0 && (
                    <div className="flex justify-between text-sm print:text-xs pt-2 print:pt-1 border-t border-gray-200">
                      <span className="text-gray-600">Adjustment</span>
                      <span className="text-red-600">- {formatCurrency(invoiceData.adjustmentAmount || 0)}</span>
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

          {/* Print Instructions */}
          <div className="print:hidden mt-6 text-center text-sm text-gray-500">
            <p>Click the print button above to print or save this invoice as PDF</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 0;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          /* Hide all navigation elements */
          nav,
          .lg\\:flex.w-64,
          .lg\\:hidden,
          header,
          footer {
            display: none !important;
          }

          /* Remove margins from main content */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Ensure content fits on half A4 */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default PrintInvoice;
