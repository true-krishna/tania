/**
 * Static datasets for the master-data feature (Admin) — US6.
 *
 * These are the "static data" placeholders the owner asked for while the
 * backend waves are unserved. Shape matches the contract-generated types
 * (`src/generated/graphql`); the feature hook (`useMasterData.ts`) is the seam
 * to swap onto the live GraphQL API later.
 */
import type {
  Chapter,
  JobRole,
  Project,
  Unit,
} from "@/generated/graphql/types";

export const units: Unit[] = [
  {
    __typename: "Unit",
    id: "unit-001",
    name: "Digital Business & Technology",
    isActive: true,
    projects: [],
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Unit",
    id: "unit-002",
    name: "Enterprise Network",
    isActive: true,
    projects: [],
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Unit",
    id: "unit-003",
    name: "Customer Experience",
    isActive: true,
    projects: [],
    createdAt: "2025-02-02T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Unit",
    id: "unit-004",
    name: "Enabler & Corporate Shared Services",
    isActive: false,
    projects: [],
    createdAt: "2024-11-30T08:00:00Z",
    updatedAt: "2025-03-15T08:00:00Z",
  },
];

export const jobRoles: JobRole[] = [
  {
    __typename: "JobRole",
    id: "jr-001",
    name: "Software Engineer",
    isActive: true,
    chapter: null,
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "JobRole",
    id: "jr-002",
    name: "DevOps Engineer",
    isActive: true,
    chapter: null,
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "JobRole",
    id: "jr-003",
    name: "Network Engineer",
    isActive: true,
    chapter: null,
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "JobRole",
    id: "jr-004",
    name: "Product Designer",
    isActive: true,
    chapter: null,
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "JobRole",
    id: "jr-005",
    name: "Digital Marketing Analyst",
    isActive: false,
    chapter: null,
    createdAt: "2024-12-05T08:00:00Z",
    updatedAt: "2025-03-10T08:00:00Z",
  },
];

export const chapters: Chapter[] = [
  {
    __typename: "Chapter",
    id: "ch-001",
    name: "Software Engineering Chapter",
    isActive: true,
    jobRoles: [],
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Chapter",
    id: "ch-002",
    name: "Infrastructure Chapter",
    isActive: true,
    jobRoles: [],
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Chapter",
    id: "ch-003",
    name: "Experience & Design Chapter",
    isActive: true,
    jobRoles: [],
    createdAt: "2025-01-12T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Chapter",
    id: "ch-004",
    name: "Marketing Chapter",
    isActive: false,
    jobRoles: [],
    createdAt: "2024-12-02T08:00:00Z",
    updatedAt: "2025-03-11T08:00:00Z",
  },
];

export const projects: Project[] = [
  {
    __typename: "Project",
    id: "prj-001",
    name: "Tania Dashboard",
    isActive: true,
    unit: units[0],
    createdAt: "2025-02-01T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Project",
    id: "prj-002",
    name: "Network Modernization",
    isActive: true,
    unit: units[1],
    createdAt: "2025-02-15T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Project",
    id: "prj-003",
    name: "MyTelkomsel Revamp",
    isActive: true,
    unit: units[2],
    createdAt: "2025-03-01T08:00:00Z",
    updatedAt: "2025-06-20T08:00:00Z",
  },
  {
    __typename: "Project",
    id: "prj-004",
    name: "Legacy CRM Decommission",
    isActive: false,
    unit: units[3],
    createdAt: "2024-10-10T08:00:00Z",
    updatedAt: "2025-03-14T08:00:00Z",
  },
];

/** Back-fill the circular references once the datasets are declared. */
function linkCircularReferences() {
  chapters[0].jobRoles = [jobRoles[0], jobRoles[1]];
  chapters[1].jobRoles = [jobRoles[2]];
  chapters[2].jobRoles = [jobRoles[3]];
  chapters[3].jobRoles = [jobRoles[4]];
  jobRoles[0].chapter = chapters[0];
  jobRoles[1].chapter = chapters[0];
  jobRoles[2].chapter = chapters[1];
  jobRoles[3].chapter = chapters[2];
  jobRoles[4].chapter = chapters[3];
  units[0].projects = [projects[0]];
  units[1].projects = [projects[1]];
  units[2].projects = [projects[2]];
  units[3].projects = [projects[3]];
}

linkCircularReferences();
