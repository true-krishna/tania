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

/**
 * Application access roles (fixed set, FR-15).
 *
 * The four built-in roles of the dynamic RBAC configuration (FR-03 amandemen
 * 2026-10-19); a role built on one of them as its template keeps this enum as the
 * value of AccessRoleDefinition.templateRole.
 */
export type AccessRole =
  | 'ADMIN'
  | 'CHAPTER'
  | 'OPERATION'
  | 'TALENT';

/** Status keamanan akun pemanggil (self view). Tidak memuat kredensial. */
export type AccountSecurity = {
  __typename?: 'AccountSecurity';
  /** Hasil provisi akun Entra milik pemanggil; null = belum pernah diprovisi. */
  entraProvision?: Maybe<EntraProvision>;
  /** Sesi aktif milik pemanggil, terbaru lebih dulu. */
  sessions: Array<AccountSession>;
};

/**
 * Satu sesi aktif (refresh token yang belum dicabut dan belum kedaluwarsa).
 * Nilai token dan hash-nya tidak pernah diekspos.
 */
export type AccountSession = {
  __typename?: 'AccountSession';
  /** Metode masuk yang membuka sesi: `local` atau `entra_sso`. */
  authMethod: Scalars['String']['output'];
  createdAt: Scalars['Time']['output'];
  expiresAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
};

export type AccountStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export type ActionStatusCount = {
  __typename?: 'ActionStatusCount';
  count: Scalars['Int']['output'];
  status: DevelopmentActionStatus;
};

/** Referensi prioritas aktivitas (FR-008); read-only, urut terendah → tertinggi. */
export type ActivityPriority = {
  __typename?: 'ActivityPriority';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
};

/** Referensi status aktivitas (FR-008); read-only, urut siklus hidup. */
export type ActivityStatus = {
  __typename?: 'ActivityStatus';
  id: Scalars['ID']['output'];
  /** true untuk Done & Cancelled — hanya untuk gaya badge; transisi status ditegakkan server-side (FR-008). */
  isTerminal: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
};

/** Jumlah aktivitas per status pada satu periode (FR-008). */
export type ActivityStatusCount = {
  __typename?: 'ActivityStatusCount';
  count: Scalars['Int']['output'];
  statusId: Scalars['ID']['output'];
  statusName: Scalars['String']['output'];
};

/** Rekap aktivitas satu bulan (FR-008); `periodId` berformat `YYYY-MM`. */
export type ActivitySummary = {
  __typename?: 'ActivitySummary';
  endDate: Scalars['Date']['output'];
  periodId: Scalars['ID']['output'];
  startDate: Scalars['Date']['output'];
  statusCounts: Array<ActivityStatusCount>;
  totalCount: Scalars['Int']['output'];
  typeCounts: Array<ActivityTypeCount>;
};

/** Jenis aktivitas pribadi talent (FR-003). */
export type ActivityType =
  | 'training'
  | 'working';

/** Jumlah aktivitas per jenis pada satu periode (FR-008). */
export type ActivityTypeCount = {
  __typename?: 'ActivityTypeCount';
  activityType: ActivityType;
  count: Scalars['Int']['output'];
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

export type AssignmentImportRowInput = {
  employeeId: Scalars['ID']['input'];
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart: Scalars['Date']['input'];
  projectId: Scalars['ID']['input'];
};

export type AssignmentStatus =
  | 'ACTIVE'
  | 'COMPLETED';

export type AuditAction =
  /** Anonimisasi retensi data pribadi (T041). */
  | 'ANONYMIZE'
  | 'CREATE'
  | 'DEACTIVATE'
  | 'DELETE'
  /** Pengakhiran kontrak lama pada mutasi (FR-38/FR-41). */
  | 'END'
  | 'LOGIN'
  | 'LOGOUT'
  /** Mutasi (FR-38/FR-41). */
  | 'MUTATE'
  /** Perpanjangan kontrak (FR-36/FR-41). */
  | 'RENEW'
  /** Resign (FR-37/FR-41). */
  | 'RESIGN'
  /** Pensiun (FR-39/FR-41). */
  | 'RETIRE'
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

export type BandPosition =
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  /** Belum ditetapkan. */
  | 'UNDEFINED'
  | 'V'
  | 'VI';

/** Kegagalan satu baris pada operasi assignment massal. */
export type BulkAssignmentError = {
  __typename?: 'BulkAssignmentError';
  code: BulkAssignmentErrorCode;
  /** Pesan siap tampil kepada pengguna (berbahasa Indonesia). */
  message: Scalars['String']['output'];
};

export type BulkAssignmentErrorCode =
  | 'BATCH_LIMIT'
  | 'DUPLICATE_ACTIVE'
  | 'INVALID'
  | 'INVALID_PERIOD'
  | 'NOT_ACTIVE'
  | 'NOT_ASSIGNABLE'
  | 'OUT_OF_SCOPE'
  | 'PROJECT_INACTIVE'
  | 'REFERENCED';

/** Hasil satu baris operasi assignment massal. */
export type BulkAssignmentItemResult = {
  __typename?: 'BulkAssignmentItemResult';
  /** Assignment hasil — terisi bila baris berhasil (bulk add/edit). */
  assignment?: Maybe<Assignment>;
  /** Assignment yang dimaksud baris ini (bulk edit/delete). */
  assignmentId?: Maybe<Scalars['ID']['output']>;
  /** Talent yang dimaksud baris ini (bulk add). */
  employeeId?: Maybe<Scalars['ID']['output']>;
  /** Kegagalan baris — terisi bila baris gagal. */
  error?: Maybe<BulkAssignmentError>;
  /** Posisi baris pada input (0-based). */
  index: Scalars['Int']['output'];
};

export type BulkAssignmentResult = {
  __typename?: 'BulkAssignmentResult';
  failed: Array<BulkAssignmentItemResult>;
  succeeded: Array<BulkAssignmentItemResult>;
};

/** Hasil satu baris impor Chapter. */
export type BulkChapterItemResult = {
  __typename?: 'BulkChapterItemResult';
  /** Chapter hasil — terisi bila baris berhasil. */
  chapter?: Maybe<Chapter>;
  error?: Maybe<BulkMasterDataError>;
  index: Scalars['Int']['output'];
};

export type BulkChapterResult = {
  __typename?: 'BulkChapterResult';
  failed: Array<BulkChapterItemResult>;
  succeeded: Array<BulkChapterItemResult>;
};

export type BulkCreateAssignmentsInput = {
  /** Maksimum 100 talent per operasi (FR-07). */
  employeeIds: Array<Scalars['ID']['input']>;
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart: Scalars['Date']['input'];
  projectId: Scalars['ID']['input'];
};

/** Hasil satu baris impor Job Role. */
export type BulkJobRoleItemResult = {
  __typename?: 'BulkJobRoleItemResult';
  error?: Maybe<BulkMasterDataError>;
  index: Scalars['Int']['output'];
  /** Job Role hasil — terisi bila baris berhasil. */
  jobRole?: Maybe<JobRole>;
};

export type BulkJobRoleResult = {
  __typename?: 'BulkJobRoleResult';
  failed: Array<BulkJobRoleItemResult>;
  succeeded: Array<BulkJobRoleItemResult>;
};

/** Kegagalan satu baris pada operasi master data massal. */
export type BulkMasterDataError = {
  __typename?: 'BulkMasterDataError';
  code: BulkMasterDataErrorCode;
  /** Pesan siap tampil kepada pengguna (berbahasa Indonesia). */
  message: Scalars['String']['output'];
};

export type BulkMasterDataErrorCode =
  | 'BATCH_LIMIT'
  | 'CONFLICT'
  | 'INVALID'
  | 'REFERENCED'
  | 'REF_AMBIGUOUS'
  | 'REF_INACTIVE'
  | 'REF_NOT_FOUND';

/** Hasil satu baris impor Project (Initiative). */
export type BulkProjectItemResult = {
  __typename?: 'BulkProjectItemResult';
  error?: Maybe<BulkMasterDataError>;
  index: Scalars['Int']['output'];
  /** Project hasil — terisi bila baris berhasil. */
  project?: Maybe<Project>;
};

export type BulkProjectResult = {
  __typename?: 'BulkProjectResult';
  failed: Array<BulkProjectItemResult>;
  succeeded: Array<BulkProjectItemResult>;
};

/** Hasil satu baris impor Unit. */
export type BulkUnitItemResult = {
  __typename?: 'BulkUnitItemResult';
  /** Kegagalan baris — terisi bila baris gagal. */
  error?: Maybe<BulkMasterDataError>;
  /** Posisi baris pada input (0-based). */
  index: Scalars['Int']['output'];
  /** Unit hasil — terisi bila baris berhasil. */
  unit?: Maybe<Unit>;
};

export type BulkUnitResult = {
  __typename?: 'BulkUnitResult';
  failed: Array<BulkUnitItemResult>;
  succeeded: Array<BulkUnitItemResult>;
};

export type BulkUpdateAssignmentsInput = {
  /** Hanya assignment berstatus ACTIVE yang dapat diubah. */
  ids: Array<Scalars['ID']['input']>;
  /** Opsional — tanggal selesai baru; tidak mengosongkan nilai yang sudah terisi (FR-11). */
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  /** Opsional — tanggal mulai baru untuk semua baris. */
  periodStart?: InputMaybe<Scalars['Date']['input']>;
  /** Opsional — project baru untuk semua baris. */
  projectId?: InputMaybe<Scalars['ID']['input']>;
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

export type ChapterImportRowInput = {
  name: Scalars['String']['input'];
};

/** Percakapan asisten milik satu pemanggil. */
export type ChatConversation = {
  __typename?: 'ChatConversation';
  id: Scalars['ID']['output'];
  /** Waktu pesan terakhir — dasar urutan daftar percakapan. */
  lastMessageAt: Scalars['Time']['output'];
  /** Jumlah pesan dalam percakapan. */
  messageCount: Scalars['Int']['output'];
  /** Pesan percakapan, terbaru lebih dulu. Hanya milik pemanggil. */
  messages: ChatMessageConnection;
  /** Waktu percakapan dimulai. */
  startedAt: Scalars['Time']['output'];
};


/** Percakapan asisten milik satu pemanggil. */
export type ChatConversationMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type ChatConversationConnection = {
  __typename?: 'ChatConversationConnection';
  edges: Array<ChatConversationEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ChatConversationEdge = {
  __typename?: 'ChatConversationEdge';
  cursor: Scalars['String']['output'];
  node: ChatConversation;
};

export type ChatMessage = {
  __typename?: 'ChatMessage';
  /**
   * ID kiriman klien (hanya pesan USER) — dipakai UI untuk mengulang kiriman yang gagal
   * secara idempoten, termasuk setelah panel dimuat ulang.
   */
  clientRequestId?: Maybe<Scalars['ID']['output']>;
  /** Isi pesan. USER ≤ 2.000 karakter; ASSISTANT dihasilkan asisten (Bahasa Indonesia). */
  content: Scalars['String']['output'];
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  /** Pemakaian token sisi input — laporan biaya (FR-10); null untuk pesan USER. */
  inputTokens?: Maybe<Scalars['Int']['output']>;
  /** Pemakaian token sisi keluaran — laporan biaya (FR-10); null untuk pesan USER. */
  outputTokens?: Maybe<Scalars['Int']['output']>;
  role: ChatMessageRole;
};

export type ChatMessageConnection = {
  __typename?: 'ChatMessageConnection';
  edges: Array<ChatMessageEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ChatMessageEdge = {
  __typename?: 'ChatMessageEdge';
  cursor: Scalars['String']['output'];
  node: ChatMessage;
};

export type ChatMessageRole =
  | 'ASSISTANT'
  | 'USER';

export type ContractEndReason =
  | 'EXPIRY'
  | 'MUTATION'
  | 'RESIGN'
  | 'RETIREMENT';

export type ContractType =
  /** EMPLOYEE MOBILIT. */
  | 'EMPLOYEE_MOBILIT'
  /** KARYAWAN TETAP — kontrak tanpa batas waktu. */
  | 'KARYAWAN_TETAP'
  /** OUTSOURCE TKP. */
  | 'OUTSOURCE_TKP'
  /** PROJECT BASED PROCUREMENT. */
  | 'PROJECT_BASED_PROCUREMENT'
  /** TKWT DIGITAL TALENT. */
  | 'TKWT_DIGITAL_TALENT'
  /** TPPBW PROHIRE. */
  | 'TPPBW_PROHIRE';

export type CreateAssignmentInput = {
  employeeId: Scalars['ID']['input'];
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
  address?: InputMaybe<Scalars['String']['input']>;
  birthDate: Scalars['Date']['input'];
  email: Scalars['String']['input'];
  fullName: Scalars['String']['input'];
  gender: Gender;
  institutionName?: InputMaybe<Scalars['String']['input']>;
  joinedAt: Scalars['Date']['input'];
  latestEducation?: InputMaybe<Scalars['String']['input']>;
  major?: InputMaybe<Scalars['String']['input']>;
  /** NIK 16 digit — unik, disimpan terenkripsi (FR-42). */
  nik: Scalars['String']['input'];
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmployeeStatus>;
};

export type CreateEmploymentContractInput = {
  bandPosition?: InputMaybe<BandPosition>;
  /** Nomor SK/kontrak; opsional. */
  contractNo?: InputMaybe<Scalars['String']['input']>;
  contractType: ContractType;
  employeeId: Scalars['ID']['input'];
  /** Wajib untuk kontrak berbatas waktu; null untuk yang tanpa batas waktu. */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  jobLevel?: InputMaybe<Scalars['String']['input']>;
  jobRoleId: Scalars['ID']['input'];
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  nomorInduk: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  officeEmail?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['Date']['input'];
  unitId: Scalars['ID']['input'];
  workLocation: WorkLocation;
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

export type CreatePersonalWorkActivityInput = {
  activityType: ActivityType;
  /** Salah satu assignment aktif milik pemanggil (FR-010). */
  assignmentId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  priorityId: Scalars['ID']['input'];
  /** Opsional; wajib null untuk training (FR-004). Project working selalu dari assignment. */
  projectId?: InputMaybe<Scalars['ID']['input']>;
  startDate: Scalars['Date']['input'];
  statusId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
};

/** Input pembuatan role kustom: template menentukan cakupan servernya. */
export type CreateRoleInput = {
  label: Scalars['String']['input'];
  /** Nama mesin, ^[A-Z][A-Z0-9_]{2,49}$, unik, dan immutable setelah dibuat. */
  name: Scalars['String']['input'];
  templateRole: AccessRole;
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
  /** Jenjang terbatas lima nilai (D11, spek 003); null = tidak diisi (data lama). */
  degree?: InputMaybe<EducationLevel>;
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

/**
 * Jenjang pendidikan terkontrol (D11 spek 003) — lima nilai; label tampilan
 * "SMA/SMK Sederajat", "D3", "S1", "S2", "S3".
 */
export type EducationLevel =
  | 'D3'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'SMA_SMK_SEDERAJAT';

export type Employee = {
  __typename?: 'Employee';
  account?: Maybe<User>;
  address?: Maybe<Scalars['String']['output']>;
  /** status aktif, punya kontrak aktif, DAN jobRole memiliki chapter. */
  assignable: Scalars['Boolean']['output'];
  /** Riwayat assignment talent, terbaru lebih dulu (FR-07). */
  assignments: AssignmentConnection;
  /** Tanggal lahir; null bila tidak diisi (data personal opsional). */
  birthDate?: Maybe<Scalars['Date']['output']>;
  /** Turunan kontrak aktif → jobRole.chapter (FR-23/FR-35); null bila role tanpa chapter. */
  chapter?: Maybe<Chapter>;
  /** Riwayat kontrak kerja, terbaru lebih dulu (FR-34). */
  contracts: EmploymentContractConnection;
  createdAt: Scalars['Time']['output'];
  email: Scalars['String']['output'];
  /** Hasil provisi akun Entra (FR-43–FR-45); null = belum pernah diprovisi. */
  entraProvision?: Maybe<EntraProvision>;
  fullName: Scalars['String']['output'];
  /** Jenis kelamin; null bila tidak diisi (data personal opsional). */
  gender?: Maybe<Gender>;
  id: Scalars['ID']['output'];
  /** IDP talent dalam cakupan pemanggil (FR-11). */
  idps: IdpConnection;
  institutionName?: Maybe<Scalars['String']['output']>;
  /** Turunan kontrak aktif (FR-35). */
  jobRole?: Maybe<JobRole>;
  joinedAt: Scalars['Date']['output'];
  latestEducation?: Maybe<Scalars['String']['output']>;
  major?: Maybe<Scalars['String']['output']>;
  /** NIK tersamar — 4 digit akhir (FR-42); nilai penuh tidak pernah diekspos. */
  nikMasked: Scalars['String']['output'];
  /** Nomor induk karyawan dari kontrak aktif (FR-34); null bila tanpa kontrak aktif. */
  nomorInduk?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  status: EmployeeStatus;
  /** Turunan kontrak aktif (FR-35). */
  unit?: Maybe<Unit>;
  updatedAt: Scalars['Time']['output'];
};


export type EmployeeAssignmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type EmployeeContractsArgs = {
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
  /** chapter pemilik job role pada kontrak aktif */
  chapterId?: InputMaybe<Scalars['ID']['input']>;
  jobRoleId?: InputMaybe<Scalars['ID']['input']>;
  /** nama / email / nomor induk (via kontrak aktif) */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmployeeStatus>;
  unitId?: InputMaybe<Scalars['ID']['input']>;
};

/** Kolom yang dapat diurutkan pada daftar talent assignable (TAN-384). */
export type EmployeeListSortField =
  | 'FULL_NAME'
  | 'NOMOR_INDUK';

export type EmployeeStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'RESIGNED'
  | 'RETIRED';

export type EmploymentContract = {
  __typename?: 'EmploymentContract';
  bandPosition: BandPosition;
  /** Nomor SK/kontrak; opsional — null bila tidak diisi. */
  contractNo?: Maybe<Scalars['String']['output']>;
  contractType: ContractType;
  createdAt: Scalars['Time']['output'];
  createdBy?: Maybe<User>;
  employee: Employee;
  /** null untuk kontrak tanpa batas waktu (KARYAWAN TETAP). */
  endDate?: Maybe<Scalars['Date']['output']>;
  endReason?: Maybe<ContractEndReason>;
  id: Scalars['ID']['output'];
  jobLevel?: Maybe<Scalars['String']['output']>;
  jobRole: JobRole;
  jobTitle?: Maybe<Scalars['String']['output']>;
  /** Employee ID yang berlaku pada kontrak ini (snapshot historis). */
  nomorInduk: Scalars['String']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  officeEmail?: Maybe<Scalars['String']['output']>;
  predecessor?: Maybe<EmploymentContract>;
  startDate: Scalars['Date']['output'];
  /** Turunan tanggal + terminatedAt, tanpa cron (FR-34). */
  status: EmploymentContractStatus;
  terminatedAt?: Maybe<Scalars['Time']['output']>;
  unit: Unit;
  updatedAt: Scalars['Time']['output'];
  workLocation: WorkLocation;
};

export type EmploymentContractConnection = {
  __typename?: 'EmploymentContractConnection';
  edges: Array<EmploymentContractEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type EmploymentContractEdge = {
  __typename?: 'EmploymentContractEdge';
  cursor: Scalars['String']['output'];
  node: EmploymentContract;
};

export type EmploymentContractFilter = {
  contractType?: InputMaybe<ContractType>;
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  /** Kontrak yang berakhir pada/before tanggal ini (jendela H-90/H-30). */
  expiringBefore?: InputMaybe<Scalars['Date']['input']>;
  jobRoleId?: InputMaybe<Scalars['ID']['input']>;
  /** nama karyawan / nomor kontrak / nomor induk */
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmploymentContractStatus>;
  unitId?: InputMaybe<Scalars['ID']['input']>;
};

export type EmploymentContractStatus =
  /** Turunan tanggal, tanpa cron (FR-34). */
  | 'ACTIVE'
  | 'ENDED'
  | 'TERMINATED';

/** Kolom yang dapat diurutkan pada daftar provisi Entra (FR-44). */
export type EntraEmployeeSortField =
  | 'EMAIL'
  | 'FULL_NAME'
  | 'PROVISION_STATUS';

export type EntraLoginInput = {
  /** Authorization code dari query string /login/callback (sekali pakai, umur pendek). */
  code: Scalars['String']['input'];
  /** PKCE code verifier yang dipakai saat meminta otorisasi (base64url, 43–128 char). */
  codeVerifier: Scalars['String']['input'];
  /** Nonce yang dikirim pada permintaan otorisasi; dicocokkan dengan klaim nonce ID token. */
  nonce: Scalars['String']['input'];
};

/** Status pengiriman email aktivasi jalur create (TAN-359). */
export type EntraNotifyStatus =
  /** Email aktivasi gagal terkirim — kirim ulang tersedia (TAN-359). */
  | 'FAILED'
  /** Email aktivasi terkirim ke email pribadi karyawan. */
  | 'SENT';

/** Hasil provisioning akun Entra seorang talent (FR-44, FR-45). */
export type EntraProvision = {
  __typename?: 'EntraProvision';
  action: EntraProvisionAction;
  /** Pesan kegagalan terakhir; null bila berhasil (FR-44). */
  lastError?: Maybe<Scalars['String']['output']>;
  /** Penanda "perlu provisi ulang": jenis akun tidak cocok dengan contract_type kontrak aktif (TAN-360). */
  needsReprovision: Scalars['Boolean']['output'];
  /** Alasan kegagalan pengiriman email aktivasi; kosong bila terkirim (TAN-359). */
  notifyError?: Maybe<Scalars['String']['output']>;
  /** Status email aktivasi (jalur create); null = tidak berlaku (jalur invite) (TAN-359). */
  notifyStatus?: Maybe<EntraNotifyStatus>;
  /** Object ID akun yang terlink — penanda anti-duplikat (FR-43). */
  objectId?: Maybe<Scalars['String']['output']>;
  status: EntraProvisionStatus;
  updatedAt: Scalars['Time']['output'];
  /** UPN hasil create; untuk invitation berisi email yang diundang (FR-45). */
  upn?: Maybe<Scalars['String']['output']>;
};

/** Jenis aksi provisi Entra (FR-45). */
export type EntraProvisionAction =
  | 'CREATE'
  | 'INVITE';

/** Status hasil provisi akun Entra (FR-44/FR-45); tanpa record = belum dibuat. */
export type EntraProvisionStatus =
  /** Akun dibuat dengan UPN digitaltelkom.id (jenis kontrak jalur create, TAN-359). */
  | 'CREATED'
  /** Akun dinonaktifkan saat terminasi (FR-46). */
  | 'DISABLED'
  /** Provisi gagal — menunggu provisioning ulang (FR-44). */
  | 'FAILED'
  /** Undangan Entra terkirim (jenis kontrak jalur invite, TAN-359). */
  | 'INVITED';

/** Status permulaan alur SSO Microsoft Entra ID. */
export type EntraSsoStart = {
  __typename?: 'EntraSsoStart';
  /**
   * URL otorisasi Microsoft yang siap dibuka browser. Null bila enabled=false.
   * Berisi hanya nilai publik (authority, clientId, scope, redirectUri, PKCE challenge).
   */
  authorizationUrl?: Maybe<Scalars['String']['output']>;
  /** True bila backend siap menerima login SSO (kredensial Entra lengkap). */
  enabled: Scalars['Boolean']['output'];
};

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

/** Keputusan 2026-10-10 — domain nilai dikunci pemilik produk. */
export type Gender =
  | 'FEMALE'
  | 'MALE';

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

export type ImportAssignmentsInput = {
  /** Maksimum 100 baris per operasi (FR-07). */
  rows: Array<AssignmentImportRowInput>;
};

export type ImportChaptersInput = {
  /** Maksimum 100 baris per operasi (FR-06). */
  rows: Array<ChapterImportRowInput>;
};

export type ImportJobRolesInput = {
  /** Maksimum 100 baris per operasi (FR-06). */
  rows: Array<JobRoleImportRowInput>;
};

export type ImportProjectsInput = {
  /** Maksimum 100 baris per operasi (FR-06). */
  rows: Array<ProjectImportRowInput>;
};

export type ImportUnitsInput = {
  /** Maksimum 100 baris per operasi (FR-06). */
  rows: Array<UnitImportRowInput>;
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

export type JobRoleImportRowInput = {
  /** Chapter pemilik — nama chapter atau ID; kosong berarti tanpa chapter (FR-20). */
  chapter?: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
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

/** Tingkat akses satu sel menu × role; cakupan data diwarisi dari template_role. */
export type MenuAccessLevel =
  | 'MANAGE'
  | 'NONE'
  | 'READ';

export type Mutation = {
  __typename?: 'Mutation';
  addCvCertification: CvCertification;
  addCvEducation: CvEducation;
  addCvSkill: CvSkill;
  addDevelopmentAction: DevelopmentAction;
  addIdpReview: ReviewLog;
  /** Buat assignment untuk banyak talent sekaligus (satu project + periode). Chapter + Admin. */
  bulkCreateAssignments: BulkAssignmentResult;
  /** Hapus banyak assignment aktif sekaligus (selesai tidak dapat dihapus). Chapter + Admin. */
  bulkDeleteAssignments: BulkAssignmentResult;
  /** Ubah status aktif/non-aktif banyak Chapter sekaligus dengan satu aksi. Khusus Admin. */
  bulkSetChapterActive: BulkChapterResult;
  /** Ubah status aktif/non-aktif banyak Job Role sekaligus dengan satu aksi. Khusus Admin. */
  bulkSetJobRoleActive: BulkJobRoleResult;
  /** Pindahkan chapter pemilik pada banyak Job Role sekaligus; chapterId kosong berarti melepas kepemilikan. Khusus Admin. */
  bulkSetJobRoleChapter: BulkJobRoleResult;
  /** Ubah status aktif/non-aktif banyak Project (Initiative) sekaligus dengan satu aksi. Khusus Admin. */
  bulkSetProjectActive: BulkProjectResult;
  /** Pindahkan Unit in Charge pada banyak Project (Initiative) sekaligus. Khusus Admin. */
  bulkSetProjectUnit: BulkProjectResult;
  /** Ubah status aktif/non-aktif banyak Unit sekaligus dengan satu aksi. Khusus Admin. */
  bulkSetUnitActive: BulkUnitResult;
  /** Terapkan satu perubahan (project dan/atau periode) ke banyak assignment aktif. Chapter + Admin. */
  bulkUpdateAssignments: BulkAssignmentResult;
  closeIdp: Idp;
  createAssignment: Assignment;
  createChapter: Chapter;
  /** Mulai percakapan baru milik pemanggil. */
  createChatConversation: ChatConversation;
  createEmployee: Employee;
  createEmploymentContract: EmploymentContract;
  createEvaluationPeriod: EvaluationPeriod;
  createEvaluationTemplate: EvaluationTemplate;
  createIdp: Idp;
  createJobRole: JobRole;
  createPersonalWorkActivity: PersonalWorkActivity;
  createProject: Project;
  /** Buat role kustom dari salah satu template bawaan. Khusus Admin. */
  createRole: Role;
  createUnit: Unit;
  /**
   * Buat akun untuk seorang karyawan (Khusus Admin).
   *
   * `accessRole` (bawaan) atau `roleName` (bawaan maupun kustom) menunjuk role
   * tersimpan; keduanya opsional tetapi tepat satu harus diisi.
   */
  createUserAccount: User;
  deactivateEmployee: Employee;
  deleteCvCertification: Scalars['Boolean']['output'];
  deleteCvEducation: Scalars['Boolean']['output'];
  deleteCvSkill: Scalars['Boolean']['output'];
  deleteDevelopmentAction: Scalars['Boolean']['output'];
  /** Soft-delete; baris dan jejak audit tetap tersimpan (FR-009). */
  deletePersonalWorkActivity: PersonalWorkActivity;
  /** Hapus role kustom yang tidak dipakai akun mana pun. Khusus Admin. */
  deleteRole: Scalars['Boolean']['output'];
  endAssignment: Assignment;
  /** Impor assignment massal dari berkas templat: satu assignment per baris. Chapter + Admin. */
  importAssignments: BulkAssignmentResult;
  /** Impor Chapter massal dari berkas templat: satu Chapter per baris. Khusus Admin. */
  importChapters: BulkChapterResult;
  /** Impor Job Role massal dari berkas templat: satu Job Role per baris. Khusus Admin. */
  importJobRoles: BulkJobRoleResult;
  /** Impor Project (Initiative) massal dari berkas templat: satu Project per baris. Khusus Admin. */
  importProjects: BulkProjectResult;
  /** Impor Unit massal dari berkas templat: satu Unit per baris. Khusus Admin. */
  importUnits: BulkUnitResult;
  login: AuthPayload;
  /** Publik. Menukar authorization code dengan sesi Tania (FR-003/FR-004). */
  loginWithEntra: AuthPayload;
  /** Revoke the current access token and, when supplied, the refresh token. */
  logout: Scalars['Boolean']['output'];
  /**
   * Provisioning manual/ulang akun Entra untuk talent yang belum punya (FR-44).
   * Hasil terlihat pada entraProvision talent; kegagalan tercatat di sana (status FAILED) tanpa menggagalkan mutasi.
   * Keputusan create/invite mengikuti contract_type kontrak aktif (TAN-359).
   */
  provisionEntraAccount: Employee;
  /** Mutasi: akhiri kontrak lama + kontrak baru efektif tanggal mutasi (FR-38). */
  recordEmployeeMutation: EmploymentContract;
  /** Exchange a refresh token for a new token pair (rotating). */
  refreshSession: AuthPayload;
  /** Perpanjangan kontrak berbatas waktu — kontrak baru terkait predecessor (FR-36). */
  renewEmploymentContract: EmploymentContract;
  /**
   * Provisi ulang satu langkah (TAN-360): akun lama dinonaktifkan lalu diganti
   * create/invite sesuai contract_type kontrak aktif — untuk akun yang jenisnya tidak
   * cocok lagi setelah mutasi. Hasil terlihat pada entraProvision.
   */
  reprovisionEntraAccount: Employee;
  /**
   * Kirim ulang email aktivasi akun hasil create (TAN-359): password sementara baru
   * di-set di Entra (tetap wajib ganti pada login pertama) lalu email baru dikirim ke
   * email pribadi karyawan. Status hasil terlihat pada entraProvision.
   */
  resendEntraActivationEmail: Employee;
  /** Kembalikan konfigurasi menu satu role ke matriks default FR-03. Khusus Admin. */
  resetRoleMenuConfig: Array<RoleMenuEntry>;
  /** Resign: akhiri kontrak aktif (end_reason=resign), status → RESIGNED, nonaktifkan akun (FR-37, FR-46). */
  resignEmployee: Employee;
  /** Pensiun: akhiri kontrak aktif (end_reason=retirement), status → RETIRED (FR-39). */
  retireEmployee: Employee;
  revokeUserSessions: Scalars['Boolean']['output'];
  /**
   * Kirim pesan user; sinkron; mengembalikan PESAN ASISTEN hasil grounding.
   * Pesan USER tersimpan sebelum pemanggilan model; kirim ulang dengan
   * clientRequestId yang sama bersifat idempoten (tidak menggandakan pesan).
   */
  sendChatMessage: ChatMessage;
  setChapterActive: Chapter;
  /**
   * Aktifkan/nonaktifkan akun Entra terlink secara manual (TAN-360), member maupun
   * guest — enable tanpa menunggu perpanjangan kontrak. Permintaan yang tidak
   * mengubah keadaan bersifat no-op; setiap perubahan tercatat di jejak audit.
   */
  setEntraAccountEnabled: Employee;
  setEvaluationPeriodActive: EvaluationPeriod;
  setEvaluationTemplateActive: EvaluationTemplate;
  setJobRoleActive: JobRole;
  setJobRoleChapter: JobRole;
  setProjectActive: Project;
  /** Ubah usia pensiun (tahun); hanya Admin (T042). */
  setRetirementAge: Scalars['Int']['output'];
  /**
   * Simpan konfigurasi menu satu role.
   *
   * Hanya sel yang benar-benar berbeda dari matriks default FR-03 yang ditulis dan
   * dicatat audit. Sel khusus Admin (Accounts, Audit, kelola Master Data) divalidasi
   * di server. Khusus Admin.
   */
  setRoleMenuAccess: Array<RoleMenuEntry>;
  /** Aktifkan/nonaktifkan role kustom. Khusus Admin. */
  setRoleStatus: Role;
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
  updateEmploymentContract: EmploymentContract;
  updateEvaluationPeriod: EvaluationPeriod;
  updateEvaluationTemplate: EvaluationTemplate;
  updateIdp: Idp;
  updateJobRole: JobRole;
  updatePersonalWorkActivity: PersonalWorkActivity;
  updateProject: Project;
  /** Ubah label role kustom; nama mesin immutable. Khusus Admin. */
  updateRole: Role;
  updateUnit: Unit;
  /**
   * Ubah peran akses sebuah akun (Khusus Admin).
   *
   * `accessRole` (bawaan) atau `roleName` (bawaan maupun kustom) menunjuk role
   * tersimpan; keduanya opsional tetapi tepat satu harus diisi.
   */
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


export type MutationBulkCreateAssignmentsArgs = {
  input: BulkCreateAssignmentsInput;
};


export type MutationBulkDeleteAssignmentsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBulkSetChapterActiveArgs = {
  ids: Array<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
};


export type MutationBulkSetJobRoleActiveArgs = {
  ids: Array<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
};


export type MutationBulkSetJobRoleChapterArgs = {
  chapterId?: InputMaybe<Scalars['ID']['input']>;
  ids: Array<Scalars['ID']['input']>;
};


export type MutationBulkSetProjectActiveArgs = {
  ids: Array<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
};


export type MutationBulkSetProjectUnitArgs = {
  ids: Array<Scalars['ID']['input']>;
  unitId: Scalars['ID']['input'];
};


export type MutationBulkSetUnitActiveArgs = {
  ids: Array<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
};


export type MutationBulkUpdateAssignmentsArgs = {
  input: BulkUpdateAssignmentsInput;
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


export type MutationCreateEmploymentContractArgs = {
  input: CreateEmploymentContractInput;
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


export type MutationCreatePersonalWorkActivityArgs = {
  input: CreatePersonalWorkActivityInput;
};


export type MutationCreateProjectArgs = {
  name: Scalars['String']['input'];
  unitId: Scalars['ID']['input'];
};


export type MutationCreateRoleArgs = {
  input: CreateRoleInput;
};


export type MutationCreateUnitArgs = {
  code: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationCreateUserAccountArgs = {
  accessRole?: InputMaybe<AccessRole>;
  email: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
  roleName?: InputMaybe<Scalars['String']['input']>;
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


export type MutationDeletePersonalWorkActivityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteRoleArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEndAssignmentArgs = {
  id: Scalars['ID']['input'];
  periodEnd: Scalars['Date']['input'];
};


export type MutationImportAssignmentsArgs = {
  input: ImportAssignmentsInput;
};


export type MutationImportChaptersArgs = {
  input: ImportChaptersInput;
};


export type MutationImportJobRolesArgs = {
  input: ImportJobRolesInput;
};


export type MutationImportProjectsArgs = {
  input: ImportProjectsInput;
};


export type MutationImportUnitsArgs = {
  input: ImportUnitsInput;
};


export type MutationLoginArgs = {
  input: LocalLoginInput;
};


export type MutationLoginWithEntraArgs = {
  input: EntraLoginInput;
};


export type MutationLogoutArgs = {
  refreshToken?: InputMaybe<Scalars['String']['input']>;
};


export type MutationProvisionEntraAccountArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationRecordEmployeeMutationArgs = {
  input: RecordMutationInput;
};


export type MutationRefreshSessionArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRenewEmploymentContractArgs = {
  input: RenewContractInput;
};


export type MutationReprovisionEntraAccountArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationResendEntraActivationEmailArgs = {
  employeeId: Scalars['ID']['input'];
};


export type MutationResetRoleMenuConfigArgs = {
  roleId: Scalars['ID']['input'];
};


export type MutationResignEmployeeArgs = {
  acknowledgeActiveWork?: InputMaybe<Scalars['Boolean']['input']>;
  effectiveDate: Scalars['Date']['input'];
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRetireEmployeeArgs = {
  acknowledgeActiveWork?: InputMaybe<Scalars['Boolean']['input']>;
  effectiveDate: Scalars['Date']['input'];
  id: Scalars['ID']['input'];
};


export type MutationRevokeUserSessionsArgs = {
  userId: Scalars['ID']['input'];
};


export type MutationSendChatMessageArgs = {
  clientRequestId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  conversationId: Scalars['ID']['input'];
};


export type MutationSetChapterActiveArgs = {
  id: Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
};


export type MutationSetEntraAccountEnabledArgs = {
  employeeId: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
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


export type MutationSetRetirementAgeArgs = {
  years: Scalars['Int']['input'];
};


export type MutationSetRoleMenuAccessArgs = {
  entries: Array<RoleMenuAccessInput>;
  roleId: Scalars['ID']['input'];
};


export type MutationSetRoleStatusArgs = {
  id: Scalars['ID']['input'];
  status: RoleStatus;
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


export type MutationUpdateEmploymentContractArgs = {
  id: Scalars['ID']['input'];
  input: UpdateEmploymentContractInput;
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


export type MutationUpdatePersonalWorkActivityArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePersonalWorkActivityInput;
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  unitId: Scalars['ID']['input'];
};


export type MutationUpdateRoleArgs = {
  id: Scalars['ID']['input'];
  label: Scalars['String']['input'];
};


export type MutationUpdateUnitArgs = {
  code: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};


export type MutationUpdateUserAccessRoleArgs = {
  accessRole?: InputMaybe<AccessRole>;
  roleName?: InputMaybe<Scalars['String']['input']>;
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
  /** Kontrak berjalan yang berakhir dalam 30 hari ke depan (FR-40). */
  contractsExpiringIn30Days: Scalars['Int']['output'];
  /** Kontrak berjalan yang berakhir dalam 90 hari ke depan (FR-40). */
  contractsExpiringIn90Days: Scalars['Int']['output'];
  /** Kontrak berjalan hari ini milik talent aktif, per unit; total barisnya sama dengan totalActiveEmployees. */
  employeesPerUnit: Array<UnitCount>;
  nonAssignableEmployees: Scalars['Int']['output'];
  /** Karyawan aktif pra-pensiun: usia ≥ retirement_age − 1 (FR-40; default 55 → ≥ 54). */
  preRetirementEmployees: Scalars['Int']['output'];
  recentEmployeeChanges: Array<Employee>;
  /** Talent aktif: karyawan berstatus ACTIVE dengan kontrak berjalan hari ini (sudah mulai, belum berakhir/expire, tidak diakhiri dini) — sama dengan jumlah kontrak aktif yang berlaku. */
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

/**
 * Aktivitas kerja/pelatihan milik seorang talent (FR-008–FR-010).
 *
 * Aktivitas disimpan di Tania dan selalu terikat pada satu assignment milik
 * pemiliknya; satu talent boleh punya beberapa assignment, dan setiap aktivitas
 * memilih salah satunya. `talent` selalu berasal dari sesi saat create.
 */
export type PersonalWorkActivity = {
  __typename?: 'PersonalWorkActivity';
  activityType: ActivityType;
  /** Assignment pemilik aktivitas; wajib aktif saat create (FR-010). */
  assignment: Assignment;
  createdAt: Scalars['Time']['output'];
  /** Penanda soft-delete; null = masih aktif (FR-009). */
  deletedAt?: Maybe<Scalars['Time']['output']>;
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  priority: ActivityPriority;
  /** Turunan assignment; null untuk activityType training (FR-004). */
  project?: Maybe<Project>;
  startDate: Scalars['Date']['output'];
  status: ActivityStatus;
  /** Pemilik aktivitas; diisi server dari sesi, tidak bisa di-set klien (FR-010). */
  talent: Employee;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Time']['output'];
};

export type PersonalWorkActivityConnection = {
  __typename?: 'PersonalWorkActivityConnection';
  edges: Array<PersonalWorkActivityEdge>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type PersonalWorkActivityEdge = {
  __typename?: 'PersonalWorkActivityEdge';
  cursor: Scalars['String']['output'];
  node: PersonalWorkActivity;
};

export type PersonalWorkActivityFilter = {
  activityType?: InputMaybe<ActivityType>;
  assignmentId?: InputMaybe<Scalars['ID']['input']>;
  /** Batas atas inklusif startDate. */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /** Project mengikuti assignment aktivitas. */
  projectId?: InputMaybe<Scalars['ID']['input']>;
  /** Batas bawah inklusif startDate. */
  startDate?: InputMaybe<Scalars['Date']['input']>;
  statusId?: InputMaybe<Scalars['ID']['input']>;
  /** Hanya untuk Chapter/Operation/Admin — Talent selalu dibatasi ke dirinya sendiri. */
  talentId?: InputMaybe<Scalars['ID']['input']>;
};

/**
 * Agregat strip metrik profil (TAN-387). Dihitung ulang saat dibaca; metrik
 * tanpa sumber data bernilai null supaya antarmuka menampilkan "—", bukan nol.
 */
export type ProfileMetrics = {
  __typename?: 'ProfileMetrics';
  /** Jumlah assignment berstatus ACTIVE milik pemanggil. */
  activeAssignmentCount?: Maybe<Scalars['Int']['output']>;
  /** Jumlah sertifikasi pada profil CV; null bila CV belum pernah diisi. */
  certificationCount?: Maybe<Scalars['Int']['output']>;
  /** Jumlah IDP berstatus COMPLETED; null bila belum pernah ada IDP. */
  completedIdpCount?: Maybe<Scalars['Int']['output']>;
  /**
   * Jumlah IDP yang belum selesai (IN_PROGRESS/NEEDS_REVIEW); null bila belum
   * pernah ada IDP.
   */
  runningIdpCount?: Maybe<Scalars['Int']['output']>;
  /**
   * Rata-rata persentase hari kerja (Senin–Jumat) enam bulan terakhir yang
   * tercakup minimal satu assignment; null bila tidak ada assignment pada rentang.
   */
  utilizationPercent?: Maybe<Scalars['Float']['output']>;
};

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

export type ProjectImportRowInput = {
  name: Scalars['String']['input'];
  /** Unit in Charge — kode Unit (unik) atau ID unit (FR-19). */
  unit: Scalars['ID']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Satu aktivitas yang terlihat pemanggil; baris orang lain atau terhapus → NOT_FOUND. */
  activity?: Maybe<PersonalWorkActivity>;
  /** Referensi prioritas aktivitas, urut terendah → tertinggi. */
  activityPriorities: Array<ActivityPriority>;
  /** Referensi status aktivitas, urut siklus hidup. */
  activityStatuses: Array<ActivityStatus>;
  /** Rekap aktivitas satu bulan (`periodId` = YYYY-MM) sesuai scope pemanggil. */
  activitySummary: ActivitySummary;
  /**
   * Kandidat assignment/IDP baru: karyawan aktif dengan kontrak aktif dan assignable (FR-04, FR-23, FR-35).
   * Pengurutan server-side dengan keyset cursor agar urutan konsisten lintas halaman (TAN-384).
   */
  assignableTalents: EmployeeConnection;
  assignments: AssignmentConnection;
  auditLogs: AuditLogConnection;
  /** Admin & Operation melihat semua chapter; Chapter hanya barisnya sendiri; Talent ditolak (FR-18, FR-23; clarify 6–8). */
  chapters: Array<Chapter>;
  /** Percakapan asisten milik pemanggil (privat mutlak; FR-02). */
  chatConversations: ChatConversationConnection;
  /** Pesan satu percakapan milik pemanggil; percakapan orang lain → NOT_FOUND (anti-enumerasi). */
  chatMessages: ChatMessageConnection;
  currentEvaluationPeriod?: Maybe<EvaluationPeriod>;
  /** Profil CV untuk pemiliknya, Chapter dalam cakupan, Operation, atau Admin (hanya baca, FR-13). */
  cvProfile?: Maybe<CvProfile>;
  dashboard: Dashboard;
  employee?: Maybe<Employee>;
  /**
   * Lookup karyawan minimal khusus form Tambah Akun (TAN-371): mengikuti sel
   * modul Akun (Admin-only), terpisah dari sel Data Karyawan sehingga menutup Data
   * Karyawan tidak ikut mematikan form Tambah Akun.
   */
  employeeLookup: EmployeeConnection;
  employees: EmployeeConnection;
  /** Kontrak habis tanpa perpanjangan — perlu tindak lanjut Operation/Admin (US10 skenario 4). */
  employeesNeedingFollowUp: EmployeeConnection;
  /**
   * Talent yang belum memiliki akun Entra (FR-44), ditambah talent terlink yang
   * jenis akunnya tidak cocok dengan contract_type kontrak aktif (penanda
   * "perlu provisi ulang" pada entraProvision, TAN-360) — dengan pencarian nama dan
   * pengurutan.
   */
  employeesWithoutEntra: EmployeeConnection;
  employmentContract?: Maybe<EmploymentContract>;
  employmentContracts: EmploymentContractConnection;
  /** Publik. Dipakai halaman login untuk memutuskan redirect otomatis (FR-001). */
  entraSsoStart: EntraSsoStart;
  evaluationPeriods: Array<EvaluationPeriod>;
  evaluationRoster: Array<EvaluationPeriodRosterEntry>;
  evaluationTemplates: Array<EvaluationTemplate>;
  /** Kontrak berakhir dalam jendela hari (default 90) — kandidat perpanjangan (FR-40, US10). */
  expiringContracts: EmploymentContractConnection;
  /** Liveness and build information; no authentication required. */
  health: Health;
  idp?: Maybe<Idp>;
  idps: IdpConnection;
  /** Admin & Operation melihat semua role; Chapter hanya role milik chapter-nya; Talent ditolak (FR-20, FR-23; clarify 6–8). */
  jobRoles: Array<JobRole>;
  /** Profil user yang sedang login. */
  me: User;
  /** Status keamanan akun pemanggil: provisi Entra dan sesi aktif (self view). */
  myAccountSecurity: AccountSecurity;
  /** Aktivitas milik pemanggil; Chapter/Operation/Admin boleh menyaring ke talent dalam scope (tanpa query allActivities). */
  myActivities: PersonalWorkActivityConnection;
  /**
   * Jejak audit pemanggil sendiri (FR-41 dipersempit ke self): entri terbaru
   * atas record karyawan, kontrak, dan assignment miliknya. `first` default 5,
   * maksimum 50. Akun tanpa record karyawan menerima daftar kosong.
   */
  myAuditTrail: Array<AuditLog>;
  myCvProfile?: Maybe<CvProfile>;
  /** IDP milik Talent yang sedang login; null = belum ada IDP (FR-14). */
  myIdp?: Maybe<Idp>;
  /**
   * Grid menu efektif milik role pemanggil — sumber sidebar dinamis.
   *
   * Tidak khusus Admin: pemanggil hanya menerima baris role-nya sendiri, yang
   * memang sudah tercermin di sidebar dan sesinya.
   */
  myMenuConfig: Array<RoleMenuEntry>;
  /** Evaluasi milik Talent yang sedang login (FR-27). */
  myPerformanceEvaluations: Array<PerformanceEvaluation>;
  /**
   * Agregat strip metrik profil milik pemanggil. Metrik tanpa sumber data
   * bernilai null agar antarmuka menampilkan "—", bukan angka karangan.
   */
  myProfileMetrics: ProfileMetrics;
  performanceEvaluations: PerformanceEvaluationConnection;
  /** Referensi Project level organisasi — terbaca oleh semua peran terautentikasi (dipakai filter Assignment); 2026-10-16 clarify 8. */
  projects: Array<Project>;
  /** Usia pensiun (tahun) dari setelan aplikasi Admin — default 55 (FR-40, T042). */
  retirementAge: Scalars['Int']['output'];
  /**
   * Grid menu × role efektif: sel tanpa baris tersimpan memakai default FR-03.
   *
   * `roleId` kosong = seluruh role; terisi = role itu saja. Khusus Admin.
   */
  roleMenuConfig: Array<RoleMenuEntry>;
  /** Daftar access role: built-in + custom (FR-01 amandemen). Khusus Admin. */
  roles: Array<Role>;
  talentReport: TalentReport;
  talentReportRange: TalentReportRange;
  /** Referensi Unit level organisasi — terbaca oleh semua peran terautentikasi (dipakai filter Data karyawan); 2026-10-16 clarify 8. */
  units: Array<Unit>;
  users: Array<User>;
};


export type QueryActivityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryActivitySummaryArgs = {
  periodId: Scalars['ID']['input'];
};


export type QueryAssignableTalentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<EmployeeListSortField>;
  sortDirection?: InputMaybe<SortDirection>;
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


export type QueryChatConversationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryChatMessagesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  conversationId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryCvProfileArgs = {
  employeeId: Scalars['ID']['input'];
};


export type QueryEmployeeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmployeeLookupArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<EmployeeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEmployeesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<EmployeeFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEmployeesNeedingFollowUpArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEmployeesWithoutEntraArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<EntraEmployeeSortField>;
  sortDirection?: InputMaybe<SortDirection>;
};


export type QueryEmploymentContractArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEmploymentContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<EmploymentContractFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEntraSsoStartArgs = {
  codeChallenge: Scalars['String']['input'];
  nonce: Scalars['String']['input'];
  state: Scalars['String']['input'];
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


export type QueryExpiringContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  days?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryMyActivitiesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<PersonalWorkActivityFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyAuditTrailArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryRoleMenuConfigArgs = {
  roleId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryRolesArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryTalentReportArgs = {
  period: TalentReportPeriodInput;
};


export type QueryUnitsArgs = {
  includeInactive?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryUsersArgs = {
  accessRole?: InputMaybe<AccessRole>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<AccountStatus>;
};

/** Mutasi di tengah kontrak — akhiri kontrak lama + kontrak baru efektif tanggal mutasi (FR-38). */
export type RecordMutationInput = {
  bandPosition?: InputMaybe<BandPosition>;
  /** Nomor SK/kontrak; opsional. */
  contractNo?: InputMaybe<Scalars['String']['input']>;
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  jobLevel?: InputMaybe<Scalars['String']['input']>;
  jobRoleId: Scalars['ID']['input'];
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  nomorInduk: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  officeEmail?: InputMaybe<Scalars['String']['input']>;
  unitId: Scalars['ID']['input'];
  workLocation: WorkLocation;
};

/** Perpanjangan kontrak berbatas waktu — kontrak baru mulai setelah kontrak lama berakhir (FR-36). */
export type RenewContractInput = {
  bandPosition?: InputMaybe<BandPosition>;
  /** Nomor SK/kontrak; opsional. */
  contractNo?: InputMaybe<Scalars['String']['input']>;
  contractType?: ContractType;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  jobLevel?: InputMaybe<Scalars['String']['input']>;
  jobRoleId: Scalars['ID']['input'];
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  nomorInduk: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  officeEmail?: InputMaybe<Scalars['String']['input']>;
  predecessorContractId: Scalars['ID']['input'];
  startDate: Scalars['Date']['input'];
  unitId: Scalars['ID']['input'];
  workLocation: WorkLocation;
};

export type ReportCategoryCount = {
  __typename?: 'ReportCategoryCount';
  count: Scalars['Int']['output'];
  kind: ReportCategoryKind;
  label: Scalars['String']['output'];
};

export type ReportCategoryKind =
  /** Kategori "Belum diisi" — selalu ditempatkan paling akhir, abu-abu. */
  | 'MISSING'
  /** Kategori "Lainnya" — agregat di luar Top 10 lokasi kerja. */
  | 'OTHER'
  /** Kategori data sah. */
  | 'VALUE';

export type ReportMonthlyMovement = {
  __typename?: 'ReportMonthlyMovement';
  churn: Scalars['Int']['output'];
  /** Bulan (YYYY-MM); setiap bulan rentang selalu hadir, tanpa kejadian bernilai 0. */
  month: Scalars['String']['output'];
  newTalent: Scalars['Int']['output'];
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

/** Definisi access role sebagai data — built-in atau custom (FR-01 amandemen). */
export type Role = {
  __typename?: 'Role';
  /** True untuk empat peran bawaan: tidak dapat diubah maupun dihapus. */
  builtIn: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  /** Nama mesin, unik; built-in memakai nama AccessRole (ADMIN, OPERATION, ...). */
  name: Scalars['String']['output'];
  status: RoleStatus;
  /** Peran yang diwarisi cakupan servernya; built-in mewarisi dirinya sendiri. */
  templateRole: AccessRole;
};

export type RoleCount = {
  __typename?: 'RoleCount';
  count: Scalars['Int']['output'];
  role: AccessRole;
};

/**
 * Satu sel menu × role pada `setRoleMenuAccess`.
 *
 * `accessLevel` adalah sumbu otorisasi server; `visible` hanya tampilan sidebar.
 */
export type RoleMenuAccessInput = {
  accessLevel: MenuAccessLevel;
  /** Kunci katalog menu: path rute tanpa garis miring depan, mis. `employees`. */
  menuEntryId: Scalars['String']['input'];
  /** Visibilitas entri di sidebar; tidak pernah mengubah otorisasi server. */
  visible: Scalars['Boolean']['input'];
};

/** Sel menu × role: visibilitas menu dan tingkat akses di dalamnya. */
export type RoleMenuEntry = {
  __typename?: 'RoleMenuEntry';
  accessLevel: MenuAccessLevel;
  /** Kunci katalog menu: path rute tanpa garis miring depan, mis. `employees`. */
  menuEntryId: Scalars['String']['output'];
  roleId: Scalars['ID']['output'];
  /** Nama mesin role pemilik sel ini (bawaan atau kustom) — kunci kolom grid. */
  roleName: Scalars['String']['output'];
  visible: Scalars['Boolean']['output'];
};

/** Status sebuah access role. */
export type RoleStatus =
  | 'ACTIVE'
  | 'INACTIVE';

/** Arah pengurutan daftar (FR-44). */
export type SortDirection =
  | 'ASC'
  | 'DESC';

export type TalentDashboard = {
  __typename?: 'TalentDashboard';
  activeAssignments: Array<Assignment>;
  idpProgress: Array<ActionStatusCount>;
  latestEvaluation?: Maybe<PerformanceEvaluation>;
  upcomingActionDeadlines: Array<DevelopmentAction>;
};

export type TalentReport = {
  __typename?: 'TalentReport';
  educationDistribution: Array<ReportCategoryCount>;
  generationDistribution: Array<ReportCategoryCount>;
  movementTrend: Array<ReportMonthlyMovement>;
  roleDistribution: Array<ReportCategoryCount>;
  /** Bulan snapshot distribusi = bulan akhir rentang terpilih (FR-04). */
  snapshotMonth: Scalars['String']['output'];
  workLocationDistribution: Array<ReportCategoryCount>;
};

export type TalentReportPeriodInput = {
  /** Bulan akhir rentang inklusif, format YYYY-MM, harus >= startMonth. */
  endMonth: Scalars['String']['input'];
  /** Bulan awal rentang inklusif, format YYYY-MM. */
  startMonth: Scalars['String']['input'];
};

/** Batas rentang filter laporan (FR-11): Januari tahun data ter-earliest s.d. Desember tahun berjalan. */
export type TalentReportRange = {
  __typename?: 'TalentReportRange';
  endMonth: Scalars['String']['output'];
  startMonth: Scalars['String']['output'];
};

/** Unit master data (FR-18). */
export type Unit = {
  __typename?: 'Unit';
  /** Kode unik satuan kerja; pembeda utama antar unit. */
  code: Scalars['String']['output'];
  createdAt: Scalars['Time']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  /** Label tampilan; tidak unik. */
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

export type UnitImportRowInput = {
  /** Kode unik satuan kerja (pembeda utama antar unit, FR-18). */
  code: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type UpdateAssignmentInput = {
  periodEnd?: InputMaybe<Scalars['Date']['input']>;
  periodStart?: InputMaybe<Scalars['Date']['input']>;
  projectId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateEmployeeInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  birthDate?: InputMaybe<Scalars['Date']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fullName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  institutionName?: InputMaybe<Scalars['String']['input']>;
  joinedAt?: InputMaybe<Scalars['Date']['input']>;
  latestEducation?: InputMaybe<Scalars['String']['input']>;
  major?: InputMaybe<Scalars['String']['input']>;
  /** NIK diisi ulang hanya bila ingin mengubahnya (FR-42). */
  nik?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<EmployeeStatus>;
};

export type UpdateEmploymentContractInput = {
  bandPosition?: InputMaybe<BandPosition>;
  contractNo?: InputMaybe<Scalars['String']['input']>;
  jobLevel?: InputMaybe<Scalars['String']['input']>;
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  officeEmail?: InputMaybe<Scalars['String']['input']>;
  workLocation?: InputMaybe<WorkLocation>;
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

export type UpdatePersonalWorkActivityInput = {
  activityType?: InputMaybe<ActivityType>;
  assignmentId?: InputMaybe<Scalars['ID']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  priorityId?: InputMaybe<Scalars['ID']['input']>;
  /** Opsional; wajib null untuk training (FR-004). */
  projectId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  statusId?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
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
  /**
   * Nama mesin role di `users.role`: nama bawaan (ADMIN, OPERATION, ...) atau
   * nama role kustom. Sumbu yang dipakai pemilih peran di halaman Accounts.
   */
  roleName: Scalars['String']['output'];
  status: AccountStatus;
  updatedAt: Scalars['Time']['output'];
};

export type WorkLocation =
  | 'BANDUNG'
  | 'JAKARTA'
  /** Belum ditetapkan (kontrak lama tanpa lokasi kerja). */
  | 'UNDEFINED';
