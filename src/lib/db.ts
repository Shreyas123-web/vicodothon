import fs from 'fs';
import path from 'path';

// Using a local JSON file to simulate persistent storage on a stateful deployment (like Render/Railway).
const DATA_DIR = path.join(process.cwd(), 'data');
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
}

function readData(): AgentData {
  if (!fs.existsSync(DATA_FILE)) {
    return { agentId: '', persona: null, posts: [], rejected: [] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { agentId: '', persona: null, posts: [], rejected: [] };
  }
}

function writeData(data: AgentData) {
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
    rejected: []
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
