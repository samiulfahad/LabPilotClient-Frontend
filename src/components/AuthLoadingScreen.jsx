// ─── Full-screen splash shown while /refresh resolves on a fresh tab/reload ──
// Pathology-themed: an ECG/heartbeat trace sweeps continuously beneath the
// LabPilot mark, echoing the paper/ledger aesthetic (#FAF9F6 background,
// teal primary, IBM Plex typography). Pure CSS/SVG — no extra deps.
const AuthLoadingScreen = () => (
  <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-[#FAF9F6]">
    <style>{`
      @keyframes lp-ecg-sweep {
        0%   { stroke-dashoffset: 1000; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes lp-pulse-dot {
        0%, 100% { opacity: 0.25; transform: scale(0.85); }
        50%      { opacity: 1;    transform: scale(1.15); }
      }
      .lp-ecg-path {
        stroke-dasharray: 1000;
        animation: lp-ecg-sweep 2.2s linear infinite;
      }
      .lp-pulse-dot {
        animation: lp-pulse-dot 1.1s ease-in-out infinite;
      }
    `}</style>

    <div className="flex flex-col items-center gap-4">
      {/* Pulsing cross, standing in for the lab/hospital mark */}
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="lp-pulse-dot absolute h-14 w-14 rounded-full bg-[#0F6E5C]/10" />
        <svg viewBox="0 0 24 24" className="relative h-8 w-8 text-[#0F6E5C]" fill="currentColor">
          <path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8V2z" />
        </svg>
      </div>

      {/* ECG / heartbeat trace */}
      <svg viewBox="0 0 240 60" className="h-10 w-60" fill="none">
        <path d="M0 30 H240" stroke="#1E4FA0" strokeOpacity="0.12" strokeWidth="1" />
        <path
          className="lp-ecg-path"
          d="M0 30 H70 L82 30 L90 8 L100 52 L108 30 L118 30 L126 18 L134 30 H240"
          stroke="#0F6E5C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <p className="font-mono text-xs tracking-wide text-[#1E4FA0]/70">Loading LabPilot Pro...</p>
  </div>
);

export default AuthLoadingScreen;
