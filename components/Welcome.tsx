
import React, { useState, useEffect } from 'react';
import { Shield, Globe, BarChart3, ArrowRight, CheckCircle2, Award, Loader2, Zap, Wifi } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStep, setLaunchStep] = useState(0);
  const launchMessages = [
    "Initializing Secure Tunnel...",
    "Verifying ECI Certificates...",
    "Synchronizing Blockchain Nodes...",
    "Handshaking with Biometric Servers...",
    "Redirecting to Secure Portal..."
  ];

  const handleLaunch = () => {
    setIsLaunching(true);
  };

  useEffect(() => {
    if (isLaunching && launchStep < launchMessages.length) {
      const timer = setTimeout(() => {
        setLaunchStep(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (isLaunching && launchStep === launchMessages.length) {
      const timer = setTimeout(() => {
        onStart();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLaunching, launchStep, onStart]);

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Launch Overlay */}
      {isLaunching && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center text-white animate-fadeIn">
          <div className="w-full max-w-md p-8 text-center">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse"></div>
              <Loader2 className="animate-spin text-blue-400 mx-auto relative z-10" size={64} />
            </div>
            <h2 className="text-2xl font-black mb-2 tracking-tight">System Launch in Progress</h2>
            <p className="text-slate-400 font-mono text-sm h-6">
              {launchMessages[launchStep] || "Finalizing..."}
            </p>
            
            <div className="mt-12 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${(launchStep / launchMessages.length) * 100}%` }}
              ></div>
            </div>
            
            <div className="mt-6 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Security Check</span>
              <span>100% Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Ticker */}
      <div className="bg-[#000080] text-white py-2 overflow-hidden whitespace-nowrap border-b border-white/10">
        <div className="inline-block animate-marquee hover:pause whitespace-nowrap">
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest flex items-center inline-flex">
            <Zap size={10} className="mr-1 text-yellow-400" /> Phase 2 Voting Commenced in 12 States
          </span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest flex items-center inline-flex">
            <Shield size={10} className="mr-1 text-green-400" /> End-to-End Encryption Protocol Active
          </span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest flex items-center inline-flex">
            <Wifi size={10} className="mr-1 text-blue-400" /> 1.2M Concurrent Users Supported
          </span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest flex items-center inline-flex">
            <Award size={10} className="mr-1 text-orange-400" /> Official ECI Digital Portal
          </span>
          {/* Duplicate for seamless loop */}
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest flex items-center inline-flex">
            <Zap size={10} className="mr-1 text-yellow-400" /> Phase 2 Voting Commenced in 12 States
          </span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest flex items-center inline-flex">
            <Shield size={10} className="mr-1 text-green-400" /> End-to-End Encryption Protocol Active
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden gradient-bg px-4">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fadeIn">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 rounded-full border border-orange-200 mb-8 shadow-sm">
            <span className="text-[#000080] font-bold text-lg">🇮🇳</span>
            <span className="text-xs font-black uppercase tracking-widest text-gray-600">Secure Democracy Initiative</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
            Empowering the World's <br />
            <span className="text-[#000080]">Digital Democracy</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            BharatVote brings the transparency of the blockchain to the Indian polling booth. Your vote, your voice, secured forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleLaunch}
              className="px-10 py-5 bg-[#000080] text-white rounded-full font-bold text-lg hover:bg-blue-900 transition-all shadow-2xl flex items-center space-x-2 group"
            >
              <span>Launch Secure Portal</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
              <CheckCircle2 className="text-[#138808]" size={18} />
              <span>Verified System Integrity</span>
            </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-50"></div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-24 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
            <div className="w-14 h-14 bg-orange-100 text-[#FF9933] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Military-Grade Encryption</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Every ballot is protected by AES-256 bit encryption and multi-sig verification protocols.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 text-[#000080] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Blockchain Persistence</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              A permanent, immutable record of every vote ensures no one can alter the democratic outcome.
            </p>
          </div>

          <div className="group p-8 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all border border-gray-100">
            <div className="w-14 h-14 bg-green-100 text-[#138808] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BarChart3 size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Real-time Verification</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Audit the election as it happens. Complete transparency for a more trusted electoral process.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-white to-green-500"></div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div>
            <div className="text-4xl font-black text-orange-400 mb-1">945M+</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Voters Registered</div>
          </div>
          <div>
            <div className="text-4xl font-black text-white mb-1">AES-256</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Crypto Standard</div>
          </div>
          <div>
            <div className="text-4xl font-black text-white mb-1">0.02s</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Sync Latency</div>
          </div>
          <div>
            <div className="text-4xl font-black text-green-400 mb-1">ACTIVE</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Network Nodes</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#000080] text-white rounded-full flex items-center justify-center text-xs shadow-lg">🇮🇳</div>
            <span className="font-black text-gray-800 tracking-tight">BharatVote v3.0.4</span>
          </div>
          <p className="text-xs text-gray-400 max-w-sm">
            Digital India Official Election Portal. Distributed ledger technology enabled by the Ministry of Electronics & IT.
          </p>
          <div className="flex items-center space-x-6">
            <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Shield size={16} className="text-[#000080]" />
            </div>
            <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                <Award size={16} className="text-[#FF9933]" />
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        .pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
