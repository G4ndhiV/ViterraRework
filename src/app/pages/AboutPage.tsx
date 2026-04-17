import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Target, Award, TrendingUp, Shield, Sparkles, ChevronsDown } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { cn } from "../components/ui/utils";

const VALUE_ICONS = [Award, Shield, Target, Sparkles];

export function AboutPage() {
  const pl = usePreviewLayout();
  const { content } = useSiteContent();
  const a = content.about;

  return (
    <div className="viterra-page flex min-h-screen flex-col bg-white">
      <Header />

      <PreviewSectionChrome blockId="about-hero" label="Cabecera">
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-brand-navy pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+5.25rem)] sm:pb-16 sm:pt-[calc(env(safe-area-inset-top,0px)+6.5rem)] md:pb-24 md:pt-52">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/about-nosotros-hero.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/78 via-black/48 to-black/60" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 text-center lg:px-8">
          <p className="font-heading text-[11px] font-normal uppercase tracking-[0.28em] text-white/75 md:text-xs not-italic">
            Viterra · Nosotros
          </p>
          <span className="mx-auto mt-3 block h-px w-12 bg-primary" aria-hidden />
          <div className="mt-5 flex justify-center text-primary" aria-hidden>
            <ChevronsDown className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="font-heading mt-6 mb-4 text-4xl font-light tracking-[-0.02em] text-white sm:text-5xl md:text-6xl">
            {a.heroTitle}
          </h1>
          <p className="font-heading mx-auto mt-4 max-w-2xl text-lg text-white/90 font-light not-italic md:text-xl">
            {a.heroSubtitle}
          </p>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-story" label="Historia">
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={cn("grid items-center gap-16", pl.gridCols("grid-cols-1 lg:grid-cols-2"))}>
            <div>
              <p className="font-heading mb-4 text-sm uppercase tracking-[0.1em] text-brand-navy/60">
                {a.storyKicker}
              </p>
              <h2 className="font-heading mb-6 text-4xl font-semibold tracking-tight text-brand-navy">
                {a.storyTitle}
              </h2>
              <p className="font-heading mb-4 leading-relaxed text-brand-navy/72 font-normal not-italic">
                {a.storyP1}
              </p>
              <p className="font-heading mb-4 leading-relaxed text-brand-navy/72 font-normal not-italic">
                {a.storyP2}
              </p>
              <p className="font-heading leading-relaxed text-brand-navy/72 font-normal not-italic">
                {a.storyP3}
              </p>
            </div>
            <div className="relative h-[500px] overflow-hidden rounded-lg border border-brand-navy/10">
              <ImageWithFallback src={a.storyImage} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-mission" label="Misión y visión">
      <section className="bg-brand-canvas py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
            <div className="rounded-lg border border-brand-navy/10 bg-white p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary">
                <Target className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading mb-4 text-2xl font-semibold tracking-tight text-brand-navy">
                {a.missionTitle}
              </h3>
              <p className="font-heading leading-relaxed text-brand-navy/72 font-normal not-italic">
                {a.missionText}
              </p>
            </div>

            <div className="rounded-lg border border-brand-navy/10 bg-white p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading mb-4 text-2xl font-semibold tracking-tight text-brand-navy">
                {a.visionTitle}
              </h3>
              <p className="font-heading leading-relaxed text-brand-navy/72 font-normal not-italic">
                {a.visionText}
              </p>
            </div>
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-values" label="Valores">
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="font-heading mb-3 text-sm uppercase tracking-[0.1em] text-brand-navy/60">
              {a.valuesKicker}
            </p>
            <h2 className="font-heading mb-4 text-4xl font-semibold tracking-tight text-brand-navy">
              {a.valuesTitle}
            </h2>
            <p className="font-heading mx-auto max-w-2xl text-brand-navy/72 font-normal not-italic">
              {a.valuesIntro}
            </p>
          </div>

          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2 lg:grid-cols-4"))}>
            {a.values.map((v, index) => {
              const Ic = VALUE_ICONS[index] ?? Award;
              return (
                <div key={`${v.title}-${index}`} className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                    <Ic className="h-8 w-8 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading mb-2 text-lg font-semibold tracking-tight text-brand-navy">
                    {v.title}
                  </h3>
                  <p className="font-heading text-sm leading-relaxed text-brand-navy/72 font-normal not-italic">
                    {v.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-stats" label="Cifras">
      <section className="bg-brand-navy py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={cn("grid gap-12", pl.gridCols("grid-cols-2 md:grid-cols-4"))}>
            {a.stats.map((st) => (
              <div key={st.label} className="text-center text-white">
                <div className="font-heading mb-3 text-5xl font-semibold">{st.value}</div>
                <div className="font-heading text-sm uppercase tracking-[0.05em] text-white/80">
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-timeline" label="Línea de tiempo">
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="font-heading mb-3 text-sm uppercase tracking-[0.1em] text-brand-navy/60">
              {a.timelineKicker}
            </p>
            <h2 className="font-heading mb-4 text-4xl font-semibold tracking-tight text-brand-navy">
              {a.timelineTitle}
            </h2>
            <p className="font-heading mx-auto max-w-2xl text-brand-navy/72 font-normal not-italic">
              {a.timelineIntro}
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-brand-navy/12" />

            <div className="space-y-16">
              {a.milestones.map((milestone, index) => (
                <div
                  key={`${milestone.year}-${index}`}
                  className={cn(
                    "flex items-center gap-8",
                    pl.preview ? "flex-col" : index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "flex-1",
                      pl.preview ? "text-center" : index % 2 === 0 ? "text-right" : "text-left"
                    )}
                  >
                    <div className="inline-block rounded-lg border border-brand-navy/10 bg-white p-6">
                      <div className="font-heading mb-2 text-sm uppercase tracking-[0.1em] text-brand-navy/60">
                        {milestone.year}
                      </div>
                      <h3 className="font-heading mb-2 text-xl font-semibold text-brand-navy">
                        {milestone.title}
                      </h3>
                      <p className="font-heading text-sm leading-relaxed text-brand-navy/72 font-normal not-italic">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="h-4 w-4 rounded-full border-4 border-white shadow-lg bg-primary" />
                  </div>
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-team" label="Equipo">
      <section className="bg-brand-canvas py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="font-heading mb-3 text-sm uppercase tracking-[0.1em] text-brand-navy/60">
              {a.teamKicker}
            </p>
            <h2 className="font-heading mb-4 text-4xl font-semibold tracking-tight text-brand-navy">
              {a.teamTitle}
            </h2>
            <p className="font-heading mx-auto max-w-2xl text-brand-navy/72 font-normal not-italic">
              {a.teamIntro}
            </p>
          </div>

          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-3"))}>
            {a.team.map((member, index) => (
              <div key={`${member.name}-${index}`} className="rounded-lg border border-brand-navy/10 bg-white p-8 text-center transition-all hover:border-brand-navy/25">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary">
                  <span className="font-heading text-2xl font-semibold text-white">
                    {member.initials}
                  </span>
                </div>
                <h3 className="font-heading mb-2 text-xl font-semibold tracking-tight text-brand-navy">
                  {member.name}
                </h3>
                <p className="font-heading text-sm font-medium text-brand-navy/72">
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <Footer />
    </div>
  );
}
