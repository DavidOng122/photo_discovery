import React from 'react';

interface Photo {
  id: string;
  signedUrl: string | null;
  sortOrder: number;
}

interface Props {
  photos: Photo[];
}

export function WalkPhotoGrid({ photos }: Props) {
  if (photos.length === 0) return null;
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '3px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {photos.map((photo) => (
          <div key={photo.id} style={{ aspectRatio: '1', backgroundColor: '#1e1e2e', overflow: 'hidden' }}>
            {photo.signedUrl ? (
              <img
                src={photo.signedUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d2d4a', fontSize: '1.25rem' }}>
                📷
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
