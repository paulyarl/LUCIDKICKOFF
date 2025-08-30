export default function LibraryPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Library</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Library items will be mapped here */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold">My Project 1</h3>
          <p className="text-muted-foreground mt-2">Last modified: Today</p>
        </div>
      </div>
    </div>
  );
}
