// PUBLIC
export const HOME = "/";
export const LOGIN = "/login";
export const TERMS_CONDITIONS = "/terms-and-conditions";
export const PRIVACY_POLICY = "/privacy-and-policy";
export const REDIRECT = "/redirect";
export const NOT_FOUND = "/404";
export const UNAUTHORIZED = "/403";

// DASHBOARD
export const DASHBOARD = "/dashboard";
export const ACTIVITIES = "/activities";
export const WORKLOAD = "/workload";
export const PROFILE = "/profile";

// EMPLOYEES
export const EMPLOYEES = "/employees";
export const EMPLOYEE_NEW = "/employees/new";
export const EMPLOYEE_DETAIL = (id: string) => `/employees/${id}`;
export const EMPLOYEE_EDIT = (id: string) => `/employees/${id}/edit`;

// CONTRACTS
export const CONTRACTS = "/contracts";
export const CONTRACT_NEW = "/contracts/new";
export const CONTRACT_DETAIL = (id: string) => `/contracts/${id}`;
export const CONTRACT_RENEW = (id: string) => `/contracts/${id}/renew`;

// ASSIGNMENTS
export const TALENT_ASSIGNMENT = "/assignments";
export const ASSIGNMENT_NEW = "/assignments/new";
export const ASSIGNMENT_DETAIL = (id: string) => `/assignments/${id}`;

// ENTRA
export const ENTRA = "/entra";

// IDP
export const IDP = "/idp";
export const IDP_NEW = "/idp/new";
export const IDP_MY = "/idp/my";
export const IDP_DETAIL = (id: string) => `/idp/${id}`;

// CV
export const CV = "/cv";

// EVALUATIONS
export const EVALUATIONS = "/evaluations";
export const EVALUATIONS_MY = "/evaluations/my";
export const EVALUATION_PERIODS = "/evaluations/periods";
export const EVALUATION_PERIOD_NEW = "/evaluations/periods/new";
export const EVALUATION_TEMPLATES = "/evaluations/templates";
export const EVALUATION_TEMPLATE_NEW = "/evaluations/templates/new";
export const EVALUATION_DETAIL = (periodId: string, employeeId: string) =>
  `/evaluations/${periodId}/${employeeId}`;

// ACCOUNTS
export const ACCOUNTS = "/accounts";

// AUDIT
export const AUDIT = "/audit";

// MASTER DATA
export const MASTER_DATA_UNITS = "/master-data/units";
export const MASTER_DATA_CHAPTERS = "/master-data/chapters";
export const MASTER_DATA_JOB_ROLES = "/master-data/job-roles";
export const MASTER_DATA_PROJECTS = "/master-data/projects";

// REPORTS
export const REPORT_TALENT = "/reports/talent";
