import axios from 'axios';

/**
 * Modular Notification Service
 * Handles SMS and other notifications using Fast2SMS
 */

const fast2smsKey = process.env.FAST2SMS_API_KEY;

interface SmsPayload {
  to: string;
  message: string;
}

/**
 * Send SMS notification via Fast2SMS
 */
export async function sendSms(payload: SmsPayload): Promise<boolean> {
  const { to, message } = payload;
  
  // Clean phone number
  const cleanPhone = to.replace(/^\+91/, '').replace(/\s+/g, '');

  if (fast2smsKey && fast2smsKey !== 'your_fast2sms_api_key') {
    try {
      await axios.post('https://www.fast2sms.com/dev/bulkV2', {
        route: 'v3',
        sender_id: 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanPhone,
      }, {
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (error: any) {
      console.error('Fast2SMS Notification Failed:', error.response?.data || error.message);
      return false;
    }
  } else {
    // Development Mock
    console.log(`[MOCK SMS] To: ${cleanPhone}, Message: ${message}`);
    return true;
  }
}

/**
 * Notify voter of successful registration
 */
export async function notifyRegistrationSuccess(phone: string, name: string) {
  return sendSms({
    to: phone,
    message: `Namaste ${name}, your registration for BharatVote is successful. Please wait for admin approval.`
  });
}

/**
 * Notify voter of vote cast
 */
export async function notifyVoteCast(phone: string) {
  return sendSms({
    to: phone,
    message: `Your vote has been successfully cast and recorded on BharatVote. Thank you for participating in democracy!`
  });
}

/**
 * Notify of election announcement
 */
export async function notifyElectionAnnouncement(phone: string, electionName: string) {
  return sendSms({
    to: phone,
    message: `A new election '${electionName}' has been announced. Please login to BharatVote to cast your vote.`
  });
}
