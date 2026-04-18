/**
 * Hero interior (renta, venta, desarrollos, servicios, nosotros, contacto).
 * El header es `fixed`; el `padding-top` del section coincide con su altura para que
 * el bloque kicker + línea roja quede justo debajo del nav (no al fondo del viewport).
 */
export const viterraHeroSectionClass =
  "viterra-reveal-off relative flex min-h-[100svh] shrink-0 flex-col justify-start overflow-hidden bg-brand-navy " +
  "pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] sm:pb-16 md:pb-24 " +
  /* Barra compacta (móvil) vs logo + nav (lg+) — ~132px ≈ 8.25rem, ver Header.tsx */
  "pt-[calc(env(safe-area-inset-top,0px)+4.25rem)] lg:pt-[calc(env(safe-area-inset-top,0px)+8.25rem)]";

/**
 * Centra en vertical el bloque interior (solo kicker + flechas + título).
 * `padding-bottom` extra deja hueco para el subtítulo absoluto y evita recortes con `overflow-hidden`.
 */
export const viterraHeroCenteredStackClass =
  "relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col justify-center px-4 py-6 text-center sm:px-6 lg:px-8 md:py-10 " +
  "pb-[clamp(7rem,18vh,12rem)] md:pb-[clamp(8rem,20vh,14rem)]";

/**
 * Contenedor `relative` solo para kicker + título; el subtítulo es hijo absoluto y no
 * entra en el cálculo del centrado vertical.
 */
export const viterraHeroCenteredInnerClass = "relative mx-auto w-full max-w-7xl text-center";

/** Kicker + línea roja + chevron (dentro del inner). */
export const viterraHeroTopClusterClass = "relative w-full shrink-0 text-center";

/** Título del hero: pegado al chevron con un pequeño respiro. */
export const viterraHeroMainClass =
  "relative flex w-full flex-col justify-start pt-2 text-center md:pt-3";

export const viterraHeroKickerClass =
  "font-heading text-[11px] font-normal uppercase tracking-[0.28em] text-white/75 md:text-xs not-italic";

/** Línea roja bajo el kicker: `mt-2` para acercarla al texto y al borde del header. */
export const viterraHeroDividerClass = "mx-auto mt-2 block h-px w-12 bg-primary";

export const viterraHeroChevronRowClass = "mt-4 flex justify-center text-primary";

export const viterraHeroTitleClass =
  "font-heading text-4xl font-light tracking-[-0.02em] text-white sm:text-5xl md:text-6xl not-italic";

/**
 * Subtítulo bajo el h1 (`top-full` del contenedor relativo). No forma parte de la altura
 * que `justify-center` usa, así no desplaza flechas ni título al cambiar el copy.
 */
export const viterraHeroSubtitleClass =
  "font-heading absolute left-1/2 top-full z-[11] mt-3 w-full max-w-2xl -translate-x-1/2 px-4 text-lg font-light leading-relaxed text-white/90 not-italic sm:px-6 md:mt-4 md:text-xl";
