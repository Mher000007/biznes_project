import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-12">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="text-base font-bold tracking-tight mb-3 block">
              arm<span className="gradient-text">biz</span>
            </Link>
            <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              Armenia&apos;s business directory. Find, connect, grow.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-3">Categories</h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/discover?category=${cat.slug}`} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-3">Product</h4>
            <ul className="space-y-2">
              {[["Discover", "/discover"], ["About", "/about"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-3">Contact</h4>
            <ul className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <li>Yerevan, Armenia</li>
              <li>info@armbiz.am</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] py-5">
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">© 2026 ArmBiz</p>
          <div className="flex gap-4">
            {["Privacy", "Terms"].map((item) => (
              <Link key={item} href="#" className="text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">{item}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
