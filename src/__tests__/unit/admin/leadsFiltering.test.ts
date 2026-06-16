/**
 * @file leadsFiltering.test.ts
 * Tests de filterLeadsForDisplay (búsqueda por scope + estado + rango de creación).
 */
import { describe, it, expect } from "vitest";
import {
  filterLeadsForDisplay,
  type LeadsDisplayFilters,
} from "../../../app/pages/admin/leadsFiltering";
import type { Lead } from "../../../app/data/leads";
import type { User } from "../../../app/contexts/AuthContext";

const NOW = new Date("2024-06-15T12:00:00");

function makeLead(over: Partial<Lead> = {}): Lead {
  return {
    id: "l1",
    name: "Cliente",
    email: "",
    phone: "",
    interest: "compra",
    propertyType: "",
    budget: 0,
    location: "",
    status: "nuevo",
    priorityStars: 3,
    source: "",
    assignedTo: "",
    assignedToUserId: "",
    createdAt: "2024-06-10",
    lastContact: "2024-06-10",
    ...over,
  } as Lead;
}

function makeUser(over: Partial<User> = {}): User {
  return {
    id: "u1",
    email: "ana@viterra.com",
    name: "Ana López",
    role: "asesor",
    permissions: [],
    profile: { phone: "", address: "", birthDate: "", workHistory: [], picture: "" },
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    history: [],
    ...over,
  } as User;
}

const base: LeadsDisplayFilters = {
  searchQuery: "",
  leadSearchNameScope: "all",
  statusFilter: "all",
  createdRangeFilter: "all",
  createdFrom: "",
  createdTo: "",
};

describe("filterLeadsForDisplay", () => {
  it("sin filtros devuelve todos", () => {
    const leads = [makeLead({ id: "a" }), makeLead({ id: "b" })];
    expect(filterLeadsForDisplay(leads, base, [], NOW)).toHaveLength(2);
  });

  it("filtra por estado", () => {
    const leads = [makeLead({ id: "a", status: "nuevo" }), makeLead({ id: "b", status: "cerrado" })];
    const out = filterLeadsForDisplay(leads, { ...base, statusFilter: "cerrado" }, [], NOW);
    expect(out.map((l) => l.id)).toEqual(["b"]);
  });

  it("búsqueda scope 'client' solo mira el nombre del cliente", () => {
    const leads = [
      makeLead({ id: "a", name: "Carlos Pérez", assignedTo: "Ana López" }),
      makeLead({ id: "b", name: "Otro", assignedTo: "Carlos Ruiz" }),
    ];
    const out = filterLeadsForDisplay(
      leads,
      { ...base, searchQuery: "carlos", leadSearchNameScope: "client" },
      [],
      NOW,
    );
    expect(out.map((l) => l.id)).toEqual(["a"]); // no matchea por asesor
  });

  it("búsqueda scope 'advisor' matchea por asesor asignado", () => {
    const leads = [
      makeLead({ id: "a", name: "Cliente X", assignedTo: "Ana López" }),
      makeLead({ id: "b", name: "Cliente Y", assignedTo: "Carlos Ruiz" }),
    ];
    const out = filterLeadsForDisplay(
      leads,
      { ...base, searchQuery: "ana", leadSearchNameScope: "advisor" },
      [],
      NOW,
    );
    expect(out.map((l) => l.id)).toEqual(["a"]);
  });

  it("búsqueda 'all' es insensible a acentos y cubre nombre/email/teléfono", () => {
    const leads = [
      makeLead({ id: "a", name: "José", email: "" }),
      makeLead({ id: "b", email: "contacto@x.com" }),
      makeLead({ id: "c", phone: "555-1234" }),
    ];
    expect(filterLeadsForDisplay(leads, { ...base, searchQuery: "jose" }, [], NOW).map((l) => l.id)).toEqual(["a"]);
    expect(filterLeadsForDisplay(leads, { ...base, searchQuery: "contacto" }, [], NOW).map((l) => l.id)).toEqual(["b"]);
    expect(filterLeadsForDisplay(leads, { ...base, searchQuery: "1234" }, [], NOW).map((l) => l.id)).toEqual(["c"]);
  });

  it("rango '3m' incluye lo reciente y excluye lo antiguo", () => {
    const leads = [
      makeLead({ id: "reciente", createdAt: "2024-05-01" }),
      makeLead({ id: "viejo", createdAt: "2023-12-01" }),
    ];
    const out = filterLeadsForDisplay(leads, { ...base, createdRangeFilter: "3m" }, [], NOW);
    expect(out.map((l) => l.id)).toEqual(["reciente"]);
  });

  it("rango 'custom' respeta from/to inclusivos", () => {
    const leads = [
      makeLead({ id: "dentro", createdAt: "2024-06-10" }),
      makeLead({ id: "antes", createdAt: "2024-05-30" }),
      makeLead({ id: "despues", createdAt: "2024-06-20" }),
    ];
    const out = filterLeadsForDisplay(
      leads,
      { ...base, createdRangeFilter: "custom", createdFrom: "2024-06-01", createdTo: "2024-06-15" },
      [],
      NOW,
    );
    expect(out.map((l) => l.id)).toEqual(["dentro"]);
  });

  it("combina búsqueda + estado + rango (AND)", () => {
    const leads = [
      makeLead({ id: "ok", name: "Match", status: "nuevo", createdAt: "2024-06-10" }),
      makeLead({ id: "badStatus", name: "Match", status: "cerrado", createdAt: "2024-06-10" }),
      makeLead({ id: "badDate", name: "Match", status: "nuevo", createdAt: "2023-01-01" }),
    ];
    const out = filterLeadsForDisplay(
      leads,
      { ...base, searchQuery: "match", statusFilter: "nuevo", createdRangeFilter: "3m" },
      [],
      NOW,
    );
    expect(out.map((l) => l.id)).toEqual(["ok"]);
  });
});
