/**
 * Enlaces a redes sociales. Sustituye `href` por las URLs reales cuando las tengas.
 */
export type SocialNetworkId = "facebook" | "instagram" | "x" | "linkedin" | "youtube";

export const SOCIAL_LINKS: ReadonlyArray<{
  id: SocialNetworkId;
  label: string;
  href: string;
}> = [
  { id: "facebook", label: "Facebook", href: "#" },
  { id: "instagram", label: "Instagram", href: "#" },
  { id: "x", label: "X (Twitter)", href: "#" },
  { id: "linkedin", label: "LinkedIn", href: "#" },
  { id: "youtube", label: "YouTube", href: "#" },
];
