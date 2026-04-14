import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Target, Award, TrendingUp, Shield, Sparkles } from "lucide-react";
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
      <section className="relative flex min-h-[58vh] flex-col justify-center overflow-hidden bg-brand-navy py-14 sm:min-h-[64vh] md:min-h-[72vh] md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-burgundy/35 to-brand-navy" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 text-center lg:px-8">
          <h1 className="font-heading mb-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {a.heroTitle}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80" style={{ fontWeight: 400 }}>
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
              <p className="mb-4 text-sm uppercase tracking-wide text-slate-500" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
                {a.storyKicker}
              </p>
              <h2 className="mb-6 text-4xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
                {a.storyTitle}
              </h2>
              <p className="mb-4 leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                {a.storyP1}
              </p>
              <p className="mb-4 leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                {a.storyP2}
              </p>
              <p className="leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                {a.storyP3}
              </p>
            </div>
            <div className="relative h-[500px] overflow-hidden rounded-lg border border-slate-200">
              <ImageWithFallback src={a.storyImage} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
      </PreviewSectionChrome>

      <PreviewSectionChrome blockId="about-mission" label="Misión y visión">
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
            <div className="rounded-lg border border-slate-200 bg-white p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: "#C8102E" }}>
                <Target className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
                {a.missionTitle}
              </h3>
              <p className="leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                {a.missionText}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-10">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: "#C8102E" }}>
                <TrendingUp className="h-7 w-7 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
                {a.visionTitle}
              </h3>
              <p className="leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
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
            <p className="mb-3 text-sm uppercase tracking-wide text-slate-500" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
              {a.valuesKicker}
            </p>
            <h2 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
              {a.valuesTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600" style={{ fontWeight: 400 }}>
              {a.valuesIntro}
            </p>
          </div>

          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-2 lg:grid-cols-4"))}>
            {a.values.map((v, index) => {
              const Ic = VALUE_ICONS[index] ?? Award;
              return (
                <div key={`${v.title}-${index}`} className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg" style={{ backgroundColor: "#C8102E" }}>
                    <Ic className="h-8 w-8 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
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
                <div className="text-sm uppercase tracking-wide text-white/80" style={{ letterSpacing: "0.05em", fontWeight: 500 }}>
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
            <p className="mb-3 text-sm uppercase tracking-wide text-slate-500" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
              {a.timelineKicker}
            </p>
            <h2 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
              {a.timelineTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600" style={{ fontWeight: 400 }}>
              {a.timelineIntro}
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-slate-200" />

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
                    <div className="inline-block rounded-lg border border-slate-200 bg-white p-6">
                      <div className="mb-2 text-sm uppercase tracking-wide text-slate-500" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
                        {milestone.year}
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                        {milestone.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600" style={{ fontWeight: 400 }}>
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="h-4 w-4 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: "#C8102E" }} />
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
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm uppercase tracking-wide text-slate-500" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
              {a.teamKicker}
            </p>
            <h2 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
              {a.teamTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600" style={{ fontWeight: 400 }}>
              {a.teamIntro}
            </p>
          </div>

          <div className={cn("grid gap-8", pl.gridCols("grid-cols-1 md:grid-cols-3"))}>
            {a.team.map((member, index) => (
              <div key={`${member.name}-${index}`} className="rounded-lg border border-slate-200 bg-white p-8 text-center transition-all hover:border-slate-300">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: "#C8102E" }}>
                  <span className="text-2xl font-semibold text-white" style={{ fontWeight: 600 }}>
                    {member.initials}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold tracking-tight text-slate-900" style={{ fontWeight: 600 }}>
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-slate-600" style={{ fontWeight: 500 }}>
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
