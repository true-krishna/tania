export interface ProfileView {
  userId: number;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  grade: string;
  squad: string;
  location: string;
  status: string;
  managerId: number | null;
  managerName: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: string;
  grade?: string;
  squad?: string;
  location?: string;
  status?: string;
  managerId?: number | null;
}

export const PROFILE_STATUSES = [
  "Active",
  "Probation",
  "On Leave",
  "Inactive",
] as const;

export const PROFILE_GRADES = [
  "Intern",
  "Junior",
  "Middle",
  "Senior",
  "Lead",
  "Principal",
] as const;

export const ROLES = [
  "Member",
  "Software Engineer",
  "QA Engineer",
  "Product Designer",
  "Data Analyst",
  "Engineering Manager",
];

export const SQUADS = ["Unassigned", "Core", "Growth", "Platform", "Design"];

export const LOCATIONS = ["Remote", "Jakarta HQ", "Bandung", "Surabaya"];

export const STATUS_STYLES: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-800",
  Probation: "bg-amber-100 text-amber-800",
  "On Leave": "bg-sky-100 text-sky-800",
  Inactive: "bg-zinc-200 text-zinc-700",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
