import { MAX_PHOTOS } from '@/constants/images';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFiles(files: File[], currentCount: number): ValidationResult {
  if (files.length === 0) {
    return { valid: false, error: '画像ファイルを選択してください。' };
  }

  if (currentCount + files.length > MAX_PHOTOS) {
    return { valid: false, error: '写真は最大10枚まで選択できます。' };
  }
  
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'サポートされていないファイル形式が含まれています。画像のみアップロード可能です。' };
    }
  }

  return { valid: true };
}
