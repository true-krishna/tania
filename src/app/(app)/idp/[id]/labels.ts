import type { DevelopmentActionStatus, DevelopmentMethod } from "@/generated/graphql/types";

export const ACTION_STATUS_LABEL: Record<DevelopmentActionStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export const METHOD_LABEL: Record<DevelopmentMethod, string> = {
  PROJECT_ASSIGNMENT: "Penugasan project",
  MENTORING: "Mentoring",
  TRAINING: "Training",
  CROSS_FUNCTIONAL_EXPOSURE: "Exposure lintas fungsi",
  SELF_STUDY: "Belajar mandiri",
};
