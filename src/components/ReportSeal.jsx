const SEAL_BORDER = "#1E4FA0";
const SEAL_RED = "#C0312B";

// Longer report names get a smaller font so the seal box doesn't grow wide
// and force the header row (heading + seal) to wrap onto two lines.
const nameFontSize = (name = "") => {
  const len = name.length;
  if (len <= 9) return "15px"; // e.g. "Cashmemo"
  if (len <= 13) return "13px"; // e.g. "IPD Memo"
  if (len <= 17) return "11px"; // e.g. "Sales Report"
  return "9.5px"; // e.g. "Collection Report", "Discount Report"
};

const ReportSeal = ({ dateLabel, reportName }) => (
  <div className="relative shrink-0 select-none rotate-[-3deg] -mt-1">
    <div
      className="bg-white px-3 py-1.5 rounded-[3px]"
      style={{ border: `2px solid ${SEAL_BORDER}`, boxShadow: `inset 0 0 0 3px ${SEAL_BORDER}05` }}
    >
      <div className="border" style={{ borderColor: `${SEAL_BORDER}55`, padding: "4px 8px" }}>
        <p
          className="text-center font-['IBM_Plex_Mono'] font-bold uppercase whitespace-nowrap"
          style={{ color: SEAL_BORDER, fontSize: "9px", letterSpacing: "1.5px" }}
        >
          LabPilotPro.com
        </p>
        <div className="h-px w-full my-0.5" style={{ backgroundColor: `${SEAL_BORDER}55` }} />
        <p
          className="text-center font-['IBM_Plex_Mono'] font-extrabold uppercase whitespace-nowrap"
          style={{ color: SEAL_RED, fontSize: nameFontSize(reportName), letterSpacing: "0.75px" }}
        >
          {reportName}
        </p>
        <p
          className="text-center font-['IBM_Plex_Mono'] font-semibold whitespace-nowrap"
          style={{ color: SEAL_RED, fontSize: "10px", letterSpacing: "0.5px" }}
        >
          {dateLabel}
        </p>
      </div>
    </div>
  </div>
);

export default ReportSeal;
