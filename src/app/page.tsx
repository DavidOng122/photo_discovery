import { PageContainer } from '@/components/common/PageContainer';
import { WalkList } from '@/components/home/WalkList';
import { getCompletedWalks } from '@/lib/walks/getWalks';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let walks: Awaited<ReturnType<typeof getCompletedWalks>>;
  try {
    walks = await getCompletedWalks();
  } catch {
    walks = [];
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>Photo Discovery</h1>
        <Link
          href="/walk/new"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          ＋ 追加
        </Link>
      </div>
      <WalkList walks={walks} />
    </PageContainer>
  );
}
