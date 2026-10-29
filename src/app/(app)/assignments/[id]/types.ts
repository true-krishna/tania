import type { AssignmentsQuery } from "@/generated/graphql";

export type AssignmentNode = AssignmentsQuery["assignments"]["edges"][number]["node"];
