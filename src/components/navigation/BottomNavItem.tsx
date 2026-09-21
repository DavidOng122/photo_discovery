import Link from 'next/link';

interface BottomNavItemProps {
  href: string;
  label: string;
  isActive: boolean;
}

export function BottomNavItem({ href, label, isActive }: BottomNavItemProps) {
  return (
    <Link 
      href={href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        flex: 1,
        color: isActive ? 'var(--primary)' : 'var(--muted)',
        fontWeight: isActive ? 'bold' : 'normal',
        transition: 'color 0.2s',
      }}
    >
      <span style={{ fontSize: '0.875rem' }}>{label}</span>
    </Link>
  );
}
