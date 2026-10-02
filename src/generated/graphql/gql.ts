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
    "mutation AddDevelopmentAction($idpId: ID!, $input: CreateDevelopmentActionInput!) {\n  addDevelopmentAction(idpId: $idpId, input: $input) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}": typeof types.AddDevelopmentActionDocument,
    "mutation AddIdpReview($idpId: ID!, $input: AddIdpReviewInput!) {\n  addIdpReview(idpId: $idpId, input: $input) {\n    id\n    reviewDate\n    summary\n    followUp\n    createdAt\n  }\n}": typeof types.AddIdpReviewDocument,
    "mutation CloseIdp($id: ID!) {\n  closeIdp(id: $id) {\n    id\n    status\n  }\n}": typeof types.CloseIdpDocument,
    "mutation CreateIdp($input: CreateIdpInput!) {\n  createIdp(input: $input) {\n    id\n    status\n    talent {\n      id\n      fullName\n    }\n  }\n}": typeof types.CreateIdpDocument,
    "query Idp($id: ID!) {\n  idp(id: $id) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    actions {\n      id\n      description\n      method\n      status\n      dueDate\n    }\n    reviews {\n      id\n      reviewDate\n      summary\n      followUp\n      createdBy {\n        id\n        fullName\n      }\n    }\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n      changedBy {\n        id\n        fullName\n      }\n    }\n  }\n}": typeof types.IdpDocument,
    "query Idps($filter: IdpFilter, $first: Int = 25, $after: String) {\n  idps(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        developmentObjective\n        timelineStart\n        timelineEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        actions {\n          id\n          status\n        }\n        reviews {\n          id\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}": typeof types.IdpsDocument,
    "mutation UpdateDevelopmentActionStatus($id: ID!, $status: DevelopmentActionStatus!) {\n  updateDevelopmentActionStatus(id: $id, status: $status) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}": typeof types.UpdateDevelopmentActionStatusDocument,
    "mutation UpdateIdp($id: ID!, $input: UpdateIdpInput!) {\n  updateIdp(id: $id, input: $input) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n    }\n  }\n}": typeof types.UpdateIdpDocument,
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
    "mutation AddDevelopmentAction($idpId: ID!, $input: CreateDevelopmentActionInput!) {\n  addDevelopmentAction(idpId: $idpId, input: $input) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}": types.AddDevelopmentActionDocument,
    "mutation AddIdpReview($idpId: ID!, $input: AddIdpReviewInput!) {\n  addIdpReview(idpId: $idpId, input: $input) {\n    id\n    reviewDate\n    summary\n    followUp\n    createdAt\n  }\n}": types.AddIdpReviewDocument,
    "mutation CloseIdp($id: ID!) {\n  closeIdp(id: $id) {\n    id\n    status\n  }\n}": types.CloseIdpDocument,
    "mutation CreateIdp($input: CreateIdpInput!) {\n  createIdp(input: $input) {\n    id\n    status\n    talent {\n      id\n      fullName\n    }\n  }\n}": types.CreateIdpDocument,
    "query Idp($id: ID!) {\n  idp(id: $id) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    actions {\n      id\n      description\n      method\n      status\n      dueDate\n    }\n    reviews {\n      id\n      reviewDate\n      summary\n      followUp\n      createdBy {\n        id\n        fullName\n      }\n    }\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n      changedBy {\n        id\n        fullName\n      }\n    }\n  }\n}": types.IdpDocument,
    "query Idps($filter: IdpFilter, $first: Int = 25, $after: String) {\n  idps(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        developmentObjective\n        timelineStart\n        timelineEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        actions {\n          id\n          status\n        }\n        reviews {\n          id\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}": types.IdpsDocument,
    "mutation UpdateDevelopmentActionStatus($id: ID!, $status: DevelopmentActionStatus!) {\n  updateDevelopmentActionStatus(id: $id, status: $status) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}": types.UpdateDevelopmentActionStatusDocument,
    "mutation UpdateIdp($id: ID!, $input: UpdateIdpInput!) {\n  updateIdp(id: $id, input: $input) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n    }\n  }\n}": types.UpdateIdpDocument,
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
export function graphql(source: "mutation AddDevelopmentAction($idpId: ID!, $input: CreateDevelopmentActionInput!) {\n  addDevelopmentAction(idpId: $idpId, input: $input) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}"): (typeof documents)["mutation AddDevelopmentAction($idpId: ID!, $input: CreateDevelopmentActionInput!) {\n  addDevelopmentAction(idpId: $idpId, input: $input) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation AddIdpReview($idpId: ID!, $input: AddIdpReviewInput!) {\n  addIdpReview(idpId: $idpId, input: $input) {\n    id\n    reviewDate\n    summary\n    followUp\n    createdAt\n  }\n}"): (typeof documents)["mutation AddIdpReview($idpId: ID!, $input: AddIdpReviewInput!) {\n  addIdpReview(idpId: $idpId, input: $input) {\n    id\n    reviewDate\n    summary\n    followUp\n    createdAt\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CloseIdp($id: ID!) {\n  closeIdp(id: $id) {\n    id\n    status\n  }\n}"): (typeof documents)["mutation CloseIdp($id: ID!) {\n  closeIdp(id: $id) {\n    id\n    status\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation CreateIdp($input: CreateIdpInput!) {\n  createIdp(input: $input) {\n    id\n    status\n    talent {\n      id\n      fullName\n    }\n  }\n}"): (typeof documents)["mutation CreateIdp($input: CreateIdpInput!) {\n  createIdp(input: $input) {\n    id\n    status\n    talent {\n      id\n      fullName\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Idp($id: ID!) {\n  idp(id: $id) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    actions {\n      id\n      description\n      method\n      status\n      dueDate\n    }\n    reviews {\n      id\n      reviewDate\n      summary\n      followUp\n      createdBy {\n        id\n        fullName\n      }\n    }\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n      changedBy {\n        id\n        fullName\n      }\n    }\n  }\n}"): (typeof documents)["query Idp($id: ID!) {\n  idp(id: $id) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    talent {\n      id\n      fullName\n      employeeCode\n      jobRole {\n        id\n        name\n      }\n    }\n    actions {\n      id\n      description\n      method\n      status\n      dueDate\n    }\n    reviews {\n      id\n      reviewDate\n      summary\n      followUp\n      createdBy {\n        id\n        fullName\n      }\n    }\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n      changedBy {\n        id\n        fullName\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Idps($filter: IdpFilter, $first: Int = 25, $after: String) {\n  idps(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        developmentObjective\n        timelineStart\n        timelineEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        actions {\n          id\n          status\n        }\n        reviews {\n          id\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"): (typeof documents)["query Idps($filter: IdpFilter, $first: Int = 25, $after: String) {\n  idps(filter: $filter, first: $first, after: $after) {\n    totalCount\n    edges {\n      node {\n        id\n        status\n        developmentObjective\n        timelineStart\n        timelineEnd\n        talent {\n          id\n          fullName\n          employeeCode\n        }\n        actions {\n          id\n          status\n        }\n        reviews {\n          id\n        }\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateDevelopmentActionStatus($id: ID!, $status: DevelopmentActionStatus!) {\n  updateDevelopmentActionStatus(id: $id, status: $status) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}"): (typeof documents)["mutation UpdateDevelopmentActionStatus($id: ID!, $status: DevelopmentActionStatus!) {\n  updateDevelopmentActionStatus(id: $id, status: $status) {\n    id\n    description\n    method\n    status\n    dueDate\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateIdp($id: ID!, $input: UpdateIdpInput!) {\n  updateIdp(id: $id, input: $input) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n    }\n  }\n}"): (typeof documents)["mutation UpdateIdp($id: ID!, $input: UpdateIdpInput!) {\n  updateIdp(id: $id, input: $input) {\n    id\n    status\n    developmentObjective\n    currentAssessment\n    gapAnalysis\n    timelineStart\n    timelineEnd\n    successIndicators\n    revisions {\n      id\n      revisionNo\n      changeNote\n      createdAt\n    }\n  }\n}"];
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