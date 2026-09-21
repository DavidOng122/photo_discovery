import { PageContainer } from '@/components/common/PageContainer';
import Link from 'next/link';

export default function HomePage() {
  return (
    <PageContainer>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Photo Discovery</h1>
      
      <p style={{ marginTop: '2rem' }}>
        まだ発見がありません。
      </p>
      
      <p style={{ marginTop: '1rem', color: 'var(--muted)', lineHeight: 1.5 }}>
        写真から、次の散歩につながる発見を見つけてみましょう。
      </p>
      
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <Link 
          href="/walk/new"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          [ 写真を追加 ]
        </Link>
      </div>
    </PageContainer>
  );
}
