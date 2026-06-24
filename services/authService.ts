import axios from 'axios';

/**
 * Send OTP to a phone number via custom backend (Fast2SMS)
 * The backend generates the OTP, stores it securely (hashed), 
 * and sends it via real SMS gateway.
 */
export const sendOtp = async (phoneNumber: string, name?: string, epicNumber?: string) => {
  try {
    // Ensure phone number is 10 digits for the API
    const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\s+/g, '');
    
    const response = await axios.post('/api/auth/send-otp', {
      phoneNumber: cleanPhone,
      name,
      epicNumber
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Send OTP Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to send OTP. Please check your connection.');
  }
};

/**
 * Verify OTP via custom backend
 * The backend compares the hashed OTP and checks expiry.
 */
export const verifyOtp = async (phoneNumber: string, otp: string) => {
  try {
    const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\s+/g, '');
    
    const response = await axios.post('/api/auth/verify-otp', {
      phoneNumber: cleanPhone,
      otp: otp
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Verify OTP Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Invalid OTP. Please try again.');
  }
};
