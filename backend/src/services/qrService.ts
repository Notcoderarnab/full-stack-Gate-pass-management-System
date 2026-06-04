import QRCode from 'qrcode';

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

export const buildQrPayload = (qrToken: string): string => {
  const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
  const verifyUrl = new URL('/verify', frontendUrl);
  verifyUrl.searchParams.set('token', qrToken);
  return verifyUrl.toString();
};

export const extractQrToken = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return '';
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    return parsedUrl.searchParams.get('token')?.trim() || normalizedValue;
  } catch {
    return normalizedValue;
  }
};

export const generateQRCode = async (
  data: string
): Promise<string> => {

  try {

    const qrDataUrl = await QRCode.toDataURL(data, {

      width: 400,

      margin: 2,

      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },

    });

    return qrDataUrl;

  } catch (error) {

    throw new Error('QR code generation failed');

  }
};
