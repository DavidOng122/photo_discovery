import { PageContainer } from '@/components/common/PageContainer';

export default function DiscoverPage() {
  return (
    <PageContainer>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>発見する</h1>
      
      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p>
          写真のアップロードが完了しました。
        </p>
        
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          次のステップで写真分析機能を実装します。
        </p>
      </div>
    </PageContainer>
  );
}
