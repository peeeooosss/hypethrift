import type { Metadata } from "next";
import Link from "next/link";
import { MallExperience } from "@/components/mall/MallExperience";
import { getMallShowcase } from "@/lib/mall/showcase";
import { MALL_ZONES } from "@/lib/mall/zones";

export const metadata: Metadata = {
  title: "Walk the Thrift Mall",
  description:
    "Step inside the HypeThrift 3D mall. Explore sneakers, streetwear, vintage, denim, bags, accessories, jewelry, outerwear and the live Bid Arena.",
  alternates: { canonical: "/" },
};

export const revalidate = 20;

export default async function HomePage() {
  const showcase = await getMallShowcase();

  return (
    <>
      <MallExperience showcase={showcase} />

      <section className="sr-only" aria-label="Mall directory fallback">
        <h1>HypeThrift — the walkable thrift mall</h1>
        <p>
          Explore eight storefronts and the Bid Arena. If 3D is unavailable, use the{" "}
          <Link href="/mall">accessible mall directory</Link>.
        </p>
        <h2>Storefronts</h2>
        <ul>
          {MALL_ZONES.map((zone) => (
            <li key={zone.slug}>
              <Link href={`/mall/${zone.slug}`}>
                {zone.name}: {zone.description}
              </Link>
              <ul>
                {showcase[zone.slug].map((product) => (
                  <li key={`${zone.slug}-${product.title}`}>
                    {product.id ? <Link href={`/listing/${product.id}`}>{product.title}</Link> : product.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <Link href="/bid-arena">Enter the Bid Arena</Link>
      </section>
    </>
  );
}
