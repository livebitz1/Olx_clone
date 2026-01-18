// API Route to proxy MSG91 OTP requests (bypasses CORS)
// This runs on the server side, so there are no CORS issues

import { MSG91_CONFIG, OTP_CONFIG } from '@/lib/otp-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, otp } = body;

    const authKey = MSG91_CONFIG.authKey;
    
    if (!authKey) {
      return Response.json(
        { type: 'error', message: 'MSG91 API key not configured' },
        { status: 500 }
      );
    }

    // Format phone: 91XXXXXXXXXX
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    let url: string;
    let requestBody: any = {};

    switch (action) {
      case 'send':
        url = 'https://control.msg91.com/api/v5/otp';
        requestBody = {
          mobile: formattedPhone,
          otp_length: OTP_CONFIG.length,
          otp_expiry: OTP_CONFIG.expiryMinutes,
        };
        if (MSG91_CONFIG.templateId) {
          requestBody.template_id = MSG91_CONFIG.templateId;
        }
        break;

      case 'verify':
        url = `https://control.msg91.com/api/v5/otp/verify?mobile=${formattedPhone}&otp=${otp}`;
        break;

      case 'resend':
        url = `https://control.msg91.com/api/v5/otp/retry?mobile=${formattedPhone}&retrytype=text`;
        break;

      default:
        return Response.json(
          { type: 'error', message: 'Invalid action' },
          { status: 400 }
        );
    }

    console.log(`[OTP API] ${action} OTP for:`, formattedPhone);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
      body: action === 'send' ? JSON.stringify(requestBody) : undefined,
    });

    const data = await response.json();
    console.log(`[OTP API] Response:`, JSON.stringify(data));

    return Response.json(data);
  } catch (error: any) {
    console.error('[OTP API] Error:', error);
    return Response.json(
      { type: 'error', message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
