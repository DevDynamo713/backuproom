import { describe, it, expect } from 'vitest';
import { scheduleIntervalHours, isOverdue, retentionExpiry, formatJob } from './backup';
describe('backup', () => {
  it('hourly = 1h', () => { expect(scheduleIntervalHours('hourly')).toBe(1); });
  it('daily = 24h', () => { expect(scheduleIntervalHours('daily')).toBe(24); });
  it('weekly = 168h', () => { expect(scheduleIntervalHours('weekly')).toBe(168); });
  it('monthly = 720h', () => { expect(scheduleIntervalHours('monthly')).toBe(720); });
  it('isOverdue true when no lastRun', () => {
    const j = { id: '1', name: 'db', source: 's', destination: 'd', schedule: 'daily', retentionDays: 30, status: 'pending' };
    expect(isOverdue(j)).toBe(true);
  });
  it('isOverdue false when recent', () => {
    const j = { id: '2', name: 'db', source: 's', destination: 'd', schedule: 'daily', retentionDays: 30, lastRun: new Date().toISOString(), status: 'success' };
    expect(isOverdue(j)).toBe(false);
  });
  it('retentionExpiry adds days', () => {
    const d = retentionExpiry('2026-10-19T12:00:00Z', 30);
    expect(d.toISOString()).toBe('2026-11-18T12:00:00.000Z');
  });
  it('formats correctly', () => {
    const j = { id: '3', name: 'db-backup', source: 'prod-db', destination: 's3://backups', schedule: 'daily', retentionDays: 30, status: 'success' };
    expect(formatJob(j)).toBe('db-backup: prod-db -> s3://backups [daily] status:success retention:30d');
  });
});