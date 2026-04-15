/** Asesores / usuarios CRM para asignación de leads (ids alineados con mock de leads). */
export const CRM_ASSIGNEES: { id: string; name: string }[] = [
  { id: "1", name: "Admin Viterra" },
  { id: "2", name: "Patricia López" },
  { id: "3", name: "Laura Méndez" },
  { id: "4", name: "María González" },
  { id: "5", name: "Carlos Rodríguez" },
];

export function getAssigneeNameById(id: string): string {
  return CRM_ASSIGNEES.find((a) => a.id === id)?.name ?? "Sin asignar";
}
