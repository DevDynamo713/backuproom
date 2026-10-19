export interface Env { BACKUPROOM_DO: DurableObjectNamespace; }
export class BackupRoomDO {
  private state: DurableObjectState;
  private jobs: Map<string, any> = new Map();
  private websockets: WebSocket[] = [];
  constructor(state: DurableObjectState, env: Env) { this.state = state; }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (url.pathname === '/jobs' && request.method === 'GET') {
      return Response.json(Array.from(this.jobs.values()));
    }
    if (url.pathname === '/job' && request.method === 'POST') {
      const data = await request.json();
      const job = { ...data, id: crypto.randomUUID(), status: 'pending', lastRun: undefined };
      this.jobs.set(job.id, job);
      this.broadcast(JSON.stringify({ type: 'job', data: job }));
      return Response.json({ success: true, job });
    }
    return new Response('Not Found', { status: 404 });
  }
  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) { }
  webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) { this.websockets = this.websockets.filter(w => w !== ws); }
  private broadcast(msg: string) { for (const ws of this.websockets) { if (ws.readyState === 1) ws.send(msg); } }
}
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const id = env.BACKUPROOM_DO.idFromName(url.pathname);
    const stub = env.BACKUPROOM_DO.get(id);
    return stub.fetch(request);
  }
}