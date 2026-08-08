import { NextResponse } from 'next/server';
import { getAgentData } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json(
      { error: 'Missing agentId parameter' },
      { status: 400 }
    );
  }

  const data = getAgentData();

  if (data.agentId !== agentId) {
    return NextResponse.json({ posts: [] });
  }

  return NextResponse.json({ 
    posts: data.posts,
    lastRunAt: data.lastRunAt 
  });
}
