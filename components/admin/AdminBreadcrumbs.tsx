"use client";

import Link from "next/link";
import { T } from "@/components/i18n/T";

type Crumb = {
  labelKey: string;
  href?: string;
};

type Props = {
  items: Crumb[];
  className?: string;
};

export default function AdminBreadcrumbs({ items, className }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <nav className={className ?? "text-sm text-muted-foreground"} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href ? (
              <Link href={item.href} className="hover:underline text-blue-600">
                <T k={item.labelKey} />
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                <T k={item.labelKey} />
              </span>
            )}
            {idx < items.length - 1 && <span className="mx-2 text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
