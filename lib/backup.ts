export type BackupStatus = 'pending' | 'running' | 'success' | 'failed' | 'restoring';
export type BackupSchedule = 'hourly' | 'daily' | 'weekly' | 'monthly';
export interface BackupJob { id: string; name: string; source: string; destination: string; schedule: BackupSchedule; retentionDays: number; lastRun?: string; status: BackupStatus; sizeGB?: number; durationSec?: number }
export function scheduleIntervalHours(s: BackupSchedule): number {
  return { hourly: 1, daily: 24, weekly: 168, monthly: 720 }[s];
}
export function isOverdue(job: BackupJob): boolean {
  if (!job.lastRun) return true;
  const hoursSince = (Date.now() - new Date(job.lastRun).getTime()) / 3600000;
  return hoursSince > scheduleIntervalHours(job.schedule);
}
export function retentionExpiry(lastRun: string, retentionDays: number): Date {
  return new Date(new Date(lastRun).getTime() + retentionDays * 86400000);
}
export function formatJob(j: BackupJob): string { return `${j.name}: ${j.source} -> ${j.destination} [${j.schedule}] status:${j.status} retention:${j.retentionDays}d`; }