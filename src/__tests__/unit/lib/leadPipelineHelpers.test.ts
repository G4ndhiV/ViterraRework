import { describe, it, expect } from "vitest";
import {
  createdThisMonth,
  isActivePipelineLead,
  countActivePipeline,
  groupLeadsBySource,
  leadsNeedingAttention,
  dashboardTimeGreetingEs,
  firstNameFromDisplayName,
} from "../../../app/lib/leadFunnel";
import {
  canViewAllLeads,
  roleLabelEs,
  leadIsAssignedToUser,
  filterLeadsForUser,
} from "../../../app/lib/leadsAccess";
import {
  createDefaultBuiltinPipelineSnapshot,
  normalizeStageOrder,
  parseGroupPipelineConfigFromUnknown,
} from "../../../app/lib/pipelineByGroup";
import {
  canAccessDashboardModule,
  canAccessLeadsModule,
  canAccessPropertiesModule,
} from "../../../app/lib/userModuleAccess";
import type { Lead } from "../../../app/data/leads";
import type { UserRole } from "../../../app/contexts/authContextTypes";

describe("Lead & Pipeline helpers", () => {
  describe("leadFunnel", () => {
    it("should check if lead was created this month", () => {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-05`;
      const leadThisMonth: Partial<Lead> = { status: "nuevo", createdAt: yearMonth };
      expect(createdThisMonth(leadThisMonth as Lead)).toBe(true);

      const leadOld: Partial<Lead> = { status: "nuevo", createdAt: "2020-01-01" };
      expect(createdThisMonth(leadOld as Lead)).toBe(false);
    });

    it("should filter active pipeline leads", () => {
      const leads: Partial<Lead>[] = [
        { id: "1", status: "nuevo" },
        { id: "2", status: "cerrado" },
        { id: "3", status: "perdido" },
      ];
      expect(isActivePipelineLead(leads[0] as Lead)).toBe(true);
      expect(isActivePipelineLead(leads[1] as Lead)).toBe(false);
      expect(countActivePipeline(leads as Lead[])).toBe(1);
    });

    it("should group leads by source", () => {
      const leads: Partial<Lead>[] = [
        { id: "1", status: "nuevo", source: "web" },
        { id: "2", status: "nuevo", source: "portal inmobiliario" },
        { id: "3", status: "nuevo", source: "facebook" },
      ];
      const grouped = groupLeadsBySource(leads as Lead[]);
      expect(grouped.length).toBeGreaterThan(0);
    });

    it("should identify leads needing attention", () => {
      const oldDate = "2020-01-01";
      const leads: Partial<Lead>[] = [
        { id: "1", status: "nuevo", createdAt: oldDate, lastContact: oldDate },
        { id: "2", status: "nuevo", createdAt: new Date().toISOString(), lastContact: new Date().toISOString() },
      ];
      const stale = leadsNeedingAttention(leads as Lead[], 7);
      expect(stale.length).toBe(1);
      expect(stale[0].id).toBe("1");
    });

    it("should generate greetings and first names", () => {
      expect(typeof dashboardTimeGreetingEs()).toBe("string");
      expect(firstNameFromDisplayName("Maria Garcia")).toBe("Maria");
      expect(firstNameFromDisplayName(undefined)).toBe("");
    });
  });

  describe("leadsAccess & permissions", () => {
    it("should check view permissions based on user role", () => {
      expect(canViewAllLeads("admin")).toBe(true);
      expect(canViewAllLeads("asesor")).toBe(false);
      expect(roleLabelEs("admin")).toContain("Administrador");
    });

    it("should check lead assignment and filter for users", () => {
      const mockUser = { id: "u123", role: "asesor", permissions: [] } as any;
      const lead1 = { id: "l1", assignedToUserId: "u123" };
      const lead2 = { id: "l2", assignedToUserId: "u999" };

      expect(leadIsAssignedToUser(lead1, mockUser)).toBe(true);
      expect(leadIsAssignedToUser(lead2, mockUser)).toBe(false);

      const filtered = filterLeadsForUser([lead1, lead2], mockUser);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("l1");
    });

    it("should check user module access", () => {
      const adminUser = {
        role: "admin" as UserRole,
        permissions: ["access_dashboard", "manage_leads", "manage_properties"],
      };
      expect(canAccessDashboardModule(adminUser as any)).toBe(true);
      expect(canAccessLeadsModule(adminUser as any)).toBe(true);
      expect(canAccessPropertiesModule(adminUser as any)).toBe(true);
    });
  });

  describe("pipelineByGroup", () => {
    it("should create default builtin pipeline snapshot", () => {
      const snapshot = createDefaultBuiltinPipelineSnapshot();
      expect(snapshot.stageOrder.length).toBeGreaterThan(0);
    });

    it("should normalize stage order properly", () => {
      const allIds = ["s1", "s2", "s3"];
      const partialOrder = ["s2"];
      const normalized = normalizeStageOrder(partialOrder, allIds);
      expect(normalized).toEqual(["s2", "s1", "s3"]);
    });

    it("should parse group pipeline config safely from unknown JSON", () => {
      const raw = {
        customStages: [{ id: "c1", label: "Cotización" }],
        stageOrder: ["c1"],
      };
      const parsed = parseGroupPipelineConfigFromUnknown(raw);
      expect(parsed.customStages[0].id).toBe("c1");
    });
  });
});
