import { Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { profileCardFooter } from "./profileUi";

type Props = {
  saving: boolean;
  dirty: boolean;
  onSave: () => void;
};

export function ProfileStickyActions({ saving, dirty, onSave }: Props) {
  return (
    <div className={profileCardFooter}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600" aria-live="polite">
          {dirty ? (
            <span className="font-medium text-amber-800">Tienes cambios sin guardar</span>
          ) : (
            <span className="text-slate-500">Todo al día</span>
          )}
        </p>
        <Button
          type="button"
          size="sm"
          className="bg-primary shadow-md shadow-primary/20 hover:bg-primary/90"
          disabled={saving}
          onClick={onSave}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
