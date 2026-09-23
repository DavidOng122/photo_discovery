import { DiscoveryHome } from '@/components/home/DiscoveryHome';
import { mockDiscoveries } from '@/data/mockDiscoveries';

export default function HomePage() {
  return <DiscoveryHome discoveries={mockDiscoveries} />;
}
