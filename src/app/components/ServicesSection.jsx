"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Home,
  Building2,
  Settings2,
  FileCheck2,
  Scale,
  BarChart3,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";

const SERVICES = [
  {
    id: 1,
    index: "01",
    tag: "ADQUISICIÓN",
    name: "Venta de Propiedades",
    description:
      "Invierte en tu patrimonio con las mejores opciones del mercado. Te acompañamos en cada etapa para encontrar la propiedad ideal.",
    benefits: [
      "Análisis de inversión personalizado",
      "Financiamiento disponible",
      "Trámites legales incluidos",
    ],
    icon: Building2,
    ctaLink: "/servicios/venta",
  },
  {
    id: 2,
    index: "02",
    tag: "ARRENDAMIENTO",
    name: "Renta de Propiedades",
    description:
      "Encuentra el hogar perfecto para ti en las mejores zonas de Guadalajara con acompañamiento personalizado en todo el proceso.",
    benefits: [
      "Propiedades verificadas y de calidad",
      "Asesoría personalizada",
      "Proceso rápido y seguro",
    ],
    icon: Home,
    ctaLink: "/servicios/renta",
  },
  {
    id: 3,
    index: "03",
    tag: "GESTIÓN",
    name: "Administración de Propiedades",
    description:
      "Maximiza tu rentabilidad sin preocupaciones. Gestionamos tu propiedad con estándares profesionales y transparencia total.",
    benefits: [
      "Cobranza puntual de rentas",
      "Mantenimiento preventivo",
      "Atención profesional a inquilinos",
    ],
    icon: Settings2,
    ctaLink: "/servicios/administracion",
  },
  {
    id: 4,
    index: "04",
    tag: "VALORACIÓN",
    name: "Avalúos y Valuación",
    description:
      "Conoce el valor real de tu propiedad con dictámenes certificados y respaldo legal para cualquier operación inmobiliaria.",
    benefits: [
      "Dictamen certificado oficial",
      "Análisis comparativo de mercado",
      "Respaldo legal completo",
    ],
    icon: BarChart3,
    ctaLink: "/servicios/avaluos",
  },
  {
    id: 5,
    index: "05",
    tag: "JURÍDICO",
    name: "Asesoría Legal",
    description:
      "Protege tu inversión con asesoría jurídica especializada en derecho inmobiliario. Contratos, escrituras y due diligence.",
    benefits: [
      "Contratos a medida y revisión",
      "Escrituración notarial",
      "Seguridad jurídica garantizada",
    ],
    icon: Scale,
    ctaLink: "/servicios/legal",
  },
  {
    id: 6,
    index: "06",
    tag: "DESARROLLO",
    name: "Desarrollos Inmobiliarios",
    description:
      "Proyectos exclusivos en preventa y construcción. Asegura tu inversión con los mejores precios de entrada al mercado.",
    benefits: [
      "Acceso a precios de preventa",
      "Seguimiento puntual de obra",
      "Garantía de desarrolladora",
    ],
    icon: FileCheck2,
    ctaLink: "/servicios/desarrollos",
  },
];

const FONT_TITLE = '"Poppins", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
const FONT_UI = '"Poppins", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
const FONT_MONO = '"Poppins", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';

const TOKENS = {
  bg: "#0C1220",
  panel: "#111827",
  nodeInactive: "rgba(245,245,240,0.04)",
  nodeBorder: "rgba(245,245,240,0.15)",
  red: "#C41E3A",
  text: "#F5F5F0",
  muted: "rgba(245,245,240,0.72)",
  border: "rgba(245,245,240,0.08)",
};

const CONTAINER = 500;
const CENTER = CONTAINER / 2; // 280
const RADIUS = 170;
const NODE_DIAM = 48;
const NODE_R = NODE_DIAM / 2;
const RETURN_NODE_DIAM = 64;

const ANGLES = [270, 330, 30, 90, 150, 210];

const CONTACT_LINKS = {
  whatsapp: "https://wa.me/523300000000?text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20servicios.",
  email: "mailto:contacto@viterra.mx",
  phone: "tel:+523300000000",
};

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}
function nodeCenter(angleDeg) {
  // x = centerX + RADIUS * cos((angle - 90) * PI / 180)
  const a = degToRad(angleDeg - 90);
  return {
    x: CENTER + RADIUS * Math.cos(a),
    y: CENTER + RADIUS * Math.sin(a),
  };
}

function nodeEdge(angleDeg) {
  const a = degToRad(angleDeg - 90);
  const d = RADIUS - NODE_R;
  return {
    x: CENTER + d * Math.cos(a),
    y: CENTER + d * Math.sin(a),
  };
}

function nodeEdgeByRadius(angleDeg, nodeRadius) {
  const a = degToRad(angleDeg - 90);
  const d = RADIUS - nodeRadius;
  return {
    x: CENTER + d * Math.cos(a),
    y: CENTER + d * Math.sin(a),
  };
}

function buildOrbitArc(fromAngle, toAngle, directionHint = null) {
  const from = nodeCenter(fromAngle);
  const to = nodeCenter(toAngle);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const side = directionHint === -1 ? -1 : 1;
  const bend = Math.min(56, Math.max(26, len * 0.18)) * side;

  // Curva Bezier suave para un desplazamiento más natural (sin órbita circular completa)
  const c1 = { x: from.x + dx * 0.33 + nx * bend, y: from.y + dy * 0.33 + ny * bend };
  const c2 = { x: from.x + dx * 0.66 + nx * bend * 0.78, y: from.y + dy * 0.66 + ny * bend * 0.78 };
  const steps = 16;
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * from.x +
      3 * mt * mt * t * c1.x +
      3 * mt * t * t * c2.x +
      t * t * t * to.x;
    const y =
      mt * mt * mt * from.y +
      3 * mt * mt * t * c1.y +
      3 * mt * t * t * c2.y +
      t * t * t * to.y;
    points.push({ x, y });
  }

  return points;
}

export function ServicesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swappedIndex, setSwappedIndex] = useState(null); // nodo de servicio que intercambia lugar con Viterra
  const [clickFx, setClickFx] = useState({ key: 0, x: CENTER, y: CENTER });
  const [returnPathAnim, setReturnPathAnim] = useState(null);
  const prevSwappedRef = useRef(null);
  const navDirectionRef = useRef(null);
  const active = activeIndex !== null ? SERVICES[activeIndex] : null;
  const ActiveCenterIcon = active?.icon;
  const isSwapped = swappedIndex !== null;
  const graphTargetIndex = activeIndex;
  const viterraPos = isSwapped ? nodeCenter(ANGLES[swappedIndex] ?? 270) : { x: CENTER, y: CENTER };

  const activeId = active?.id ?? "none";

  useEffect(() => {
    if (swappedIndex === null) {
      prevSwappedRef.current = null;
      setReturnPathAnim(null);
      return;
    }

    const prevIdx = prevSwappedRef.current;
    if (prevIdx !== null && prevIdx !== swappedIndex) {
      const fromAngle = ANGLES[prevIdx] ?? 270;
      const toAngle = ANGLES[swappedIndex] ?? 270;
      const arcPoints = buildOrbitArc(fromAngle, toAngle, navDirectionRef.current);
      setReturnPathAnim({
        points: arcPoints,
        key: Date.now(),
      });
    } else {
      setReturnPathAnim(null);
    }

    navDirectionRef.current = null;
    prevSwappedRef.current = swappedIndex;
  }, [swappedIndex]);

  const shiftService = (direction) => {
    navDirectionRef.current = direction;
    const base = activeIndex ?? 0;
    const nextIndex = (base + direction + SERVICES.length) % SERVICES.length;
    setActiveIndex(nextIndex);

    // En modo swap, el nodo Viterra pequeño debe seguir el nuevo nodo seleccionado
    if (isSwapped) {
      setSwappedIndex(nextIndex);
      const p = nodeCenter(ANGLES[nextIndex] ?? 270);
      setClickFx({ key: Date.now(), x: p.x, y: p.y });
    }
  };

  const prev = () => shiftService(-1);
  const next = () => shiftService(1);

  const selectServiceFromFooter = (targetIndex) => {
    const current = activeIndex ?? 0;
    const cwSteps = (targetIndex - current + SERVICES.length) % SERVICES.length;
    const ccwSteps = (current - targetIndex + SERVICES.length) % SERVICES.length;
    navDirectionRef.current = cwSteps <= ccwSteps ? 1 : -1;

    setActiveIndex(targetIndex);
    if (isSwapped) {
      setSwappedIndex(targetIndex);
      const p = nodeCenter(ANGLES[targetIndex] ?? 270);
      setClickFx({ key: Date.now(), x: p.x, y: p.y });
    }
  };

  return (
    <section
      style={{
        height: "auto",
        minHeight: "calc(100dvh - 72px)",
        width: "100%",
        background: "#FFFFFF",
        marginTop: 0,
        marginBottom: 0,
      }}
      className="relative overflow-x-hidden"
    >
      {/* Fonts (sin tocar otros archivos) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      `}</style>

      {/* BODY: 2 columns */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "50% 50%", height: "auto", minHeight: "calc(100dvh - 72px)" }}
      >
        {/* COLUMN A */}
        <aside
          style={{
            background: "#FFFFFF",
            borderRight: "none",
            position: "relative",
            overflow: "hidden",
            padding: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Radial glow centered on hub */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              width: 480,
              height: 480,
              borderRadius: 9999,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(185,28,28,0.08) 0%, transparent 65%)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* graph canvas */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 8px 16px 8px",
            }}
          >
            <div style={{ position: "relative", width: CONTAINER, height: CONTAINER, overflow: "visible" }}>
              <svg
                aria-hidden
                style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
                viewBox={`0 0 ${CONTAINER} ${CONTAINER}`}
              >
                <defs>
                  {SERVICES.map((_, i) => {
                    const angle = ANGLES[i] ?? 270;
                    const nc = nodeCenter(angle);
                    return (
                      <g key={`grad-${i}`}>
                        <linearGradient
                          id={`lineInactiveGrad-${i}`}
                          gradientUnits="userSpaceOnUse"
                          x1={CENTER}
                          y1={CENTER}
                          x2={nc.x}
                          y2={nc.y}
                        >
                          <stop offset="0%" stopColor="#B91C1C" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient
                          id={`lineActiveGrad-${i}`}
                          gradientUnits="userSpaceOnUse"
                          x1={CENTER}
                          y1={CENTER}
                          x2={nc.x}
                          y2={nc.y}
                        >
                          <stop offset="0%" stopColor="#B91C1C" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#B91C1C" stopOpacity={0.2} />
                        </linearGradient>
                      </g>
                    );
                  })}
                </defs>

                {graphTargetIndex !== null ? (() => {
                  const e =
                    isSwapped && graphTargetIndex === swappedIndex
                      ? nodeEdgeByRadius(ANGLES[graphTargetIndex] ?? 270, RETURN_NODE_DIAM / 2)
                      : nodeEdge(ANGLES[graphTargetIndex] ?? 270);
                  const activeD = `M ${CENTER} ${CENTER} L ${e.x} ${e.y}`;
                  return (
                    <path id="activePath" d={activeD} fill="none" stroke="none" strokeWidth={0} pointerEvents="none" />
                  );
                })() : null}

                {SERVICES.map((_, idx) => {
                  if (isSwapped && idx !== swappedIndex) return null;
                  const angle = ANGLES[idx] ?? 270;
                  const edge = isSwapped && idx === swappedIndex ? nodeEdgeByRadius(angle, RETURN_NODE_DIAM / 2) : nodeEdge(angle);
                  const isActive = graphTargetIndex !== null && idx === graphTargetIndex;
                  const gradId = isActive ? `lineActiveGrad-${idx}` : `lineInactiveGrad-${idx}`;
                  return (
                    <motion.line
                      key={`l-${idx}`}
                      x1={CENTER}
                      y1={CENTER}
                      x2={edge.x}
                      y2={edge.y}
                      stroke={`url(#${gradId})`}
                      strokeWidth={isActive ? 1.5 : 1}
                      strokeLinecap="round"
                      initial={false}
                      animate={{ strokeOpacity: isActive ? 0.95 : 0.32 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    />
                  );
                })}

                {graphTargetIndex !== null ? (
                  <circle key={graphTargetIndex} r={2} fill="#B91C1C">
                    <animateMotion dur="4.4s" repeatCount="indefinite" rotate="auto">
                      <mpath href="#activePath" />
                    </animateMotion>
                  </circle>
                ) : null}
              </svg>

              {/* Center node */}
              <motion.button
                key={`center-node-${swappedIndex ?? "base"}-${graphTargetIndex ?? "none"}`}
                type="button"
                onClick={() => {
                  if (isSwapped) {
                    setSwappedIndex(null);
                    setActiveIndex(null);
                    setClickFx({ key: Date.now(), x: CENTER, y: CENTER });
                    return;
                  }
                  if (!isSwapped) {
                    setActiveIndex(null);
                  }
                }}
                aria-label="Viterra nodo central"
                style={{
                  position: "absolute",
                  left: CENTER - 44,
                  top: CENTER - 44,
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: "#B91C1C",
                  boxShadow: isSwapped
                    ? "0 0 0 10px rgba(185,28,28,0.16), 0 0 0 20px rgba(185,28,28,0.08), 0 0 26px rgba(185,28,28,0.35)"
                    : "0 0 0 8px rgba(185,28,28,0.12), 0 0 0 16px rgba(185,28,28,0.06)",
                  zIndex: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                initial={{ opacity: 0.9, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: [1, 1.08, 1], rotate: [0, -3, 0] }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Ring 1 */}
                <div
                  className="ne-empty-glow"
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 100,
                    height: 100,
                    marginLeft: -50,
                    marginTop: -50,
                    borderRadius: "50%",
                    border: "1px solid rgba(185,28,28,0.25)",
                    animation: "neSpin 14s linear infinite",
                    transformOrigin: "50% 50%",
                    pointerEvents: "none",
                  }}
                />
                {/* Ring 2 + diamonds */}
                <div
                  className="ne-empty-line ne-empty-line--top"
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 132,
                    height: 132,
                    marginLeft: -66,
                    marginTop: -66,
                    borderRadius: "50%",
                    border: "1px dashed rgba(185,28,28,0.12)",
                    animation: "neSpin 22s linear infinite reverse",
                    transformOrigin: "50% 50%",
                    pointerEvents: "none",
                  }}
                >
                  {[0, 90, 180, 270].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const R = 62;
                    const cx = 66;
                    const cy = 66;
                    const x = cx + R * Math.cos(rad) - 2;
                    const y = cy + R * Math.sin(rad) - 2;
                    return (
                      <div
                        key={deg}
                        style={{
                          position: "absolute",
                          left: x,
                          top: y,
                          width: 4,
                          height: 4,
                          background: "rgba(185,28,28,0.5)",
                          transform: "rotate(45deg)",
                        }}
                      />
                    );
                  })}
                </div>
                <motion.div
                  key={`center-icon-${isSwapped ? `service-${swappedIndex}` : `logo-${activeIndex ?? "none"}`}`}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {!isSwapped ? (
                    <img
                      src="/images/branding/viterra-mark-mono-alpha.png"
                      alt=""
                      style={{
                        width: 62,
                        height: 62,
                        objectFit: "contain",
                        filter: "brightness(0) invert(1)",
                      }}
                    />
                  ) : (
                    <ActiveCenterIcon size={56} color="#FFFFFF" strokeWidth={2.2} />
                  )}
                </motion.div>
              </motion.button>

              {/* Service nodes */}
              {SERVICES.map((s, i) => {
                if (isSwapped && i !== swappedIndex) return null;
                const angle = ANGLES[i] ?? 270;
                const p = nodeCenter(angle);
                const isReturnNode = isSwapped && i === swappedIndex;
                const nodeSize = isReturnNode ? RETURN_NODE_DIAM : NODE_DIAM;
                const isActive = !isReturnNode && graphTargetIndex !== null && i === graphTargetIndex;
                const isArrivalTarget = graphTargetIndex !== null && i === graphTargetIndex;

                return (
                  <motion.div
                    key={isReturnNode ? "return-viterra-node" : s.id}
                    className="ne-nodewrap"
                    style={{
                      position: "absolute",
                      left:
                        isReturnNode && returnPathAnim
                          ? returnPathAnim.points[0].x - nodeSize / 2
                          : p.x - nodeSize / 2,
                      top:
                        isReturnNode && returnPathAnim
                          ? returnPathAnim.points[0].y - nodeSize / 2
                          : p.y - nodeSize / 2,
                      zIndex: 4,
                    }}
                    animate={
                      isReturnNode && returnPathAnim
                        ? {
                            left: returnPathAnim.points.map((pt) => pt.x - nodeSize / 2),
                            top: returnPathAnim.points.map((pt) => pt.y - nodeSize / 2),
                          }
                        : { left: p.x - nodeSize / 2, top: p.y - nodeSize / 2 }
                    }
                    transition={
                      isReturnNode && returnPathAnim
                        ? { duration: 0.72, ease: [0.22, 0.61, 0.36, 1] }
                        : { type: "spring", stiffness: 220, damping: 20, mass: 0.6 }
                    }
                    onAnimationComplete={() => {
                      if (isReturnNode && returnPathAnim) setReturnPathAnim(null);
                    }}
                  >
                    <motion.button
                      type="button"
                      className={`ne-snode${isActive ? " ne-snode--active" : ""}${isArrivalTarget ? " ne-snode--arrival-pulse" : ""}`}
                      onClick={() => {
                        if (isReturnNode) {
                          setSwappedIndex(null);
                          setActiveIndex(null);
                          setClickFx({ key: Date.now(), x: p.x, y: p.y });
                          return;
                        }
                        setActiveIndex(i);
                        setSwappedIndex(i);
                        setClickFx({ key: Date.now(), x: p.x, y: p.y });
                      }}
                      aria-label={`Servicio ${s.index}`}
                      initial={{ opacity: 0, scale: 0.6 }}
                      whileHover={
                        isActive
                          ? {}
                          : {
                              scale: 1.08,
                              backgroundColor: "rgba(185,28,28,0.1)",
                              borderColor: "rgba(185,28,28,0.5)",
                              boxShadow: "0 0 14px rgba(185,28,28,0.2)",
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: isActive ? [1, 1.12, 1] : 1,
                        backgroundColor: isReturnNode ? "rgba(255,255,255,0.92)" : isActive ? "#B91C1C" : "rgba(15,23,42,0.08)",
                        borderColor: isReturnNode ? "rgba(185,28,28,0.32)" : isActive ? "#B91C1C" : "rgba(15,23,42,0.28)",
                        boxShadow: isActive
                          ? "0 0 0 4px rgba(185,28,28,0.15), 0 0 20px rgba(185,28,28,0.35)"
                          : "0 0 0 0 rgba(0,0,0,0)",
                      }}
                      transition={{
                        opacity: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
                        scale: isActive
                          ? { duration: 0.35, ease: "easeOut" }
                          : { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
                        backgroundColor: { duration: 0.2, ease: "easeOut" },
                        borderColor: { duration: 0.2, ease: "easeOut" },
                        boxShadow: { duration: 0.25, ease: "easeOut" },
                      }}
                      style={{
                        position: "relative",
                        width: nodeSize,
                        height: nodeSize,
                        borderRadius: 8,
                        border: "1px solid rgba(15,23,42,0.28)",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                      }}
                    >
                      {isReturnNode ? (
                        <>
                          <span className="ne-return-base ne-return-base--a" aria-hidden />
                          <span className="ne-return-base ne-return-base--b" aria-hidden />
                        </>
                      ) : null}
                      {isActive ? (
                        <span
                          className="ne-snode-pulse"
                          aria-hidden
                          style={{
                            position: "absolute",
                            top: -3,
                            right: -3,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#ffffff",
                            border: "1.5px solid #B91C1C",
                            pointerEvents: "none",
                          }}
                        />
                      ) : null}
                      {isReturnNode ? (
                        <img
                          src="/images/branding/viterra-mark-mono-alpha.png"
                          alt=""
                          style={{
                            width: 56,
                            height: 56,
                            objectFit: "contain",
                            filter: "brightness(0) saturate(100%) invert(17%) sepia(93%) saturate(3220%) hue-rotate(350deg) brightness(81%) contrast(92%)",
                          }}
                        />
                      ) : (
                        <s.icon
                          className="ne-snode-icon"
                          size={18}
                          style={{
                            color: isActive ? "#ffffff" : "rgba(15,23,42,0.68)",
                            transition: "color 0.2s ease",
                          }}
                        />
                      )}
                    </motion.button>

                    <div className="ne-tip">{isReturnNode ? "Viterra · Volver a red" : s.name}</div>
                  </motion.div>
                );
              })}

              <motion.span
                key={`clickfx-${clickFx.key}`}
                initial={{ opacity: 0.45, scale: 0.35 }}
                animate={{ opacity: 0, scale: 1.55 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  left: clickFx.x,
                  top: clickFx.y,
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  border: "1px solid rgba(185,28,28,0.55)",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none",
                  zIndex: 7,
                }}
              />
            </div>
          </div>

          <footer
            style={{
              height: 52,
              background: "#0A1628",
              borderTop: `1px solid ${TOKENS.border}`,
              padding: "0 clamp(16px, 3vw, 36px)",
              flexShrink: 0,
            }}
            className="flex items-center"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "nowrap", overflowX: "auto", width: "100%" }}>
              {SERVICES.map((s, i) => {
                const isActive = i === activeIndex;
                const short = s.name.split(" ")[0] ?? s.name;
                return (
                  <span key={`seg-left-${s.id}`} style={{ display: "inline-flex", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => selectServiceFromFooter(i)}
                      style={{
                        fontFamily: FONT_MONO,
                        fontSize: 9,
                        color: isActive ? TOKENS.text : TOKENS.muted,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        letterSpacing: "0.02em",
                        padding: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      · {short}
                    </button>
                    {i < SERVICES.length - 1 ? <span style={{ color: "rgba(255,255,255,0.12)", marginLeft: 10 }}>|</span> : null}
                  </span>
                );
              })}
            </div>
          </footer>

          {/* Keyframes + graph-only UI */}
          <style>{`
            @keyframes neSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes nodePulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.4); opacity: 0.5; }
            }
            @keyframes nodeArrivalPulse {
              0%, 84% {
                box-shadow: 0 0 0 4px rgba(185,28,28,0.15), 0 0 20px rgba(185,28,28,0.35);
              }
              90% {
                box-shadow: 0 0 0 5px rgba(185,28,28,0.2), 0 0 26px rgba(185,28,28,0.44);
              }
              100% {
                box-shadow: 0 0 0 4px rgba(185,28,28,0.15), 0 0 20px rgba(185,28,28,0.35);
              }
            }
            .ne-snode {
              transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
            }
            .ne-snode:hover:not(.ne-snode--active) {
              transform: translateY(-3px) scale(1.1) rotate(-1deg);
              background: rgba(185,28,28,0.1) !important;
              border-color: rgba(185,28,28,0.5) !important;
              box-shadow: 0 10px 20px rgba(185,28,28,0.22), 0 0 14px rgba(185,28,28,0.22);
            }
            .ne-snode:hover:not(.ne-snode--active) .ne-snode-icon {
              color: #1a2744 !important;
              transform: scale(1.07);
            }
            .ne-snode-pulse {
              animation: nodePulse 2s ease infinite;
            }
            .ne-snode--arrival-pulse {
              animation: nodeArrivalPulse 4.4s ease-in-out infinite;
            }
            .ne-return-base {
              position: absolute;
              left: 50%;
              top: 50%;
              pointer-events: none;
              border-radius: 6px;
              transform: translate(-50%, -50%) rotate(0deg);
              opacity: 0.34;
              filter: blur(0.25px);
            }
            .ne-return-base--a {
              width: 86px;
              height: 86px;
              border: 1px solid rgba(230, 48, 48, 0.2);
              animation: neReturnBaseSpin 14s linear infinite;
            }
            .ne-return-base--b {
              width: 78px;
              height: 78px;
              border: 1px dashed rgba(230, 48, 48, 0.16);
              animation: neReturnBaseSpinRev 18s linear infinite;
            }
            @keyframes neReturnBaseSpin {
              from { transform: translate(-50%, -50%) rotate(0deg); opacity: 0.22; }
              50% { opacity: 0.36; }
              to { transform: translate(-50%, -50%) rotate(360deg); opacity: 0.22; }
            }
            @keyframes neReturnBaseSpinRev {
              from { transform: translate(-50%, -50%) rotate(0deg); opacity: 0.16; }
              50% { opacity: 0.28; }
              to { transform: translate(-50%, -50%) rotate(-360deg); opacity: 0.16; }
            }
            .ne-tip {
              position: absolute;
              bottom: calc(100% + 10px);
              left: 50%;
              transform: translate(-50%, 4px);
              background: rgba(255,255,255,0.96);
              border: 1px solid rgba(15,23,42,0.24);
              color: rgba(15,23,42,0.92);
              font-size: 11px;
              font-family: inherit;
              font-weight: 600;
              letter-spacing: 0.04em;
              padding: 5px 10px;
              border-radius: 4px;
              white-space: nowrap;
              pointer-events: none;
              z-index: 50;
              opacity: 0;
              transition: opacity 0.15s ease, transform 0.15s ease;
            }
            .ne-tip::after {
              content: "";
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              border: 4px solid transparent;
              border-top-color: rgba(255,255,255,0.96);
            }
            .ne-nodewrap:hover .ne-tip {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          `}</style>
        </aside>

        {/* COLUMN B: INFO PANEL */}
        <aside
          style={{
            background: TOKENS.panel,
            borderLeft: "none",
            padding: "48px clamp(20px, 2.6vw, 40px) 132px",
            overflow: "hidden",
            position: "relative",
          }}
          className="flex min-h-[calc(100dvh-72px)] flex-col"
        >
          <AnimatePresence mode="wait" initial={false}>
            {active ? (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  position: "relative",
                  zIndex: 1,
                  minHeight: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >

              <h3
                style={{
                  fontFamily: FONT_TITLE,
                  fontSize: "clamp(34px, 3.2vw, 44px)",
                  fontWeight: 600,
                  lineHeight: 1.06,
                  marginBottom: 20,
                  paddingBottom: 14,
                  color: "#F8FAFC",
                  textWrap: "balance",
                  borderBottom: "2px solid rgba(230,48,48,0.9)",
                }}
              >
                {active.name}
              </h3>

              <div style={{ width: 52, height: 2, background: "linear-gradient(90deg, #FB7185, rgba(251,113,133,0.25))", marginBottom: 24 }} />

              <p
                style={{
                  fontFamily: FONT_UI,
                  fontSize: 17,
                  fontWeight: 450,
                  lineHeight: 1.6,
                  color: "rgba(248,250,252,0.86)",
                  maxWidth: 480,
                  marginBottom: 28,
                }}
              >
                {active.description}
              </p>

              <div style={{ marginBottom: 28, display: "grid", gap: 10, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 18,
                    fontFamily: FONT_TITLE,
                    fontSize: 126,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: "rgba(248,250,252,0.01)",
                    filter: "blur(0.7px)",
                    userSelect: "none",
                    pointerEvents: "none",
                    lineHeight: 1,
                    zIndex: 0,
                  }}
                  aria-hidden
                >
                  {active.index}
                </div>
                {active.benefits.map((b, idx) => (
                  <div
                    key={`${active.id}-${idx}`}
                    style={{
                      padding: "12px 168px 12px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 10,
                        height: 10,
                        flexShrink: 0,
                        marginTop: 6,
                        color: "#FB7185",
                        fontSize: 18,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      -
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_UI,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#F8FAFC",
                        letterSpacing: "0.02em",
                        lineHeight: 1.45,
                      }}
                    >
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href={CONTACT_LINKS.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "rgba(248,250,252,0.86)",
                    textDecoration: "none",
                    fontFamily: FONT_UI,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  <MessageCircle size={14} color="#F8FAFC" />
                  WhatsApp
                </a>
                <a
                  href={CONTACT_LINKS.email}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "rgba(248,250,252,0.86)",
                    textDecoration: "none",
                    fontFamily: FONT_UI,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  <Mail size={14} color="#F8FAFC" />
                  Correo
                </a>
                <a
                  href={CONTACT_LINKS.phone}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "rgba(248,250,252,0.86)",
                    textDecoration: "none",
                    fontFamily: FONT_UI,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  <Phone size={14} color="#F8FAFC" />
                  Llamada
                </a>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                  <button
                    type="button"
                    onClick={prev}
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      background: "transparent",
                      border: "none",
                      color: "rgba(248,250,252,0.8)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      padding: 0,
                    }}
                    className="ne-nav"
                  >
                    ← Ant.
                  </button>
                  <span style={{ color: "rgba(245,245,240,0.42)" }}>·</span>
                  <button
                    type="button"
                    onClick={next}
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      background: "transparent",
                      border: "none",
                      color: "rgba(248,250,252,0.8)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      padding: 0,
                    }}
                    className="ne-nav"
                  >
                    Sig. →
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: 4 }}>
                <Link
                  to={active.ctaLink}
                  style={{
                    fontFamily: FONT_UI,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                    background: "transparent",
                    color: "rgba(248,250,252,0.8)",
                    border: "none",
                    padding: 0,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                  className="ne-cta"
                >
                  Conocer más sobre este servicio
                </Link>
              </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                style={{
                  minHeight: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: 6,
                  padding: "0 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  className="ne-empty-line ne-empty-line--bottom"
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(circle at 50% 42%, rgba(251,113,133,0.09) 0%, rgba(251,113,133,0.03) 28%, transparent 60%)",
                  }}
                />
                <div
                  className="ne-empty-spark ne-empty-spark--left"
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "22%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "72%",
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(251,113,133,0.35), transparent)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  className="ne-empty-spark ne-empty-spark--right"
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "84%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60%",
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(248,250,252,0.1), transparent)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "30%",
                    left: "18%",
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    transform: "rotate(45deg)",
                    background: "rgba(251,113,133,0.45)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "56%",
                    right: "16%",
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    transform: "rotate(45deg)",
                    background: "rgba(248,250,252,0.35)",
                    pointerEvents: "none",
                  }}
                />
                <img
                  className="ne-empty-logo"
                  src="/images/branding/viterra-mark-red-alpha.png"
                  alt=""
                  style={{
                    width: 220,
                    height: 220,
                    objectFit: "contain",
                    marginBottom: -44,
                    display: "block",
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT_TITLE,
                    fontSize: "clamp(28px, 2.8vw, 40px)",
                    color: TOKENS.red,
                    lineHeight: 1.1,
                    fontWeight: 600,
                  }}
                >
                  Red Viterra en espera
                </div>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 420,
                    fontFamily: FONT_UI,
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: "rgba(248,250,252,0.74)",
                    fontWeight: 500,
                  }}
                >
                  Selecciona cualquier nodo del grafo para explorar su información. Pulsa Viterra para volver aquí.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <style>{`
            @keyframes neEmptyGlowPulse {
              0%, 100% { opacity: 0.78; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
            @keyframes neEmptyLogoFloat {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-7px); }
            }
            @keyframes neEmptyLineBreath {
              0%, 100% { opacity: 0.45; }
              50% { opacity: 0.9; }
            }
            @keyframes neEmptySparkTwinkle {
              0%, 100% { opacity: 0.4; transform: rotate(45deg) scale(1); }
              50% { opacity: 1; transform: rotate(45deg) scale(1.18); }
            }
            .ne-empty-glow {
              animation: neEmptyGlowPulse 5.8s ease-in-out infinite;
              transform-origin: center;
            }
            .ne-empty-logo {
              animation: neEmptyLogoFloat 4.8s ease-in-out infinite;
            }
            .ne-empty-line {
              animation: neEmptyLineBreath 4.6s ease-in-out infinite;
            }
            .ne-empty-line--bottom {
              animation-delay: 0.8s;
            }
            .ne-empty-spark {
              animation: neEmptySparkTwinkle 3.6s ease-in-out infinite;
            }
            .ne-empty-spark--right {
              animation-delay: 1.2s;
            }
            .ne-cta:hover {
              background: transparent;
              color: #ffffff;
              transform: none;
              box-shadow: none;
            }
            .ne-nav:hover {
              background: transparent;
              color: #ffffff;
              box-shadow: none;
            }
          `}</style>
        </aside>
      </div>

    </section>
  );
}
