"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

import { useI18n } from "@/i18n";

export default function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname.startsWith("/admin-secure") || pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-12">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="mb-3 block">
              <img src="/logo.png" alt="Findy Logo" style={{ height: '7rem' }} className="w-auto object-contain [filter:invert(56%)_sepia(87%)_saturate(2462%)_hue-rotate(119deg)_brightness(98%)_contrast(105%)] dark:[filter:brightness(0)_invert(1)]" />
            </Link>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-3">{t.nav.categories}</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  {cat.slug === 'horeca' ? (
                    <Link href={`/discover?category=${cat.slug}`} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                      {cat.name}
                    </Link>
                  ) : (
                    <span className="text-xs text-[hsl(var(--muted-foreground))] opacity-40 cursor-not-allowed select-none blur-sm">
                      {cat.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-3">{t.footer.product}</h4>
            <ul className="space-y-2">
              {[
                [t.nav.discover, "/discover"],
                [t.nav.about, "/about"]
              ].map(([label, href]) => (
                <li key={href as string}>
                  <Link href={href as string} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-3">{t.footer.contact}</h4>
            <ul className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li>Yerevan, Armenia</li>
              <li>findyarmenia@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] py-5">
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">© 2026 FAINDY</p>
        </div>
      </div>
    </footer>
  );
}
