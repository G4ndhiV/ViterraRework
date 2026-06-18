import { Shield } from "lucide-react";
import { Label } from "../../ui/label";
import { profilePermissionCards } from "./profileTypes";
import { readClass } from "./profileUi";

type Props = {
  roleLabel: string;
  enabledPermissions: string[];
};

export function ProfileAccessTab({ roleLabel, enabledPermissions }: Props) {
  const enabledCards = profilePermissionCards.filter(({ value }) =>
    enabledPermissions.includes(value),
  );

  return (
    <div
      id="profile-panel-access"
      role="tabpanel"
      aria-labelledby="profile-tab-access"
      className="space-y-6"
    >
      <div className="max-w-md space-y-1.5">
        <Label className="text-xs font-medium text-slate-600">
          <Shield className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
          Rol en el CRM
        </Label>
        <p className={readClass}>{roleLabel}</p>
        <p className="text-[11px] text-slate-500">El rol lo asigna un administrador; no se edita desde aquí.</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-800">Módulos habilitados</p>
        {enabledCards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
            Sin módulos asignados
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {enabledCards.map(({ value, label, description, Icon }) => (
              <li
                key={value}
                className="flex gap-3 rounded-xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-sm ring-1 ring-slate-900/[0.03]"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-navy/10 bg-brand-navy/[0.06] text-brand-navy">
                  <Icon className="h-5 w-5" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
