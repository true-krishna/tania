export function EmptyNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-board p-8 text-center text-sm text-zinc-500 shadow-sm">
      {message}
    </div>
  );
}
