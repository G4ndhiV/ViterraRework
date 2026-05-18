export function ProfileClearLink({
  visible,
  saving,
  onClick,
}: {
  visible: boolean;
  saving: boolean;
  onClick: () => void;
}) {
  if (!visible) return <span className="inline-block h-5 w-14 shrink-0" aria-hidden />;
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className="shrink-0 text-[11px] font-medium text-slate-500 underline-offset-2 transition hover:text-primary hover:underline disabled:opacity-50"
    >
      Quitar
    </button>
  );
}
