import mongoose, { Schema } from 'mongoose';

export interface IClass {
  instructorId: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:MM", 24-hour
  durationMinutes: number;
  classType: 'General' | 'Special';
  payRate: number;
  status: 'draft' | 'published';
}

const classSchema = new Schema<IClass>({
  instructorId: { type: String, required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true, default: 60 },
  classType: { type: String, enum: ['General', 'Special'], required: true },
  payRate: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
});

export const Class = mongoose.model<IClass>('Class', classSchema);
