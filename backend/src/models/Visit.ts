import mongoose, {Document,Schema,Types} from "mongoose";

export type VisitStatus = | 'PENDING'      // Guest submitted, waiting for host
  | 'APPROVED'     // Host approved, QR generated
  | 'REJECTED'     // Host rejected
  | 'CHECKED_IN'   // Guard scanned, guest entered
  | 'COMPLETED'    // Visit finished
  | 'EXPIRED';     // QR expired / cancelled


  export interface IVisit extends Document {
    guestId: Types.ObjectId;
  hostId: Types.ObjectId;
  purposeOfVisit: string;
  visitDate: Date;
  visitTimeSlot: string;
  gate?: string;
  status: VisitStatus;
  guestNote?: string;
  hostNote?: string;
  qrToken?: string;
  qrCodeImageBase64?: string;
  qrGeneratedAt?: Date;
  qrExpiresAt?: Date;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  }


  const visitSchema = new Schema<IVisit>(
  {
    guestId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostId:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purposeOfVisit:    { type: String, required: true },
    visitDate:         { type: Date, required: true },
    visitTimeSlot:     { type: String, required: true },
    gate:              { type: String, trim: true, default: 'Gate A' },
    status:            {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'COMPLETED', 'EXPIRED'],
      default: 'PENDING',
    },
    guestNote:         { type: String },
    hostNote:          { type: String },
    qrToken:           { type: String, unique: true, sparse: true },
    qrCodeImageBase64: { type: String },
    qrGeneratedAt:     { type: Date },
    qrExpiresAt:       { type: Date },
    checkedInAt:       { type: Date },
  },
  { timestamps: true }
);

// Index for fast QR token lookup
visitSchema.index({ qrToken: 1 });

export const Visit = mongoose.model<IVisit>('Visit', visitSchema);
