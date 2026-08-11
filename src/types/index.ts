export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MANAGEMENT"
  | "SALES_EXECUTIVE"
  | "SURVEY_TEAM"
  | "DOCUMENTATION_TEAM"
  | "KSEB_TEAM"
  | "INSTALLATION_TEAM"
  | "PROJECT_MANAGER";

export type Permission =
  | "lead.view"
  | "lead.create"
  | "lead.edit"
  | "lead.assign"
  | "customer.view"
  | "customer.create"
  | "customer.edit"
  | "project.view"
  | "project.create"
  | "project.edit"
  | "project.assign"
  | "project.change_stage"
  | "documents.view"
  | "documents.change_status"
  | "loan.view"
  | "loan.edit"
  | "kseb.view"
  | "kseb.edit"
  | "installation.view"
  | "installation.edit"
  | "subsidy.view"
  | "subsidy.edit"
  | "duty.view"
  | "duty.create"
  | "duty.edit"
  | "duty.assign"
  | "duty.complete"
  | "task.view"
  | "task.create"
  | "task.edit"
  | "task.assign"
  | "task.complete"
  | "followup.view"
  | "followup.create"
  | "followup.edit"
  | "followup.complete"
  | "reports.view"
  | "team.view"
  | "team.manage"
  | "settings.view"
  | "settings.manage"
  | "audit.view"
  | "user.create"
  | "user.edit"
  | "user.deactivate"
  | "notifications.view";

export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "HOT";

export type LeadStage =
  | "NEW_LEAD"
  | "CONTACTED"
  | "QUALIFIED"
  | "SITE_SURVEY"
  | "QUOTATION"
  | "NEGOTIATION"
  | "BOOKED"
  | "LOST";

export type ProjectStage =
  | "BOOKING_CONFIRMED"
  | "DOCUMENTS"
  | "LOAN"
  | "KSEB_DOCUMENTATION"
  | "KSEB_APPLICATION"
  | "INSTALLATION"
  | "KSEB_INSPECTION"
  | "NET_METER"
  | "SUBSIDY"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";

export type ProjectHealth =
  | "ON_TRACK"
  | "AT_RISK"
  | "DELAYED"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type ProjectType = "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type DocumentType =
  | "AADHAAR"
  | "PAN"
  | "ELECTRICITY_BILL"
  | "BANK_PASSBOOK"
  | "CANCELLED_CHEQUE"
  | "TAX_RECEIPT_PROPERTY"
  | "CUSTOMER_PHOTO"
  | "SITE_PHOTO"
  | "OTHER";

// Pure status tracking: PENDING, COLLECTED, NOT_REQUIRED (Never UPLOADED)
export type DocumentStatus = "PENDING" | "COLLECTED" | "NOT_REQUIRED";

export type LoanStatus =
  | "NOT_REQUIRED"
  | "NOT_STARTED"
  | "APPLICATION_SUBMITTED"
  | "DOCUMENT_VERIFICATION"
  | "UNDER_PROCESS"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSEMENT_PENDING"
  | "DISBURSED";

export type KsebStatus =
  | "NOT_STARTED"
  | "DOCUMENTATION"
  | "APPLICATION_PREPARATION"
  | "APPLICATION_SUBMITTED"
  | "FEASIBILITY"
  | "AGREEMENT"
  | "INSPECTION"
  | "APPROVED"
  | "NET_METER_PENDING"
  | "NET_METER_INSTALLED"
  | "COMPLETED";

export type InstallationStatus =
  | "NOT_STARTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ON_HOLD";

export type SubsidyStatus =
  | "NOT_APPLICABLE"
  | "NOT_STARTED"
  | "APPLICATION"
  | "INSPECTION"
  | "APPROVAL"
  | "PROCESSING"
  | "CREDITED"
  | "COMPLETED";

export type ActionType =
  | "CALL"
  | "WHATSAPP"
  | "SITE_VISIT"
  | "MEETING"
  | "SEND_QUOTATION"
  | "COLLECT_DOCUMENTS"
  | "OTHER";

export type FollowUpStatus = "PENDING" | "COMPLETED" | "RESCHEDULED" | "CANCELLED";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type DutyType =
  | "LEAD_FOLLOWUP"
  | "SITE_SURVEY"
  | "DOCUMENT_COLLECTION"
  | "LOAN_FOLLOWUP"
  | "KSEB_PROCESSING"
  | "INSTALLATION"
  | "PROJECT_COORDINATION"
  | "CUSTOMER_COMMUNICATION"
  | "OTHER";

export type DutyStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CustomPermissionOverrides {
  grants?: Permission[];
  denials?: Permission[];
}

export interface User {
  id: string; // Alias for uid
  uid: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  role: Role | null;
  roleId?: Role | null;
  superAdmin?: boolean;
  approvalStatus?: ApprovalStatus;
  department: string;
  designation: string;
  active: boolean;
  status?: EmployeeStatus;
  avatar?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  registeredAt?: string;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  deviceInfo?: string | null;
  customPermissions?: CustomPermissionOverrides | null;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  department: string;
  permissions: Permission[];
}

export interface Duty {
  id: string;
  title: string;
  description?: string | null;
  dutyType: DutyType;
  assignedTo: string; // User UID
  assignedUser?: User | null;
  assignedBy: string; // Creator UID
  assignedByUser?: User | null;
  leadId?: string | null;
  lead?: Lead | null;
  customerId?: string | null;
  customer?: Customer | null;
  projectId?: string | null;
  project?: Project | null;
  taskId?: string | null;
  dueDate: string;
  priority: Priority;
  status: DutyStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  leadNumber: string;
  customerName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  district: string;
  leadSource: string;
  assignedSalespersonId: string;
  assignedSalesperson?: User;
  priority: LeadPriority;
  estimatedSystemSizeKw: number;
  monthlyElectricityBill?: number | null;
  requirementNotes?: string | null;
  currentStage: LeadStage;
  lostReason?: string | null;
  stageChangedAt: string;
  nextFollowUpDate?: string | null;
  convertedToCustomerId?: string | null;
  convertedToProjectId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  address: string;
  district: string;
  consumerNumber?: string | null;
  ksebConsumerNumber?: string | null;
  ksebSection?: string | null;
  ksebSubDivision?: string | null;
  propertyType: string;
  notes?: string | null;
  originalLeadId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  projects?: Project[];
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  documentType: DocumentType;
  title: string;
  isRequired: boolean;
  status: DocumentStatus;
  updatedById?: string | null;
  updatedBy?: User | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanDetail {
  id: string;
  projectId: string;
  loanRequired: boolean;
  financeProvider?: string | null;
  applicationNumber?: string | null;
  applicationDate?: string | null;
  loanAmount?: number | null;
  status: LoanStatus;
  assignedEmployeeId?: string | null;
  assignedEmployee?: User | null;
  notes?: string | null;
  updatedAt: string;
}

export interface KsebDetail {
  id: string;
  projectId: string;
  consumerNumber?: string | null;
  sectionOffice?: string | null;
  subDivision?: string | null;
  applicationNumber?: string | null;
  applicationDate?: string | null;
  status: KsebStatus;
  feasibilityStatus?: string | null;
  agreementStatus?: string | null;
  inspectionDate?: string | null;
  inspectionStatus?: string | null;
  netMeterStatus?: string | null;
  netMeterInstalledDate?: string | null;
  notes?: string | null;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  status: "PENDING" | "COMPLETED" | "NOT_APPLICABLE";
  completedAt?: string | null;
  completedBy?: string | null;
}

export interface PhotoProof {
  id: string;
  url: string;
  title: string;
  caption?: string;
  uploadedAt: string;
}

export interface InstallationDetail {
  id: string;
  projectId: string;
  installationTeamName?: string | null;
  supervisorId?: string | null;
  supervisor?: User | null;
  scheduledDate?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
  status: InstallationStatus;
  checklist: ChecklistItem[];
  photos: PhotoProof[];
  notes?: string | null;
  updatedAt: string;
}

export interface SubsidyDetail {
  id: string;
  projectId: string;
  subsidyApplicable: boolean;
  portalApplicationNumber?: string | null;
  applicationDate?: string | null;
  status: SubsidyStatus;
  inspectionStatus?: string | null;
  approvalStatus?: string | null;
  creditStatus?: string | null;
  creditedDate?: string | null;
  estimatedSubsidyAmount?: number | null;
  notes?: string | null;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  leadId?: string | null;
  lead?: Lead | null;
  customerId?: string | null;
  customer?: Customer | null;
  projectId?: string | null;
  project?: Project | null;
  assignedUserId: string;
  assignedUser?: User | null;
  dueDate: string;
  dueTime: string;
  actionType: ActionType;
  notes?: string | null;
  status: FollowUpStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId?: string | null;
  project?: Project | null;
  leadId?: string | null;
  lead?: Lead | null;
  customerId?: string | null;
  customer?: Customer | null;
  title: string;
  description?: string | null;
  assignedUserId: string;
  assignedUser?: User | null;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectNumber: string;
  customerId: string;
  customer?: Customer;
  leadId?: string | null;
  lead?: Lead | null;
  systemSizeKw: number;
  projectType: ProjectType;
  inverterCapacityKw?: number | null;
  inverterMake?: string | null;
  panelMake?: string | null;
  salespersonId: string;
  salesperson?: User;
  projectManagerId: string;
  projectManager?: User;
  siteSupervisorId?: string | null;
  siteSupervisor?: User | null;
  currentStageOwnerId?: string | null;
  currentStageOwner?: User | null;
  currentStage: ProjectStage;
  overallStatus: ProjectHealth;
  priority: Priority;
  estimatedProjectValue?: number | null;
  accountsReferenceId?: string | null;
  accountsUrl?: string | null;
  startDate: string;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  nextActionTitle?: string | null;
  nextActionOwnerId?: string | null;
  nextActionOwner?: User | null;
  nextActionDueDate?: string | null;
  nextActionStatus: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  documents?: ProjectDocument[];
  loanDetail?: LoanDetail | null;
  ksebDetail?: KsebDetail | null;
  installationDetail?: InstallationDetail | null;
  subsidyDetail?: SubsidyDetail | null;
  tasks?: Task[];
  duties?: Duty[];
  followUps?: FollowUp[];
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userRole?: string | null;
  action: string;
  actionCategory?: "BUSINESS" | "SECURITY" | "ADMIN_MANAGEMENT" | "OVERRIDE" | "USER_MANAGEMENT";
  targetUserId?: string | null;
  targetUserName?: string | null;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: "NORMAL" | "WARNING" | "CRITICAL";
  isOverride?: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  relatedProjectId?: string | null;
  relatedTaskId?: string | null;
  relatedDutyId?: string | null;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

export interface Note {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  activeProjects: number;
  completedProjects: number;
  followUpsToday: number;
  overdueFollowUps: number;
  projectsAtRisk: number;
  projectsDelayed: number;
  totalCapacityKwSold: number;
  leadsByStage: { stage: LeadStage; label: string; count: number }[];
  projectsByStage: { stage: ProjectStage; label: string; count: number }[];
  needsAttention: {
    id: string;
    type: "OVERDUE_FOLLOWUP" | "OVERDUE_TASK" | "PENDING_DOCS" | "PENDING_LOAN" | "OVERDUE_INSTALLATION" | "OVERDUE_KSEB" | "OVERDUE_DUTY";
    severity: "CRITICAL" | "WARNING";
    title: string;
    subtitle: string;
    dueText: string;
    entityType: "LEAD" | "PROJECT" | "TASK" | "FOLLOWUP" | "DUTY";
    entityId: string;
    linkUrl: string;
  }[];
}

export interface SuperAdminStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  suspendedEmployees: number;
  pendingApprovalsCount: number;
  activeAdmins: number;
  activeProjects: number;
  delayedProjects: number;
  overdueDuties: number;
  overdueTasks: number;
  todayFollowUps: number;
  recentSecurityEventsCount: number;
  recentAdminActionsCount: number;
}

export interface EmployeeWorkloadSummary {
  user: User;
  activeLeadsCount: number;
  activeProjectsCount: number;
  openDutiesCount: number;
  overdueDutiesCount: number;
  todayTasksCount: number;
  upcomingTasksCount: number;
  completedTasksCount: number;
  effectivePermissions: Permission[];
}
