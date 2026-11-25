import Link from "next/link";

type Props = {
  categories: { slug: string; name: string }[];
  className?: string;
};

// Teal chip links to /category?category=<slug> — used on pack/lesson
// detail pages to show canonical membership (not freeform tags).
export function CategoryChipLinks({ categories, className }: Props) {
  if (categories.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/category?category=${c.slug}`}
          className="rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-bold text-brand-teal transition hover:bg-brand-teal/20"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
