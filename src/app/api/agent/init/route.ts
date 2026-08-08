import { NextResponse } from 'next/server';
import { initAgent, Persona } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.persona || !body.persona.name || !body.persona.domain) {
      return NextResponse.json(
        { error: 'Invalid request payload. Expected { persona: { name, domain } }' },
        { status: 400 }
      );
    }

    const persona: Persona = body.persona;
    
    // Save the persona to the local JSON database
    const agentId = initAgent(persona);

    return NextResponse.json({ agentId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse JSON body' },
      { status: 400 }
    );
  }
}
