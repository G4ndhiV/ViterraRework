import { PdfDownloadModal } from "./PdfDownloadModal";
import type { Property } from "../PropertyCard";
import type { Development } from "../../data/developments";

interface PdfDownloadDropdownProps {
  data: Property | Development;
  type: "property" | "development";
  className?: string;
}

export function PdfDownloadDropdown({ data, type, className }: PdfDownloadDropdownProps) {
  // We use the new modal instead of the old dropdown menu
  return <PdfDownloadModal data={data} type={type} className={className} />;
}
