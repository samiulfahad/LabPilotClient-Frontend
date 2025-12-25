import Portal from "../Portal";

const LoadingScreen = ({ message = "Processing request" }) => {
  return (
    <Portal>
    <div className="fixed inset-0 flex flex-col items-center justify-center backdrop-blur-[3px] z-[99]">

      {/* Animated medical pulse + ring */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-blue-500/20 animate-ping"></div>
        <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>

      {/* Title */}
      <div className="text-xl font-semibold tracking-wide text-gray-700">
        Lab Pilot
      </div>

      {/* Subtitle */}
      <div className="mt-2 text-sm text-gray-500">
        {message}...
      </div>

      {/* Progress bar pulse */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-1 w-full bg-blue-500 animate-[progress_2s_linear_infinite]"></div>
      </div>

      <style>
        {`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
    </Portal>
  );
};

export default LoadingScreen;
