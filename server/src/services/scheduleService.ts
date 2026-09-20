import { Class } from '../models/Class';
import { toMinutes, toTimeString, rangesOverlap } from '../utils/timeUtils';

export async function findConflict(dayOfWeek: number, startTime: string, durationMinutes: number) {
  const classesOnDay = await Class.find({ dayOfWeek, status: 'published' });
  const newStart = toMinutes(startTime);
  return classesOnDay.find((c) => rangesOverlap(newStart, durationMinutes, toMinutes(c.startTime), c.durationMinutes)) || null;
}

export async function suggestAlternatives(dayOfWeek: number, durationMinutes: number, count = 3): Promise<string[]> {
  const classesOnDay = await Class.find({ dayOfWeek, status: 'published' });
  const suggestions: string[] = [];

  for (let slot = 6 * 60; slot <= 21 * 60 - durationMinutes && suggestions.length < count; slot += 30) {
    const conflict = classesOnDay.some((c) => rangesOverlap(slot, durationMinutes, toMinutes(c.startTime), c.durationMinutes));
    if (!conflict) {
      suggestions.push(toTimeString(slot));
    }
  }

  return suggestions;
}
