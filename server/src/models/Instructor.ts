import mongoose, { Schema } from 'mongoose';

export interface IInstructor {
  instructorId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
}

const instructorSchema = new Schema<IInstructor>({
  instructorId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  preferredContact: { type: String, enum: ['phone', 'email'], required: true },
});

export const Instructor = mongoose.model<IInstructor>('Instructor', instructorSchema);
