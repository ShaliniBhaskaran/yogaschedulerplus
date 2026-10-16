import mongoose, { Schema } from 'mongoose';

export interface ICustomer {
  customerId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  classBalance: number;
  isUnlimited: boolean;
}

const customerSchema = new Schema<ICustomer>({
  customerId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  preferredContact: { type: String, enum: ['phone', 'email'], required: true },
  classBalance: { type: Number, default: 0 },
  isUnlimited: { type: Boolean, default: false },
  
});
export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
