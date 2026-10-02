/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** Application access roles (fixed set, FR-15). */
export type AccessRole =
  | 'ADMIN'
  | 'CHAPTER'
  | 'OPERATION'
  | 'TALENT';

export type AccountStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type AddIdpReviewInput = {
  followUp?: string | null | undefined;
  reviewDate: string;
  summary: string;
};

export type AssignmentFilter = {
  employeeId?: string | number | null | undefined;
  projectId?: string | number | null | undefined;
  status?: AssignmentStatus | null | undefined;
};

export type AssignmentStatus =
  | 'ACTIVE'
  | 'COMPLETED';

export type CreateAssignmentInput = {
  employeeId: string | number;
  jobRoleId: string | number;
  periodEnd?: string | null | undefined;
  periodStart: string;
  projectId: string | number;
};

export type CreateDevelopmentActionInput = {
  description: string;
  dueDate?: string | null | undefined;
  method: DevelopmentMethod;
};

export type CreateEmployeeInput = {
  email: string;
  employeeCode: string;
  fullName: string;
  jobRoleId: string | number;
  joinedAt: string;
  status?: EmployeeStatus | null | undefined;
  unitId: string | number;
};

export type CreateEvaluationPeriodInput = {
  endDate: string;
  name: string;
  startDate: string;
  templateId: string | number;
};

export type CreateEvaluationTemplateInput = {
  criteria: Array<EvaluationCriterionInput>;
  name: string;
};

export type EmployeeFilter = {
  assignableOnly?: boolean | null | undefined;
  jobRoleId?: string | number | null | undefined;
  /** nama / email / employeeCode */
  search?: string | null | undefined;
  status?: EmployeeStatus | null | undefined;
  unitId?: string | number | null | undefined;
};

export type EmployeeStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type EvaluationAnswerInput = {
  criterionId: string | number;
  valueBool?: boolean | null | undefined;
  valueNumeric?: number | null | undefined;
  valueText?: string | null | undefined;
};

export type EvaluationAnswerType =
  | 'FREE_TEXT'
  | 'SCALE_1_5'
  | 'SCALE_1_10'
  | 'YES_NO';

export type EvaluationCriterionInput = {
  answerType: EvaluationAnswerType;
  label: string;
  position: number;
};

export type EvaluationFillState =
  | 'EVALUATED'
  | 'NOT_EVALUATED';

export type EvaluationPeriodState =
  /** Melewati tanggal selesai — hanya baca. */
  | 'CLOSED'
  /** Tanggal saat ini berada dalam rentang periode (FR-25). */
  | 'RUNNING'
  /** Tanggal mulai belum tiba. */
  | 'SCHEDULED';

export type LocalLoginInput = {
  email: string;
  password: string;
};

export type PerformanceEvaluationStatus =
  | 'DRAFT'
  | 'SUBMITTED';

export type UpsertPerformanceEvaluationInput = {
  answers?: Array<EvaluationAnswerInput> | null | undefined;
  developmentNotes?: string | null | undefined;
  employeeId: string | number;
  periodId: string | number;
  summaryAchievement?: string | null | undefined;
};

export type UsersQueryVariables = Exact<{
  search?: string | null | undefined;
  accessRole?: AccessRole | null | undefined;
  status?: AccountStatus | null | undefined;
}>;


export type UsersQuery = { users: Array<{ id: string, fullName: string, email: string, accessRole: AccessRole, status: AccountStatus }> };

export type AssignableTalentsQueryVariables = Exact<{
  search?: string | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AssignableTalentsQuery = { assignableTalents: { edges: Array<{ node: { id: string, fullName: string, employeeCode: string } }> } };

export type AssignmentsQueryVariables = Exact<{
  filter?: AssignmentFilter | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AssignmentsQuery = { assignments: { totalCount: number, edges: Array<{ node: { id: string, status: AssignmentStatus, periodStart: string, periodEnd: string | null, talent: { id: string, fullName: string, employeeCode: string }, project: { id: string, name: string }, jobRole: { id: string, name: string } } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type CreateAssignmentMutationVariables = Exact<{
  input: CreateAssignmentInput;
}>;


export type CreateAssignmentMutation = { createAssignment: { id: string, status: AssignmentStatus } };

export type EndAssignmentMutationVariables = Exact<{
  id: string | number;
  periodEnd: string;
}>;


export type EndAssignmentMutation = { endAssignment: { id: string, status: AssignmentStatus, periodEnd: string | null } };

export type LoginMutationVariables = Exact<{
  input: LocalLoginInput;
}>;


export type LoginMutation = { login: { accessToken: string, accessTokenExpiresAt: string, refreshToken: string, refreshTokenExpiresAt: string, user: { id: string, email: string, fullName: string, accessRole: AccessRole, status: AccountStatus } } };

export type LogoutMutationVariables = Exact<{
  refreshToken?: string | null | undefined;
}>;


export type LogoutMutation = { logout: boolean };

export type RefreshSessionMutationVariables = Exact<{
  refreshToken: string;
}>;


export type RefreshSessionMutation = { refreshSession: { ' $fragmentRefs'?: { 'AuthSessionFragment': AuthSessionFragment } } };

export type AuthSessionFragment = { accessToken: string, accessTokenExpiresAt: string, refreshToken: string, refreshTokenExpiresAt: string, user: { id: string, email: string, fullName: string, accessRole: AccessRole, status: AccountStatus } } & { ' $fragmentName'?: 'AuthSessionFragment' };

export type CreateEmployeeMutationVariables = Exact<{
  input: CreateEmployeeInput;
}>;


export type CreateEmployeeMutation = { createEmployee: { id: string, fullName: string, employeeCode: string } };

export type DeactivateEmployeeMutationVariables = Exact<{
  id: string | number;
  acknowledgeActiveWork?: boolean | null | undefined;
}>;


export type DeactivateEmployeeMutation = { deactivateEmployee: { id: string, status: EmployeeStatus } };

export type EmployeeQueryVariables = Exact<{
  id: string | number;
}>;


export type EmployeeQuery = { employee: { id: string, fullName: string, employeeCode: string, email: string, status: EmployeeStatus, assignable: boolean, joinedAt: string, unit: { id: string, name: string }, jobRole: { id: string, name: string }, chapter: { id: string, name: string } | null } | null };

export type EmployeesQueryVariables = Exact<{
  filter?: EmployeeFilter | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type EmployeesQuery = { employees: { totalCount: number, edges: Array<{ node: { id: string, fullName: string, employeeCode: string, email: string, status: EmployeeStatus, assignable: boolean, unit: { id: string, name: string }, jobRole: { id: string, name: string } } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type CreateEvaluationPeriodMutationVariables = Exact<{
  input: CreateEvaluationPeriodInput;
}>;


export type CreateEvaluationPeriodMutation = { createEvaluationPeriod: { id: string, name: string, startDate: string, endDate: string, state: EvaluationPeriodState, isActive: boolean, template: { id: string, name: string } } };

export type CreateEvaluationTemplateMutationVariables = Exact<{
  input: CreateEvaluationTemplateInput;
}>;


export type CreateEvaluationTemplateMutation = { createEvaluationTemplate: { id: string, name: string, isActive: boolean, criteria: Array<{ id: string, label: string, answerType: EvaluationAnswerType, position: number }> } };

export type CurrentEvaluationPeriodQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentEvaluationPeriodQuery = { currentEvaluationPeriod: { id: string, name: string, startDate: string, endDate: string, state: EvaluationPeriodState, isActive: boolean, template: { id: string, name: string, criteria: Array<{ id: string, label: string, answerType: EvaluationAnswerType, position: number }> } } | null };

export type EvaluationPeriodsQueryVariables = Exact<{
  includeInactive?: boolean | null | undefined;
}>;


export type EvaluationPeriodsQuery = { evaluationPeriods: Array<{ id: string, name: string, startDate: string, endDate: string, state: EvaluationPeriodState, isActive: boolean, template: { id: string, name: string } }> };

export type EvaluationRosterQueryVariables = Exact<{
  periodId: string | number;
}>;


export type EvaluationRosterQuery = { evaluationRoster: Array<{ fillState: EvaluationFillState, talent: { id: string, fullName: string, employeeCode: string, jobRole: { id: string, name: string } }, evaluation: { id: string, status: PerformanceEvaluationStatus, updatedAt: string } | null }> };

export type EvaluationTemplatesQueryVariables = Exact<{
  includeInactive?: boolean | null | undefined;
}>;


export type EvaluationTemplatesQuery = { evaluationTemplates: Array<{ id: string, name: string, isActive: boolean, createdAt: string, criteria: Array<{ id: string, label: string, answerType: EvaluationAnswerType, position: number }> }> };

export type MyPerformanceEvaluationsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyPerformanceEvaluationsQuery = { myPerformanceEvaluations: Array<{ id: string, status: PerformanceEvaluationStatus, summaryAchievement: string | null, developmentNotes: string | null, updatedAt: string, period: { id: string, name: string, startDate: string, endDate: string, state: EvaluationPeriodState }, answers: Array<{ valueNumeric: number | null, valueBool: boolean | null, valueText: string | null, criterion: { id: string, label: string, answerType: EvaluationAnswerType, position: number } }> }> };

export type PerformanceEvaluationForTalentQueryVariables = Exact<{
  periodId: string | number;
  employeeId: string | number;
  first?: number | null | undefined;
}>;


export type PerformanceEvaluationForTalentQuery = { performanceEvaluations: { edges: Array<{ node: { id: string, status: PerformanceEvaluationStatus, summaryAchievement: string | null, developmentNotes: string | null, createdAt: string, updatedAt: string, talent: { id: string, fullName: string, employeeCode: string }, period: { id: string, name: string, startDate: string, endDate: string, state: EvaluationPeriodState, template: { id: string, name: string, criteria: Array<{ id: string, label: string, answerType: EvaluationAnswerType, position: number }> } }, answers: Array<{ valueNumeric: number | null, valueBool: boolean | null, valueText: string | null, criterion: { id: string, label: string, answerType: EvaluationAnswerType, position: number } }>, createdBy: { id: string, fullName: string } | null } }> } };

export type SetEvaluationTemplateActiveMutationVariables = Exact<{
  id: string | number;
  isActive: boolean;
}>;


export type SetEvaluationTemplateActiveMutation = { setEvaluationTemplateActive: { id: string, name: string, isActive: boolean } };

export type SubmitPerformanceEvaluationMutationVariables = Exact<{
  id: string | number;
}>;


export type SubmitPerformanceEvaluationMutation = { submitPerformanceEvaluation: { id: string, status: PerformanceEvaluationStatus } };

export type UpdateEvaluationTemplateMutationVariables = Exact<{
  id: string | number;
  name?: string | null | undefined;
  criteria?: Array<EvaluationCriterionInput> | EvaluationCriterionInput | null | undefined;
}>;


export type UpdateEvaluationTemplateMutation = { updateEvaluationTemplate: { id: string, name: string, isActive: boolean, criteria: Array<{ id: string, label: string, answerType: EvaluationAnswerType, position: number }> } };

export type UpsertPerformanceEvaluationMutationVariables = Exact<{
  input: UpsertPerformanceEvaluationInput;
}>;


export type UpsertPerformanceEvaluationMutation = { upsertPerformanceEvaluation: { id: string, status: PerformanceEvaluationStatus, summaryAchievement: string | null, developmentNotes: string | null, answers: Array<{ valueNumeric: number | null, valueBool: boolean | null, valueText: string | null, criterion: { id: string, label: string, answerType: EvaluationAnswerType, position: number } }> } };

export type ChaptersQueryVariables = Exact<{
  includeInactive?: boolean | null | undefined;
}>;


export type ChaptersQuery = { chapters: Array<{ id: string, name: string, isActive: boolean, jobRoles: Array<{ id: string, name: string }> }> };

export type JobRolesQueryVariables = Exact<{
  includeInactive?: boolean | null | undefined;
}>;


export type JobRolesQuery = { jobRoles: Array<{ id: string, name: string, isActive: boolean, chapter: { id: string, name: string } | null }> };

export type ProjectsQueryVariables = Exact<{
  unitId?: string | number | null | undefined;
  includeInactive?: boolean | null | undefined;
}>;


export type ProjectsQuery = { projects: Array<{ id: string, name: string, isActive: boolean, unit: { id: string, name: string } }> };

export type UnitsQueryVariables = Exact<{
  includeInactive?: boolean | null | undefined;
}>;


export type UnitsQuery = { units: Array<{ id: string, name: string, isActive: boolean, projects: Array<{ id: string, name: string }> }> };

export const AuthSessionFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthSession"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"accessTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"accessRole"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<AuthSessionFragment, unknown>;
export const UsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Users"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accessRole"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AccessRole"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AccountStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"accessRole"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accessRole"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"accessRole"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<UsersQuery, UsersQueryVariables>;
export const AssignableTalentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AssignableTalents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignableTalents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AssignableTalentsQuery, AssignableTalentsQueryVariables>;
export const AssignmentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Assignments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AssignmentFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assignments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"talent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"project"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<AssignmentsQuery, AssignmentsQueryVariables>;
export const CreateAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateAssignmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<CreateAssignmentMutation, CreateAssignmentMutationVariables>;
export const EndAssignmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EndAssignment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodEnd"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"endAssignment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodEnd"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodEnd"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}}]}}]}}]} as unknown as DocumentNode<EndAssignmentMutation, EndAssignmentMutationVariables>;
export const LoginDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Login"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocalLoginInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"login"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"accessTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"accessRole"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"Logout"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}}]}]}}]} as unknown as DocumentNode<LogoutMutation, LogoutMutationVariables>;
export const RefreshSessionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshSession"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshSession"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"refreshToken"},"value":{"kind":"Variable","name":{"kind":"Name","value":"refreshToken"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AuthSession"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AuthSession"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AuthPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"accessTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"refreshToken"}},{"kind":"Field","name":{"kind":"Name","value":"refreshTokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"accessRole"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<RefreshSessionMutation, RefreshSessionMutationVariables>;
export const CreateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEmployeeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}}]}}]}}]} as unknown as DocumentNode<CreateEmployeeMutation, CreateEmployeeMutationVariables>;
export const DeactivateEmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateEmployee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"acknowledgeActiveWork"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateEmployee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"acknowledgeActiveWork"},"value":{"kind":"Variable","name":{"kind":"Name","value":"acknowledgeActiveWork"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DeactivateEmployeeMutation, DeactivateEmployeeMutationVariables>;
export const EmployeeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Employee"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employee"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignable"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"chapter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<EmployeeQuery, EmployeeQueryVariables>;
export const EmployeesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Employees"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"EmployeeFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"25"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"employees"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assignable"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"jobRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<EmployeesQuery, EmployeesQueryVariables>;
export const CreateEvaluationPeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEvaluationPeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEvaluationPeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEvaluationPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CreateEvaluationPeriodMutation, CreateEvaluationPeriodMutationVariables>;
export const CreateEvaluationTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateEvaluationTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateEvaluationTemplateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createEvaluationTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"criteria"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]}}]} as unknown as DocumentNode<CreateEvaluationTemplateMutation, CreateEvaluationTemplateMutationVariables>;
export const CurrentEvaluationPeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrentEvaluationPeriod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentEvaluationPeriod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"criteria"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CurrentEvaluationPeriodQuery, CurrentEvaluationPeriodQueryVariables>;
export const EvaluationPeriodsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EvaluationPeriods"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"evaluationPeriods"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<EvaluationPeriodsQuery, EvaluationPeriodsQueryVariables>;
export const EvaluationRosterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EvaluationRoster"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"evaluationRoster"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"talent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}},{"kind":"Field","name":{"kind":"Name","value":"jobRole"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"fillState"}},{"kind":"Field","name":{"kind":"Name","value":"evaluation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]} as unknown as DocumentNode<EvaluationRosterQuery, EvaluationRosterQueryVariables>;
export const EvaluationTemplatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EvaluationTemplates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"evaluationTemplates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"criteria"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<EvaluationTemplatesQuery, EvaluationTemplatesQueryVariables>;
export const MyPerformanceEvaluationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyPerformanceEvaluations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPerformanceEvaluations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summaryAchievement"}},{"kind":"Field","name":{"kind":"Name","value":"developmentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"period"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}},{"kind":"Field","name":{"kind":"Name","value":"answers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"criterion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"valueNumeric"}},{"kind":"Field","name":{"kind":"Name","value":"valueBool"}},{"kind":"Field","name":{"kind":"Name","value":"valueText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MyPerformanceEvaluationsQuery, MyPerformanceEvaluationsQueryVariables>;
export const PerformanceEvaluationForTalentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PerformanceEvaluationForTalent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"1"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"performanceEvaluations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"employeeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"employeeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summaryAchievement"}},{"kind":"Field","name":{"kind":"Name","value":"developmentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"talent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"employeeCode"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summaryAchievement"}},{"kind":"Field","name":{"kind":"Name","value":"developmentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"period"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"template"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"criteria"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"answers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"criterion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"valueNumeric"}},{"kind":"Field","name":{"kind":"Name","value":"valueBool"}},{"kind":"Field","name":{"kind":"Name","value":"valueText"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]}}]}}]} as unknown as DocumentNode<PerformanceEvaluationForTalentQuery, PerformanceEvaluationForTalentQueryVariables>;
export const SetEvaluationTemplateActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetEvaluationTemplateActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setEvaluationTemplateActive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]}}]} as unknown as DocumentNode<SetEvaluationTemplateActiveMutation, SetEvaluationTemplateActiveMutationVariables>;
export const SubmitPerformanceEvaluationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitPerformanceEvaluation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitPerformanceEvaluation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<SubmitPerformanceEvaluationMutation, SubmitPerformanceEvaluationMutationVariables>;
export const UpdateEvaluationTemplateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateEvaluationTemplate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EvaluationCriterionInput"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateEvaluationTemplate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"criteria"},"value":{"kind":"Variable","name":{"kind":"Name","value":"criteria"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"criteria"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateEvaluationTemplateMutation, UpdateEvaluationTemplateMutationVariables>;
export const UpsertPerformanceEvaluationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertPerformanceEvaluation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertPerformanceEvaluationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPerformanceEvaluation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"summaryAchievement"}},{"kind":"Field","name":{"kind":"Name","value":"developmentNotes"}},{"kind":"Field","name":{"kind":"Name","value":"answers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"criterion"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"answerType"}},{"kind":"Field","name":{"kind":"Name","value":"position"}}]}},{"kind":"Field","name":{"kind":"Name","value":"valueNumeric"}},{"kind":"Field","name":{"kind":"Name","value":"valueBool"}},{"kind":"Field","name":{"kind":"Name","value":"valueText"}}]}}]}}]}}]} as unknown as DocumentNode<UpsertPerformanceEvaluationMutation, UpsertPerformanceEvaluationMutationVariables>;
export const ChaptersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Chapters"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chapters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"jobRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ChaptersQuery, ChaptersQueryVariables>;
export const JobRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"chapter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<JobRolesQuery, JobRolesQueryVariables>;
export const ProjectsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Projects"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"projects"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"unitId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unitId"}}},{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"unit"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ProjectsQuery, ProjectsQueryVariables>;
export const UnitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Units"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"units"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"includeInactive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInactive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"projects"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<UnitsQuery, UnitsQueryVariables>;