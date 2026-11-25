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
    <nav className={className ?? "text-sm text-brand-navy/60"} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href ? (
              <Link href={item.href} className="font-semibold text-brand-teal hover:underline">
                <T k={item.labelKey} />
              </Link>
            ) : (
              <span className="font-medium">
                <T k={item.labelKey} />
              </span>
            )}
            {idx < items.length - 1 && <span className="mx-2 text-brand-navy/30">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
