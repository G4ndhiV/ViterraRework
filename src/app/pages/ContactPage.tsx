import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { MapPin, Phone, Mail, Clock, Send, ChevronDown } from "lucide-react";
import { usePreviewLayout } from "../../contexts/PreviewCanvasContext";
import { useSiteContent } from "../../contexts/SiteContentContext";
import { PreviewSectionChrome } from "../components/admin/siteEditor/PreviewSectionChrome";
import { Reveal } from "../components/Reveal";
import { ViterraHeroTopClusterAnimated } from "../components/ViterraHeroTopClusterAnimated";
import { cn } from "../components/ui/utils";
import {
  viterraHeroSectionClass,
  viterraHeroCenteredStackClass,
  viterraHeroCenteredInnerClass,
  viterraHeroMainClass,
  viterraHeroTitleClass,
  viterraHeroSubtitleClass,
} from "../config/heroLayout";

export function ContactPage() {
  const reduceMotion = useReducedMotion();
  const pl = usePreviewLayout();
  const { content } = useSiteContent();
  const c = content.contact;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const timeouts: number[] = [];
    let removeResizeListener: (() => void) | undefined;
    let cancelled = false;

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const lat = Number(c.mapLat);
      const lng = Number(c.mapLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        console.warn("Contacto: coordenadas del mapa no válidas; revisa latitud/longitud en el editor.");
        return;
      }

      try {
        const L = await import('leaflet');
        (window as any).L = L;
        
        await import('leaflet/dist/leaflet.css');

        const center: [number, number] = [lat, lng];

        const el = mapRef.current;
        const map = (L as any).map(el).setView(center, 15);

        (L as any).tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        // Marcador de la oficina
        const customIcon = (L as any).divIcon({
          className: 'custom-office-marker',
          html: `
            <div style="position: relative; cursor: pointer; filter: drop-shadow(0 4px 8px rgba(20, 28, 46, 0.35));">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="24" cy="24" r="21" fill="#C8102E" stroke="white" stroke-width="2.5"/>
                <text x="24" y="30" text-anchor="middle" font-family="Poppins, system-ui, sans-serif" font-size="19" font-weight="300" fill="white" letter-spacing="0.12em">V</text>
              </svg>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
          popupAnchor: [0, -24]
        });

        const marker = (L as any).marker(center, { icon: customIcon }).addTo(map);

        const escapeHtml = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const mapAddrPlain = c.mapPopupAddress.replace(/<br\s*\/?>/gi, "\n");
        const mapAddrSafe = escapeHtml(mapAddrPlain);

        const popupContent = `
          <div style="font-family: Poppins, sans-serif; padding: 8px;">
            <h3 style="font-weight: 600; font-size: 16px; color: #141c2e; margin: 0 0 8px 0;">
              ${escapeHtml(c.mapPopupTitle)}
            </h3>
            <p style="font-size: 14px; color: #64748B; margin: 0 0 8px 0; white-space: pre-line;">
              ${mapAddrSafe}
            </p>
            <a 
              href="https://maps.google.com/?q=${c.mapLat},${c.mapLng}" 
              target="_blank"
              style="color: #C8102E; font-size: 14px; font-weight: 600; text-decoration: none;"
            >
              Ver en Google Maps →
            </a>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: 'custom-popup'
        });

        mapInstanceRef.current = map;
        const safeInvalidate = () => {
          try {
            map.invalidateSize();
          } catch {
            /* ignore */
          }
        };
        requestAnimationFrame(safeInvalidate);
        timeouts.push(window.setTimeout(safeInvalidate, 180));

        if (!cancelled) {
          const onResize = () => safeInvalidate();
          window.addEventListener("resize", onResize);
          removeResizeListener = () => window.removeEventListener("resize", onResize);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    timeouts.push(window.setTimeout(() => void initMap(), 0));

    return () => {
      cancelled = true;
      removeResizeListener?.();
      timeouts.forEach((id) => window.clearTimeout(id));
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [c.mapLat, c.mapLng, c.mapPopupTitle, c.mapPopupAddress]);

  const heroContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: reduceMotion ? 0 : 0.06,
      },
    },
  } as const;

  const heroItemVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] as const },
    },
  } as const;

  return (
    <div className="viterra-page min-h-screen flex flex-col bg-white" >
      <Header />

      {/* Hero Section */}
      <PreviewSectionChrome blockId="contact-hero" label="Cabecera">
      <section className={viterraHeroSectionClass}>
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img
            src="https://blog.grupoguia.mx/hubfs/DJI_20241206140245_0034_D.jpg"
            alt=""
            className="h-full w-full object-cover"
            initial={false}
            animate={
              reduceMotion
                ? { scale: 1.05 }
                : { scale: [1.05, 1.07, 1.05] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 22, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-navy/78 via-black/48 to-black/60" />
        </div>
        <div className={viterraHeroCenteredStackClass}>
          <motion.div
            className={viterraHeroCenteredInnerClass}
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <ViterraHeroTopClusterAnimated
              kicker="Viterra · Contacto"
              itemVariants={heroItemVariants}
              reduceMotion={!!reduceMotion}
            />
            <motion.div variants={heroItemVariants} className={viterraHeroMainClass}>
              <h1 className={viterraHeroTitleClass}>{c.heroTitle}</h1>
            </motion.div>
            <motion.p variants={heroItemVariants} className={viterraHeroSubtitleClass}>
              {c.heroSubtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>
      </PreviewSectionChrome>

      {/* Contact Section */}
      <section className="bg-white py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn("grid gap-8 md:gap-12", pl.gridCols("grid-cols-1 lg:grid-cols-3"))}>
            {/* Contact Information */}
            <Reveal className={cn("space-y-6", pl.colSpan("lg:col-span-1"))} y={26}>
              <PreviewSectionChrome blockId="contact-info" label="Datos de contacto">
              <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 md:p-8">
                <h3 className="mb-6 text-lg font-semibold tracking-tight text-slate-900 sm:mb-8 sm:text-xl" style={{ fontWeight: 600 }}>
                  {c.infoTitle}
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1 tracking-tight" style={{ fontWeight: 600 }}>
                        {c.addressTitle}
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line" style={{ fontWeight: 400 }}>
                        {c.addressLines}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1 tracking-tight" style={{ fontWeight: 600 }}>
                        {c.phoneTitle}
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line" style={{ fontWeight: 400 }}>
                        {c.phoneLines}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1 tracking-tight" style={{ fontWeight: 600 }}>
                        {c.emailTitle}
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line" style={{ fontWeight: 400 }}>
                        {c.emailLines}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1 tracking-tight" style={{ fontWeight: 600 }}>
                        {c.hoursTitle}
                      </h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line" style={{ fontWeight: 400 }}>
                        {c.hoursLines}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </PreviewSectionChrome>

              {/* Quick Info */}
              <PreviewSectionChrome blockId="contact-whatsapp" label="WhatsApp">
              <motion.div
                className="rounded-lg border border-brand-navy/80 bg-brand-navy p-5 text-white sm:p-6 md:p-8"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                <h3 className="mb-3 text-lg font-semibold tracking-tight sm:mb-4 sm:text-xl" style={{ fontWeight: 600 }}>
                  {c.quickTitle}
                </h3>
                <p className="mb-6 text-sm text-white/80" style={{ fontWeight: 400 }}>
                  {c.quickSubtitle}
                </p>
                <a
                  href={c.quickWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-brand-navy px-6 py-3.5 rounded-lg hover:bg-brand-canvas hover:shadow-lg transition-all duration-300 text-center font-medium"
                  style={{ fontWeight: 600 }}
                >
                  {c.quickWhatsappLabel}
                </a>
              </motion.div>
              </PreviewSectionChrome>
            </Reveal>

            {/* Contact Form */}
            <PreviewSectionChrome blockId="contact-form" label="Formulario">
            <Reveal className={pl.colSpan("lg:col-span-2")} y={26} delay={0.1}>
            <div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 md:p-10">
                <h3 className="mb-6 text-xl font-semibold tracking-tight text-slate-900 sm:mb-8 sm:text-2xl" style={{ fontWeight: 600 }}>
                  {c.formTitle}
                </h3>

                {submitted && (
                  <motion.div
                    className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-slate-900 font-semibold mb-1" style={{ fontWeight: 600 }}>
                      {c.successTitle}
                    </p>
                    <p className="text-sm text-slate-600" style={{ fontWeight: 400 }}>
                      {c.successSubtitle}
                    </p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className={cn("grid gap-6", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-slate-700 mb-2"
                        style={{ fontWeight: 500 }}
                      >
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all text-sm"
                        placeholder="Tu nombre"
                        style={{ fontWeight: 400 }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-700 mb-2"
                        style={{ fontWeight: 500 }}
                      >
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all text-sm"
                        placeholder="tu@email.com"
                        style={{ fontWeight: 400 }}
                      />
                    </div>
                  </div>

                  <div className={cn("grid gap-6", pl.gridCols("grid-cols-1 md:grid-cols-2"))}>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-slate-700 mb-2"
                        style={{ fontWeight: 500 }}
                      >
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full min-h-[48px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all text-sm"
                        placeholder="(123) 456-7890"
                        style={{ fontWeight: 400 }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-slate-700 mb-2"
                        style={{ fontWeight: 500 }}
                      >
                        Asunto *
                      </label>
                      <div className="relative">
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className={cn(
                            "w-full min-h-[48px] appearance-none border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-900",
                            "rounded-lg transition-all focus:border-[#C8102E] focus:outline-none focus:ring-2 focus:ring-[#C8102E]",
                            "cursor-pointer"
                          )}
                          style={{ fontWeight: 400 }}
                        >
                          <option value="">Selecciona un asunto</option>
                          <option value="compra">Compra de propiedad</option>
                          <option value="venta">Venta de propiedad</option>
                          <option value="alquiler">Alquiler</option>
                          <option value="asesoria">Asesoría</option>
                          <option value="otro">Otro</option>
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-slate-700 mb-2"
                      style={{ fontWeight: 500 }}
                    >
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-all resize-none text-sm"
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      style={{ fontWeight: 400 }}
                    ></textarea>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    className="group w-full bg-[#C8102E] text-white px-6 py-3.5 rounded-lg hover:bg-[#a00d25] hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                    style={{ fontWeight: 600 }}
                  >
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                    <span>Enviar Mensaje</span>
                  </motion.button>

                  <p className="text-sm text-slate-500 text-center font-medium" style={{ fontWeight: 400 }}>
                    * Campos obligatorios
                  </p>
                </form>
              </div>
            </div>
            </Reveal>
            </PreviewSectionChrome>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <PreviewSectionChrome blockId="contact-map" label="Mapa">
      <section className="bg-slate-50 py-12 sm:py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-8 text-center sm:mb-12" y={22}>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500 sm:mb-3 sm:text-sm" style={{ letterSpacing: "0.1em", fontWeight: 500 }}>
                {c.mapSectionKicker}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl md:text-4xl" style={{ fontWeight: 600 }}>
                {c.mapSectionTitle}
              </h2>
            </div>
          </Reveal>
          <style>{`\n            .custom-office-marker {\n              background: none;\n              border: none;\n            }\n            \n            .custom-popup .leaflet-popup-content-wrapper {\n              border-radius: 12px;\n              padding: 16px;\n              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);\n              border: 1px solid #E2E8F0;\n            }\n            \n            .custom-popup .leaflet-popup-content {\n              margin: 0;\n            }\n            \n            .custom-popup .leaflet-popup-tip {\n              background: white;\n              border: 1px solid #E2E8F0;\n              border-top: none;\n              border-left: none;\n            }\n            \n            .custom-popup .leaflet-popup-close-button {\n              color: #64748B;\n              font-size: 20px;\n              padding: 4px 8px;\n            }\n            \n            .custom-popup .leaflet-popup-close-button:hover {\n              color: #0F172A;\n            }\n          `}</style>
          <motion.div
            ref={mapRef}
            className="h-[min(420px,52svh)] min-h-[240px] w-full overflow-hidden rounded-lg border border-slate-200 shadow-lg sm:h-[400px] md:h-[450px]"
            initial={reduceMotion ? false : { opacity: 0 }}
            whileInView={reduceMotion ? undefined : { opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </section>
      </PreviewSectionChrome>

      <Footer />
    </div>
  );
}