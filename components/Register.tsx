
import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Lock, ArrowRight, User, Mail, MapPin, Fingerprint, ShieldAlert, Smartphone, RefreshCw, Bell } from 'lucide-react';

interface RegisterProps {
  onVoterRegister: (data: { name: string; epic: string; aadhaar: string; constituency: string; pin: string }) => void;
  onAdminRegister: (data: { username: string; email: string; pass: string; role: string }) => void;
  onBackToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onVoterRegister, onAdminRegister, onBackToLogin }) => {
  const [mode, setMode] = useState<'VOTER' | 'ADMIN'>('VOTER');
  const [step, setStep] = useState<'DETAILS' | 'AADHAAR' | 'OTP'>('DETAILS');
  const [voterData, setVoterData] = useState({ name: '', epic: '', aadhaar: '', constituency: '', pin: '', confirmPin: '' });
  const [adminData, setAdminData] = useState({ username: '', email: '', pass: '', confirmPass: '', role: 'ELECTION_OFFICER' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [demoOtp, setDemoOtp] = useState('');

  const verifyAadhaarAndSendOtp = async () => {
    setIsVerifying(true);
    setError('');
    
    try {
      // Validate Aadhaar
      let aadhaarToVerify = '';
      if (mode === 'VOTER') {
        if (voterData.aadhaar.length !== 12) {
          setError('Invalid Aadhaar Number. Must be 12 digits.');
          setIsVerifying(false);
          setStep('DETAILS');
          return;
        }
        aadhaarToVerify = voterData.aadhaar;
      } else {
        // For admin, use a demo Aadhaar for this example
        aadhaarToVerify = '999999999999';
      }

      // Call real API to request OTP
      const response = await fetch('/api/aadhaar/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaarNumber: aadhaarToVerify,
          purpose: mode === 'VOTER' ? 'registration' : 'admin_onboarding'
        })
      });

      const data = await response.json();

      if (data.success) {
        setTransactionId(data.transactionId || '');
        setMaskedMobile(data.maskedMobile || '');
        setDemoOtp(data.otp || ''); // Store the actual OTP for demo mode
        setStep('OTP');
      } else {
        setError(data.message || 'Failed to request OTP. Please try again.');
        setStep('DETAILS');
      }
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError('Failed to connect to verification service. Please try again.');
      setStep('DETAILS');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVoterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterData.name || !voterData.epic || !voterData.aadhaar || !voterData.constituency || !voterData.pin) {
      setError('All fields are required');
      return;
    }
    if (voterData.pin !== voterData.confirmPin) {
      setError('PINs do not match');
      return;
    }
    if (voterData.pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (voterData.aadhaar.length !== 12) {
      setError('Aadhaar must be 12 digits');
      return;
    }
    setStep('AADHAAR');
    verifyAadhaarAndSendOtp();
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminData.username || !adminData.email || !adminData.pass) {
      setError('All fields are required');
      return;
    }
    if (adminData.pass !== adminData.confirmPass) {
      setError('Passwords do not match');
      return;
    }
    setStep('AADHAAR'); // Use same loading view for admin onboarding too
    verifyAadhaarAndSendOtp();
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsVerifying(false);
      return;
    }

    try {
      // Call real API to verify OTP
      const aadhaarToVerify = mode === 'VOTER' ? voterData.aadhaar : '999999999999';
      
      const response = await fetch('/api/aadhaar/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          otp,
          aadhaarNumber: aadhaarToVerify
        })
      });

      const data = await response.json();

      if (data.success) {
        // OTP verified, save token and proceed with registration
        setOtpToken(data.token || '');
        
        if (mode === 'VOTER') {
          onVoterRegister({
            name: voterData.name,
            epic: voterData.epic,
            aadhaar: voterData.aadhaar,
            constituency: voterData.constituency,
            pin: voterData.pin
          });
        } else {
          onAdminRegister({
            username: adminData.username,
            email: adminData.email,
            pass: adminData.pass,
            role: adminData.role
          });
        }
      } else {
        // Check if we can extract remaining attempts from the message
        const message = data.message || 'Invalid OTP. Please try again.';
        setError(message);
        
        // Update remaining attempts if available
        const attemptsMatch = message.match(/(\d+)\s+attempts?\s+remaining/);
        if (attemptsMatch) {
          const remaining = parseInt(attemptsMatch[1]);
          setRemainingAttempts(remaining);
          if (remaining === 0) {
            setError('Maximum OTP attempts exceeded. Please request a new OTP.');
            setStep('DETAILS');
          }
        }
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('Failed to verify OTP. Please check your connection and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${mode === 'VOTER' ? 'gradient-bg' : 'bg-slate-900'}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 overflow-hidden">
        
        {/* Tab Switcher */}
        {step === 'DETAILS' && (
          <div className="flex border-b">
            <button 
              onClick={() => { setMode('VOTER'); setError(''); }}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                mode === 'VOTER' ? 'text-[#FF9933] border-b-4 border-[#FF9933]' : 'text-gray-400 bg-gray-50'
              }`}
            >
              Citizen Registration
            </button>
            <button 
              onClick={() => { setMode('ADMIN'); setError(''); }}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                mode === 'ADMIN' ? 'text-[#000080] border-b-4 border-[#000080]' : 'text-gray-400 bg-gray-50'
              }`}
            >
              Official Onboarding
            </button>
          </div>
        )}

        <div className="p-8">
          <div className="text-center mb-8">
            {step === 'OTP' && (
              <div className="mb-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-emerald-500 text-white p-2 rounded-lg">
                      <Bell size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">OTP Generated</p>
                      <p className="text-sm font-bold text-emerald-900">For testing purposes</p>
                    </div>
                  </div>
                  
                  {/* OTP Display */}
                  <div 
                    className="bg-white border-2 border-emerald-300 rounded-xl p-4 text-center cursor-pointer hover:bg-emerald-50 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(demoOtp);
                      // Simple feedback
                      const element = document.activeElement as HTMLElement;
                      if (element) element.blur();
                    }}
                  >
                    <p className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-widest">Your OTP</p>
                    <p className="text-3xl font-black text-emerald-600 tracking-[0.3em] font-mono select-all">
                      {demoOtp}
                    </p>
                    <p className="text-xs text-emerald-700 mt-2">Click to copy • Valid for 15 minutes</p>
                  </div>
                </div>
              </div>
            )}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors ${mode === 'VOTER' ? 'bg-orange-100' : 'bg-blue-100'}`}>
              {step === 'DETAILS' ? (
                <UserPlus className={mode === 'VOTER' ? 'text-[#FF9933]' : 'text-[#000080]'} size={32} />
              ) : step === 'AADHAAR' ? (
                <ShieldCheck className={mode === 'VOTER' ? 'text-[#FF9933]' : 'text-[#000080]'} size={32} />
              ) : (
                <Smartphone className={mode === 'VOTER' ? 'text-[#FF9933]' : 'text-[#000080]'} size={32} />
              )}
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {step === 'DETAILS' ? 'Join BharatVote' : step === 'AADHAAR' ? 'UIDAI Verification' : 'Verify Identity'}
            </h2>
            <p className="text-gray-500 mt-2">
              {step === 'DETAILS' 
                ? (mode === 'VOTER' ? 'Register as a verified citizen' : 'Official Election Personnel Registration')
                : step === 'AADHAAR'
                ? 'Securely connecting to UIDAI servers for e-KYC...'
                : `Enter the 6-digit OTP sent to ${maskedMobile}`
              }
            </p>
          </div>

          {step === 'DETAILS' ? (
            <>
              {mode === 'ADMIN' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start space-x-2 mb-6">
                  <ShieldAlert size={16} className="text-amber-600 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-tight">
                    Official registration requires pre-authorization from the Election Commission of India.
                  </p>
                </div>
              )}

              <form onSubmit={mode === 'VOTER' ? handleVoterSubmit : handleAdminSubmit} className="space-y-4">
                {mode === 'VOTER' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={voterData.name}
                            onChange={(e) => setVoterData({ ...voterData, name: e.target.value })}
                            placeholder="Rahul Sharma"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">EPIC Number</label>
                        <div className="relative">
                          <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={voterData.epic}
                            onChange={(e) => setVoterData({ ...voterData, epic: e.target.value.toUpperCase() })}
                            placeholder="EPIC1234567"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Aadhaar Number</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={voterData.aadhaar}
                          onChange={(e) => setVoterData({ ...voterData, aadhaar: e.target.value.replace(/\D/g, '') })}
                          placeholder="1234 5678 9012"
                          maxLength={12}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all"
                        />
                      </div>
                    </div>

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
                          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
                          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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

                {error && <p className="text-red-500 text-xs italic font-medium text-center">{error}</p>}

                <button
                  type="submit"
                  className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                    mode === 'VOTER' ? 'bg-[#138808] hover:bg-[#0f6e06]' : 'bg-[#000080] hover:bg-blue-900'
                  }`}
                >
                  <span>{mode === 'VOTER' ? 'Verify Aadhaar & Continue' : 'Onboard & Continue'}</span>
                  <ArrowRight size={20} />
                </button>
              </form>
            </>
          ) : step === 'AADHAAR' ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-gray-100 border-t-[#FF9933] rounded-full animate-spin"></div>
                <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#138808]" size={40} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800">Verifying Aadhaar</h3>
                <p className="text-gray-500 text-sm mt-2">Connecting to UIDAI Central Identity Data Repository...</p>
              </div>
              {error && (
                <div className="text-center">
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                  <button 
                    onClick={() => setStep('DETAILS')}
                    className="mt-4 text-[#FF9933] text-xs font-bold uppercase tracking-widest"
                  >
                    Go Back & Correct
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleOtpVerify} className="space-y-6">
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
                    className="w-full pl-10 pr-4 py-4 text-center text-2xl font-bold tracking-[0.5em] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF9933] outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs italic font-medium text-center">{error}</p>}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === 'VOTER' ? 'bg-[#138808] hover:bg-[#0f6e06]' : 'bg-[#000080] hover:bg-blue-900'
                  }`}
                >
                  <span>{isVerifying ? 'Verifying...' : 'Verify & Complete'}</span>
                  <ShieldCheck size={20} />
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep('DETAILS')}
                  disabled={isVerifying}
                  className="w-full text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Change Details
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-400">Didn't receive OTP?</p>
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/aadhaar/resend-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ transactionId })
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setError('');
                        alert('OTP resent successfully to ' + data.maskedMobile);
                      } else {
                        setError(data.message || 'Failed to resend OTP');
                      }
                    } catch (err) {
                      setError('Failed to resend OTP. Please try again.');
                    }
                  }}
                  disabled={isVerifying}
                  className="text-xs text-[#FF9933] font-bold uppercase tracking-widest mt-1 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

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
    </div>
  );
};

export default Register;
