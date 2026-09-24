/* eslint-disable @next/next/no-img-element */
import { PreviewFile } from '@/hooks/usePhotoUpload';
import styles from './PhotoPreviewGrid.module.css';

interface Props {
  photo: PreviewFile;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PhotoPreviewItem({ photo, selected, onToggle, disabled = false }: Props) {
  return (
    <button
      type="button"
      className={styles.photoTile}
      onClick={onToggle}
      disabled={disabled}
      aria-label={selected ? '写真の選択を解除' : '写真を選択'}
      aria-pressed={selected}
    >
      <img className={styles.thumbnail} src={photo.previewUrl} alt="" />
      {selected && <span className={styles.selectedOverlay} aria-hidden="true" />}
    </button>
  );
}
