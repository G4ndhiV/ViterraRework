import { Navigate, useLocation } from "react-router";

export function PropertiesRedirectPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const status = params.get("status");

  const targetPath = status === "venta" ? "/venta" : "/renta";
  if (status) params.delete("status");

  const nextSearch = params.toString();
  return <Navigate to={nextSearch ? `${targetPath}?${nextSearch}` : targetPath} replace />;
}
