import React from 'react';

interface Props {
  onClick: () => void;
  isConfirming: boolean;
  disabled?: boolean;
}

export function ConfirmDiscoveryButton({ onClick, isConfirming, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isConfirming}
      style={{
        width: '100%',
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontWeight: 'bold',
        fontSize: '1rem',
        cursor: (disabled || isConfirming) ? 'not-allowed' : 'pointer',
        opacity: (disabled || isConfirming) ? 0.7 : 1,
      }}
    >
      {isConfirming ? '次の発見を準備しています…' : '次の発見を探す'}
    </button>
  );
}
