import type { ProfileInsights } from "../../../lib/profileInsights";
import { KpiFunnelStages } from "../kpis/KpiFunnelStages";
import { KpiSourceBreakdown } from "../kpis/KpiSourceBreakdown";
import { ProfileTrendChart } from "./ProfileTrendChart";

type Props = {
  insights: ProfileInsights;
};

export function ProfilePerformanceCharts({ insights }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <KpiFunnelStages funnel={insights.funnel} />
        <KpiSourceBreakdown
          data={insights.sources}
          title="Origen de tus leads"
          description="Distribución por canal de captación"
        />
      </div>
      <ProfileTrendChart trend={insights.trend} />
    </div>
  );
}
