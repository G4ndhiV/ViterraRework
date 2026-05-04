import { useLocation } from "react-router";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { SOCIAL_LINKS, type SocialNetworkId } from "../config/socialLinks";
import { cn } from "./ui/utils";

const iconById: Record<SocialNetworkId, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const sizeStyles = {
  /** Desktop navbar: misma lectura que enlaces (sin cajas segmentadas) */
  md: { pad: "p-2", icon: "h-[17px] w-[17px]" },
  sm: { pad: "p-1.5", icon: "h-4 w-4" },
  xs: { pad: "p-1.5", icon: "h-[14px] w-[14px]" },
} as const;

type SocialNavIconsProps = {
  className?: string;
  /** md: barra desktop · sm: mapa / tablet · xs: cabecera móvil muy estrecha */
  iconSize?: keyof typeof sizeStyles;
};

export function SocialNavIcons({ className, iconSize = "md" }: SocialNavIconsProps) {
  const location = useLocation();
  const hidden =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/login");
  if (hidden) return null;

  const { pad, icon } = sizeStyles[iconSize];

  return (
    <ul
      role="list"
      aria-label="Redes sociales"
      className={cn(
        "flex flex-nowrap items-center",
        iconSize === "md" ? "gap-1 sm:gap-2" : "gap-0.5 sm:gap-1.5",
        className
      )}
    >
      {SOCIAL_LINKS.map(({ id, label, href }) => {
        const Icon = iconById[id];
        return (
          <li key={id} className="shrink-0">
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className={cn(
                "inline-flex items-center justify-center rounded-md text-white/85 transition-colors",
                "hover:bg-white/[0.07] hover:text-white",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
                "active:bg-white/[0.1]",
                pad
              )}
            >
              <Icon className={icon} strokeWidth={1.5} aria-hidden />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
