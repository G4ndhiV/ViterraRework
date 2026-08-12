import { describe, it, expect } from "vitest";
import {
  filterMyLeads,
  computePipelineStageBreakdown,
  buildProfileInsights,
} from "../../../app/lib/profileInsights";
import type { Lead } from "../../../app/data/leads";
import type { User } from "../../../app/contexts/AuthContext";

describe("profileInsights utilities", () => {
  const mockUser: User = {
    id: "u1",
    email: "advisor@viterra.com",
    name: "Carlos Advisor",
    role: "asesor",
    permissions: [],
  };

  const mockLeads: Partial<Lead>[] = [
    {
      id: "l1",
      name: "Client 1",
      phone: "123",
      email: "c1@test.com",
      status: "nuevo",
      assignedTo: "Carlos Advisor",
      assignedToUserId: "u1",
      budget: 50000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "l2",
      name: "Client 2",
      phone: "456",
      email: "c2@test.com",
      status: "cerrado",
      assignedTo: "Carlos Advisor",
      assignedToUserId: "u1",
      budget: 3000000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "l3",
      name: "Client 3",
      phone: "789",
      email: "c3@test.com",
      status: "nuevo",
      assignedTo: "Other Advisor",
      assignedToUserId: "u2",
      createdAt: new Date().toISOString(),
    },
  ];

  it("should filter leads belonging to the user", () => {
    const myLeads = filterMyLeads(mockLeads as Lead[], mockUser);
    expect(myLeads.length).toBe(2);
    expect(myLeads.map((l) => l.id)).toEqual(["l1", "l2"]);
  });

  it("should compute pipeline stage breakdown for user leads", () => {
    const breakdown = computePipelineStageBreakdown(mockLeads as Lead[], []);
    expect(breakdown.length).toBeGreaterThan(0);
    const nuevoStage = breakdown.find((s) => s.stageLabel === "Nuevo");
    expect(nuevoStage?.leadCount).toBe(2);
  });

  it("should build full profile insights object", () => {
    const insights = buildProfileInsights({
      user: mockUser,
      users: [mockUser],
      leads: mockLeads as Lead[],
      customStages: [],
      propertiesCount: 10,
      myActivePropertiesCount: 4,
      appointments: [],
      groups: [],
      targets: [],
      stageOrder: ["nuevo", "cerrado"],
    });

    expect(insights.stats.activePipeline).toBe(1);
    expect(insights.stats.newLeadsMonth).toBe(2);
    expect(insights.stats.closedMonth).toBe(1);
    expect(insights.stats.conversionPct).toBe(50);
  });
});
