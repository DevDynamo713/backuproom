"use client";
import { useState, useEffect, useRef } from 'react';
export default function Room({ params }: { params: { id: string } }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [schedule, setSchedule] = useState('daily');
  const [retentionDays, setRetentionDays] = useState('30');
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket(`wss://backuproom.devdynamo713.com/room/${params.id}/ws`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'job') {
        setJobs(prev => [...prev, data.data]);
      }
    };
    wsRef.current = ws;
    const poll = setInterval(async () => {
      const res = await fetch(`https://backuproom.devdynamo713.com/room/${params.id}/jobs`);
      if (res.ok) setJobs(await res.json());
    }, 3000);
    return () => { ws.close(); clearInterval(poll); };
  }, [params.id]);
  const addJob = async () => {
    const data = { name, source, destination, schedule, retentionDays: parseInt(retentionDays) };
    await fetch(`https://backuproom.devdynamo713.com/room/${params.id}/job`, { method: 'POST', body: JSON.stringify(data) });
    setName(''); setSource(''); setDestination(''); setRetentionDays('30');
  };
  const statusColor: Record<string, string> = { pending: '#a1a1aa', running: '#60a5fa', success: '#4ade80', failed: '#f87171', restoring: '#fbbf24' };
  const isOverdue = (j: any) => {
    if (!j.lastRun) return true;
    const hours: Record<string, number> = { hourly: 1, daily: 24, weekly: 168, monthly: 720 };
    return (Date.now() - new Date(j.lastRun).getTime()) / 3600000 > hours[j.schedule];
  };
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', background: '#0a0a0a', color: '#e5e5e5', minHeight: '100vh' }}>
      <h1>BackupRoom: {params.id}</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="job name" className="name-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="source" className="source-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }} />
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="destination" className="destination-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }} />
        <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="schedule-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa' }}>
          <option value="hourly">hourly</option>
          <option value="daily">daily</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
        </select>
        <input value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} placeholder="retention days" className="retention-input" style={{ padding: 8, background: '#111111', border: '1px solid #3f3f46', borderRadius: 6, color: '#fafafa', width: 100 }} />
        <button className="add-btn" onClick={addJob} disabled={!name.trim() || !source.trim() || !destination.trim()} style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create Backup Job</button>
      </div>
      <div className="job-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {jobs.map(j => {
          const overdue = isOverdue(j);
          return (
            <div key={j.id} style={{ padding: 16, border: `1px solid ${overdue ? '#fbbf24' : '#27272a'}`, borderRadius: 12, background: '#09090b' }}>
              <strong style={{ fontSize: 18, color: '#60a5fa' }}>{j.name}</strong>
              <div style={{ marginTop: 4, color: '#a1a1aa', fontSize: 13 }}>{j.source} → {j.destination}</div>
              <div style={{ marginTop: 4, color: '#a1a1aa', fontSize: 13 }}>Schedule: {j.schedule} | Retention: {j.retentionDays}d</div>
              {j.lastRun && <div style={{ marginTop: 4, color: '#a1a1aa', fontSize: 13 }}>Last run: {new Date(j.lastRun).toLocaleString()}</div>}
              {j.sizeGB && <div style={{ marginTop: 4, color: '#a1a1aa', fontSize: 13 }}>Size: {j.sizeGB}GB {j.durationSec && `(${j.durationSec}s)`}</div>}
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: statusColor[j.status], textTransform: 'uppercase' }}>{j.status}</span>
                {overdue && j.status !== 'running' && <span style={{ color: '#fbbf24', fontSize: 12 }}>⚠ OVERDUE</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}