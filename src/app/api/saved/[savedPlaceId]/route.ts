import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { unsavePlace } from '@/lib/saved/unsavePlace';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ savedPlaceId: string }> }
) {
  try {
    const { savedPlaceId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    await unsavePlace(savedPlaceId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Unsave place error:', err);
    if (err.message?.includes('Access denied')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 403 });
    }
    return NextResponse.json({ error: { code: 'UNSAVE_FAILED', message: '保存を解除できませんでした。もう一度お試しください。' } }, { status: 500 });
  }
}
