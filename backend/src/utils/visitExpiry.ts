import { Visit } from '../models/Visit';

export const expireApprovedVisits = async () => {
  await Visit.updateMany(
    { status: 'APPROVED', qrExpiresAt: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
};
