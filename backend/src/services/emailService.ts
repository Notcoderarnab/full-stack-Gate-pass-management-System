import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

interface ApprovalEmailData {
  guestEmail: string;
  guestName: string;
  hostName: string;
  visitDate: Date;
  timeSlot: string;
  qrCodeBase64: string;
}

export const sendApprovalEmail = async (data: ApprovalEmailData): Promise<void> => {
  const base64Data = data.qrCodeBase64.replace(/^data:image\/png;base64,/, '');

  await transporter.sendMail({
    from: `"GatePass Security" <${process.env.EMAIL_USER}>`,
    to: data.guestEmail,
    subject: 'Your Visit Has Been Approved — GatePass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Visit Approved! 🎉</h2>
        <p>Hello <strong>${data.guestName}</strong>,</p>
        <p>Your visit request has been <strong>approved</strong>!</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; background: #f0fdf4; font-weight: bold;">Host</td>
            <td style="padding: 8px;">${data.hostName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f0fdf4; font-weight: bold;">Date</td>
            <td style="padding: 8px;">${data.visitDate.toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; background: #f0fdf4; font-weight: bold;">Time</td>
            <td style="padding: 8px;">${data.timeSlot}</td>
          </tr>
        </table>
        <p>Show the QR code below to the security guard when you arrive:</p>
        <img src="cid:qrcode" alt="Your GatePass QR Code" style="width: 250px; border: 1px solid #e5e7eb; border-radius: 8px;"/>
        <br/><br/>
        <p style="color: #6b7280; font-size: 12px;">— The GatePass Team</p>
      </div>
    `,
    attachments: [
      {
        filename: 'gatepass-qr.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qrcode',
      },
    ],
  });
};

export const sendRejectionEmail = async (data: {
  guestEmail: string;
  guestName: string;
  reason: string;
}): Promise<void> => {
  await transporter.sendMail({
    from: `"GatePass Security" <${process.env.EMAIL_USER}>`,
    to: data.guestEmail,
    subject: ' Visit Request Update — GatePass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #dc2626;">Visit Request Not Approved</h2>
        <p>Hello <strong>${data.guestName}</strong>,</p>
        <p>Unfortunately, your visit request was <strong>not approved</strong>.</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>You may submit a new request at a different time.</p>
        <p style="color: #6b7280; font-size: 12px;">— The GatePass Team</p>
      </div>
    `,
  });
};
