export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Carregando">
      <div className="h-6 w-48 rounded-lg bg-surface-2" />
      <div className="h-9 w-full max-w-md rounded-lg bg-surface-2" />
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="h-9 bg-surface-2" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-border/60 px-4 py-3">
            <div className="size-7 rounded-full bg-surface-2" />
            <div className="h-3 w-1/4 rounded bg-surface-2" />
            <div className="h-3 w-1/6 rounded bg-surface-2" />
            <div className="ml-auto h-3 w-16 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
