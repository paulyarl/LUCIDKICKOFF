import { Suspense } from 'react';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { PackList } from '@/components/packs/PackList';
import { Icons } from '@/components/icons';

// Mock data - in a real app, this would come from your API
const mockPacks = [
  {
    id: '1',
    title: 'Ocean Life',
    description: 'Explore the wonders of the deep blue sea',
    imageUrl: '/placeholders/ocean-cover.jpg',
    progress: 35,
    isLocked: false,
    isNew: true,
    isTrending: true,
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Space Adventure',
    description: 'Blast off into the cosmos',
    imageUrl: '/placeholders/space-cover.jpg',
    progress: 0,
    isLocked: true,
    isNew: true,
    isTrending: true,
  },
  {
    id: '3',
    title: 'Dinosaur World',
    description: 'Meet the giants of the past',
    imageUrl: '/placeholders/dino-cover.jpg',
    progress: 80,
    isLocked: false,
    isTrending: true,
  },
  {
    id: '4',
    title: 'Jungle Safari',
    description: 'Discover exotic animals',
    imageUrl: '/placeholders/jungle-cover.jpg',
    progress: 0,
    isLocked: false,
    isFavorite: true,
  },
  {
    id: '5',
    title: 'Fairy Tales',
    description: 'Classic stories come to life',
    imageUrl: '/placeholders/fairy-cover.jpg',
    progress: 0,
    isLocked: true,
  },
  {
    id: '6',
    title: 'Outer Space',
    description: 'Journey through the stars',
    imageUrl: '/placeholders/space2-cover.jpg',
    progress: 20,
    isLocked: false,
    isNew: true,
  },
  {
    id: '7',
    title: 'Under the Sea',
    description: 'Discover marine life',
    imageUrl: '/placeholders/sea-cover.jpg',
    progress: 0,
    isLocked: true,
  },
  {
    id: '8',
    title: 'Dinosaur Kingdom',
    description: 'Prehistoric creatures await',
    imageUrl: '/placeholders/dino2-cover.jpg',
    progress: 60,
    isLocked: false,
    isTrending: true,
  },
];

export default function DashboardPage() {
  // In a real app, this would be fetched from your API
  const continuePacks = mockPacks.filter(pack => pack.progress > 0).sort((a, b) => b.progress! - a.progress!);
  const trendingPacks = [...mockPacks].filter(pack => pack.isTrending);
  const newPacks = [...mockPacks].filter(pack => pack.isNew);

  return (
    <div className="flex-1 space-y-8 p-4 pt-6 md:p-8">
      <DashboardHero
        title="Let's Get Creative!"
        subtitle="Explore, learn, and color your way through amazing adventures"
        primaryAction={{
          label: 'Start Coloring',
          onClick: () => console.log('Start coloring'),
          icon: <Icons.palette className="h-5 w-5" />
        }}
        secondaryAction={{
          label: 'Browse Packs',
          onClick: () => {
            const packsSection = document.getElementById('trending-packs');
            packsSection?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      <Suspense fallback={<div>Loading your packs...</div>}>
        {/* Continue Coloring Section */}
        {continuePacks.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Continue Coloring</h2>
            <PackList
              packs={continuePacks}
              title="Continue Coloring"
              description="Pick up where you left off"
              maxItems={8}
              showFilters={false}
            />
          </section>
        )}

        {/* Trending Packs Section */}
        <section className="space-y-6" id="trending-packs">
          <h2 className="text-2xl font-bold tracking-tight">Trending Packs</h2>
          <PackList
            packs={trendingPacks}
            title="Trending Now"
            description="Popular packs loved by the community"
            maxItems={8}
          />
        </section>

        {/* New Packs Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">New Packs</h2>
          <PackList
            packs={newPacks}
            title="New & Noteworthy"
            description="Fresh content just for you"
            maxItems={8}
          />
        </section>
      </Suspense>
    </div>
  );
}
