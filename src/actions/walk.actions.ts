'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { revalidatePath } from 'next/cache';

export async function updateWalkTitle(walkId: string, rawTitle: string) {
  const title = rawTitle.trim();
  if (!title || title.length === 0) {
    return { error: 'タイトルを入力してください。' };
  }
  if (title.length > 60) {
    return { error: 'タイトルは60文字以内で入力してください。' };
  }

  const user = await getCurrentUser();
  if (!user) return { error: '認証が必要です。' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('walks')
    .update({ title })
    .eq('id', walkId)
    .eq('user_id', user.id);

  if (error) {
    console.error('updateWalkTitle error:', error);
    return { error: 'タイトルを更新できませんでした。' };
  }

  revalidatePath(`/walk/${walkId}`);
  revalidatePath('/');
  return { success: true };
}

export async function deleteWalkAction(walkId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: '認証が必要です。' };

  const supabase = await createClient();

  // Verify ownership
  const { data: walk } = await supabase
    .from('walks')
    .select('id, user_id')
    .eq('id', walkId)
    .eq('user_id', user.id)
    .single();

  if (!walk) return { error: 'Walk not found or access denied.' };

  // Fetch storage paths before deleting
  const { data: photos } = await supabase
    .from('walk_photos')
    .select('storage_path')
    .eq('walk_id', walkId);

  // Delete storage objects
  if (photos && photos.length > 0) {
    const paths = photos.map((p: any) => p.storage_path);
    const { error: storageErr } = await supabase.storage
      .from('walk-photos')
      .remove(paths);
    if (storageErr) {
      console.error('Storage cleanup error (non-fatal):', storageErr);
    }
  }

  // Delete the walk (cascades to walk_photos, discovery_tags, recommendation_sets, etc.)
  const { error: deleteErr } = await supabase
    .from('walks')
    .delete()
    .eq('id', walkId)
    .eq('user_id', user.id);

  if (deleteErr) {
    console.error('deleteWalkAction error:', deleteErr);
    return { error: '散歩を削除できませんでした。' };
  }

  revalidatePath('/');
  return { success: true };
}
