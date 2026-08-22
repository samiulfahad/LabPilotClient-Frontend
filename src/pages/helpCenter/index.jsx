import { useState } from "react";
import { PhoneCall, MessageSquareText, Send, HelpCircle, Phone } from "lucide-react";
import supportService from "../../api/support";
import Popup from "../../components/popup";

const PHONE_NUMBER = "+880 1518-918551";
const PHONE_TEL = "+8801518918551";

const CONTACT_PATTERN = /^\d{11}$/;

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState("message"); // "call" | "message"
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [contactTouched, setContactTouched] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const isContactValid = CONTACT_PATTERN.test(contact.trim());
  const canSubmit = message.trim() && isContactValid && status !== "sending";

  const handleContactChange = (e) => {
    // Digits only, capped at 11 — keeps the field honest as they type.
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
    setContact(digitsOnly);
  };

  const handleSubmit = async () => {
    if (!message.trim() || !isContactValid) {
      setContactTouched(true);
      return;
    }
    setStatus("sending");
    try {
      await supportService.sendMessage(message.trim(), contact.trim());
      setMessage("");
      setContact("");
      setContactTouched(false);
      setStatus("idle");
      setShowSuccessPopup(true);
    } catch {
      setStatus("error");
    }
  };

  const tabs = [
    { id: "call", label: "ফোনে কল করুন", icon: PhoneCall },
    { id: "message", label: "মেসেজ পাঠান", icon: MessageSquareText },
  ];

  return (
    <div className="min-h-screen bg-[#f0f1f7] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-48 -left-48 w-[560px] h-[560px] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-48 w-[420px] h-[420px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative max-w-xl mx-auto px-4 pt-7 pb-16">
        <div
          className="flex items-center gap-3 mb-8"
          style={{ animation: "cardIn 0.4s cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-inner">
              <HelpCircle className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">
              হেল্প সেন্টার<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">আজ আমরা আপনাকে কীভাবে সাহায্য করতে পারি?</p>
          </div>
        </div>

        <div
          className="flex gap-1 p-1 mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm"
          style={{ animation: "cardIn 0.5s cubic-bezier(.22,1,.36,1) 0.1s both" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2.2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="bg-white border border-gray-100 rounded-3xl p-6 overflow-hidden"
          style={{ animation: "cardIn 0.5s cubic-bezier(.22,1,.36,1) 0.15s both" }}
        >
          {activeTab === "call" ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/60 mb-5">
                <PhoneCall className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">সরাসরি কথা বলুন</p>
              <p className="text-[12px] text-gray-400 mb-5">জরুরি প্রয়োজনে আমাদের টিমকে কল করুন</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight mb-6">{PHONE_NUMBER}</p>
              <a
                href={`tel:${PHONE_TEL}`}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <PhoneCall className="w-4 h-4" /> কল করুন
              </a>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">আমাদের মেসেজ পাঠান</p>
              <p className="text-[11.5px] text-gray-400 mb-4">অভিযোগ, প্রশ্ন, যেকোনো কিছু — আমরা যোগাযোগ করব।</p>

              <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5">যোগাযোগ নম্বর</label>
              <div className="relative mb-1">
                <Phone className="w-4 h-4 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={contact}
                  onChange={handleContactChange}
                  onBlur={() => setContactTouched(true)}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                  className={`w-full rounded-2xl border p-4 pl-11 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 resize-none ${
                    contactTouched && !isContactValid
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-indigo-200"
                  }`}
                />
              </div>
              {contactTouched && !isContactValid && (
                <p className="text-[11px] text-red-500 mb-3">সঠিক ১১ সংখ্যার নম্বর দিন।</p>
              )}
              {!(contactTouched && !isContactValid) && <div className="mb-3" />}

              <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5">মেসেজ</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="এখানে আপনার মেসেজ লিখুন..."
                rows={5}
                maxLength={2000}
                className="w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
              />

              <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-gray-300">{message.length}/2000</p>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4" /> {status === "sending" ? "পাঠানো হচ্ছে..." : "পাঠান"}
                </button>
              </div>

              {status === "error" && (
                <p className="text-[11px] text-red-500 mt-2">কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।</p>
              )}
            </div>
          )}
        </div>

        <p
          className="text-center text-[11px] text-gray-300 font-medium mt-12"
          style={{ animation: "cardIn 0.5s cubic-bezier(.22,1,.36,1) 0.4s both" }}
        >
          LabPilot Pro · Your Smart Partner
        </p>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {showSuccessPopup && (
        <Popup
          type="success"
          message="আপনার মেসেজ পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।"
          onClose={() => setShowSuccessPopup(false)}
        />
      )}
    </div>
  );
}
