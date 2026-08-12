import { describe, it, expect } from "vitest";
import {
  startOfMonthMs,
  startOfNextMonthMs,
  shiftMonths,
  buildDateRange,
  comparePeriods,
  parseLeadTime,
  isClosedLead,
  isLostLead,
  leadClosedAt,
  computeCoreKpis,
  computeFunnelRates,
  computeSourceBreakdown,
  computePropertyTypeDistribution,
  computeOperationDistribution,
  computePropertiesStale,
  stageWinProbability,
  computeWeightedPipelineValue,
  computeAdvisorRanking,
  csvFromRows,
  pctDelta,
  formatDelta,
  formatHours,
  formatMoney,
} from "../../../app/lib/kpiCompute";
import type { Lead } from "../../../app/data/leads";
import type { Property } from "../../../app/components/PropertyCard";

describe("kpiCompute utilities", () => {
  describe("Date helpers", () => {
    it("should compute start of month in milliseconds", () => {
      const d = new Date(2026, 7, 15, 12, 30, 0); // Aug 15, 2026
      const res = startOfMonthMs(d);
      const expected = new Date(2026, 7, 1, 0, 0, 0, 0).getTime();
      expect(res).toBe(expected);
    });

    it("should compute start of next month in milliseconds", () => {
      const d = new Date(2026, 7, 15);
      const res = startOfNextMonthMs(d);
      const expected = new Date(2026, 8, 1, 0, 0, 0, 0).getTime();
      expect(res).toBe(expected);
    });

    it("should shift months correctly", () => {
      const d = new Date(2026, 7, 1);
      const shifted = shiftMonths(d, -3);
      expect(shifted.getFullYear()).toBe(2026);
      expect(shifted.getMonth()).toBe(4); // May
    });

    it("should build date range for month, ytd, and custom", () => {
      const monthRange = buildDateRange("month");
      expect(monthRange.key).toBe("month");
      expect(monthRange.end).toBeGreaterThan(monthRange.start);

      const ytdRange = buildDateRange("ytd");
      expect(ytdRange.key).toBe("ytd");
      expect(ytdRange.end).toBeGreaterThan(ytdRange.start);

      const customRange = buildDateRange("custom", "2026-01-01", "2026-01-31");
      expect(customRange.key).toBe("custom");
      expect(customRange.start).toBe(Date.parse("2026-01-01T00:00:00"));
    });

    it("should compare periods given a date range", () => {
      const range = buildDateRange("month");
      const comp = comparePeriods(range);
      expect(comp.current.key).toBe("month");
      expect(comp.previous.start).toBeLessThan(comp.current.start);
      expect(comp.yearAgo.start).toBeLessThan(comp.previous.start);
    });
  });

  describe("Lead status and timing helpers", () => {
    it("should parse lead timestamps", () => {
      expect(parseLeadTime(undefined)).toBeNull();
      expect(parseLeadTime("2026-08-01T12:00:00Z")).toBe(Date.parse("2026-08-01T12:00:00Z"));
    });

    it("should check if lead is closed or lost", () => {
      const leadWon: Partial<Lead> = {
        id: "l1",
        name: "Juan",
        status: "cerrado",
        createdAt: "2026-08-01T12:00:00Z",
      };
      const leadLost: Partial<Lead> = {
        ...leadWon,
        id: "l2",
        status: "perdido",
      };

      expect(isClosedLead(leadWon as Lead, [])).toBe(true);
      expect(isClosedLead(leadLost as Lead, [])).toBe(false);
      expect(isLostLead(leadLost as Lead, [])).toBe(true);
      expect(isLostLead(leadWon as Lead, [])).toBe(false);
      expect(leadClosedAt(leadWon as Lead)).toBe(Date.parse("2026-08-01T12:00:00Z"));
    });
  });

  describe("KPI aggregations & pipeline math", () => {
    it("should compute core KPIs", () => {
      const nowIso = new Date().toISOString();
      const leads: Partial<Lead>[] = [
        {
          id: "1",
          name: "Lead 1",
          status: "nuevo",
          source: "portal",
          createdAt: nowIso,
          budget: 100000,
        },
        {
          id: "2",
          name: "Lead 2",
          status: "cerrado",
          source: "web",
          createdAt: nowIso,
          budget: 200000,
        },
      ];
      const range = buildDateRange("month");
      const kpis = computeCoreKpis(leads as Lead[], [], range);

      expect(kpis.totalLeads).toBe(2);
      expect(kpis.closedLeads).toBe(1);
      expect(kpis.salesVolume).toBe(200000);
      expect(kpis.conversionRate).toBe(0.5);
    });

    it("should compute funnel rates", () => {
      const leads: Partial<Lead>[] = [
        { id: "1", name: "A", status: "nuevo", source: "web", createdAt: "" },
        { id: "2", name: "B", status: "negociacion", source: "web", createdAt: "" },
      ];
      const funnel = computeFunnelRates(leads as Lead[], ["nuevo", "negociacion", "cerrado"], []);
      expect(funnel.length).toBe(3);
      const newStage = funnel.find((s) => s.id === "nuevo");
      expect(newStage?.count).toBe(1);
    });

    it("should compute source breakdown and property distributions", () => {
      const leads: Partial<Lead>[] = [
        { id: "1", name: "A", status: "nuevo", source: "Google", createdAt: "" },
        { id: "2", name: "B", status: "nuevo", source: "Google", createdAt: "" },
        { id: "3", name: "C", status: "nuevo", source: "Meta", createdAt: "" },
      ];
      const sources = computeSourceBreakdown(leads as Lead[]);
      expect(sources[0].name).toBe("Google");
      expect(sources[0].count).toBe(2);

      const properties: Partial<Property>[] = [
        { id: "p1", type: "Casa", status: "venta" },
        { id: "p2", type: "Casa", status: "alquiler" },
        { id: "p3", type: "Departamento", status: "venta" },
      ];
      const typeDist = computePropertyTypeDistribution(properties as Property[]);
      expect(typeDist.find((t) => t.name === "Casa")?.count).toBe(2);

      const opDist = computeOperationDistribution(properties as Property[]);
      expect(opDist.find((o) => o.name === "Venta")?.count).toBe(2);
    });

    it("should compute stale properties", () => {
      const oldDate = new Date(Date.now() - 90 * 86400 * 1000).toISOString();
      const properties: Partial<Property>[] = [
        { id: "p1", title: "Old Prop", listedAtIso: oldDate },
        { id: "p2", title: "New Prop", listedAtIso: new Date().toISOString() },
      ];
      const stale = computePropertiesStale(properties as Property[], 60);
      expect(stale.length).toBe(1);
      expect(stale[0].id).toBe("p1");
    });

    it("should compute stage win probability and weighted pipeline value", () => {
      expect(stageWinProbability("nuevo")).toBe(0.08);
      expect(stageWinProbability("cerrado")).toBe(1.0);
      expect(stageWinProbability("perdido")).toBe(0);

      const leads: Partial<Lead>[] = [
        {
          id: "1",
          name: "A",
          status: "cerrado",
          budget: 10000,
        },
        {
          id: "2",
          name: "B",
          status: "nuevo",
          budget: 10000,
        },
      ];
      const weighted = computeWeightedPipelineValue(leads as Lead[], []);
      expect(weighted).toBe(800);
    });

    it("should compute advisor rankings", () => {
      const nowIso = new Date().toISOString();
      const leads: Partial<Lead>[] = [
        { id: "1", name: "A", status: "cerrado", assignedTo: "Advisor 1", assignedToUserId: "a1", budget: 50000, createdAt: nowIso },
        { id: "2", name: "B", status: "nuevo", assignedTo: "Advisor 2", assignedToUserId: "a2", createdAt: nowIso },
      ];
      const resolver = (l: Lead) => ({ id: l.assignedToUserId || "", name: l.assignedTo || "Unassigned" });
      const ranking = computeAdvisorRanking(leads as Lead[], [], buildDateRange("month"), resolver);
      expect(ranking.length).toBe(2);
      expect(ranking[0].name).toBe("Advisor 1");
    });

    it("should generate CSV string from rows", () => {
      const headers = ["Name", "Email"];
      const rows = [{ Name: "Alice", Email: "alice@test.com" }];
      const csv = csvFromRows(headers, rows);
      expect(csv).toContain("Name,Email");
      expect(csv).toContain("Alice,alice@test.com");
    });

    it("should compute percentage delta and format labels", () => {
      expect(pctDelta(150, 100)).toBe(0.5);
      expect(pctDelta(50, 100)).toBe(-0.5);
      expect(pctDelta(10, 0)).toBeNull();

      expect(formatDelta(0.5)).toEqual({ sign: "up", label: "+50%" });
      expect(formatDelta(-0.255)).toEqual({ sign: "down", label: "-25.5%" });
      expect(formatDelta(0)).toEqual({ sign: "flat", label: "0%" });
      expect(formatDelta(null)).toEqual({ sign: "na", label: "—" });

      expect(formatHours(48)).toBe("2.0 d");
      expect(formatHours(null)).toBe("—");

      expect(formatMoney(1250.5)).toContain("1,251");
    });
  });
});
