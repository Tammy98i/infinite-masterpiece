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

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm min-h-11 text-right transition-colors duration-200 cursor-pointer ${
        active
          ? 'bg-[#C8A24C]/15 text-[#F7E7B5] border border-[#C8A24C]/40'
          : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
      <span className="font-light flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="text-[10px] tracking-wide text-[#C8A24C] border border-[#C8A24C]/40 rounded-full px-2 py-0.5 shrink-0">
          {item.badge}
        </span>
      ) : !item.ready ? (
        <span className="text-[10px] text-white/30 shrink-0">בקרוב</span>
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
      <div className="p-5 border-b border-white/10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[#C8A24C] mb-2">ניהול</p>
        <h2 className="text-xl font-light">לוח בקרה</h2>
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
            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2.5 ps-9 pe-3 text-sm text-white placeholder:text-white/35 focus:border-[#C8A24C] focus:outline-none min-h-11"
          />
        </label>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="grid gap-2">
          {filteredGroups.map((group) => {
            const open = query ? true : openGroups[group.id] ?? group.id === activeGroupId;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40 hover:text-white/60 cursor-pointer"
                >
                  <span>{group.label}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open ? (
                  <div className="grid gap-0.5 mt-0.5">
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
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={onExit}
          className="w-full px-4 py-2.5 rounded-full border border-white/15 text-sm min-h-11 cursor-pointer hover:border-white/40 transition-colors"
        >
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
    <div className="lg:hidden border-b border-white/10 bg-[#080808] p-3 grid gap-1 max-h-[50vh] overflow-y-auto">
      {items.map((item) => (
        <Fragment key={item.id}>
          <NavButton item={item} active={tab === item.id} onClick={() => onNavigate(item.id)} />
        </Fragment>
      ))}
    </div>
  );
}
