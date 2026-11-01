
import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  Mic,
  PhoneCall,
  FolderLock,
  Power,
  X,
  Lock,
  Bot,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ActivationModalProps {
  isOpen: boolean;
  onActivate: () => void;
  onClose: () => void;
}

const permissionItems = [
  {
    title: 'Accessibility Service',
    description: 'অন্য অ্যাপের স্ক্রিন বুঝতে ও UI interaction করতে প্রয়োজন',
    icon: Layers,
  },
  {
    title: 'Microphone & Voice',
    description: 'ভয়েস কমান্ড শোনা ও Voice Assistant চালাতে প্রয়োজন',
    icon: Mic,
  },
  {
    title: 'Floating Window',
    description: 'অন্য অ্যাপের উপরে Floating Orb দেখাতে প্রয়োজন',
    icon: Sparkles,
  },
  {
    title: 'Phone & Calls',
    description: 'কল-সংক্রান্ত Native Android integration-এর জন্য প্রয়োজন',
    icon: PhoneCall,
  },
  {
    title: 'Files & Device Data',
    description: 'অনুমোদিত ফাইল ও ডিভাইস ডেটা ব্যবহারের জন্য প্রয়োজন',
    icon: FolderLock,
  },
  {
    title: 'Device Administration',
    description: 'এটি আলাদা Android capability; সাধারণ Admin Mode এর সমান নয়',
    icon: Lock,
  },
];

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onActivate,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.25)]">

        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close activation window"
          className="absolute top-4 right-4 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative flex flex-col items-center text-center space-y-5">

          <div className="relative mt-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)]">
              <Power className="w-9 h-9 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              NEXORA • ACTIVATION CENTER
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Start NEXORA
            </h2>

            <p className="text-sm text-slate-300 max-w-sm mx-auto mt-3 font-bengali leading-relaxed">
              NEXORA Session শুরু করার আগে প্রয়োজনীয় Android
              Permission এবং Native Integration সম্পর্কে জেনে নাও।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full text-left">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5 text-xs">
                <Bot className="w-4 h-4" />
                AI Assistant
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                AI Provider সংযুক্ত থাকলে AI উত্তর দিতে পারবে।
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4" />
                Safety First
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                গুরুত্বপূর্ণ কাজের আগে User Confirmation প্রয়োজন।
              </p>
            </div>
          </div>

          <div className="w-full text-left space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Required Android Capabilities
              </h3>
              <span className="text-[10px] text-amber-300 font-semibold">
                NOT VERIFIED
              </span>
            </div>

            {permissionItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3"
                >
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.description}
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-amber-300 whitespace-nowrap">
                    NOT CONNECTED
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-300">
                  Important Notice
                </p>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  এই মুহূর্তে Android Native Permission যাচাই বা Grant
                  করার ব্যবস্থা যুক্ত হয়নি। এই বোতাম শুধু NEXORA-এর
                  বর্তমান App Session শুরু করবে। Background Voice,
                  Accessibility, Call Control এবং Device Control এখনো
                  বাস্তবায়ন করা বাকি।
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onActivate}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm tracking-wide shadow-[0_0_35px_rgba(6,182,212,0.35)] transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            START NEXORA SESSION
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel and Go Back
          </button>

          <p className="text-[10px] text-slate-500">
            NEXORA • User-controlled AI Assistant
          </p>
        </div>
      </div>
    </div>
  );
};
