import { heroContent } from "@/content/hero-content";

import { AuroraBackdrop } from "./AuroraBackdrop";
import { GlassLink } from "./GlassLink";

export function Hero() {
  const { brand, eyebrow, titleLines, description, actions, meta, media } =
    heroContent;

  return (
    <main className="hero relative isolate min-h-svh flex-1 overflow-hidden bg-hero-ink font-hero text-hero-primary">
      <AuroraBackdrop video={media.video} poster={media.poster} />

      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-[1800px] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-10 sm:pb-8 sm:pt-8 lg:px-[6vw] lg:pb-10 lg:pt-9">
        <header
          data-reveal="masthead"
          className="flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.16em] text-hero-primary sm:text-[11px]"
        >
          <div className="flex items-center gap-5">
            <span className="font-semibold">{brand.name}</span>
            <span className="hidden text-hero-secondary lg:inline">
              {brand.descriptor}
            </span>
          </div>
          <span className="hidden text-hero-secondary md:inline">
            {brand.field}
          </span>
        </header>

        <section
          aria-labelledby="hero-title"
          className="flex flex-1 items-center py-12 sm:py-16 lg:py-[12vh]"
        >
          <div className="w-full">
            <p
              data-reveal="eyebrow"
              className="flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] text-hero-secondary sm:text-[11px]"
            >
              <span className="hero-eyebrow-line" aria-hidden="true" />
              {eyebrow}
            </p>

            <h1
              id="hero-title"
              aria-label={titleLines.join(" ")}
              className="hero-title mt-6 sm:mt-8"
            >
              {titleLines.map((line, index) => (
                <span className="hero-title-mask" key={line} aria-hidden="true">
                  <span data-reveal={index === 0 ? "headline-one" : "headline-two"}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>

            <p
              data-reveal="body"
              className="mt-7 max-w-[36rem] text-[15px] leading-7 text-hero-secondary sm:mt-8 sm:text-base sm:leading-7 lg:text-[17px] lg:leading-8"
            >
              {description}
            </p>

            <div className="mt-8 flex w-full max-w-[22rem] flex-col gap-3 sm:mt-10 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
              {actions.map((action, index) => (
                <div
                  key={action.href}
                  data-reveal={index === 0 ? "action-primary" : "action-secondary"}
                  className="w-full sm:w-auto"
                >
                  <GlassLink href={action.href} intent={action.intent}>
                    {action.label}
                  </GlassLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="flex items-end justify-between gap-8 font-mono text-[9px] leading-5 tracking-[0.13em] text-hero-muted sm:text-[10px]">
          <p data-reveal="meta" className="max-w-[34ch]">
            {meta.audience}
          </p>
          <p data-reveal="meta" className="hidden text-right md:block">
            {meta.disciplines}
          </p>
        </footer>
      </div>
    </main>
  );
}
