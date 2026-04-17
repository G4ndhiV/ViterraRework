import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInMinutes,
  format,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  User,
} from "lucide-react";
import {
  AGENDA_STATUS_LABEL,
  AGENDA_STATUS_STYLES,
  AGENDA_STORAGE_KEY,
  type AgendaAppointment,
  type AgendaStatus,
  createDefaultAgendaAppointments,
  filterAppointmentsForDay,
  filterAppointmentsForWeek,
  newAgendaId,
  normalizeStoredAgenda,
  parseAppointment,
} from "../../data/agenda";
import { Calendar } from "../ui/calendar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

const START_HOUR = 8;
const END_HOUR_EXCLUSIVE = 20;
const PX_PER_HOUR = 52;
const HOUR_COUNT = END_HOUR_EXCLUSIVE - START_HOUR;

function statusBadgeClassName(status: AgendaStatus): string {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "confirmed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "completed":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "";
  }
}

function layoutBlock(
  apt: AgendaAppointment,
  day: Date,
): { topPct: number; heightPct: number } | null {
  const { start, end } = parseAppointment(apt);
  if (!start || !end || end <= start) return null;
  const sod = startOfDay(day);
  const visStart = setMinutes(setHours(sod, START_HOUR), 0);
  const visEnd = setMinutes(setHours(sod, END_HOUR_EXCLUSIVE), 0);
  const s = start > visStart ? start : visStart;
  const e = end < visEnd ? end : visEnd;
  if (e <= s) return null;
  const totalMin = differenceInMinutes(visEnd, visStart);
  const topMin = differenceInMinutes(s, visStart);
  const durMin = differenceInMinutes(e, s);
  return {
    topPct: (topMin / totalMin) * 100,
    heightPct: Math.max((durMin / totalMin) * 100, 8),
  };
}

export function AdminAgendaModule() {
  const [appointments, setAppointments] = useState<AgendaAppointment[]>(() => {
    try {
      const raw = localStorage.getItem(AGENDA_STORAGE_KEY);
      if (raw) {
        const parsed = normalizeStoredAgenda(JSON.parse(raw));
        if (parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return createDefaultAgendaAppointments(new Date());
  });

  useEffect(() => {
    try {
      localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(appointments));
    } catch {
      /* ignore */
    }
  }, [appointments]);

  const [view, setView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [monthSelectedDay, setMonthSelectedDay] = useState(() => new Date());

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<AgendaAppointment | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("09:00");
  const [formEnd, setFormEnd] = useState("10:00");
  const [formClient, setFormClient] = useState("");
  const [formStaff, setFormStaff] = useState("");
  const [formStatus, setFormStatus] = useState<AgendaStatus>("pending");

  const openAdd = useCallback(() => {
    const d = new Date();
    setFormTitle("Nueva cita");
    setFormDate(format(d, "yyyy-MM-dd"));
    setFormStart("09:00");
    setFormEnd("10:00");
    setFormClient("");
    setFormStaff("");
    setFormStatus("pending");
    setAddOpen(true);
  }, []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const rangeStart = useMemo(
    () => startOfWeek(weekStart, { weekStartsOn: 1 }),
    [weekStart],
  );
  const weekEndExclusive = useMemo(() => addDays(rangeStart, 7), [rangeStart]);

  const weekAppointments = useMemo(
    () => filterAppointmentsForWeek(appointments, rangeStart, weekEndExclusive),
    [appointments, rangeStart, weekEndExclusive],
  );

  const monthDayAppointments = useMemo(
    () => filterAppointmentsForDay(appointments, monthSelectedDay),
    [appointments, monthSelectedDay],
  );

  const titleWeek = format(weekStart, "MMMM yyyy", { locale: es });
  const titleMonth = format(monthSelectedDay, "MMMM yyyy", { locale: es });

  const goPrevWeek = () => setWeekStart((w) => addDays(w, -7));
  const goNextWeek = () => setWeekStart((w) => addDays(w, 7));

  const handleMonthSelect = (d: Date | undefined) => {
    if (!d) return;
    setMonthSelectedDay(d);
    setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
  };

  const handleViewChange = (next: "week" | "month") => {
    setView(next);
    if (next === "week") {
      setWeekStart(startOfWeek(monthSelectedDay, { weekStartsOn: 1 }));
    }
  };

  const openDetail = (a: AgendaAppointment) => {
    setSelected(a);
    setDetailOpen(true);
  };

  const patchAppointmentStatus = useCallback((id: string, status: AgendaStatus) => {
    setAppointments((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    setSelected((s) => (s && s.id === id ? { ...s, status } : s));
  }, []);

  const saveNew = () => {
    if (!formTitle.trim() || !formDate || !formClient.trim()) return;
    const [y, mo, da] = formDate.split("-").map(Number);
    const [sh, sm] = formStart.split(":").map(Number);
    const [eh, em] = formEnd.split(":").map(Number);
    const s = new Date(y!, mo! - 1, da!, sh ?? 9, sm ?? 0, 0, 0);
    const e = new Date(y!, mo! - 1, da!, eh ?? 10, em ?? 0, 0, 0);
    if (e <= s) return;
    const next: AgendaAppointment = {
      id: newAgendaId(),
      title: formTitle.trim(),
      start: s.toISOString(),
      end: e.toISOString(),
      status: formStatus,
      clientName: formClient.trim(),
      staffName: formStaff.trim() || "—",
    };
    setAppointments((prev) => [...prev, next]);
    setAddOpen(false);
  };

  const gridHeightPx = HOUR_COUNT * PX_PER_HOUR;

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/90 shadow-[0_24px_60px_-18px_rgba(20,28,46,0.14)] ring-1 ring-slate-900/[0.04]">
        <div
          className="h-1.5 w-full bg-gradient-to-r from-brand-gold via-primary to-brand-burgundy"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent blur-3xl"
          aria-hidden
        />
        <div className="relative px-5 pb-6 pt-6 md:px-8 md:pb-7 md:pt-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
              style={{ fontWeight: 600 }}
            >
              CRM
            </p>
            <h1 className="font-heading mt-1.5 text-2xl tracking-tight text-brand-navy sm:text-3xl" style={{ fontWeight: 700 }}>
              Agenda
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600" style={{ fontWeight: 500 }}>
              Citas y seguimientos en vista semanal o mensual. Crea una cita nueva cuando la necesites.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            <div
              className="inline-flex w-full rounded-full border border-slate-200/80 bg-slate-100/90 p-0.5 shadow-inner sm:w-auto"
              role="group"
              aria-label="Vista de calendario"
            >
              <button
                type="button"
                onClick={() => handleViewChange("week")}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all sm:flex-none sm:py-1.5",
                  view === "week"
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
                style={{ fontWeight: view === "week" ? 600 : 500 }}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("month")}
                className={cn(
                  "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all sm:flex-none sm:py-1.5",
                  view === "month"
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
                style={{ fontWeight: view === "month" ? 600 : 500 }}
              >
                Mes
              </button>
            </div>
            <Button
              type="button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
              onClick={openAdd}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva cita
            </Button>
          </div>
          </div>
        </div>
      </header>

      {view === "week" && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-200/80 pb-4 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-slate-200"
            onClick={goPrevWeek}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p
            className="min-w-0 flex-1 text-center font-heading text-lg capitalize text-brand-navy sm:flex-none sm:text-xl"
            style={{ fontWeight: 700 }}
          >
            {titleWeek}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-slate-200"
            onClick={goNextWeek}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {view === "month" && (
        <div className="border-b border-slate-200/80 pb-4">
          <p className="font-heading text-lg capitalize text-brand-navy sm:text-xl" style={{ fontWeight: 700 }}>
            {titleMonth}
          </p>
          <p className="mt-1 text-sm text-slate-500" style={{ fontWeight: 500 }}>
            Selecciona un día en el calendario para ver las citas.
          </p>
        </div>
      )}

      {view === "week" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-[720px]">
            <div className="flex w-[3.25rem] shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 sm:w-14">
              <div className="flex min-h-[4.5rem] items-center justify-center border-b border-slate-200 px-0.5">
                <CalendarIcon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
              </div>
              <div
                className="flex flex-col"
                style={{ height: gridHeightPx }}
                aria-hidden
              >
                {Array.from({ length: HOUR_COUNT }, (_, idx) => START_HOUR + idx).map((h) => (
                  <div
                    key={h}
                    className="flex shrink-0 items-start justify-end border-b border-slate-100 pr-1.5 pt-1.5"
                    style={{ height: PX_PER_HOUR, minHeight: PX_PER_HOUR }}
                  >
                    <span className="select-none text-[11px] leading-none tabular-nums text-slate-500">
                      {String(h).padStart(2, "0")}.00
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-7 border-b border-slate-200">
                {weekDays.map((d) => {
                  const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={d.toISOString()}
                      className="flex min-h-[4.5rem] flex-col justify-center border-l border-slate-100 px-1 py-2 text-center first:border-l-0"
                    >
                      <p
                        className={cn(
                          "text-[11px] font-medium uppercase tracking-wide",
                          isToday ? "text-primary" : "text-slate-500",
                        )}
                        style={{ fontWeight: 600 }}
                      >
                        {format(d, "EEE", { locale: es })}
                      </p>
                      <p
                        className={cn(
                          "text-sm",
                          isToday
                            ? "font-semibold text-primary"
                            : "font-medium text-slate-900",
                        )}
                        style={{ fontWeight: isToday ? 700 : 600 }}
                      >
                        {format(d, "d.MM", { locale: es })}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayEvents = weekAppointments.filter((a) => {
                    const { start } = parseAppointment(a);
                    return format(start, "yyyy-MM-dd") === dayKey;
                  });

                  return (
                    <div
                      key={dayKey}
                      className="relative border-l border-slate-100 first:border-l-0"
                      style={{ height: gridHeightPx }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 flex flex-col"
                        aria-hidden
                      >
                        {Array.from({ length: HOUR_COUNT }, (_, i) => (
                          <div
                            key={i}
                            className="border-b border-slate-100"
                            style={{
                              height: PX_PER_HOUR,
                              backgroundImage:
                                "linear-gradient(to bottom, transparent 49%, rgba(148,163,184,0.12) 50%, transparent 51%)",
                              backgroundSize: "100% 50%",
                            }}
                          />
                        ))}
                      </div>

                      {dayEvents.map((a) => {
                        const layout = layoutBlock(a, day);
                        if (!layout) return null;
                        const styles = AGENDA_STATUS_STYLES[a.status];
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => openDetail(a)}
                            className={cn(
                              "absolute left-0.5 right-0.5 z-[1] overflow-hidden rounded-md border border-slate-200/60 text-left shadow-sm ring-1 transition hover:brightness-[0.98] focus-visible:outline focus-visible:ring-2 focus-visible:ring-primary/40",
                              styles.bg,
                              styles.border,
                              styles.ring,
                            )}
                            style={{
                              top: `${layout.topPct}%`,
                              height: `${layout.heightPct}%`,
                              borderTopWidth: 4,
                            }}
                          >
                            <div className="flex h-full min-h-[36px] flex-col p-1.5">
                              <span className="line-clamp-1 text-[11px] font-semibold leading-tight text-slate-900">
                                {a.clientName.trim() || "Sin cliente"}
                              </span>
                              <span className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-600">
                                {a.title}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <Calendar
              mode="single"
              selected={monthSelectedDay}
              onSelect={(d) => handleMonthSelect(d)}
              locale={es}
              weekStartsOn={1}
              className="w-full rounded-lg"
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3
              className="font-heading mb-4 text-lg text-brand-navy capitalize"
              style={{ fontWeight: 600 }}
            >
              {format(monthSelectedDay, "EEEE d MMMM", { locale: es })}
            </h3>
            {monthDayAppointments.length === 0 ? (
              <p className="text-sm text-slate-500" style={{ fontWeight: 500 }}>
                No hay citas este día.
              </p>
            ) : (
              <ul className="space-y-3">
                {monthDayAppointments.map((a) => {
                  const { start, end } = parseAppointment(a);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => openDetail(a)}
                        className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-left transition hover:bg-slate-100/80"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900" style={{ fontWeight: 600 }}>
                            {a.clientName.trim() || "Sin cliente"}
                          </p>
                          <p className="text-xs text-slate-600" style={{ fontWeight: 500 }}>
                            {a.title} · {format(start, "HH:mm")} – {format(end, "HH:mm")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0", statusBadgeClassName(a.status))}
                        >
                          {AGENDA_STATUS_LABEL[a.status]}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="text-left font-heading text-lg text-brand-navy">
                  {selected.clientName}
                </DialogTitle>
                <DialogDescription className="text-left text-sm text-slate-600">
                  {selected.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="space-y-2">
                  <Label htmlFor="ag-detail-status">Estado</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) =>
                      patchAppointmentStatus(selected.id, v as AgendaStatus)
                    }
                  >
                    <SelectTrigger id="ag-detail-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(AGENDA_STATUS_LABEL) as AgendaStatus[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {AGENDA_STATUS_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 text-slate-700">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span style={{ fontWeight: 500 }}>
                    {format(parseAppointment(selected).start, "d MMM yyyy", {
                      locale: es,
                    })}{" "}
                    {format(parseAppointment(selected).start, "HH.mm")} –{" "}
                    {format(parseAppointment(selected).end, "HH.mm")}
                  </span>
                </div>
                <div className="flex gap-2 text-slate-700">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span style={{ fontWeight: 500 }}>{selected.staffName}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="font-heading text-brand-navy">Nueva cita</DialogTitle>
            <DialogDescription>
              Completa los datos. La cita aparecerá en la agenda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ag-title">Título / tipo</Label>
              <Input
                id="ag-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej. Visita propiedad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-date">Fecha</Label>
              <Input
                id="ag-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ag-start">Inicio</Label>
                <Input
                  id="ag-start"
                  type="time"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ag-end">Fin</Label>
                <Input
                  id="ag-end"
                  type="time"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-client">Cliente</Label>
              <Input
                id="ag-client"
                value={formClient}
                onChange={(e) => setFormClient(e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-staff">Asesor</Label>
              <Input
                id="ag-staff"
                value={formStaff}
                onChange={(e) => setFormStaff(e.target.value)}
                placeholder="Nombre del asesor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ag-status">Estado</Label>
              <Select
                value={formStatus}
                onValueChange={(v) => setFormStatus(v as AgendaStatus)}
              >
                <SelectTrigger id="ag-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AGENDA_STATUS_LABEL) as AgendaStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {AGENDA_STATUS_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={saveNew} className="bg-primary text-primary-foreground">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
