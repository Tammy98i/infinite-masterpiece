import { SiteLogo } from './SiteLogo';

export function BridgeShell() {
  return (
    <div className="min-h-screen bg-[#010308] text-white">
      <header className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <SiteLogo alt="" className="h-8" />
          <span className="text-white/30 text-sm">ספרייה</span>
        </div>
        <span className="text-[12px] text-white/40">טוען…</span>
      </header>
      <div className="h-0.5 w-full bg-white/[0.04]" role="progressbar" aria-label="טוען ספרייה" aria-busy="true">
        <div className="h-full w-2/5 bg-[#C8A24C] motion-safe:animate-pulse" />
      </div>
      <div className="max-w-3xl mx-auto px-6 pt-24 text-right">
        <p className="text-white/50 font-light text-lg">טוען את הספרייה האינסופית</p>
        <p className="text-white/30 text-sm mt-2 font-light">המעטפת נשארת. רק התוכן מתחלף.</p>
      </div>
    </div>
  );
}
