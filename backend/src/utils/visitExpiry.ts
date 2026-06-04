import { Visit } from '../models/Visit';

export const expireApprovedVisits = async () => {
  await Visit.updateMany(
    { status: { $in: ['APPROVED', 'CHECKED_IN'] }, qrExpiresAt: { $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
};
