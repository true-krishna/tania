export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-tp-lg bg-tp-tint-peach px-5 py-4 text-sm text-tp-ink-peach"
      role="alert"
    >
      {message}
    </div>
  );
}
