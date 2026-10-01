export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  UUID: { input: string; output: string; }
};

export type AccessRole =
  | 'ADMIN'
  | 'CHAPTER'
  | 'OPERATION'
  | 'TALENT';

export type AccountStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type ActionStatusCount = {
  __typename?: 'ActionStatusCount';
  count: Scalars['Int']['output'];
  status: DevelopmentActionStatus;
};

export type AddIdpReviewInput = {
  followUp?: InputMaybe<Scalars['String']['input']>;
  reviewDate: Scalars['Date']['input'];
  summary: Scalars['String']['input'];
};

export type AdminDashboard = {
  __typename?: 'AdminDashboard';
  accountsPerRole: Array<RoleCount>;
  inactiveAccounts: Scalars['Int']['output'];
  masterDataActiveCounts: Array<MasterDataCount>;
  talentsPerChapter: Array<ChapterCount>;
};

export type Assignment = {
  __typename?: 'Assignment';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  id: Scalars['UUID']['output'];
  jobRole: JobRole;
  periodEnd?: Maybe<Scalars['Date']['output']>;
  periodStart: Scalars['Date']['output'];
  project: Project;
  status: AssignmentStatus;
  talent: Employee;
  updatedAt: Scalars['DateTime']['output'];
};

export type AssignmentConnection = {
  __typename?: 'AssignmentConnection';
  edges: Array<AssignmentEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AssignmentEdge = {
  __typename?: 'AssignmentEdge';
  cursor: Scalars['String']['output'];
  node: Assignment;
};

export type AssignmentFilter = {
  employeeId?: InputMaybe<Scalars['UUID']['input']>;
  projectId?: InputMaybe<Scalars['UUID']['input']>;
  status?: InputMaybe<AssignmentStatus>;
};

export type AssignmentStatus =
  | 'ACTIVE'
  | 'COMPLETED';

export type AuditAction =
  | 'CREATE'
  | 'DEACTIVATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPDATE';

export type AuditLog = {
  __typename?: 'AuditLog';
  action: AuditAction;
  actor?: Maybe<User>;
  actorRole?: Maybe<AccessRole>;
  after?: Maybe<Scalars['String']['output']>;
  before?: Maybe<Scalars['String']['output']>;
  entityId?: Maybe<Scalars['String']['output']>;
  entityType: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  ip?: Maybe<Scalars['String']['output']>;
  occurredAt: Scalars['DateTime']['output'];
  requestId?: Maybe<Scalars['String']['output']>;
  userAgent?: Maybe<Scalars['String']['output']>;
};

export type AuditLogConnection = {
  __typename?: 'AuditLogConnection';
  edges: Array<AuditLogEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AuditLogEdge = {
  __typename?: 'AuditLogEdge';
  cursor: Scalars['String']['output'];
  node: AuditLog;
};

export type AuditLogFilter = {
  action?: InputMaybe<AuditAction>;
  actorUserId?: InputMaybe<Scalars['UUID']['input']>;
  entityId?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['DateTime']['input']>;
  to?: InputMaybe<Scalars['DateTime']['input']>;
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  accessTokenExpiresAt: Scalars['DateTime']['output'];
  user: User;
};

export type Chapter = {
  __typename?: 'Chapter';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  jobRoles: Array<JobRole>;
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type ChapterCount = {
  __typename?: 'ChapterCount';
  chapter: Chapter;
  count: Scalars['Int']['output'];
};

export type ChapterDashboard = {
  __typename?: 'ChapterDashboard';
  actionProgress: Array<ActionStatusCount>;
  currentEvaluationPeriod?: Maybe<EvaluationPeriod>;
  idpStatusDistribution: Array<IdpStatusCount>;
  idpsNeedingReview: Scalars['Int']['output'];
  unassignedTalents: Array<Employee>;
};

export type CreateAssignmentInput = {
  employeeId: Scalars['UUID']['input'];
  jobRoleId: Scalars['UUID']['input'];
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart: Scalars['Date']['input'];
  projectId: Scalars['UUID']['input'];
};

export type CreateDevelopmentActionInput = {
  description: Scalars['String']['input'];
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  method: DevelopmentMethod;
};

export type CreateEmployeeInput = {
  email: Scalars['String']['input'];
  employeeCode: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  jobRoleId: Scalars['UUID']['input'];
  joinedAt: Scalars['Date']['input'];
  status?: InputMaybe<EmployeeStatus>;
  unitId: Scalars['UUID']['input'];
};

export type CreateEvaluationPeriodInput = {
  endDate: Scalars['Date']['input'];
  name: Scalars['String']['input'];
  startDate: Scalars['Date']['input'];
  templateId: Scalars['UUID']['input'];
};

export type CreateEvaluationTemplateInput = {
  criteria: Array<EvaluationCriterionInput>;
  name: Scalars['String']['input'];
};

export type CreateIdpInput = {
  actions?: InputMaybe<Array<CreateDevelopmentActionInput>>;
  currentAssessment: Scalars['String']['input'];
  developmentObjective: Scalars['String']['input'];
  employeeId: Scalars['UUID']['input'];
  gapAnalysis: Scalars['String']['input'];
  successIndicators: Scalars['String']['input'];
  timelineEnd: Scalars['Date']['input'];
  timelineStart: Scalars['Date']['input'];
};

export type CvCertification = {
  __typename?: 'CvCertification';
  credentialUrl?: Maybe<Scalars['String']['output']>;
  expiryDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  issuedDate?: Maybe<Scalars['Date']['output']>;
  issuer?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type CvCertificationInput = {
  credentialUrl?: InputMaybe<Scalars['String']['input']>;
  expiryDate?: InputMaybe<Scalars['Date']['input']>;
  issuedDate?: InputMaybe<Scalars['Date']['input']>;
  issuer?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CvEducation = {
  __typename?: 'CvEducation';
  degree?: Maybe<Scalars['String']['output']>;
  endYear?: Maybe<Scalars['Int']['output']>;
  fieldOfStudy?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  institution: Scalars['String']['output'];
  startYear?: Maybe<Scalars['Int']['output']>;
};

export type CvEducationInput = {
  degree?: InputMaybe<Scalars['String']['input']>;
  endYear?: InputMaybe<Scalars['Int']['input']>;
  fieldOfStudy?: InputMaybe<Scalars['String']['input']>;
  institution: Scalars['String']['input'];
  startYear?: InputMaybe<Scalars['Int']['input']>;
};

export type CvProfile = {
  __typename?: 'CvProfile';
  certifications: Array<CvCertification>;
  educations: Array<CvEducation>;
  id: Scalars['UUID']['output'];
  skills: Array<CvSkill>;
  summary?: Maybe<Scalars['String']['output']>;
  talent: Employee;
  updatedAt: Scalars['DateTime']['output'];
  /** Diturunkan dari riwayat assignment (FR-12) — termasuk yang sudah diakhiri. */
  workExperience: Array<Assignment>;
};

export type CvSkill = {
  __typename?: 'CvSkill';
  id: Scalars['UUID']['output'];
  level?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type CvSkillInput = {
  level?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type Dashboard = AdminDashboard | ChapterDashboard | OperationDashboard | TalentDashboard;

export type DevelopmentAction = {
  __typename?: 'DevelopmentAction';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  dueDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['UUID']['output'];
  method: DevelopmentMethod;
  status: DevelopmentActionStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type DevelopmentActionStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'TODO';

export type DevelopmentMethod =
  | 'CROSS_FUNCTIONAL_EXPOSURE'
  | 'MENTORING'
  | 'PROJECT_ASSIGNMENT'
  | 'SELF_STUDY'
  | 'TRAINING';

export type Employee = {
  __typename?: 'Employee';
  account?: Maybe<User>;
  assignable: Scalars['Boolean']['output'];
  assignments: AssignmentConnection;
  chapter?: Maybe<Chapter>;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  employeeCode: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  idps: IdpConnection;
  jobRole: JobRole;
  joinedAt: Scalars['Date']['output'];
  status: EmployeeStatus;
  unit: Unit;
  updatedAt: Scalars['DateTime']['output'];
};


export type EmployeeAssignmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type EmployeeIdpsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type EmployeeConnection = {
  __typename?: 'EmployeeConnection';
  edges: Array<EmployeeEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type EmployeeEdge = {
  __typename?: 'EmployeeEdge';
  cursor: Scalars['String']['output'];
  node: Employee;
};

export type EmployeeFilter = {
  assignableOnly?: InputMaybe<Scalars['Boolean']['input']>;
  jobRoleId?: InputMaybe<Scalars['UUID']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmployeeStatus>;
  unitId?: InputMaybe<Scalars['UUID']['input']>;
};

export type EmployeeStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type EvaluationAnswer = {
  __typename?: 'EvaluationAnswer';
  criterion: EvaluationCriterion;
  valueBool?: Maybe<Scalars['Boolean']['output']>;
  valueNumeric?: Maybe<Scalars['Float']['output']>;
  valueText?: Maybe<Scalars['String']['output']>;
};

export type EvaluationAnswerInput = {
  criterionId: Scalars['UUID']['input'];
  valueBool?: InputMaybe<Scalars['Boolean']['input']>;
  valueNumeric?: InputMaybe<Scalars['Float']['input']>;
  valueText?: InputMaybe<Scalars['String']['input']>;
};

export type EvaluationAnswerType =
  | 'FREE_TEXT'
  | 'SCALE_1_5'
  | 'SCALE_1_10'
  | 'YES_NO';

export type EvaluationCriterion = {
  __typename?: 'EvaluationCriterion';
  answerType: EvaluationAnswerType;
  id: Scalars['UUID']['output'];
  label: Scalars['String']['output'];
  position: Scalars['Int']['output'];
};

export type EvaluationCriterionInput = {
  answerType: EvaluationAnswerType;
  label: Scalars['String']['input'];
  position: Scalars['Int']['input'];
};

export type EvaluationFillState =
  | 'EVALUATED'
  | 'NOT_EVALUATED';

export type EvaluationPeriod = {
  __typename?: 'EvaluationPeriod';
  createdAt: Scalars['DateTime']['output'];
  endDate: Scalars['Date']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  startDate: Scalars['Date']['output'];
  state: EvaluationPeriodState;
  template: EvaluationTemplate;
  updatedAt: Scalars['DateTime']['output'];
};

export type EvaluationPeriodRosterEntry = {
  __typename?: 'EvaluationPeriodRosterEntry';
  evaluation?: Maybe<PerformanceEvaluation>;
  fillState: EvaluationFillState;
  talent: Employee;
};

export type EvaluationPeriodState =
  | 'CLOSED'
  | 'RUNNING'
  | 'SCHEDULED';

export type EvaluationTemplate = {
  __typename?: 'EvaluationTemplate';
  createdAt: Scalars['DateTime']['output'];
  criteria: Array<EvaluationCriterion>;
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Idp = {
  __typename?: 'Idp';
  actions: Array<DevelopmentAction>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  currentAssessment: Scalars['String']['output'];
  developmentObjective: Scalars['String']['output'];
  gapAnalysis: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  reviews: Array<ReviewLog>;
  revisions: Array<IdpRevision>;
  status: IdpStatus;
  successIndicators: Scalars['String']['output'];
  talent: Employee;
  timelineEnd: Scalars['Date']['output'];
  timelineStart: Scalars['Date']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type IdpConnection = {
  __typename?: 'IdpConnection';
  edges: Array<IdpEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type IdpEdge = {
  __typename?: 'IdpEdge';
  cursor: Scalars['String']['output'];
  node: Idp;
};

export type IdpFilter = {
  employeeId?: InputMaybe<Scalars['UUID']['input']>;
  needsReviewOnly?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<IdpStatus>;
};

export type IdpRevision = {
  __typename?: 'IdpRevision';
  changeNote?: Maybe<Scalars['String']['output']>;
  changedBy?: Maybe<User>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  revisionNo: Scalars['Int']['output'];
};

export type IdpStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'NEEDS_REVIEW';

export type IdpStatusCount = {
  __typename?: 'IdpStatusCount';
  count: Scalars['Int']['output'];
  status: IdpStatus;
};

/** Master Data Role — peran jabatan/fungsional (bukan peran akses). */
export type JobRole = {
  __typename?: 'JobRole';
  chapter?: Maybe<Chapter>;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type LocalLoginInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MasterDataCount = {
  __typename?: 'MasterDataCount';
  active: Scalars['Int']['output'];
  inactive: Scalars['Int']['output'];
  kind: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addCvCertification: CvCertification;
  addCvEducation: CvEducation;
  addCvSkill: CvSkill;
  addDevelopmentAction: DevelopmentAction;
  addIdpReview: ReviewLog;
  closeIdp: Idp;
  createAssignment: Assignment;
  createChapter: Chapter;
  createEmployee: Employee;
  createEvaluationPeriod: EvaluationPeriod;
  createEvaluationTemplate: EvaluationTemplate;
  createIdp: Idp;
  createJobRole: JobRole;
  createProject: Project;
  createUnit: Unit;
  createUserAccount: User;
  deactivateEmployee: Employee;
  deleteCvCertification: Scalars['Boolean']['output'];
  deleteCvEducation: Scalars['Boolean']['output'];
  deleteCvSkill: Scalars['Boolean']['output'];
  deleteDevelopmentAction: Scalars['Boolean']['output'];
  endAssignment: Assignment;
  login: AuthPayload;
  logout: Scalars['Boolean']['output'];
  refreshToken: AuthPayload;
  revokeUserSessions: Scalars['Boolean']['output'];
  setChapterActive: Chapter;
  setEvaluationPeriodActive: EvaluationPeriod;
  setEvaluationTemplateActive: EvaluationTemplate;
  setJobRoleActive: JobRole;
  setJobRoleChapter: JobRole;
  setProjectActive: Project;
  setUnitActive: Unit;
  setUserAccountStatus: User;
  submitPerformanceEvaluation: PerformanceEvaluation;
  updateAssignment: Assignment;
  updateChapter: Chapter;
  updateCvCertification: CvCertification;
  updateCvEducation: CvEducation;
  updateCvSkill: CvSkill;
  updateDevelopmentAction: DevelopmentAction;
  updateDevelopmentActionStatus: DevelopmentAction;
  updateEmployee: Employee;
  updateEvaluationPeriod: EvaluationPeriod;
  updateEvaluationTemplate: EvaluationTemplate;
  updateIdp: Idp;
  updateJobRole: JobRole;
  updateProject: Project;
  updateUnit: Unit;
  updateUserAccessRole: User;
  upsertCvProfile: CvProfile;
  upsertPerformanceEvaluation: PerformanceEvaluation;
};


export type MutationAddCvCertificationArgs = {
  input: CvCertificationInput;
};


export type MutationAddCvEducationArgs = {
  input: CvEducationInput;
};


export type MutationAddCvSkillArgs = {
  input: CvSkillInput;
};


export type MutationAddDevelopmentActionArgs = {
  idpId: Scalars['UUID']['input'];
  input: CreateDevelopmentActionInput;
};


export type MutationAddIdpReviewArgs = {
  idpId: Scalars['UUID']['input'];
  input: AddIdpReviewInput;
};


export type MutationCloseIdpArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationCreateAssignmentArgs = {
  input: CreateAssignmentInput;
};


export type MutationCreateChapterArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateEmployeeArgs = {
  input: CreateEmployeeInput;
};


export type MutationCreateEvaluationPeriodArgs = {
  input: CreateEvaluationPeriodInput;
};


export type MutationCreateEvaluationTemplateArgs = {
  input: CreateEvaluationTemplateInput;
};


export type MutationCreateIdpArgs = {
  input: CreateIdpInput;
};


export type MutationCreateJobRoleArgs = {
  chapterId?: InputMaybe<Scalars['UUID']['input']>;
  name: Scalars['String']['input'];
};


export type MutationCreateProjectArgs = {
  name: Scalars['String']['input'];
  unitId: Scalars['UUID']['input'];
};


export type MutationCreateUnitArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateUserAccountArgs = {
  accessRole: AccessRole;
  email: Scalars['String']['input'];
  employeeId: Scalars['UUID']['input'];
  temporaryPassword?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeactivateEmployeeArgs = {
  acknowledgeActiveWork?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['UUID']['input'];
};


export type MutationDeleteCvCertificationArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteCvEducationArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteCvSkillArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteDevelopmentActionArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationEndAssignmentArgs = {
  id: Scalars['UUID']['input'];
  periodEnd: Scalars['Date']['input'];
};


export type MutationLoginArgs = {
  input: LocalLoginInput;
};


export type MutationRevokeUserSessionsArgs = {
  userId: Scalars['UUID']['input'];
};


export type MutationSetChapterActiveArgs = {
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetEvaluationPeriodActiveArgs = {
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetEvaluationTemplateActiveArgs = {
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetJobRoleActiveArgs = {
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetJobRoleChapterArgs = {
  chapterId?: InputMaybe<Scalars['UUID']['input']>;
  id: Scalars['UUID']['input'];
};


export type MutationSetProjectActiveArgs = {
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetUnitActiveArgs = {
  id: Scalars['UUID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetUserAccountStatusArgs = {
  status: AccountStatus;
  userId: Scalars['UUID']['input'];
};


export type MutationSubmitPerformanceEvaluationArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationUpdateAssignmentArgs = {
  id: Scalars['UUID']['input'];
  input: UpdateAssignmentInput;
};


export type MutationUpdateChapterArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateCvCertificationArgs = {
  id: Scalars['UUID']['input'];
  input: CvCertificationInput;
};


export type MutationUpdateCvEducationArgs = {
  id: Scalars['UUID']['input'];
  input: CvEducationInput;
};


export type MutationUpdateCvSkillArgs = {
  id: Scalars['UUID']['input'];
  input: CvSkillInput;
};


export type MutationUpdateDevelopmentActionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['UUID']['input'];
  method?: InputMaybe<DevelopmentMethod>;
};


export type MutationUpdateDevelopmentActionStatusArgs = {
  id: Scalars['UUID']['input'];
  status: DevelopmentActionStatus;
};


export type MutationUpdateEmployeeArgs = {
  id: Scalars['UUID']['input'];
  input: UpdateEmployeeInput;
};


export type MutationUpdateEvaluationPeriodArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['UUID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type MutationUpdateEvaluationTemplateArgs = {
  criteria?: InputMaybe<Array<EvaluationCriterionInput>>;
  id: Scalars['UUID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateIdpArgs = {
  id: Scalars['UUID']['input'];
  input: UpdateIdpInput;
};


export type MutationUpdateJobRoleArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateProjectArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  unitId: Scalars['UUID']['input'];
};


export type MutationUpdateUnitArgs = {
  id: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateUserAccessRoleArgs = {
  accessRole: AccessRole;
  userId: Scalars['UUID']['input'];
};


export type MutationUpsertCvProfileArgs = {
  input: UpsertCvProfileInput;
};


export type MutationUpsertPerformanceEvaluationArgs = {
  input: UpsertPerformanceEvaluationInput;
};

export type OperationDashboard = {
  __typename?: 'OperationDashboard';
  employeesPerUnit: Array<UnitCount>;
  nonAssignableEmployees: Scalars['Int']['output'];
  recentEmployeeChanges: Array<Employee>;
  totalActiveEmployees: Scalars['Int']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PerformanceEvaluation = {
  __typename?: 'PerformanceEvaluation';
  answers: Array<EvaluationAnswer>;
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  developmentNotes?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  period: EvaluationPeriod;
  status: PerformanceEvaluationStatus;
  summaryAchievement?: Maybe<Scalars['String']['output']>;
  talent: Employee;
  updatedAt: Scalars['DateTime']['output'];
};

export type PerformanceEvaluationConnection = {
  __typename?: 'PerformanceEvaluationConnection';
  edges: Array<PerformanceEvaluationEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PerformanceEvaluationEdge = {
  __typename?: 'PerformanceEvaluationEdge';
  cursor: Scalars['String']['output'];
  node: PerformanceEvaluation;
};

export type PerformanceEvaluationStatus =
  | 'DRAFT'
  | 'SUBMITTED';

export type Project = {
  __typename?: 'Project';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  unit: Unit;
  updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
  __typename?: 'Query';
  assignableTalents: EmployeeConnection;
  assignments: AssignmentConnection;
  auditLogs: AuditLogConnection;
  chapters: Array<Chapter>;
  currentEvaluationPeriod?: Maybe<EvaluationPeriod>;
  cvProfile?: Maybe<CvProfile>;
  /** Dashboard sesuai peran pemanggil (FR-29/FR-30). */
  dashboard: Dashboard;
  employee?: Maybe<Employee>;
  employees: EmployeeConnection;
  evaluationPeriods: Array<EvaluationPeriod>;
  evaluationRoster: Array<EvaluationPeriodRosterEntry>;
  evaluationTemplates: Array<EvaluationTemplate>;
  idp?: Maybe<Idp>;
  idps: IdpConnection;
  jobRoles: Array<JobRole>;
  /** Profil user yang sedang login beserta cakupan chapter-nya. */
  me: User;
  myCvProfile?: Maybe<CvProfile>;
  myIdp?: Maybe<Idp>;
  myPerformanceEvaluations: Array<PerformanceEvaluation>;
  performanceEvaluations: PerformanceEvaluationConnection;
  projects: Array<Project>;
  units: Array<Unit>;
  users: Array<User>;
};


export type QueryAssignableTalentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAssignmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AssignmentFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAuditLogsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AuditLogFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryChaptersArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryCvProfileArgs = {
  employeeId: Scalars['UUID']['input'];
};


export type QueryEmployeeArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryEmployeesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<EmployeeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEvaluationPeriodsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryEvaluationRosterArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  periodId: Scalars['UUID']['input'];
};


export type QueryEvaluationTemplatesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryIdpArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryIdpsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<IdpFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryJobRolesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryPerformanceEvaluationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  employeeId?: InputMaybe<Scalars['UUID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  periodId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryProjectsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  unitId?: InputMaybe<Scalars['UUID']['input']>;
};


export type QueryUnitsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryUsersArgs = {
  accessRole?: InputMaybe<AccessRole>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AccountStatus>;
};

export type ReviewLog = {
  __typename?: 'ReviewLog';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  followUp?: Maybe<Scalars['String']['output']>;
  id: Scalars['UUID']['output'];
  reviewDate: Scalars['Date']['output'];
  summary: Scalars['String']['output'];
};

export type RoleCount = {
  __typename?: 'RoleCount';
  count: Scalars['Int']['output'];
  role: AccessRole;
};

export type TalentDashboard = {
  __typename?: 'TalentDashboard';
  activeAssignments: Array<Assignment>;
  idpProgress: Array<ActionStatusCount>;
  latestEvaluation?: Maybe<PerformanceEvaluation>;
  upcomingActionDeadlines: Array<DevelopmentAction>;
};

export type Unit = {
  __typename?: 'Unit';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  projects: Array<Project>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UnitCount = {
  __typename?: 'UnitCount';
  count: Scalars['Int']['output'];
  unit: Unit;
};

export type UpdateAssignmentInput = {
  jobRoleId?: InputMaybe<Scalars['UUID']['input']>;
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart?: InputMaybe<Scalars['Date']['input']>;
  projectId?: InputMaybe<Scalars['UUID']['input']>;
};

export type UpdateEmployeeInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  jobRoleId?: InputMaybe<Scalars['UUID']['input']>;
  joinedAt?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<EmployeeStatus>;
  unitId?: InputMaybe<Scalars['UUID']['input']>;
};

export type UpdateIdpInput = {
  changeNote?: InputMaybe<Scalars['String']['input']>;
  currentAssessment?: InputMaybe<Scalars['String']['input']>;
  developmentObjective?: InputMaybe<Scalars['String']['input']>;
  gapAnalysis?: InputMaybe<Scalars['String']['input']>;
  successIndicators?: InputMaybe<Scalars['String']['input']>;
  timelineEnd?: InputMaybe<Scalars['Date']['input']>;
  timelineStart?: InputMaybe<Scalars['Date']['input']>;
};

export type UpsertCvProfileInput = {
  summary?: InputMaybe<Scalars['String']['input']>;
};

export type UpsertPerformanceEvaluationInput = {
  answers?: InputMaybe<Array<EvaluationAnswerInput>>;
  developmentNotes?: InputMaybe<Scalars['String']['input']>;
  employeeId: Scalars['UUID']['input'];
  periodId: Scalars['UUID']['input'];
  summaryAchievement?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  accessRole: AccessRole;
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  employee?: Maybe<Employee>;
  fullName: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  lastLoginAt?: Maybe<Scalars['DateTime']['output']>;
  status: AccountStatus;
  updatedAt: Scalars['DateTime']['output'];
};
