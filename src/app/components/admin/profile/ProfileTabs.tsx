import { PROFILE_TABS, type ProfileTabId } from "./profileTypes";
import { tabButtonClass, tabListClass } from "./profileUi";

type Props = {
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
};

export function ProfileTabs({ activeTab, onTabChange }: Props) {
  return (
    <div
      className={tabListClass}
      role="tablist"
      aria-label="Secciones del perfil"
    >
      {PROFILE_TABS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`profile-tab-${id}`}
          aria-selected={activeTab === id}
          aria-controls={`profile-panel-${id}`}
          onClick={() => onTabChange(id)}
          className={tabButtonClass(activeTab === id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
