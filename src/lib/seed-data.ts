import {
  User,
  Lead,
  Customer,
  Project,
  ProjectDocument,
  LoanDetail,
  KsebDetail,
  InstallationDetail,
  SubsidyDetail,
  FollowUp,
  Task,
  Duty,
  AuditLog,
  Notification,
  Note,
} from "@/types";
import {
  INITIAL_USERS,
  DEFAULT_DOCUMENT_CHECKLIST,
  DEFAULT_INSTALLATION_CHECKLIST,
} from "./constants";

export function generateSeedData() {
  const users: User[] = INITIAL_USERS.map((u) => ({
    ...u,
    createdAt: "2026-01-15T09:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  }));

  const customers: Customer[] = [];
  const leads: Lead[] = [];
  const projects: Project[] = [];
  const documents: ProjectDocument[] = [];
  const loanDetails: LoanDetail[] = [];
  const ksebDetails: KsebDetail[] = [];
  const installationDetails: InstallationDetail[] = [];
  const subsidyDetails: SubsidyDetail[] = [];
  const followUps: FollowUp[] = [];
  const tasks: Task[] = [];
  const duties: Duty[] = [];
  const auditLogs: AuditLog[] = [
    {
      id: "audit-init-1",
      entityType: "USER",
      entityId: "usr-super-admin",
      userId: "usr-super-admin",
      userName: "Vertx Energies Super Admin",
      userRole: "SUPER_ADMIN",
      action: "CREATE",
      actionCategory: "SECURITY",
      targetUserId: "usr-super-admin",
      targetUserName: "Vertx Energies Super Admin",
      description: "Super Administrator authority bootstrap initialized for vertxenergies@gmail.com.",
      severity: "NORMAL",
      createdAt: "2026-01-15T09:00:00.000Z",
    },
  ];
  const notifications: Notification[] = [];
  const notes: Note[] = [];

  return {
    users,
    customers,
    leads,
    projects,
    documents,
    loanDetails,
    ksebDetails,
    installationDetails,
    subsidyDetails,
    followUps,
    tasks,
    duties,
    auditLogs,
    notifications,
    notes,
  };
}
