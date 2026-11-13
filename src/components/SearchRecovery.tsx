type Props = { queries: string[]; onSelect: (query: string) => void };

export function SearchRecovery({ queries, onSelect }: Props) {
  if (!queries.length) return null;
  return (
    <section aria-label="הצעות לחיפוש אחר" className="mt-8 text-center">
      <h3 className="text-base text-[#dfc47d] mb-2">אפשר לנסות גם</h3>
      <p className="text-sm text-[#bdc8d9] mb-4">נושאים מתוך התוכן הקיים בספרייה</p>
      <div className="flex flex-wrap justify-center gap-2">
        {queries.map(query => (
          <button key={query} type="button" onClick={() => onSelect(query)}
            className="px-4 py-2 rounded-full border border-white/25 text-base text-[#f5f1e9] hover:border-[#b79043] hover:text-[#dfc47d] min-h-11 cursor-pointer">
            <bdi dir="auto">{query}</bdi>
          </button>
        ))}
      </div>
    </section>
  );
}
