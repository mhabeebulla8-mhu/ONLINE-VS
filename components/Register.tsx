
import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Lock, ArrowRight, User, Mail, MapPin, Smartphone, ShieldAlert } from 'lucide-react';
import { sendOtp, verifyOtp } from '../services/authService';

interface RegisterProps {
  onVoterRegister: (data: { name: string; epic: string; phone: string; constituency: string; pin: string }) => void;
  onAdminRegister: (data: { username: string; email: string; phone: string; pass: string; role: string }) => void;
  onBackToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onVoterRegister, onAdminRegister, onBackToLogin }) => {
  const [mode, setMode] = useState<'VOTER' | 'ADMIN'>('VOTER');
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'DETAILS'>('PHONE');
  const [voterData, setVoterData] = useState({ name: '', epic: '', phone: '', constituency: '', pin: '', confirmPin: '' });
  const [adminData, setAdminData] = useState({ username: '', email: '', phone: '', pass: '', confirmPass: '', role: 'ELECTION_OFFICER' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
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

  const requestPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const phoneToVerify = mode === 'VOTER' ? voterData.phone : adminData.phone;
    const nameToVerify = mode === 'VOTER' ? voterData.name : adminData.username;
    const epicToVerify = mode === 'VOTER' ? voterData.epic : '';
    
    if (mode === 'VOTER' && (!voterData.name || !voterData.epic)) {
      setError('Name and EPIC Number are required');
      return;
    }

    if (!phoneToVerify || phoneToVerify.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      await sendOtp(phoneToVerify, nameToVerify, epicToVerify);
      setMaskedPhone(phoneToVerify.replace(/(\d{2})\d{4}(\d{4})/, '$1XXXX$2'));
      setStep('OTP');
      setResendTimer(60);
    } catch (err: any) {
      console.error('Error requesting OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneToVerify = mode === 'VOTER' ? voterData.phone : adminData.phone;

    setIsVerifying(true);
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsVerifying(false);
      return;
    }

    try {
      await verifyOtp(phoneToVerify, otp);
      setStep('DETAILS');
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'VOTER') {
      if (!voterData.name || !voterData.epic || !voterData.constituency || !voterData.pin) {
        setError('All fields are required');
        return;
      }
      if (voterData.pin !== voterData.confirmPin) {
        setError('PINs do not match');
        return;
      }
      onVoterRegister({
        name: voterData.name,
        epic: voterData.epic,
        phone: voterData.phone,
        constituency: voterData.constituency,
        pin: voterData.pin
      });
    } else {
      if (!adminData.username || !adminData.email || !adminData.pass) {
        setError('All fields are required');
        return;
      }
      if (adminData.pass !== adminData.confirmPass) {
        setError('Passwords do not match');
        return;
      }
      onAdminRegister({
        username: adminData.username,
        email: adminData.email,
        phone: adminData.phone,
        pass: adminData.pass,
        role: adminData.role
      });
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${mode === 'VOTER' ? 'gradient-bg' : 'bg-slate-900'}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 overflow-hidden">
        
        {/* Tab Switcher */}
        <div className="flex border-b">
          <button 
            onClick={() => { setMode('VOTER'); setStep('PHONE'); setError(''); }}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'VOTER' ? 'text-[#FF9933] border-b-4 border-[#FF9933]' : 'text-gray-400 bg-gray-50'
            }`}
          >
            Citizen Registration
          </button>
          <button 
            onClick={() => { setMode('ADMIN'); setStep('PHONE'); setError(''); }}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'ADMIN' ? 'text-[#000080] border-b-4 border-[#000080]' : 'text-gray-400 bg-gray-50'
            }`}
          >
            Official Onboarding
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors ${mode === 'VOTER' ? 'bg-orange-100' : 'bg-blue-100'}`}>
              {step === 'DETAILS' ? (
                <UserPlus className={mode === 'VOTER' ? 'text-[#FF9933]' : 'text-[#000080]'} size={32} />
              ) : (
                <Smartphone className={mode === 'VOTER' ? 'text-[#FF9933]' : 'text-[#000080]'} size={32} />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {step === 'DETAILS' ? 'Join BharatVote' : 'Verify Identity'}
            </h2>
            <p className="text-gray-500 mt-2">
              {step === 'DETAILS' 
                ? (mode === 'VOTER' ? 'Register as a verified citizen' : 'Official Election Personnel Registration')
                : step === 'PHONE'
                ? (isVerifying ? 'Requesting OTP...' : 'Verify your mobile number to continue')
                : `Enter the 6-digit OTP sent to ${maskedPhone}`
              }
            </p>
          </div>

          {step === 'DETAILS' && mode === 'ADMIN' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start space-x-2 mb-6">
              <ShieldAlert size={16} className="text-amber-600 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-tight">
                Official registration requires pre-authorization from the Election Commission of India.
              </p>
            </div>
          )}

          <form onSubmit={step === 'PHONE' ? requestPhoneOtp : (step === 'OTP' ? handleOtpVerify : handleFinalRegister)} className="space-y-4">
            {step === 'PHONE' ? (
              <>
                {mode === 'VOTER' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name (as per ID)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={voterData.name}
                          onChange={(e) => setVoterData({ ...voterData, name: e.target.value })}
                          placeholder="ARJUN SINGH"
                          disabled={isVerifying}
                          className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 outline-none transition-all ${
                            mode === 'VOTER' ? 'focus:ring-[#FF9933]' : 'focus:ring-[#000080]'
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">EPIC Number (Voter ID)</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={voterData.epic}
                          onChange={(e) => setVoterData({ ...voterData, epic: e.target.value.toUpperCase() })}
                          placeholder="VOTE123456"
                          disabled={isVerifying}
                          className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 outline-none transition-all ${
                            mode === 'VOTER' ? 'focus:ring-[#FF9933]' : 'focus:ring-[#000080]'
                          }`}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={mode === 'VOTER' ? voterData.phone : adminData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (mode === 'VOTER') {
                          setVoterData({ ...voterData, phone: val });
                        } else {
                          setAdminData({ ...adminData, phone: val });
                        }
                      }}
                      placeholder="9876543210"
                      maxLength={10}
                      disabled={isVerifying}
                      className={`w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 outline-none transition-all ${
                        mode === 'VOTER' ? 'focus:ring-[#FF9933]' : 'focus:ring-[#000080]'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">A 6-digit verification code will be sent to this number.</p>
                </div>
              </>
            ) : step === 'OTP' ? (
              <>
                <div className="flex justify-center space-x-2">
                  <div className="relative w-full">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={isVerifying}
                      className={`w-full pl-10 pr-4 py-4 text-center text-2xl font-bold tracking-[0.5em] border border-gray-200 rounded-xl focus:ring-2 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        mode === 'VOTER' ? 'focus:ring-[#FF9933]' : 'focus:ring-[#000080]'
                      }`}
                    />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <button 
                    type="button"
                    onClick={() => setStep('PHONE')}
                    className="text-[10px] text-[#FF9933] font-bold uppercase tracking-widest hover:underline block w-full"
                  >
                    Change Number
                  </button>
                  
                  {resendTimer > 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      Resend OTP in {resendTimer}s
                    </p>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => requestPhoneOtp()}
                      className="text-[10px] text-[#FF9933] font-bold uppercase tracking-widest hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {mode === 'VOTER' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Constituency</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={voterData.constituency}
                          onChange={(e) => setVoterData({ ...voterData, constituency: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all appearance-none bg-white"
                        >
                          <option value="">Select Constituency</option>
                          <option value="New Delhi">New Delhi</option>
                          <option value="Mumbai South">Mumbai South</option>
                          <option value="Bangalore Central">Bangalore Central</option>
                          <option value="Chennai North">Chennai North</option>
                          <option value="Kolkata South">Kolkata South</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Security PIN</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="password"
                            value={voterData.pin}
                            onChange={(e) => setVoterData({ ...voterData, pin: e.target.value })}
                            placeholder="••••"
                            maxLength={4}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirm PIN</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="password"
                            value={voterData.confirmPin}
                            onChange={(e) => setVoterData({ ...voterData, confirmPin: e.target.value })}
                            placeholder="••••"
                            maxLength={4}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Official ID</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={adminData.username}
                            onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                            placeholder="officer_name"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Official Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="email"
                            value={adminData.email}
                            onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                            placeholder="name@eci.gov.in"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Designation</label>
                      <select
                        value={adminData.role}
                        onChange={(e) => setAdminData({ ...adminData, role: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all bg-white"
                      >
                        <option value="ELECTION_OFFICER">Election Officer</option>
                        <option value="SYSTEM_ADMIN">System Administrator</option>
                        <option value="AUDITOR">Election Auditor</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passkey</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="password"
                            value={adminData.pass}
                            onChange={(e) => setAdminData({ ...adminData, pass: e.target.value })}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirm Passkey</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="password"
                            value={adminData.confirmPass}
                            onChange={(e) => setAdminData({ ...adminData, confirmPass: e.target.value })}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#000080] outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {error && <p className="text-red-500 text-xs italic font-medium text-center">{error}</p>}

            <button
              type="submit"
              disabled={isVerifying}
              className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                mode === 'VOTER' ? 'bg-[#138808] hover:bg-[#0f6e06]' : 'bg-[#000080] hover:bg-blue-900'
              }`}
            >
              <span>
                {isVerifying 
                  ? 'Processing...' 
                  : step === 'PHONE' 
                    ? 'Request Secure OTP' 
                    : step === 'OTP' 
                      ? 'Verify & Continue' 
                      : (mode === 'VOTER' ? 'Complete Registration' : 'Onboard & Continue')}
              </span>
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={onBackToLogin}
              className="text-xs text-gray-500 hover:text-gray-800 font-bold uppercase tracking-widest transition-colors"
            >
              Already registered? Sign In
            </button>
          </div>

          <p className="mt-6 text-center text-[10px] text-gray-400">
            By registering, you agree to the ECI Digital Voting Guidelines and IT Act 2000.
          </p>
        </div>
      </div>
      <div id="otp-timer-placeholder"></div>
    </div>
  );
};

export default Register;
