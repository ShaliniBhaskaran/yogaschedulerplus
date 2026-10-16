import mongoose, { Schema } from 'mongoose';

export interface ISale {
  customerId: string;
  packageId: string;
  amountPaid: number;
  modeOfPayment: 'Cash' | 'Card' | 'Online';
  paymentDate: Date;
  validityStartDate: Date;
  validityEndDate: Date;
}

const saleSchema = new Schema<ISale>({
  customerId: { type: String, required: true },
  packageId: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  modeOfPayment: { type: String, enum: ['Cash', 'Card', 'Online'], required: true },
  paymentDate: { type: Date, required: true },
  validityStartDate: { type: Date, required: true },
  validityEndDate: { type: Date, required: true },
}, { timestamps: true });

export const Sale = mongoose.model<ISale>('Sale', saleSchema);
