import { Counter } from '../models/Counter';

export async function generateId(prefix: string, sequenceName: string): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  const padded = String(counter.seq).padStart(5, '0');
  return `${prefix}${padded}`;
}
