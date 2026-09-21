import { PageContainer } from '@/components/common/PageContainer';

export default function SavedPage() {
  return (
    <PageContainer>
      <h1 style={{ fontSize: '1.5rem', margin: 0 }}>保存した場所</h1>
      
      <p style={{ marginTop: '2rem', color: 'var(--muted)' }}>
        保存した場所はまだありません。
      </p>
    </PageContainer>
  );
}
