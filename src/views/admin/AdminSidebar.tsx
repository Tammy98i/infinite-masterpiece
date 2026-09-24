import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { NavGroup, NavItem, Tab } from './adminNav';

type AdminSidebarProps = {
  groups: NavGroup[];
  tab: Tab;
  onNavigate: (id: Tab) => void;
  userName: string;
  userEmail?: string;
  onExit: () => void;
};

function AsideVeils() {
  return (
    <>
      <span className="crm-desk-aside-veil crm-desk-aside-veil-a" aria-hidden />
      <span className="crm-desk-aside-veil crm-desk-aside-veil-b" aria-hidden />
      <span className="crm-desk-aside-veil crm-desk-aside-veil-c" aria-hidden />
      <span className="crm-desk-aside-veil crm-desk-aside-veil-d" aria-hidden />
    </>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`crm-desk-nav-item ${active ? 'is-active' : ''}`}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
      <span className="flex-1 min-w-0 text-start">
        <span className="block truncate">{item.label}</span>
        {item.why ? <span className="crm-desk-nav-why block truncate">{item.why}</span> : null}
      </span>
      {item.badge ? (
        <span className="crm-desk-nav-badge">{item.badge}</span>
      ) : !item.ready ? (
        <span className="crm-desk-nav-badge">בקרוב</span>
      ) : null}
    </button>
  );
}

export function AdminSidebar({ groups, tab, onNavigate, userName, userEmail, onExit }: AdminSidebarProps) {
  const [query, setQuery] = useState('');
  const activeGroupId = useMemo(() => {
    for (const group of groups) {
      if (group.items.some((item) => item.id === tab)) return group.id;
    }
    return groups[0]?.id || '';
  }, [groups, tab]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const group of groups) initial[group.id] = group.id === activeGroupId;
    return initial;
  });

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.id.includes(q) ||
            (item.why || '').toLowerCase().includes(q) ||
            (item.keywords || '').toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <AsideVeils />
      <div className="p-5 border-b border-white/10">
        <p className="text-[11px] text-white/45 mb-2">ניהול</p>
        <h2 className="crm-rail-title text-xl">לוח בקרה</h2>
        <p className="text-xs text-white/45 mt-2 font-light truncate">{userName}</p>
        {userEmail ? (
          <p className="text-[11px] text-white/30 mt-1 truncate" dir="ltr">
            {userEmail}
          </p>
        ) : null}
      </div>

      <div className="p-3 border-b border-white/10">
        <label className="relative block">
          <span className="sr-only">חיפוש בתפריט</span>
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/35 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש..."
            className="crm-desk-nav-search"
          />
        </label>
      </div>

      <nav className="crm-desk-nav flex-1 p-3 overflow-y-auto">
        {filteredGroups.map((group) => {
          const open = query ? true : openGroups[group.id] ?? group.id === activeGroupId;
          return (
            <div key={group.id}>
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="crm-desk-nav-group-label"
              >
                <span>{group.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open ? (
                <div className="grid gap-0.5">
                  {group.items.map((item) => (
                    <Fragment key={item.id}>
                      <NavButton
                        item={item}
                        active={tab === item.id}
                        onClick={() => onNavigate(item.id)}
                      />
                    </Fragment>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button type="button" onClick={onExit} className="crm-desk-nav-exit">
          לספרייה
        </button>
      </div>
    </>
  );
}

export function AdminMobileNav({
  groups,
  tab,
  onNavigate,
}: {
  groups: NavGroup[];
  tab: Tab;
  onNavigate: (id: Tab) => void;
}) {
  const items = groups.flatMap((g) => g.items);
  return (
    <div className="crm-desk-aside lg:hidden relative border-b border-white/10 p-3 max-h-[50vh] overflow-y-auto">
      <AsideVeils />
      <nav className="crm-desk-nav">
        {items.map((item) => (
          <Fragment key={item.id}>
            <NavButton item={item} active={tab === item.id} onClick={() => onNavigate(item.id)} />
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
