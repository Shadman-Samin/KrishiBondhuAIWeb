import { CROPS } from "@/data/crops";
import { DISEASES } from "@/data/diseases";
import { MARKET_LISTINGS } from "@/data/marketplace";

export type SearchResult = {
  category: "crop" | "disease" | "market";
  title: string;
  subtitle: string;
  href: string;
};

export function search(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  for (const c of CROPS) {
    if (
      c.name.toLowerCase().includes(q) ||
      c.nameBn.includes(q) ||
      c.season.toLowerCase().includes(q)
    ) {
      results.push({
        category: "crop",
        title: `${c.name} / ${c.nameBn}`,
        subtitle: `${c.season} · ${c.plantMonth}`,
        href: "/dashboard/crop-calendar",
      });
    }
  }

  for (const d of DISEASES) {
    if (
      d.name.toLowerCase().includes(q) ||
      d.nameBn.includes(q) ||
      d.crops.some((c) => c.toLowerCase().includes(q)) ||
      d.cropsBn.some((c) => c.includes(q))
    ) {
      results.push({
        category: "disease",
        title: `${d.name} / ${d.nameBn}`,
        subtitle: `${d.crops.join(", ")} · ${d.severity}`,
        href: "/dashboard/disease",
      });
    }
  }

  for (const l of MARKET_LISTINGS) {
    if (
      l.title.toLowerCase().includes(q) ||
      l.titleBn.includes(q) ||
      l.crop.toLowerCase().includes(q) ||
      l.cropBn.includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.locationBn.includes(q)
    ) {
      results.push({
        category: "market",
        title: `${l.title} / ${l.titleBn}`,
        subtitle: `৳${l.price}/${l.unit} · ${l.location}`,
        href: "/dashboard/marketplace",
      });
    }
  }

  return results.slice(0, 8);
}
