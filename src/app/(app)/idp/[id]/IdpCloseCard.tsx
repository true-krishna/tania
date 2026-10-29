"use client";

import { useMutation } from "@apollo/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { useToast } from "@/components/Toast";
import { CloseIdpDocument, IdpDocument } from "@/generated/graphql";
import { errorText } from "@/lib/errors";
import type { IdpDetail } from "./types";

export function IdpCloseCard({ idp, managing }: { idp: IdpDetail; managing: boolean }) {
  const [closeIdp, { loading }] = useMutation(CloseIdpDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id: idp.id } }],
  });
  const { pushToast } = useToast();

  async function handleClose() {
    try {
      await closeIdp({ variables: { id: idp.id } });
      pushToast("success", "IDP ditutup.");
    } catch (err) {
      pushToast("error", errorText(err, "Gagal menutup IDP."));
    }
  }

  if (idp.status === "COMPLETED") {
    return (
      <Chip size="large" variant="success">
        IDP selesai.
      </Chip>
    );
  }

  if (!managing) return null;

  return (
    <Card className="flex max-w-3xl flex-col gap-3 border-amber-200 bg-amber-50">
      <p className="text-sm text-amber-800">
        Tutup IDP ini saat success indicators sudah dievaluasi pada review (status →{" "}
        <strong>selesai</strong>).
      </p>
      <div>
        <Button
          className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
          disabled={loading}
          onClick={handleClose}
          type="button"
          variant="secondary"
        >
          Tutup IDP
        </Button>
      </div>
    </Card>
  );
}
