export function CvEmptyValue({ reason }: { reason: string }) {
  return (
    <p className="tp-empty">
      <strong>—</strong>
      {reason}
    </p>
  );
}
