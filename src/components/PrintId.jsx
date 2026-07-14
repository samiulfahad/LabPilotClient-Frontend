import { useState } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { pdf, Document, Page, Image, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Loader2, Barcode, QrCode, IdCard } from "lucide-react";

// ─── Code Generation ───────────────────────────────────────────────────────

const generateBarcodeDataUrl = (value) => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, value, { format: "CODE128", width: 2, height: 50, displayValue: false, margin: 0 });
  return canvas.toDataURL("image/png");
};

const generateQrDataUrl = (value) => QRCode.toDataURL(value, { width: 180, margin: 0 });

// ─── PDF Document ───────────────────────────────────────────────────────────
// Small tube-label sizes in points (1mm ≈ 2.83pt)

const pdfStyles = StyleSheet.create({
  labelPage: { padding: 4, alignItems: "center", justifyContent: "center" },
  qrPage: { paddingVertical: 4, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  barcode: { width: 100, height: 22, marginBottom: 3 },
  qrcode: { width: 60, height: 60, marginBottom: 5 },
  id: { fontSize: 8, fontWeight: 700, letterSpacing: 0.3, marginTop: 0 },
  idOnly: { fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
});

// mode: "barcode" | "qrcode" | "id"
const IdLabelPdf = ({ displayId, mode, barcodeUrl, qrUrl }) => {
  // barcode: ~40mm x 14mm | qr: ~32mm x 26mm (wide horizontal padding) | id: ~41mm x 11mm
  const size = mode === "qrcode" ? [92, 74] : mode === "barcode" ? [117, 40] : [116, 32];
  const pageStyle = mode === "qrcode" ? pdfStyles.qrPage : pdfStyles.labelPage;

  return (
    <Document>
      <Page size={size} style={pageStyle} wrap={false}>
        {mode === "barcode" && barcodeUrl && <Image src={barcodeUrl} style={pdfStyles.barcode} />}
        {mode === "qrcode" && qrUrl && <Image src={qrUrl} style={pdfStyles.qrcode} />}
        {mode !== "id" && <Text style={pdfStyles.id}>{displayId}</Text>}
        {mode === "id" && <Text style={pdfStyles.idOnly}>{displayId}</Text>}
      </Page>
    </Document>
  );
};

// ─── PrintId (ID Print Action Buttons) ─────────────────────────────────────

const PrintId = ({ displayId, onError }) => {
  const [loadingMode, setLoadingMode] = useState(null);

  const openPdf = async (mode) => {
    try {
      setLoadingMode(mode);
      let barcodeUrl = null;
      let qrUrl = null;

      if (mode === "barcode") barcodeUrl = generateBarcodeDataUrl(displayId);
      if (mode === "qrcode") qrUrl = await generateQrDataUrl(displayId);

      const blob = await pdf(
        <IdLabelPdf displayId={displayId} mode={mode} barcodeUrl={barcodeUrl} qrUrl={qrUrl} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      onError?.();
    } finally {
      setLoadingMode(null);
    }
  };

  const Btn = ({ mode, icon: Icon, label }) => (
    <button
      onClick={() => openPdf(mode)}
      disabled={loadingMode !== null}
      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
    >
      {loadingMode === mode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4 fu fu1">
      <Btn mode="barcode" icon={Barcode} label="Print Barcode" />
      <Btn mode="qrcode" icon={QrCode} label="Print QR Code" />
      <Btn mode="id" icon={IdCard} label="Print ID" />
    </div>
  );
};

export default PrintId;
