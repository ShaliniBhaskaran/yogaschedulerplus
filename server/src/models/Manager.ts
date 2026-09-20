import mongoose, { Schema } from 'mongoose';

export interface IManager {
  email: string;
  passwordHash: string;
}

const managerSchema = new Schema<IManager>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

export const Manager = mongoose.model<IManager>('Manager', managerSchema);
