export default function CommunityPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Community</h1>
      <div className="grid gap-6">
        {/* Community content will go here */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold">Featured Packs</h3>
          <p className="text-muted-foreground mt-2">Discover amazing packs from the community</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Community pack items */}
            <div className="p-4 border rounded">
              <h4 className="font-medium">Community Pack 1</h4>
              <p className="text-sm text-muted-foreground">By User123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
