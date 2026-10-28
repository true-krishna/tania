import * as React from "react";
import Link from "next/link";
import { IconLockAccessOff } from "@tabler/icons-react";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { DASHBOARD } from "@/lib/constants/routes";

interface AccessDeniedProps {
  manage?: boolean;
  canRead?: boolean;
}

export function AccessDenied({ manage = false, canRead = false }: AccessDeniedProps) {
  const readOnly = manage && canRead;

  return (
    <section
      aria-labelledby="access-denied-title"
      className="flex min-h-[60vh] items-center justify-center"
      role="alert"
    >
      <Card className="w-full max-w-md text-center" padded={false}>
        <div className="px-8 py-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tp-tint-peach text-tp-ink-peach">
            <IconLockAccessOff aria-hidden className="h-7 w-7" />
          </span>
          <Chip className="mt-4" size="small" variant="danger">
            {readOnly ? "Akses terbatas" : "Akses ditolak"}
          </Chip>
          <h1 className="tp-h2 mt-3" id="access-denied-title">
            {readOnly
              ? "Halaman ini hanya untuk pengelolaan"
              : "Anda tidak memiliki akses ke halaman ini"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tp-muted">
            {readOnly
              ? "Peran Anda dapat melihat data ini, tetapi tidak dapat mengubahnya. Hubungi Admin bila Anda memerlukan akses pengelolaan."
              : "Peran Anda saat ini tidak memiliki izin untuk membuka halaman ini. Hubungi Admin bila akses diperlukan."}
          </p>
          <Link className="tp-btn tp-btn--primary mt-6" href={DASHBOARD}>
            Buka dashboard
          </Link>
        </div>
      </Card>
    </section>
  );
}
