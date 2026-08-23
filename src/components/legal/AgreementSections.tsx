import Link from "next/link";

export default function AgreementSections({
  sections,
  heading,
  fullHref,
  scrollable = true,
}: {
  sections: ReadonlyArray<{ title: string; body: string }>;
  heading: string;
  fullHref?: string;
  scrollable?: boolean;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-black uppercase">{heading}</h2>
      <div className={`${scrollable ? "max-h-[32rem] overflow-y-auto" : ""} border-2 border-ink/20 rounded-2xl p-5 space-y-5 bg-ink/[0.02]`}>
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="font-black uppercase text-sm mb-1">{section.title}</h3>
            <p className="text-sm text-gray-700 font-bold leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>
      {fullHref && <p className="text-xs text-gray-500 font-bold">
        Need to review the terms separately? <Link href={fullHref} className="underline">Read the full agreement</Link>.
      </p>}
    </div>
  );
}
