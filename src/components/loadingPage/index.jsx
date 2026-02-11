import Portal from "../Portal";
import { useEffect, useState } from "react";

const LoadingScreen = ({ message = "Processing request", subMessage }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(0,100,255,0.15), transparent 40%), " +
            "radial-gradient(circle at 80% 70%, rgba(0,200,255,0.1), transparent 40%), " +
            "rgba(10, 20, 40, 0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Medical cross pattern (pure CSS) */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, 
                #ffffff 0px, #ffffff 10px,
                transparent 10px, transparent 20px
              )
            `,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/30 max-w-md w-full mx-4 text-center animate-in fade-in zoom-in duration-300">
          {/* Double DNA helix spinner */}
          <div className="relative flex justify-center items-center mb-6">
            {/* Outer ring – clockwise */}
            <div className="absolute w-20 h-20 rounded-full border-4 border-blue-200/30 border-t-blue-600 animate-spin" />
            {/* Inner ring – counter‑clockwise (arbitrary value) */}
            <div className="absolute w-14 h-14 rounded-full border-4 border-cyan-200/40 border-b-cyan-600 animate-[spin_1.5s_linear_infinite_reverse]" />
            {/* Pulsing core */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full animate-pulse shadow-lg shadow-blue-500/30" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h2>
          {subMessage && <p className="text-gray-600 text-sm">{subMessage}</p>}

          <div className="mt-6 w-16 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto" />
        </div>
      </div>
    </Portal>
  );
};

export default LoadingScreen;
