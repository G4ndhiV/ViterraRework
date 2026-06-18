import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  AGENDA_STORAGE_KEY,
  normalizeStoredAgenda,
  type AgendaAppointment,
} from "../../data/agenda";

export type AdminAppointmentsState = {
  appointments: AgendaAppointment[];
  setAppointments: Dispatch<SetStateAction<AgendaAppointment[]>>;
};

/**
 * Agenda local (localStorage) que alimenta las métricas de citas en KPI's.
 * Se re-hidrata al cambiar de pestaña para reflejar cambios hechos en el módulo de Agenda.
 */
export function useAdminAppointments(activeTab: string): AdminAppointmentsState {
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AGENDA_STORAGE_KEY);
      if (!raw) {
        setAppointments([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      setAppointments(normalizeStoredAgenda(parsed));
    } catch {
      setAppointments([]);
    }
  }, [activeTab]);

  return { appointments, setAppointments };
}
