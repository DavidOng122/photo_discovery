import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ walkId: string }> }
) {
  const { walkId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: walk, error } = await supabase
    .from('walks')
    .select('status, title')
    .eq('id', walkId)
    .eq('user_id', user.id)
    .single();

  if (error || !walk) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  let tags: any[] = [];
  if (walk.status === 'TAG_SELECTION' || walk.status === 'RECOMMENDING' || walk.status === 'COMPLETED') {
    const { data } = await supabase
      .from('discovery_tags')
      .select('id, label, category, reason')
      .eq('walk_id', walkId);
    tags = data || [];
  }

  return NextResponse.json({ walk, tags });
}
