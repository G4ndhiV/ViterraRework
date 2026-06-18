import type { Lead, CustomKanbanStage } from "../../data/leads";
import type { Property } from "../PropertyCard";
import type { AgendaAppointment } from "../../data/agenda";
import type { User } from "../../contexts/AuthContext";
import { AdvisorDashboard } from "./AdvisorDashboard";
import { GroupLeaderDashboard } from "./GroupLeaderDashboard";
import { AdminDashboard } from "./dashboard/AdminDashboard";
import {
  AdminDashboardSkeleton,
  AdminPipelineDashboardSkeleton,
} from "../../pages/admin/AdminSectionSkeletons";

type Props = {
  loading: boolean;
  isAdvisor: boolean;
  isGroupLeader: boolean;
  leadsForUser: Lead[];
  leadsInActivePipeline: Lead[];
  properties: Property[];
  appointments: AgendaAppointment[];
  users: User[];
  customStages: CustomKanbanStage[];
  onNavigate: (tab: "leads" | "agenda" | "properties" | "kpis" | "company") => void;
  onNewLead: () => void;
  onOpenUsers: () => void;
};

/** Contenido de la pestaña Dashboard: elige el panel según el rol efectivo. */
export function AdminDashboardContent({
  loading,
  isAdvisor,
  isGroupLeader,
  leadsForUser,
  leadsInActivePipeline,
  properties,
  appointments,
  users,
  customStages,
  onNavigate,
  onNewLead,
  onOpenUsers,
}: Props) {
  return (
    <div className="space-y-8">
      {loading ? (
        isAdvisor || isGroupLeader ? (
          <AdminPipelineDashboardSkeleton />
        ) : (
          <AdminDashboardSkeleton />
        )
      ) : isAdvisor ? (
        <AdvisorDashboard leads={leadsForUser} properties={properties} customStages={customStages} />
      ) : isGroupLeader ? (
        <GroupLeaderDashboard
          leads={leadsInActivePipeline}
          properties={properties}
          customStages={customStages}
          users={users}
        />
      ) : (
        <AdminDashboard
          leads={leadsForUser}
          properties={properties}
          appointments={appointments}
          users={users}
          customStages={customStages}
          onNavigate={onNavigate}
          onNewLead={onNewLead}
          onOpenUsers={onOpenUsers}
        />
      )}
    </div>
  );
}
