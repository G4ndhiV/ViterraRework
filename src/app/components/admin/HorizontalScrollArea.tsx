import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../ui/utils";

type Props = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  ariaLabel?: string;
  showHint?: boolean;
  hintPlacement?: "top" | "bottom";
  showTopScrollbar?: boolean;
  showBottomScrollbar?: boolean;
  enableDragPan?: boolean;
};

type ScrollMetrics = {
  scrollLeft: number;
  scrollWidth: number;
  clientWidth: number;
};

const scrollBtnClass =
  "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-brand-navy shadow-md backdrop-blur-sm transition hover:border-slate-300 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function CustomHorizontalScrollbar({
  metrics,
  onScrollLeftChange,
  className,
  ariaControlsId,
}: {
  metrics: ScrollMetrics;
  onScrollLeftChange: (left: number) => void;
  className?: string;
  ariaControlsId?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });

  const { scrollLeft, scrollWidth, clientWidth } = metrics;
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const hasOverflow = scrollWidth > clientWidth + 2;

  const thumbRatio = hasOverflow ? clientWidth / scrollWidth : 1;
  const thumbWidthPct = hasOverflow ? Math.max(12, Math.min(100, thumbRatio * 100)) : 100;
  const travelPct = 100 - thumbWidthPct;
  const thumbLeftPct = hasOverflow && maxScroll > 0 ? (scrollLeft / maxScroll) * travelPct : 0;

  const scrollFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || maxScroll <= 0) return;
      const rect = track.getBoundingClientRect();
      const travelPx = rect.width * (travelPct / 100);
      if (travelPx <= 0) return;
      const thumbHalf = (rect.width * thumbWidthPct) / 100 / 2;
      const x = Math.max(0, Math.min(travelPx, clientX - rect.left - thumbHalf));
      onScrollLeftChange((x / travelPx) * maxScroll);
    },
    [maxScroll, onScrollLeftChange, thumbWidthPct, travelPct],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      e.preventDefault();
      const track = trackRef.current;
      if (!track || maxScroll <= 0) return;
      const rect = track.getBoundingClientRect();
      const travelPx = rect.width * (travelPct / 100);
      if (travelPx <= 0) return;
      const delta = e.clientX - dragRef.current.startX;
      const scrollDelta = (delta / travelPx) * maxScroll;
      onScrollLeftChange(Math.max(0, Math.min(maxScroll, dragRef.current.startScrollLeft + scrollDelta)));
    };

    const onUp = () => {
      dragRef.current.active = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [maxScroll, onScrollLeftChange, travelPct]);

  if (!hasOverflow) return null;

  return (
    <div
      ref={trackRef}
      className={cn("crm-hscroll-custom", className)}
      role="scrollbar"
      aria-orientation="horizontal"
      aria-controls={ariaControlsId}
      aria-valuenow={Math.round(scrollLeft)}
      aria-valuemin={0}
      aria-valuemax={Math.round(maxScroll)}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).classList.contains("crm-hscroll-custom__thumb")) return;
        scrollFromClientX(e.clientX);
      }}
    >
      <div
        className="crm-hscroll-custom__thumb"
        style={{ width: `${thumbWidthPct}%`, left: `${thumbLeftPct}%` }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragRef.current = { active: true, startX: e.clientX, startScrollLeft: scrollLeft };
        }}
      />
    </div>
  );
}

export function HorizontalScrollArea({
  children,
  className,
  contentClassName,
  ariaLabel = "Contenido con desplazamiento horizontal",
  showHint = true,
  hintPlacement = "top",
  showTopScrollbar = true,
  showBottomScrollbar = true,
  enableDragPan = true,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const mainId = useRef(`hscroll-${Math.random().toString(36).slice(2, 9)}`);
  const panRef = useRef({ active: false, startX: 0, startScrollLeft: 0 });
  const interactionActiveRef = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [metrics, setMetrics] = useState<ScrollMetrics>({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && el.scrollLeft > 4);
    setCanScrollRight(overflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setMetrics({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });
  }, []);

  const applyScrollLeft = useCallback(
    (scrollLeft: number) => {
      const main = mainRef.current;
      if (!main) return;
      const max = Math.max(0, main.scrollWidth - main.clientWidth);
      main.scrollLeft = Math.max(0, Math.min(max, scrollLeft));
      updateScrollState();
    },
    [updateScrollState],
  );

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const el = mainRef.current;
      if (!el) return;
      const delta = Math.max(320, Math.round(el.clientWidth * 0.72)) * direction;
      applyScrollLeft(el.scrollLeft + delta);
    },
    [applyScrollLeft],
  );

  const syncFromMain = useCallback(() => {
    updateScrollState();
  }, [updateScrollState]);

  useEffect(() => {
    const main = mainRef.current;
    const inner = innerRef.current;
    if (!main) return;

    const measure = () => updateScrollState();

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(main);
    if (inner) ro.observe(inner);
    main.addEventListener("scroll", syncFromMain, { passive: true });
    return () => {
      ro.disconnect();
      main.removeEventListener("scroll", syncFromMain);
    };
  }, [syncFromMain, updateScrollState, children]);

  useEffect(() => {
    if (!enableDragPan) return;

    const onMove = (e: MouseEvent) => {
      if (!panRef.current.active) return;
      e.preventDefault();
      applyScrollLeft(panRef.current.startScrollLeft - (e.clientX - panRef.current.startX));
    };

    const onUp = () => {
      if (!panRef.current.active) return;
      panRef.current.active = false;
      setIsPanning(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [enableDragPan, applyScrollLeft]);

  useEffect(() => {
    if (!hasOverflow) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (!interactionActiveRef.current) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      e.preventDefault();
      scrollByPage(e.key === "ArrowLeft" ? -1 : 1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasOverflow, scrollByPage]);

  const handlePanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableDragPan || !hasOverflow || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-hscroll-no-pan]")) return;
    if (target.closest("button, a, input, select, textarea, [role='button'], [contenteditable='true']")) return;

    const el = mainRef.current;
    if (!el) return;

    e.preventDefault();
    panRef.current = { active: true, startX: e.clientX, startScrollLeft: el.scrollLeft };
    setIsPanning(true);
  };

  const setInteractionActive = (active: boolean) => {
    interactionActiveRef.current = active;
  };

  const hint = showHint && hasOverflow ? (
    <p className="text-center text-[10px] leading-relaxed text-slate-500">
      Flechas en pantalla · <span className="font-medium text-slate-600">teclas ← →</span> con el cursor sobre el tablero ·
      arrastra el fondo (no las tarjetas)
    </p>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={cn("relative min-w-0", className)}
      onMouseEnter={() => setInteractionActive(true)}
      onMouseLeave={() => setInteractionActive(false)}
      onFocusCapture={() => setInteractionActive(true)}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          setInteractionActive(false);
        }
      }}
    >
      {hintPlacement === "top" && hint ? <div className="mb-2.5">{hint}</div> : null}

      {hasOverflow && canScrollLeft ? (
        <button
          type="button"
          className={cn(scrollBtnClass, "left-1 sm:left-2")}
          aria-label="Ver columnas anteriores"
          onClick={() => scrollByPage(-1)}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      {hasOverflow && canScrollRight ? (
        <button
          type="button"
          className={cn(scrollBtnClass, "right-1 sm:right-2")}
          aria-label="Ver más columnas"
          onClick={() => scrollByPage(1)}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      {showTopScrollbar ? (
        <CustomHorizontalScrollbar
          metrics={metrics}
          onScrollLeftChange={applyScrollLeft}
          className="mb-2"
          ariaControlsId={mainId.current}
        />
      ) : null}

      <div
        ref={mainRef}
        id={mainId.current}
        data-hscroll-pan={enableDragPan ? "true" : undefined}
        className={cn(
          "crm-horizontal-scroll crm-horizontal-scroll--viewport min-w-0 overflow-x-auto",
          enableDragPan && hasOverflow && (isPanning ? "cursor-grabbing select-none" : "cursor-grab"),
          contentClassName,
        )}
        role="region"
        aria-label={ariaLabel}
        tabIndex={hasOverflow ? 0 : undefined}
        onScroll={syncFromMain}
        onMouseDown={handlePanMouseDown}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollByPage(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollByPage(1);
          }
        }}
      >
        <div ref={innerRef} className="inline-block min-w-full">
          {children}
        </div>
      </div>

      {showBottomScrollbar ? (
        <CustomHorizontalScrollbar
          metrics={metrics}
          onScrollLeftChange={applyScrollLeft}
          className="mt-2"
          ariaControlsId={mainId.current}
        />
      ) : null}

      {hintPlacement === "bottom" && hint ? <div className="mt-2.5">{hint}</div> : null}
    </div>
  );
}
