import { PageContainer } from '@/components/common/PageContainer';

export default function NewWalkPage() {
  return (
    <PageContainer>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>新しい発見</h1>
      
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p>
          散歩の写真から、新しい発見を見つけます。
        </p>
        
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          写真アップロード機能は次のステップで実装します。
        </p>
      </div>
    </PageContainer>
  );
}
