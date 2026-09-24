import { PreviewFile } from '@/hooks/usePhotoUpload';
import { PhotoPreviewItem } from './PhotoPreviewItem';
import styles from './PhotoPreviewGrid.module.css';

interface Props {
  photos: PreviewFile[];
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onAdd: () => void;
  canAddMore: boolean;
  disabled?: boolean;
}

export function PhotoPreviewGrid({ photos, selectedIds, onToggle, onAdd, canAddMore, disabled = false }: Props) {
  return (
    <div className={styles.grid} data-node-id="64:41">
      {photos.map((photo) => (
        <PhotoPreviewItem
          key={photo.id}
          photo={photo}
          selected={selectedIds.has(photo.id)}
          onToggle={() => onToggle(photo.id)}
          disabled={disabled}
        />
      ))}

      {canAddMore && (
        <button type="button" className={styles.addTile} onClick={onAdd} disabled={disabled} aria-label="写真を追加">
          +
        </button>
      )}
    </div>
  );
}
