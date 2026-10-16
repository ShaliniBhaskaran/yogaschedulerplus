import mongoose, { Schema } from 'mongoose';

export interface IPackage {
  packageId: string;
  packageName: string;
  packageCategory: 'General' | 'Senior';
  numberOfClasses: '1' | '4' | '10' | 'unlimited';
  classType: 'General' | 'Special';
  startDate: Date;
  endDate: Date;
  price: number;
}

const packageSchema = new Schema<IPackage>({
  packageId: { type: String, required: true, unique: true },
  packageName: { type: String, required: true },
  packageCategory: { type: String, enum: ['General', 'Senior'], required: true },
  numberOfClasses: { type: String, enum: ['1', '4', '10', 'unlimited'], required: true },
  classType: { type: String, enum: ['General', 'Special'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

export const Package = mongoose.model<IPackage>('Package', packageSchema);
