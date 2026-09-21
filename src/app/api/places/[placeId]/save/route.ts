import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { savePlace } from '@/lib/saved/savePlace';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const { placeId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const result = await savePlace(placeId);
    return NextResponse.json({ savedPlaceId: result.savedPlaceId, alreadySaved: result.alreadySaved });
  } catch (err: any) {
    console.error('Save place error:', err);
    if (err.message?.includes('not found')) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: '場所が見つかりませんでした。' } }, { status: 404 });
    }
    if (err.message?.includes('Access denied')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: 'SAVE_FAILED', message: '場所を保存できませんでした。もう一度お試しください。' } }, { status: 500 });
  }
}
