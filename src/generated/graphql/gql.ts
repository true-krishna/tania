/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Users($search: String, $accessRole: AccessRole, $status: AccountStatus) {\n  users(search: $search, accessRole: $accessRole, status: $status) {\n    id\n    fullName\n    email\n    accessRole\n    status\n  }\n}": typeof types.UsersDocument,
    "query AssignableTalents($search: String, $first: Int = 25, $after: String) {\n  assignableTalents(search: $search, first: $first, after: $after) {\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n      }\n    }\n  }\n}": typeof types.AssignableTalentsDocument,
    "query Assignments($filter: AssignmentFilter, $first: Int = 25, $after: String) {\n  assignments(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        periodStart\n        periodEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        project {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}": typeof types.AssignmentsDocument,
    "mutation CreateAssignment($input: CreateAssignmentInput!) {\n  createAssignment(input: $input) {\n    id\n    status\n  }\n}": typeof types.CreateAssignmentDocument,
    "mutation EndAssignment($id: ID!, $periodEnd: Date!) {\n  endAssignment(id: $id, periodEnd: $periodEnd) {\n    id\n    status\n    periodEnd\n  }\n}": typeof types.EndAssignmentDocument,
    "mutation Login($input: LocalLoginInput!) {\n  login(input: $input) {\n    accessToken\n    accessTokenExpiresAt\n    refreshToken\n    refreshTokenExpiresAt\n    user {\n      id\n      email\n      fullName\n      accessRole\n      status\n    }\n  }\n}": typeof types.LoginDocument,
    "mutation Logout($refreshToken: String) {\n  logout(refreshToken: $refreshToken)\n}": typeof types.LogoutDocument,
    "mutation RefreshSession($refreshToken: String!) {\n  refreshSession(refreshToken: $refreshToken) {\n    ...AuthSession\n  }\n}": typeof types.RefreshSessionDocument,
    "fragment AuthSession on AuthPayload {\n  accessToken\n  accessTokenExpiresAt\n  refreshToken\n  refreshTokenExpiresAt\n  user {\n    id\n    email\n    fullName\n    accessRole\n    status\n  }\n}": typeof types.AuthSessionFragmentDoc,
    "mutation CreateEmployee($input: CreateEmployeeInput!) {\n  createEmployee(input: $input) {\n    id\n    fullName\n    employeeCode\n  }\n}": typeof types.CreateEmployeeDocument,
    "mutation DeactivateEmployee($id: ID!, $acknowledgeActiveWork: Boolean = false) {\n  deactivateEmployee(id: $id, acknowledgeActiveWork: $acknowledgeActiveWork) {\n    id\n    status\n  }\n}": typeof types.DeactivateEmployeeDocument,
    "query Employee($id: ID!) {\n  employee(id: $id) {\n    id\n    fullName\n    employeeCode\n    email\n    status\n    assignable\n    joinedAt\n    unit {\n      id\n      name\n    }\n    jobRole {\n      id\n      name\n    }\n    chapter {\n      id\n      name\n    }\n  }\n}": typeof types.EmployeeDocument,
    "query Employees($filter: EmployeeFilter, $first: Int = 25, $after: String) {\n  employees(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n        email\n        status\n        assignable\n        unit {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}": typeof types.EmployeesDocument,
    "mutation CreateEvaluationPeriod($input: CreateEvaluationPeriodInput!) {\n  createEvaluationPeriod(input: $input) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}": typeof types.CreateEvaluationPeriodDocument,
    "mutation CreateEvaluationTemplate($input: CreateEvaluationTemplateInput!) {\n  createEvaluationTemplate(input: $input) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}": typeof types.CreateEvaluationTemplateDocument,
    "query CurrentEvaluationPeriod {\n  currentEvaluationPeriod {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n      criteria {\n        id\n        label\n        answerType\n        position\n      }\n    }\n  }\n}": typeof types.CurrentEvaluationPeriodDocument,
    "query EvaluationPeriods($includeInactive: Boolean = false) {\n  evaluationPeriods(includeInactive: $includeInactive) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}": typeof types.EvaluationPeriodsDocument,
    "query EvaluationRoster($periodId: ID!) {\n  evaluationRoster(periodId: $periodId) {\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    fillState\n    evaluation {\n      id\n      status\n      updatedAt\n    }\n  }\n}": typeof types.EvaluationRosterDocument,
    "query EvaluationTemplates($includeInactive: Boolean = false) {\n  evaluationTemplates(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n    createdAt\n  }\n}": typeof types.EvaluationTemplatesDocument,
    "query MyPerformanceEvaluations {\n  myPerformanceEvaluations {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    period {\n      id\n      name\n      startDate\n      endDate\n      state\n    }\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n    updatedAt\n  }\n}": typeof types.MyPerformanceEvaluationsDocument,
    "query PerformanceEvaluationForTalent($periodId: ID!, $employeeId: ID!, $first: Int = 1) {\n  performanceEvaluations(\n    periodId: $periodId\n    employeeId: $employeeId\n    first: $first\n  ) {\n    edges {\n      node {\n        id\n        status\n        summaryAchievement\n        developmentNotes\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        status\n        summaryAchievement\n        developmentNotes\n        period {\n          id\n          name\n          startDate\n          endDate\n          state\n          template {\n            id\n            name\n            criteria {\n              id\n              label\n              answerType\n              position\n            }\n          }\n        }\n        answers {\n          criterion {\n            id\n            label\n            answerType\n            position\n          }\n          valueNumeric\n          valueBool\n          valueText\n        }\n        createdBy {\n          id\n          fullName\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n}": typeof types.PerformanceEvaluationForTalentDocument,
    "mutation SetEvaluationTemplateActive($id: ID!, $isActive: Boolean!) {\n  setEvaluationTemplateActive(id: $id, isActive: $isActive) {\n    id\n    name\n    isActive\n  }\n}": typeof types.SetEvaluationTemplateActiveDocument,
    "mutation SubmitPerformanceEvaluation($id: ID!) {\n  submitPerformanceEvaluation(id: $id) {\n    id\n    status\n  }\n}": typeof types.SubmitPerformanceEvaluationDocument,
    "mutation UpdateEvaluationTemplate($id: ID!, $name: String, $criteria: [EvaluationCriterionInput!]) {\n  updateEvaluationTemplate(id: $id, name: $name, criteria: $criteria) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}": typeof types.UpdateEvaluationTemplateDocument,
    "mutation UpsertPerformanceEvaluation($input: UpsertPerformanceEvaluationInput!) {\n  upsertPerformanceEvaluation(input: $input) {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n  }\n}": typeof types.UpsertPerformanceEvaluationDocument,
    "query Chapters($includeInactive: Boolean = false) {\n  chapters(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    jobRoles {\n      id\n      name\n    }\n  }\n}": typeof types.ChaptersDocument,
    "query JobRoles($includeInactive: Boolean = false) {\n  jobRoles(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    chapter {\n      id\n      name\n    }\n  }\n}": typeof types.JobRolesDocument,
    "query Projects($unitId: ID, $includeInactive: Boolean = false) {\n  projects(unitId: $unitId, includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    unit {\n      id\n      name\n    }\n  }\n}": typeof types.ProjectsDocument,
    "query Units($includeInactive: Boolean = false) {\n  units(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    projects {\n      id\n      name\n    }\n  }\n}": typeof types.UnitsDocument,
};
const documents: Documents = {
    "query Users($search: String, $accessRole: AccessRole, $status: AccountStatus) {\n  users(search: $search, accessRole: $accessRole, status: $status) {\n    id\n    fullName\n    email\n    accessRole\n    status\n  }\n}": types.UsersDocument,
    "query AssignableTalents($search: String, $first: Int = 25, $after: String) {\n  assignableTalents(search: $search, first: $first, after: $after) {\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n      }\n    }\n  }\n}": types.AssignableTalentsDocument,
    "query Assignments($filter: AssignmentFilter, $first: Int = 25, $after: String) {\n  assignments(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        periodStart\n        periodEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        project {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}": types.AssignmentsDocument,
    "mutation CreateAssignment($input: CreateAssignmentInput!) {\n  createAssignment(input: $input) {\n    id\n    status\n  }\n}": types.CreateAssignmentDocument,
    "mutation EndAssignment($id: ID!, $periodEnd: Date!) {\n  endAssignment(id: $id, periodEnd: $periodEnd) {\n    id\n    status\n    periodEnd\n  }\n}": types.EndAssignmentDocument,
    "mutation Login($input: LocalLoginInput!) {\n  login(input: $input) {\n    accessToken\n    accessTokenExpiresAt\n    refreshToken\n    refreshTokenExpiresAt\n    user {\n      id\n      email\n      fullName\n      accessRole\n      status\n    }\n  }\n}": types.LoginDocument,
    "mutation Logout($refreshToken: String) {\n  logout(refreshToken: $refreshToken)\n}": types.LogoutDocument,
    "mutation RefreshSession($refreshToken: String!) {\n  refreshSession(refreshToken: $refreshToken) {\n    ...AuthSession\n  }\n}": types.RefreshSessionDocument,
    "fragment AuthSession on AuthPayload {\n  accessToken\n  accessTokenExpiresAt\n  refreshToken\n  refreshTokenExpiresAt\n  user {\n    id\n    email\n    fullName\n    accessRole\n    status\n  }\n}": types.AuthSessionFragmentDoc,
    "mutation CreateEmployee($input: CreateEmployeeInput!) {\n  createEmployee(input: $input) {\n    id\n    fullName\n    employeeCode\n  }\n}": types.CreateEmployeeDocument,
    "mutation DeactivateEmployee($id: ID!, $acknowledgeActiveWork: Boolean = false) {\n  deactivateEmployee(id: $id, acknowledgeActiveWork: $acknowledgeActiveWork) {\n    id\n    status\n  }\n}": types.DeactivateEmployeeDocument,
    "query Employee($id: ID!) {\n  employee(id: $id) {\n    id\n    fullName\n    employeeCode\n    email\n    status\n    assignable\n    joinedAt\n    unit {\n      id\n      name\n    }\n    jobRole {\n      id\n      name\n    }\n    chapter {\n      id\n      name\n    }\n  }\n}": types.EmployeeDocument,
    "query Employees($filter: EmployeeFilter, $first: Int = 25, $after: String) {\n  employees(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n        email\n        status\n        assignable\n        unit {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}": types.EmployeesDocument,
    "mutation CreateEvaluationPeriod($input: CreateEvaluationPeriodInput!) {\n  createEvaluationPeriod(input: $input) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}": types.CreateEvaluationPeriodDocument,
    "mutation CreateEvaluationTemplate($input: CreateEvaluationTemplateInput!) {\n  createEvaluationTemplate(input: $input) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}": types.CreateEvaluationTemplateDocument,
    "query CurrentEvaluationPeriod {\n  currentEvaluationPeriod {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n      criteria {\n        id\n        label\n        answerType\n        position\n      }\n    }\n  }\n}": types.CurrentEvaluationPeriodDocument,
    "query EvaluationPeriods($includeInactive: Boolean = false) {\n  evaluationPeriods(includeInactive: $includeInactive) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}": types.EvaluationPeriodsDocument,
    "query EvaluationRoster($periodId: ID!) {\n  evaluationRoster(periodId: $periodId) {\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    fillState\n    evaluation {\n      id\n      status\n      updatedAt\n    }\n  }\n}": types.EvaluationRosterDocument,
    "query EvaluationTemplates($includeInactive: Boolean = false) {\n  evaluationTemplates(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n    createdAt\n  }\n}": types.EvaluationTemplatesDocument,
    "query MyPerformanceEvaluations {\n  myPerformanceEvaluations {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    period {\n      id\n      name\n      startDate\n      endDate\n      state\n    }\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n    updatedAt\n  }\n}": types.MyPerformanceEvaluationsDocument,
    "query PerformanceEvaluationForTalent($periodId: ID!, $employeeId: ID!, $first: Int = 1) {\n  performanceEvaluations(\n    periodId: $periodId\n    employeeId: $employeeId\n    first: $first\n  ) {\n    edges {\n      node {\n        id\n        status\n        summaryAchievement\n        developmentNotes\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        status\n        summaryAchievement\n        developmentNotes\n        period {\n          id\n          name\n          startDate\n          endDate\n          state\n          template {\n            id\n            name\n            criteria {\n              id\n              label\n              answerType\n              position\n            }\n          }\n        }\n        answers {\n          criterion {\n            id\n            label\n            answerType\n            position\n          }\n          valueNumeric\n          valueBool\n          valueText\n        }\n        createdBy {\n          id\n          fullName\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n}": types.PerformanceEvaluationForTalentDocument,
    "mutation SetEvaluationTemplateActive($id: ID!, $isActive: Boolean!) {\n  setEvaluationTemplateActive(id: $id, isActive: $isActive) {\n    id\n    name\n    isActive\n  }\n}": types.SetEvaluationTemplateActiveDocument,
    "mutation SubmitPerformanceEvaluation($id: ID!) {\n  submitPerformanceEvaluation(id: $id) {\n    id\n    status\n  }\n}": types.SubmitPerformanceEvaluationDocument,
    "mutation UpdateEvaluationTemplate($id: ID!, $name: String, $criteria: [EvaluationCriterionInput!]) {\n  updateEvaluationTemplate(id: $id, name: $name, criteria: $criteria) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}": types.UpdateEvaluationTemplateDocument,
    "mutation UpsertPerformanceEvaluation($input: UpsertPerformanceEvaluationInput!) {\n  upsertPerformanceEvaluation(input: $input) {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n  }\n}": types.UpsertPerformanceEvaluationDocument,
    "query Chapters($includeInactive: Boolean = false) {\n  chapters(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    jobRoles {\n      id\n      name\n    }\n  }\n}": types.ChaptersDocument,
    "query JobRoles($includeInactive: Boolean = false) {\n  jobRoles(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    chapter {\n      id\n      name\n    }\n  }\n}": types.JobRolesDocument,
    "query Projects($unitId: ID, $includeInactive: Boolean = false) {\n  projects(unitId: $unitId, includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    unit {\n      id\n      name\n    }\n  }\n}": types.ProjectsDocument,
    "query Units($includeInactive: Boolean = false) {\n  units(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    projects {\n      id\n      name\n    }\n  }\n}": types.UnitsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Users($search: String, $accessRole: AccessRole, $status: AccountStatus) {\n  users(search: $search, accessRole: $accessRole, status: $status) {\n    id\n    fullName\n    email\n    accessRole\n    status\n  }\n}"): (typeof documents)["query Users($search: String, $accessRole: AccessRole, $status: AccountStatus) {\n  users(search: $search, accessRole: $accessRole, status: $status) {\n    id\n    fullName\n    email\n    accessRole\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query AssignableTalents($search: String, $first: Int = 25, $after: String) {\n  assignableTalents(search: $search, first: $first, after: $after) {\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n      }\n    }\n  }\n}"): (typeof documents)["query AssignableTalents($search: String, $first: Int = 25, $after: String) {\n  assignableTalents(search: $search, first: $first, after: $after) {\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Assignments($filter: AssignmentFilter, $first: Int = 25, $after: String) {\n  assignments(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        periodStart\n        periodEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        project {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"): (typeof documents)["query Assignments($filter: AssignmentFilter, $first: Int = 25, $after: String) {\n  assignments(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        periodStart\n        periodEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        project {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateAssignment($input: CreateAssignmentInput!) {\n  createAssignment(input: $input) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation CreateAssignment($input: CreateAssignmentInput!) {\n  createAssignment(input: $input) {\n    id\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation EndAssignment($id: ID!, $periodEnd: Date!) {\n  endAssignment(id: $id, periodEnd: $periodEnd) {\n    id\n    status\n    periodEnd\n  }\n}"): (typeof documents)["mutation EndAssignment($id: ID!, $periodEnd: Date!) {\n  endAssignment(id: $id, periodEnd: $periodEnd) {\n    id\n    status\n    periodEnd\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Login($input: LocalLoginInput!) {\n  login(input: $input) {\n    accessToken\n    accessTokenExpiresAt\n    refreshToken\n    refreshTokenExpiresAt\n    user {\n      id\n      email\n      fullName\n      accessRole\n      status\n    }\n  }\n}"): (typeof documents)["mutation Login($input: LocalLoginInput!) {\n  login(input: $input) {\n    accessToken\n    accessTokenExpiresAt\n    refreshToken\n    refreshTokenExpiresAt\n    user {\n      id\n      email\n      fullName\n      accessRole\n      status\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation Logout($refreshToken: String) {\n  logout(refreshToken: $refreshToken)\n}"): (typeof documents)["mutation Logout($refreshToken: String) {\n  logout(refreshToken: $refreshToken)\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation RefreshSession($refreshToken: String!) {\n  refreshSession(refreshToken: $refreshToken) {\n    ...AuthSession\n  }\n}"): (typeof documents)["mutation RefreshSession($refreshToken: String!) {\n  refreshSession(refreshToken: $refreshToken) {\n    ...AuthSession\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment AuthSession on AuthPayload {\n  accessToken\n  accessTokenExpiresAt\n  refreshToken\n  refreshTokenExpiresAt\n  user {\n    id\n    email\n    fullName\n    accessRole\n    status\n  }\n}"): (typeof documents)["fragment AuthSession on AuthPayload {\n  accessToken\n  accessTokenExpiresAt\n  refreshToken\n  refreshTokenExpiresAt\n  user {\n    id\n    email\n    fullName\n    accessRole\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateEmployee($input: CreateEmployeeInput!) {\n  createEmployee(input: $input) {\n    id\n    fullName\n    employeeCode\n  }\n}"): (typeof documents)["mutation CreateEmployee($input: CreateEmployeeInput!) {\n  createEmployee(input: $input) {\n    id\n    fullName\n    employeeCode\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation DeactivateEmployee($id: ID!, $acknowledgeActiveWork: Boolean = false) {\n  deactivateEmployee(id: $id, acknowledgeActiveWork: $acknowledgeActiveWork) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation DeactivateEmployee($id: ID!, $acknowledgeActiveWork: Boolean = false) {\n  deactivateEmployee(id: $id, acknowledgeActiveWork: $acknowledgeActiveWork) {\n    id\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Employee($id: ID!) {\n  employee(id: $id) {\n    id\n    fullName\n    employeeCode\n    email\n    status\n    assignable\n    joinedAt\n    unit {\n      id\n      name\n    }\n    jobRole {\n      id\n      name\n    }\n    chapter {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["query Employee($id: ID!) {\n  employee(id: $id) {\n    id\n    fullName\n    employeeCode\n    email\n    status\n    assignable\n    joinedAt\n    unit {\n      id\n      name\n    }\n    jobRole {\n      id\n      name\n    }\n    chapter {\n      id\n      name\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Employees($filter: EmployeeFilter, $first: Int = 25, $after: String) {\n  employees(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n        email\n        status\n        assignable\n        unit {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"): (typeof documents)["query Employees($filter: EmployeeFilter, $first: Int = 25, $after: String) {\n  employees(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        fullName\n        employeeCode\n        email\n        status\n        assignable\n        unit {\n          id\n          name\n        }\n        jobRole {\n          id\n          name\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateEvaluationPeriod($input: CreateEvaluationPeriodInput!) {\n  createEvaluationPeriod(input: $input) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["mutation CreateEvaluationPeriod($input: CreateEvaluationPeriodInput!) {\n  createEvaluationPeriod(input: $input) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateEvaluationTemplate($input: CreateEvaluationTemplateInput!) {\n  createEvaluationTemplate(input: $input) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}"): (typeof documents)["mutation CreateEvaluationTemplate($input: CreateEvaluationTemplateInput!) {\n  createEvaluationTemplate(input: $input) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query CurrentEvaluationPeriod {\n  currentEvaluationPeriod {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n      criteria {\n        id\n        label\n        answerType\n        position\n      }\n    }\n  }\n}"): (typeof documents)["query CurrentEvaluationPeriod {\n  currentEvaluationPeriod {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n      criteria {\n        id\n        label\n        answerType\n        position\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query EvaluationPeriods($includeInactive: Boolean = false) {\n  evaluationPeriods(includeInactive: $includeInactive) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["query EvaluationPeriods($includeInactive: Boolean = false) {\n  evaluationPeriods(includeInactive: $includeInactive) {\n    id\n    name\n    startDate\n    endDate\n    state\n    isActive\n    template {\n      id\n      name\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query EvaluationRoster($periodId: ID!) {\n  evaluationRoster(periodId: $periodId) {\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    fillState\n    evaluation {\n      id\n      status\n      updatedAt\n    }\n  }\n}"): (typeof documents)["query EvaluationRoster($periodId: ID!) {\n  evaluationRoster(periodId: $periodId) {\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    fillState\n    evaluation {\n      id\n      status\n      updatedAt\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query EvaluationTemplates($includeInactive: Boolean = false) {\n  evaluationTemplates(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n    createdAt\n  }\n}"): (typeof documents)["query EvaluationTemplates($includeInactive: Boolean = false) {\n  evaluationTemplates(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query MyPerformanceEvaluations {\n  myPerformanceEvaluations {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    period {\n      id\n      name\n      startDate\n      endDate\n      state\n    }\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n    updatedAt\n  }\n}"): (typeof documents)["query MyPerformanceEvaluations {\n  myPerformanceEvaluations {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    period {\n      id\n      name\n      startDate\n      endDate\n      state\n    }\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n    updatedAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query PerformanceEvaluationForTalent($periodId: ID!, $employeeId: ID!, $first: Int = 1) {\n  performanceEvaluations(\n    periodId: $periodId\n    employeeId: $employeeId\n    first: $first\n  ) {\n    edges {\n      node {\n        id\n        status\n        summaryAchievement\n        developmentNotes\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        status\n        summaryAchievement\n        developmentNotes\n        period {\n          id\n          name\n          startDate\n          endDate\n          state\n          template {\n            id\n            name\n            criteria {\n              id\n              label\n              answerType\n              position\n            }\n          }\n        }\n        answers {\n          criterion {\n            id\n            label\n            answerType\n            position\n          }\n          valueNumeric\n          valueBool\n          valueText\n        }\n        createdBy {\n          id\n          fullName\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n}"): (typeof documents)["query PerformanceEvaluationForTalent($periodId: ID!, $employeeId: ID!, $first: Int = 1) {\n  performanceEvaluations(\n    periodId: $periodId\n    employeeId: $employeeId\n    first: $first\n  ) {\n    edges {\n      node {\n        id\n        status\n        summaryAchievement\n        developmentNotes\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        status\n        summaryAchievement\n        developmentNotes\n        period {\n          id\n          name\n          startDate\n          endDate\n          state\n          template {\n            id\n            name\n            criteria {\n              id\n              label\n              answerType\n              position\n            }\n          }\n        }\n        answers {\n          criterion {\n            id\n            label\n            answerType\n            position\n          }\n          valueNumeric\n          valueBool\n          valueText\n        }\n        createdBy {\n          id\n          fullName\n        }\n        createdAt\n        updatedAt\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SetEvaluationTemplateActive($id: ID!, $isActive: Boolean!) {\n  setEvaluationTemplateActive(id: $id, isActive: $isActive) {\n    id\n    name\n    isActive\n  }\n}"): (typeof documents)["mutation SetEvaluationTemplateActive($id: ID!, $isActive: Boolean!) {\n  setEvaluationTemplateActive(id: $id, isActive: $isActive) {\n    id\n    name\n    isActive\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation SubmitPerformanceEvaluation($id: ID!) {\n  submitPerformanceEvaluation(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation SubmitPerformanceEvaluation($id: ID!) {\n  submitPerformanceEvaluation(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateEvaluationTemplate($id: ID!, $name: String, $criteria: [EvaluationCriterionInput!]) {\n  updateEvaluationTemplate(id: $id, name: $name, criteria: $criteria) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}"): (typeof documents)["mutation UpdateEvaluationTemplate($id: ID!, $name: String, $criteria: [EvaluationCriterionInput!]) {\n  updateEvaluationTemplate(id: $id, name: $name, criteria: $criteria) {\n    id\n    name\n    isActive\n    criteria {\n      id\n      label\n      answerType\n      position\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpsertPerformanceEvaluation($input: UpsertPerformanceEvaluationInput!) {\n  upsertPerformanceEvaluation(input: $input) {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n  }\n}"): (typeof documents)["mutation UpsertPerformanceEvaluation($input: UpsertPerformanceEvaluationInput!) {\n  upsertPerformanceEvaluation(input: $input) {\n    id\n    status\n    summaryAchievement\n    developmentNotes\n    answers {\n      criterion {\n        id\n        label\n        answerType\n        position\n      }\n      valueNumeric\n      valueBool\n      valueText\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Chapters($includeInactive: Boolean = false) {\n  chapters(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    jobRoles {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["query Chapters($includeInactive: Boolean = false) {\n  chapters(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    jobRoles {\n      id\n      name\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query JobRoles($includeInactive: Boolean = false) {\n  jobRoles(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    chapter {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["query JobRoles($includeInactive: Boolean = false) {\n  jobRoles(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    chapter {\n      id\n      name\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Projects($unitId: ID, $includeInactive: Boolean = false) {\n  projects(unitId: $unitId, includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    unit {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["query Projects($unitId: ID, $includeInactive: Boolean = false) {\n  projects(unitId: $unitId, includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    unit {\n      id\n      name\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Units($includeInactive: Boolean = false) {\n  units(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    projects {\n      id\n      name\n    }\n  }\n}"): (typeof documents)["query Units($includeInactive: Boolean = false) {\n  units(includeInactive: $includeInactive) {\n    id\n    name\n    isActive\n    projects {\n      id\n      name\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;