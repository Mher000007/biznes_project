import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="rounded-2xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] p-10 sm:p-14">
          <div className="max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              List your business
            </h2>
            <p className="text-sm opacity-60 mb-6 leading-relaxed">
              Join 900+ businesses on ArmBiz. Create your profile, manage bookings, and reach thousands of customers across Armenia.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[hsl(var(--background))] text-[hsl(var(--foreground))] px-5 text-sm font-medium transition-opacity hover:opacity-85">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/discover" className="inline-flex h-10 items-center rounded-lg border border-[hsl(var(--background))]/20 px-5 text-sm font-medium transition-all hover:bg-[hsl(var(--background))]/10">
                Browse directory
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
