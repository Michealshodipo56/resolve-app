export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 py-12 text-ink-faint"
      role="status"
      aria-live="polite"
    >
      <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-ink-line" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border border-dashed border-ink-line px-6 py-14 text-center">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{description}</p>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="border border-danger/30 bg-danger-soft px-6 py-8"
      role="alert"
    >
      <h2 className="font-serif text-xl text-danger">{title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
