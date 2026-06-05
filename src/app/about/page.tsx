import type { Metadata } from "next";
import { Building2, Users, Globe, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "About — ArmenBiz Hub",
  description: "Learn about ArmenBiz Hub, Armenia's premier business directory platform.",
};

export default function AboutPage() {
  return (
    <div className="pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">About ArmenBiz Hub</h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            We&apos;re building Armenia&apos;s most comprehensive business directory to connect entrepreneurs,
            foster partnerships, and drive economic growth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {[
            { icon: Building2, title: "900+ Businesses", desc: "A growing directory of verified Armenian enterprises across all industries." },
            { icon: Users, title: "Community First", desc: "Built for Armenian entrepreneurs by people who understand the local market." },
            { icon: Globe, title: "Digital Presence", desc: "Helping businesses establish a strong online presence and reach new customers." },
            { icon: Award, title: "Verified Profiles", desc: "Every business goes through a verification process to ensure quality and trust." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl gradient-primary p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
          <p className="max-w-xl mx-auto text-white/85 leading-relaxed">
            To create a centralized platform where every Armenian business — from startups to established
            enterprises — can increase visibility, find partners, and connect with customers who need their services.
          </p>
        </div>
      </div>
    </div>
  );
}
