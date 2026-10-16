import mongoose, { Schema } from 'mongoose';

export interface IAttendance {
  classId: string;
  instructorId: string;
  sessionDateTime: Date;
  customerIds: string[];
}

const attendanceSchema = new Schema<IAttendance>({
  classId: { type: String, required: true },
  instructorId: { type: String, required: true },
  sessionDateTime: { type: Date, required: true },
  customerIds: { type: [String], required: true },
}, { timestamps: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
