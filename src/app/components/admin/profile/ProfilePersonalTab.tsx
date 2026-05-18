import type { Dispatch, SetStateAction } from "react";
import { Briefcase, Phone, Smartphone } from "lucide-react";
import { Label } from "../../ui/label";
import { cn } from "../../ui/utils";
import type { TokkoUserProfilePatch } from "../../../lib/supabaseTokkoUsers";
import { ProfileClearLink } from "./ProfileClearLink";
import type { ProfileDraft } from "./profileTypes";
import { inputClass, profileSectionTitle, readClass } from "./profileUi";

type Props = {
  draft: ProfileDraft;
  setDraft: Dispatch<SetStateAction<ProfileDraft>>;
  saving: boolean;
  canEditPosition: boolean;
  onClearField: (key: keyof TokkoUserProfilePatch) => void;
};

export function ProfilePersonalTab({
  draft,
  setDraft,
  saving,
  canEditPosition,
  onClearField,
}: Props) {
  return (
    <div
      id="profile-panel-personal"
      role="tabpanel"
      aria-labelledby="profile-tab-personal"
      className="space-y-8"
    >
      <section>
        <h3 className={profileSectionTitle}>Datos generales</h3>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-600">Nombre completo</Label>
          <input
            className={inputClass}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </div>
      </section>

      <section>
        <h3 className={profileSectionTitle}>Contacto</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-slate-600">
                <Phone className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                Teléfono
              </Label>
              <ProfileClearLink visible={Boolean(draft.phone)} saving={saving} onClick={() => onClearField("phone")} />
            </div>
            <input
              className={inputClass}
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-slate-600">
                <Smartphone className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                Celular
              </Label>
              <ProfileClearLink
                visible={Boolean(draft.cellphone)}
                saving={saving}
                onClick={() => onClearField("cellphone")}
              />
            </div>
            <input
              className={inputClass}
              value={draft.cellphone}
              onChange={(e) => setDraft((d) => ({ ...d, cellphone: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-slate-600">
                <Briefcase className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                Puesto
              </Label>
              {canEditPosition ? (
                <ProfileClearLink
                  visible={Boolean(draft.position.trim())}
                  saving={saving}
                  onClick={() => onClearField("position")}
                />
              ) : null}
            </div>
            {canEditPosition ? (
              <input
                className={inputClass}
                value={draft.position}
                onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
                placeholder="Ej. Asesor inmobiliario"
              />
            ) : (
              <>
                <p className={cn(readClass, !draft.position.trim() && "text-slate-400")}>
                  {draft.position.trim() || "Sin puesto asignado"}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Solo administradores y líderes de grupo pueden editar el puesto.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
