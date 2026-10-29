import { Chip } from "@/components/Chip";
import { roleLabelFor, type RoleOption } from "@/features/accounts/roles";

export function RoleBadge({
  roleName,
  options,
}: {
  roleName: string;
  options: readonly RoleOption[];
}) {
  return (
    <Chip size="small" variant="info">
      {roleLabelFor(roleName, options)}
    </Chip>
  );
}
