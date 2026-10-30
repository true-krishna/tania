import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { AccountSecurityRow } from "./AccountSecurityRow";

export function AccountSecurityCard({ email }: { email: string | undefined }) {
  return (
    <Card className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="tp-h3">Akun & keamanan</h2>
        <Chip size="small" variant="neutral">
          Hanya profil sendiri
        </Chip>
      </div>
      <div className="mt-3 flex flex-col">
        <AccountSecurityRow label="Email akun" reason="Sesi tidak tersedia." value={email} />
        <AccountSecurityRow label="Kata sandi" reason="Menunggu data keamanan akun (TAN-387)." />
        <AccountSecurityRow
          label="Autentikasi dua faktor"
          reason="Menunggu data keamanan akun (TAN-387)."
        />
        <AccountSecurityRow
          label="Perangkat & sesi"
          reason="Menunggu data sesi perangkat (TAN-387)."
        />
      </div>
    </Card>
  );
}
