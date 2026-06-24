
import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Settings, ShieldAlert, Smartphone } from 'lucide-react';
import { sendOtp, verifyOtp } from '../services/authService';

interface LoginProps {
  onVoterLogin: (identifier: string, pin: string) => void;
  onAdminLogin: (user: string, pass: string) => void;
  onGoToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onVoterLogin, onAdminLogin, onGoToRegister }) => {
  const [mode, setMode] = useState<'VOTER' | 'ADMIN'>('VOTER');
  const [voterData, setVoterData] = useState({ identifier: '', pin: '' });
  const [adminData, setAdminData] = useState({ user: '', pass: '' });
  const [error, setError] = useState('');
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpStep, setOtpStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [otpPhone, setOtpPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVoterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (voterData.identifier.length < 5 || voterData.pin.length < 4) {
      setError('Please enter valid EPIC Number and Security PIN');
      return;
    }
    
    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/login/voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: voterData.identifier, 
          pin: voterData.pin 
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresOtp) {
          const phoneNumber = data.phoneNumber;
          if (!phoneNumber) {
            setError('Mobile number not found for this account.');
            setIsVerifying(false);
            return;
          }

          await sendOtp(phoneNumber);
          
          setMaskedPhone(data.maskedPhone);
          setOtpPhone(phoneNumber);
          setUseOtpLogin(true);
          setOtpStep('OTP');
          setResendTimer(60);
        } else {
          // Bypassed OTP (e.g. test voter) - log in directly
          onVoterLogin(voterData.identifier, voterData.pin);
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to connect to authentication service.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminData.user && adminData.pass) {
      onAdminLogin(adminData.user, adminData.pass);
    } else {
      setError('Please enter both Admin ID and Passkey');
    }
  };

  const verifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsVerifying(false);
      return;
    }

    try {
      await verifyOtp(otpPhone, otp);
      
      const response = await fetch('/api/login/voter/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: otpPhone
        })
      });

      const data = await response.json();

      if (response.ok) {
        onVoterLogin(data.epicNumber, 'OTP_VERIFIED'); 
      } else {
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${mode === 'VOTER' ? 'gradient-bg' : 'bg-slate-900'}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md border border-white/20 overflow-hidden">
        
        {/* Tab Switcher */}
        <div className="flex border-b">
          <button 
            onClick={() => { setMode('VOTER'); setError(''); }}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'VOTER' ? 'text-[#FF9933] border-b-4 border-[#FF9933]' : 'text-gray-400 bg-gray-50'
            }`}
          >
            Citizen Login
          </button>
          <button 
            onClick={() => { setMode('ADMIN'); setError(''); }}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'ADMIN' ? 'text-[#000080] border-b-4 border-[#000080]' : 'text-gray-400 bg-gray-50'
            }`}
          >
            Official Login
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-colors ${mode === 'VOTER' ? 'bg-orange-100' : 'bg-blue-100'}`}>
              {mode === 'VOTER' ? (
                <ShieldCheck className="text-[#FF9933]" size={40} />
              ) : (
                <Settings className="text-[#000080]" size={40} />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800">BharatVote</h2>
            <p className="text-gray-500 mt-2">
              {mode === 'VOTER' ? 'Secure Voter Authentication' : 'ECI Administrative Access'}
            </p>
          </div>

          {mode === 'ADMIN' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start space-x-2 mb-6">
              <ShieldAlert size={16} className="text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-tight">
                Unauthorized access to the Election Command Center is a punishable offense under the IT Act.
              </p>
            </div>
          )}

          <form onSubmit={mode === 'ADMIN' ? handleAdminSubmit : (otpStep === 'PHONE' ? handleVoterSubmit : verifyOtpLogin)} className="space-y-6">
            {mode === 'VOTER' ? (
              <>
                {otpStep === 'PHONE' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">EPIC Number / Mobile</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={voterData.identifier}
                          onChange={(e) => setVoterData({ ...voterData, identifier: e.target.value })}
                          placeholder="VOTE123456"
                          disabled={isVerifying}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Security PIN</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={voterData.pin}
                          onChange={(e) => setVoterData({ ...voterData, pin: e.target.value.replace(/\D/g, '') })}
                          placeholder="••••"
                          maxLength={4}
                          disabled={isVerifying}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Enter OTP</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit OTP"
                        maxLength={6}
                        disabled={isVerifying}
                        className="w-full pl-10 pr-4 py-4 text-center text-2xl font-bold tracking-[0.5em] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">OTP sent to {maskedPhone}</p>
                    <div className="flex flex-col space-y-2 mt-4">
                      <button 
                        type="button"
                        onClick={() => setOtpStep('PHONE')}
                        className="text-[10px] text-[#FF9933] font-bold uppercase tracking-widest hover:underline"
                      >
                        Back to Login
                      </button>

                      {resendTimer > 0 ? (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                          Resend OTP in {resendTimer}s
                        </p>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleVoterSubmit(new Event('submit') as any)}
                          className="text-[10px] text-[#FF9933] font-bold uppercase tracking-widest hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admin ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={adminData.user}
                      onChange={(e) => setAdminData({ ...adminData, user: e.target.value })}
                      placeholder="official_01"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Secure Passkey</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={adminData.pass}
                      onChange={(e) => setAdminData({ ...adminData, pass: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-red-500 text-xs italic font-medium text-center">{error}</p>}

            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'VOTER' ? 'bg-[#138808] hover:bg-[#0f6e06]' : 'bg-[#000080] hover:bg-blue-900'
              }`}
            >
              <span>
                {isVerifying 
                  ? 'Processing...' 
                  : mode === 'VOTER' 
                    ? (otpStep === 'PHONE' ? 'Request Secure OTP' : 'Verify & Enter')
                    : 'Access Command Center'}
              </span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={onGoToRegister}
              className="text-xs text-gray-500 hover:text-gray-800 font-bold uppercase tracking-widest transition-colors"
            >
              New to BharatVote? Register Here
            </button>
          </div>

          {mode === 'VOTER' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-semibold mb-4">Secured Verification</p>
              <div className="grid grid-cols-1 gap-4">
                 <div className="flex flex-col items-center text-[#138808]">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mb-1">🛡️</div>
                  <span className="text-[10px]">EPIC Verified</span>
                </div>
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-[10px] text-gray-400">
            System uptime 99.9%. Encrypted with E2EE protocol.
          </p>
        </div>
      </div>
      <div id="otp-timer-placeholder"></div>
    </div>
  );
};

export default Login;
