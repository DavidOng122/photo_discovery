import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const messages = body.messages || [];
  const prompt = messages[0]?.content || '';

  // Simple mock response based on prompt
  if (typeof prompt === 'string' && prompt.includes('recommend')) {
    // Recommendation Mock
    return NextResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              places: [
                { name: 'Mock Place 1', type: 'place', area: 'Tokyo', reason: 'r1', googleMapsQuery: 'Mock 1 Tokyo', matchedFeatures: ['f1'] },
                { name: 'Mock Place 2', type: 'place', area: 'Tokyo', reason: 'r2', googleMapsQuery: 'Mock 2 Tokyo', matchedFeatures: ['f2'] },
                { name: 'Mock Place 3', type: 'place', area: 'Tokyo', reason: 'r3', googleMapsQuery: 'Mock 3 Tokyo', matchedFeatures: ['f3'] },
              ]
            })
          }
        }
      ]
    });
  } else {
    // Vision Mock
    return NextResponse.json({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Mock Walk',
              observations: [{ id: 'obs1', description: 'desc', type: 'style', matchedFeatures: ['f1'] }],
              discoveries: [{ lens: 'culture', phrase: 'Mock Phrase', explanation: 'exp', observationIds: ['obs1'] }]
            })
          }
        }
      ]
    });
  }
}
