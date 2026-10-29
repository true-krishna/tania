import * as React from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/cn";

type InputDropzoneProps = {
  accept?: { [mimeType: string]: string[] };
  ariaLabel: string;
  disabled?: boolean;
  hint?: React.ReactNode;
  onFileSelect: (file: File | null) => void;
  selectedName?: string | null;
};

export function InputDropzone({
  accept,
  ariaLabel,
  disabled = false,
  hint,
  onFileSelect,
  selectedName,
}: InputDropzoneProps) {
  const onDrop = React.useCallback(
    (accepted: readonly File[], rejected: readonly FileRejection[]) => {
      onFileSelect(accepted[0] ?? rejected[0]?.file ?? null);
    },
    [onFileSelect],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    disabled,
    multiple: false,
    noDragEventsBubbling: true,
    onDrop,
  });
  return (
    <div
      {...getRootProps({
        className: cn(
          "cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors",
          isDragActive
            ? "border-tp-ink-info bg-tp-tint-info"
            : "border-tp-line bg-tp-bg hover:border-tp-ink-info",
          disabled && "cursor-default opacity-60",
        ),
      })}
    >
      <input {...getInputProps({ "aria-label": ariaLabel })} />
      {selectedName ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-tp-line bg-tp-surface px-3 py-1.5 text-sm text-tp-text">
          {selectedName}
          <button
            aria-label="Hapus berkas terpilih"
            className="text-tp-muted hover:text-tp-ink-peach"
            onClick={(event) => {
              event.stopPropagation();
              onFileSelect(null);
            }}
            type="button"
          >
            ×
          </button>
        </span>
      ) : (
        <p className="text-tp-muted">
          {hint ?? (
            <>
              Tarik dan letakkan berkas di sini, atau{" "}
              <span className="font-medium text-tp-ink-info underline">pilih berkas</span>.
            </>
          )}
        </p>
      )}
    </div>
  );
}
