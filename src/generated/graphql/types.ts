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
  JSON: { input: unknown; output: unknown; }
  Time: { input: string; output: string; }
};

/** Application access roles (fixed set, FR-15). */
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

/** Penempatan talent pada sebuah project untuk satu periode (FR-05). */
export type Assignment = {
  __typename?: 'Assignment';
  createdAt: Scalars['Time']['output'];
  createdBy?: Maybe<User>;
  id: Scalars['ID']['output'];
  jobRole: JobRole;
  periodEnd?: Maybe<Scalars['Date']['output']>;
  periodStart: Scalars['Date']['output'];
  project: Project;
  status: AssignmentStatus;
  talent: Employee;
  updatedAt: Scalars['Time']['output'];
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
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
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

/** One entry of the audit trail (FR-17), append-only. */
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
  occurredAt: Scalars['Time']['output'];
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
  actorUserId?: InputMaybe<Scalars['ID']['input']>;
  entityId?: InputMaybe<Scalars['String']['input']>;
  entityType?: InputMaybe<Scalars['String']['input']>;
  from?: InputMaybe<Scalars['Time']['input']>;
  to?: InputMaybe<Scalars['Time']['input']>;
};

/** A freshly issued access/refresh token pair. */
export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  accessTokenExpiresAt: Scalars['Time']['output'];
  refreshToken: Scalars['String']['output'];
  refreshTokenExpiresAt: Scalars['Time']['output'];
  user: User;
};

/** Chapter master data (FR-24). */
export type Chapter = {
  __typename?: 'Chapter';
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  /** Job roles owned by this chapter, alphabetical. */
  jobRoles: Array<JobRole>;
  name: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
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
  employeeId: Scalars['ID']['input'];
  jobRoleId: Scalars['ID']['input'];
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart: Scalars['Date']['input'];
  projectId: Scalars['ID']['input'];
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
  jobRoleId: Scalars['ID']['input'];
  joinedAt: Scalars['Date']['input'];
  status?: InputMaybe<EmployeeStatus>;
  unitId: Scalars['ID']['input'];
};

export type CreateEvaluationPeriodInput = {
  endDate: Scalars['Date']['input'];
  name: Scalars['String']['input'];
  startDate: Scalars['Date']['input'];
  templateId: Scalars['ID']['input'];
};

export type CreateEvaluationTemplateInput = {
  criteria: Array<EvaluationCriterionInput>;
  name: Scalars['String']['input'];
};

export type CreateIdpInput = {
  actions?: InputMaybe<Array<CreateDevelopmentActionInput>>;
  currentAssessment: Scalars['String']['input'];
  developmentObjective: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
  gapAnalysis: Scalars['String']['input'];
  successIndicators: Scalars['String']['input'];
  timelineEnd: Scalars['Date']['input'];
  timelineStart: Scalars['Date']['input'];
};

export type CvCertification = {
  __typename?: 'CvCertification';
  credentialUrl?: Maybe<Scalars['String']['output']>;
  expiryDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
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
  id: Scalars['ID']['output'];
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

/** Profil CV milik talent (FR-12); pengalaman kerja diturunkan dari assignment. */
export type CvProfile = {
  __typename?: 'CvProfile';
  certifications: Array<CvCertification>;
  educations: Array<CvEducation>;
  id: Scalars['ID']['output'];
  skills: Array<CvSkill>;
  summary?: Maybe<Scalars['String']['output']>;
  talent: Employee;
  updatedAt: Scalars['Time']['output'];
  /** Diturunkan dari riwayat assignment (FR-12) — termasuk yang sudah diakhiri. */
  workExperience: Array<Assignment>;
};

export type CvSkill = {
  __typename?: 'CvSkill';
  id: Scalars['ID']['output'];
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
  createdAt: Scalars['Time']['output'];
  description: Scalars['String']['output'];
  dueDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  method: DevelopmentMethod;
  status: DevelopmentActionStatus;
  updatedAt: Scalars['Time']['output'];
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
  /** status aktif DAN jobRole memiliki chapter. */
  assignable: Scalars['Boolean']['output'];
  /** Riwayat assignment talent, terbaru lebih dulu (FR-07). */
  assignments: AssignmentConnection;
  /** Turunan jobRole.chapter (FR-23); null bila role tanpa chapter. */
  chapter?: Maybe<Chapter>;
  createdAt: Scalars['Time']['output'];
  email: Scalars['String']['output'];
  employeeCode: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** IDP talent dalam cakupan pemanggil (FR-11). */
  idps: IdpConnection;
  jobRole: JobRole;
  joinedAt: Scalars['Date']['output'];
  status: EmployeeStatus;
  unit: Unit;
  updatedAt: Scalars['Time']['output'];
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
  jobRoleId?: InputMaybe<Scalars['ID']['input']>;
  /** nama / email / employeeCode */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmployeeStatus>;
  unitId?: InputMaybe<Scalars['ID']['input']>;
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
  criterionId: Scalars['ID']['input'];
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
  id: Scalars['ID']['output'];
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

/** Periode evaluasi; terpinned ke satu template saat dibuat (FR-25). */
export type EvaluationPeriod = {
  __typename?: 'EvaluationPeriod';
  createdAt: Scalars['Time']['output'];
  endDate: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  startDate: Scalars['Date']['output'];
  /** Turunan dari tanggal saat ini, bukan kolom tersimpan. */
  state: EvaluationPeriodState;
  template: EvaluationTemplate;
  updatedAt: Scalars['Time']['output'];
};

export type EvaluationPeriodRosterEntry = {
  __typename?: 'EvaluationPeriodRosterEntry';
  evaluation?: Maybe<PerformanceEvaluation>;
  fillState: EvaluationFillState;
  talent: Employee;
};

export type EvaluationPeriodState =
  /** Melewati tanggal selesai — hanya baca. */
  | 'CLOSED'
  /** Tanggal saat ini berada dalam rentang periode (FR-25). */
  | 'RUNNING'
  /** Tanggal mulai belum tiba. */
  | 'SCHEDULED';

export type EvaluationTemplate = {
  __typename?: 'EvaluationTemplate';
  createdAt: Scalars['Time']['output'];
  criteria: Array<EvaluationCriterion>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
};

export type Health = {
  __typename?: 'Health';
  status: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

/** Individual Development Plan milik satu talent (FR-08). */
export type Idp = {
  __typename?: 'Idp';
  actions: Array<DevelopmentAction>;
  createdAt: Scalars['Time']['output'];
  createdBy?: Maybe<User>;
  currentAssessment: Scalars['String']['output'];
  developmentObjective: Scalars['String']['output'];
  gapAnalysis: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  reviews: Array<ReviewLog>;
  revisions: Array<IdpRevision>;
  status: IdpStatus;
  successIndicators: Scalars['String']['output'];
  talent: Employee;
  timelineEnd: Scalars['Date']['output'];
  timelineStart: Scalars['Date']['output'];
  updatedAt: Scalars['Time']['output'];
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
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  needsReviewOnly?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<IdpStatus>;
};

export type IdpRevision = {
  __typename?: 'IdpRevision';
  changeNote?: Maybe<Scalars['String']['output']>;
  changedBy?: Maybe<User>;
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
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

/** Master Data Role — peran jabatan/fungsional (bukan peran akses, FR-20). */
export type JobRole = {
  __typename?: 'JobRole';
  /** null = role tanpa chapter → tidak assignable (FR-22/FR-23). */
  chapter?: Maybe<Chapter>;
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
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
  /** Revoke the current access token and, when supplied, the refresh token. */
  logout: Scalars['Boolean']['output'];
  /** Exchange a refresh token for a new token pair (rotating). */
  refreshSession: AuthPayload;
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
  /** Talent pemilik atau Chapter chapter terkait (FR-09). */
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
  idpId: Scalars['ID']['input'];
  input: CreateDevelopmentActionInput;
};


export type MutationAddIdpReviewArgs = {
  idpId: Scalars['ID']['input'];
  input: AddIdpReviewInput;
};


export type MutationCloseIdpArgs = {
  id: Scalars['ID']['input'];
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
  chapterId?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
};


export type MutationCreateProjectArgs = {
  name: Scalars['String']['input'];
  unitId: Scalars['ID']['input'];
};


export type MutationCreateUnitArgs = {
  name: Scalars['String']['input'];
};


export type MutationCreateUserAccountArgs = {
  accessRole: AccessRole;
  email: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
  temporaryPassword?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeactivateEmployeeArgs = {
  acknowledgeActiveWork?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationDeleteCvCertificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCvEducationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCvSkillArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDevelopmentActionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEndAssignmentArgs = {
  id: Scalars['ID']['input'];
  periodEnd: Scalars['Date']['input'];
};


export type MutationLoginArgs = {
  input: LocalLoginInput;
};


export type MutationLogoutArgs = {
  refreshToken?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRefreshSessionArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRevokeUserSessionsArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationSetChapterActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetEvaluationPeriodActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetEvaluationTemplateActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetJobRoleActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetJobRoleChapterArgs = {
  chapterId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationSetProjectActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetUnitActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetUserAccountStatusArgs = {
  status: AccountStatus;
  userId: Scalars['ID']['input'];
};


export type MutationSubmitPerformanceEvaluationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAssignmentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAssignmentInput;
};


export type MutationUpdateChapterArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateCvCertificationArgs = {
  id: Scalars['ID']['input'];
  input: CvCertificationInput;
};


export type MutationUpdateCvEducationArgs = {
  id: Scalars['ID']['input'];
  input: CvEducationInput;
};


export type MutationUpdateCvSkillArgs = {
  id: Scalars['ID']['input'];
  input: CvSkillInput;
};


export type MutationUpdateDevelopmentActionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  method?: InputMaybe<DevelopmentMethod>;
};


export type MutationUpdateDevelopmentActionStatusArgs = {
  id: Scalars['ID']['input'];
  status: DevelopmentActionStatus;
};


export type MutationUpdateEmployeeArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEmployeeInput;
};


export type MutationUpdateEvaluationPeriodArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type MutationUpdateEvaluationTemplateArgs = {
  criteria?: InputMaybe<Array<EvaluationCriterionInput>>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateIdpArgs = {
  id: Scalars['ID']['input'];
  input: UpdateIdpInput;
};


export type MutationUpdateJobRoleArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  unitId: Scalars['ID']['input'];
};


export type MutationUpdateUnitArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateUserAccessRoleArgs = {
  accessRole: AccessRole;
  userId: Scalars['ID']['input'];
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

/** Penilaian performa satu talent untuk satu periode (FR-26). */
export type PerformanceEvaluation = {
  __typename?: 'PerformanceEvaluation';
  answers: Array<EvaluationAnswer>;
  createdAt: Scalars['Time']['output'];
  createdBy?: Maybe<User>;
  developmentNotes?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  period: EvaluationPeriod;
  status: PerformanceEvaluationStatus;
  summaryAchievement?: Maybe<Scalars['String']['output']>;
  talent: Employee;
  updatedAt: Scalars['Time']['output'];
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

/** Project master data; wajib merujuk tepat satu Unit (FR-19). */
export type Project = {
  __typename?: 'Project';
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  unit: Unit;
  updatedAt: Scalars['Time']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Kandidat assignment/IDP baru: karyawan aktif dan assignable (FR-04, FR-23). */
  assignableTalents: EmployeeConnection;
  assignments: AssignmentConnection;
  auditLogs: AuditLogConnection;
  chapters: Array<Chapter>;
  currentEvaluationPeriod?: Maybe<EvaluationPeriod>;
  /** Profil CV untuk pemiliknya atau Chapter dalam cakupan (hanya baca, FR-13). */
  cvProfile?: Maybe<CvProfile>;
  dashboard: Dashboard;
  employee?: Maybe<Employee>;
  employees: EmployeeConnection;
  evaluationPeriods: Array<EvaluationPeriod>;
  evaluationRoster: Array<EvaluationPeriodRosterEntry>;
  evaluationTemplates: Array<EvaluationTemplate>;
  /** Liveness and build information; no authentication required. */
  health: Health;
  idp?: Maybe<Idp>;
  idps: IdpConnection;
  jobRoles: Array<JobRole>;
  /** Profil user yang sedang login. */
  me: User;
  myCvProfile?: Maybe<CvProfile>;
  /** IDP milik Talent yang sedang login; null = belum ada IDP (FR-14). */
  myIdp?: Maybe<Idp>;
  /** Evaluasi milik Talent yang sedang login (FR-27). */
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
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeArgs = {
  id: Scalars['ID']['input'];
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
  periodId: Scalars['ID']['input'];
};


export type QueryEvaluationTemplatesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryIdpArgs = {
  id: Scalars['ID']['input'];
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
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  periodId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryProjectsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
  unitId?: InputMaybe<Scalars['ID']['input']>;
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
  createdAt: Scalars['Time']['output'];
  createdBy?: Maybe<User>;
  followUp?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
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

/** Unit master data (FR-18). */
export type Unit = {
  __typename?: 'Unit';
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  /** Projects owned by this unit, alphabetical. */
  projects: Array<Project>;
  updatedAt: Scalars['Time']['output'];
};

export type UnitCount = {
  __typename?: 'UnitCount';
  count: Scalars['Int']['output'];
  unit: Unit;
};

export type UpdateAssignmentInput = {
  jobRoleId?: InputMaybe<Scalars['ID']['input']>;
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart?: InputMaybe<Scalars['Date']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateEmployeeInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  jobRoleId?: InputMaybe<Scalars['ID']['input']>;
  joinedAt?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<EmployeeStatus>;
  unitId?: InputMaybe<Scalars['ID']['input']>;
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
  employeeId: Scalars['ID']['input'];
  periodId: Scalars['ID']['input'];
  summaryAchievement?: InputMaybe<Scalars['String']['input']>;
};

/** An application account with exactly one access role. */
export type User = {
  __typename?: 'User';
  accessRole: AccessRole;
  createdAt: Scalars['Time']['output'];
  email: Scalars['String']['output'];
  employee?: Maybe<Employee>;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['Time']['output']>;
  status: AccountStatus;
  updatedAt: Scalars['Time']['output'];
};
