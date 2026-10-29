export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-tp-lg border border-tp-line bg-tp-surface p-5">
      <p className="tp-empty">
        <strong>{message}</strong>
      </p>
    </div>
  );
}
