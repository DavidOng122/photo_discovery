'use client';

import React from 'react';
import Image from 'next/image';
import { buildGoogleMapsUrl } from '@/lib/maps/buildGoogleMapsUrl';
import styles from './GoogleMapsButton.module.css';

interface Props {
  name: string;
  googleMapsQuery?: string | null;
  area?: string | null;
  variant?: 'default' | 'card';
}

export function GoogleMapsButton({ name, googleMapsQuery, area, variant = 'default' }: Props) {
  const url = buildGoogleMapsUrl(name, googleMapsQuery, area);
  if (variant === 'card') {
    return (
      <a className={styles.cardButton} href={url} target="_blank" rel="noopener noreferrer" data-node-id="19:25">
        <Image src="/figma/recommendations/map-pin.svg" alt="" width={20} height={20} unoptimized />
        <span>Google Mapsで開く</span>
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: '0.65rem 1rem',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '9999px',
        fontSize: '0.85rem',
        fontWeight: 500,
        color: '#c8c7e8',
        textDecoration: 'none',
        backgroundColor: 'rgba(255,255,255,0.05)',
        flex: 1,
      }}
    >
      <span>🗺</span>
      Google Mapsで開く
    </a>
  );
}
