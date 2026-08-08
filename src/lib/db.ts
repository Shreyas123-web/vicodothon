import fs from 'fs';
import path from 'path';

// Force absolute path for Railway production to avoid Next.js cwd resolving differences
const DATA_DIR = process.env.NODE_ENV === 'production' 
  ? '/app/data' 
  : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Persona {
  name: string;
  domain: string;
}

export interface Post {
  id: string;
  createdAt: string;
  text: string;
  rationale: string;
  sources: string[];
}

export interface RejectedTopic {
  title: string;
  reason: string;
  rejectedAt: string;
}

export interface AgentData {
  agentId: string;
  persona: Persona | null;
  posts: Post[];
  rejected: RejectedTopic[];
  lastRunAt?: string;
}

function readData(): AgentData {
  console.log(`[DB] Reading from exact path: ${DATA_FILE}`);
  if (!fs.existsSync(DATA_FILE)) {
    console.log(`[DB] File not found at path. Returning empty state.`);
    return { agentId: '', persona: null, posts: [], rejected: [] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    console.log(`[DB] Successfully read ${raw.length} bytes from file.`);
    return JSON.parse(raw);
  } catch (e) {
    console.log(`[DB] Error parsing file:`, e);
    return { agentId: '', persona: null, posts: [], rejected: [] };
  }
}

function writeData(data: AgentData) {
  console.log(`[DB] Writing to exact path: ${DATA_FILE}`);
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DATA_FILE);
}

export function initAgent(persona: Persona): string {
  const agentId = `agent_${Date.now()}`;
  writeData({
    agentId,
    persona,
    posts: [],
    rejected: [],
    lastRunAt: new Date().toISOString()
  });
  return agentId;
}

export function getAgentData(): AgentData {
  return readData();
}

export function savePost(post: Post) {
  const data = readData();
  data.posts.unshift(post); // newest first
  writeData(data);
}

export function saveRejections(rejections: RejectedTopic[]) {
  const data = readData();
  data.rejected = [...rejections, ...data.rejected];
  writeData(data);
}

export function updateHeartbeat() {
  const data = readData();
  if (data.agentId) {
    data.lastRunAt = new Date().toISOString();
    writeData(data);
  }
}
