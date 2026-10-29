import type { IdpQuery } from "@/generated/graphql";

export type IdpDetail = NonNullable<IdpQuery["idp"]>;
