import React from "react";
import type { User } from "../contexts/AuthContext";
import { generatePdf } from "./generatePdfFicha";
import { ProfilePerformanceReportPdf } from "../components/admin/profile/ProfilePerformanceReportPdf";
import type { ProfileInsights } from "./profileInsights";
import { buildProfileReportSheets, reportBaseFilename } from "./profileReportExport";

export async function downloadProfilePerformanceReportPdf(
  insights: ProfileInsights,
  user: User,
): Promise<void> {
  const generatedAt = new Date().toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const sheets = buildProfileReportSheets(insights, user);

  await generatePdf(
    React.createElement(ProfilePerformanceReportPdf, {
      user,
      generatedAt,
      rangeLabel: insights.rangeLabel,
      sheets,
    }),
    `${reportBaseFilename(user)}.pdf`,
  );
}
