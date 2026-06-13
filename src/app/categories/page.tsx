// import Link from "next/link";
// import { CATEGORIES } from "@/lib/constants";
// import { Monitor, Wheat, UtensilsCrossed, ShoppingBag, Building2, Landmark, Heart, GraduationCap, ArrowRight, Hammer } from "lucide-react";
// import type { Metadata } from "next";
// 
// export const metadata: Metadata = {
//   title: "Categories — ArmenBiz Hub",
//   description: "Browse Armenian businesses by industry: Building Material, Agriculture, HoReCa, Construction, Finance, Healthcare, and Education.",
// };
// 
// const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
//   Monitor, Wheat, UtensilsCrossed, ShoppingBag, Building2, Landmark, Heart, GraduationCap, Hammer,
// };
// 
// export default function CategoriesPage() {
//   return (
//     <div className="pt-20 pb-16">
//       <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//         <div className="mb-12">
//           <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Business Categories</h1>
//           <p className="text-[hsl(var(--muted-foreground))] text-lg">
//             Explore Armenian businesses across all major industries
//           </p>
//         </div>
// 
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {CATEGORIES.map((cat) => {
//             const Icon = ICON_MAP[cat.icon] || Monitor;
//             return (
//               <Link
//                 key={cat.id}
//                 href={`/discover?category=${cat.slug}`}
//                 className="group flex items-start gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 transition-all duration-300 hover:border-[hsl(var(--primary))]/30 hover:shadow-xl hover:shadow-[hsl(var(--primary))]/5 hover:-translate-y-1"
//               >
//                 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] transition-colors group-hover:bg-[hsl(var(--primary))] group-hover:text-white">
//                   <Icon className="h-7 w-7" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between mb-1">
//                     <h2 className="text-base font-semibold group-hover:text-[hsl(var(--primary))] transition-colors">{cat.name}</h2>
//                     <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-all group-hover:translate-x-1" />
//                   </div>
//                   <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">{cat.description}</p>
//                   <span className="text-xs font-medium text-[hsl(var(--primary))]">{cat.count} businesses</span>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

import { redirect } from "next/navigation";

export default function CategoriesPage() {
  redirect("/discover");
}
