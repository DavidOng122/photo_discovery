import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>ページが見つかりません</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--muted)' }}>お探しのページは存在しないか、移動した可能性があります。</p>
      <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
        ホームに戻る
      </Link>
    </div>
  );
}
