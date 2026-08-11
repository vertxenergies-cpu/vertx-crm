import fs from "fs";
import path from "path";
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
  DashboardStats,
  ProjectStage,
  ProjectHealth,
  LeadStage,
  Role,
  EmployeeStatus,
  ApprovalStatus,
  SuperAdminStats,
  EmployeeWorkloadSummary,
  CustomPermissionOverrides,
  Permission,
} from "@/types";
import { generateSeedData } from "./seed-data";
import { PROJECT_STAGES_CONFIG, ROLES_CONFIG } from "./constants";

interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  leads: Lead[];
  projects: Project[];
  documents: ProjectDocument[];
  loanDetails: LoanDetail[];
  ksebDetails: KsebDetail[];
  installationDetails: InstallationDetail[];
  subsidyDetails: SubsidyDetail[];
  followUps: FollowUp[];
  tasks: Task[];
  duties: Duty[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  notes: Note[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let memoryDb: DatabaseSchema | null = null;

function ensureDataFile(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw) as DatabaseSchema;
      return memoryDb;
    }
  } catch (err) {
    console.error("Failed to load db file, initializing with seed data", err);
  }

  const seed = generateSeedData();
  memoryDb = seed;
  saveDataFile(seed);
  return seed;
}

function saveDataFile(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    memoryDb = data;
  } catch (err) {
    console.error("Failed to save db file", err);
  }
}

export const db = {
  // Users
  getUsers(): User[] {
    const data = ensureDataFile();
    return data.users;
  },

  getUserById(id: string): User | undefined {
    const data = ensureDataFile();
    return data.users.find((u) => u.id === id || u.uid === id);
  },

  createUser(user: User): User {
    const data = ensureDataFile();
    const existingIndex = data.users.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      data.users[existingIndex] = { ...data.users[existingIndex], ...user, updatedAt: new Date().toISOString() };
      saveDataFile(data);
      return data.users[existingIndex];
    }
    data.users.push(user);
    saveDataFile(data);
    return user;
  },

  updateUserPasswordStatus(uid: string, mustChangePassword: boolean): { success: boolean; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) return { success: false, error: "User not found." };
    user.mustChangePassword = mustChangePassword;
    user.updatedAt = new Date().toISOString();
    saveDataFile(data);

    this.createAuditLog({
      entityType: "USER",
      entityId: user.uid,
      userId: user.uid,
      userName: user.name,
      userRole: user.role,
      action: "PASSWORD_CHANGED",
      actionCategory: "SECURITY",
      description: `User ${user.name} (${user.email}) updated account password. Temporary password requirement resolved.`,
      newValue: `mustChangePassword=${mustChangePassword}`,
    });

    return { success: true };
  },

  // Leads
  getLeads(filters?: {
    search?: string;
    salespersonId?: string;
    district?: string;
    source?: string;
    priority?: string;
    stage?: string;
  }): Lead[] {
    const data = ensureDataFile();
    let leads = [...data.leads];

    if (filters?.salespersonId) {
      leads = leads.filter((l) => l.assignedSalespersonId === filters.salespersonId);
    }
    if (filters?.district) {
      leads = leads.filter((l) => l.district.toLowerCase() === filters.district?.toLowerCase());
    }
    if (filters?.source) {
      leads = leads.filter((l) => l.leadSource.toLowerCase() === filters.source?.toLowerCase());
    }
    if (filters?.priority) {
      leads = leads.filter((l) => l.priority === filters.priority);
    }
    if (filters?.stage) {
      leads = leads.filter((l) => l.currentStage === filters.stage);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.leadNumber.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q)
      );
    }

    // Attach salesperson
    return leads.map((lead) => ({
      ...lead,
      assignedSalesperson: data.users.find((u) => u.id === lead.assignedSalespersonId),
    }));
  },

  getLeadById(id: string): Lead | undefined {
    const data = ensureDataFile();
    const lead = data.leads.find((l) => l.id === id);
    if (!lead) return undefined;

    return {
      ...lead,
      assignedSalesperson: data.users.find((u) => u.id === lead.assignedSalespersonId),
    };
  },

  createLead(input: Omit<Lead, "id" | "leadNumber" | "createdAt" | "updatedAt" | "stageChangedAt">): Lead {
    const data = ensureDataFile();
    const count = data.leads.length + 1;
    const pad = String(count).padStart(4, "0");
    const leadNumber = `LED-2026-${pad}`;

    const newLead: Lead = {
      ...input,
      id: `lead-${Date.now()}`,
      leadNumber,
      stageChangedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.leads.unshift(newLead);

    // Audit log
    this.createAuditLog({
      entityType: "LEAD",
      entityId: newLead.id,
      userId: input.assignedSalespersonId || "system",
      userName: data.users.find((u) => u.id === input.assignedSalespersonId)?.name || "System",
      userRole: "SALES_EXECUTIVE",
      action: "LEAD_CREATED",
      field: null,
      oldValue: null,
      newValue: newLead.currentStage,
      description: `Created new lead ${newLead.leadNumber} for ${newLead.customerName} (${newLead.estimatedSystemSizeKw} kW in ${newLead.district}).`,
    });

    saveDataFile(data);
    return newLead;
  },

  updateLead(id: string, updates: Partial<Lead>, user?: User): Lead | undefined {
    const data = ensureDataFile();
    const index = data.leads.findIndex((l) => l.id === id);
    if (index === -1) return undefined;

    const current = data.leads[index];
    const updated: Lead = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.currentStage && updates.currentStage !== current.currentStage) {
      updated.stageChangedAt = new Date().toISOString();
      this.createAuditLog({
        entityType: "LEAD",
        entityId: id,
        userId: user?.id || "usr-super-admin",
        userName: user?.name || "Sales Team",
        userRole: user?.role || "SALES_EXECUTIVE",
        action: "STAGE_CHANGE",
        field: "currentStage",
        oldValue: current.currentStage,
        newValue: updates.currentStage,
        description: `${user?.name || "Sales User"} updated lead stage to ${updates.currentStage}.`,
      });
    }

    data.leads[index] = updated;
    saveDataFile(data);
    return updated;
  },

  convertLeadToCustomer(leadId: string, customOptions?: {
    systemSizeKw?: number;
    projectValue?: number;
    salespersonId?: string;
    projectManagerId?: string;
    ksebConsumerNumber?: string;
    ksebSection?: string;
  }, user?: User): { customer: Customer; project: Project } {
    const data = ensureDataFile();
    const lead = data.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error("Lead not found");

    // Check if customer already exists
    let existingCustomer = data.customers.find((c) => c.phone === lead.phone || c.originalLeadId === lead.id);
    const customer: Customer = existingCustomer || {
      id: `cust-${Date.now()}`,
      customerNumber: `CUST-2026-${String(data.customers.length + 1).padStart(4, "0")}`,
      name: lead.customerName,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      email: lead.email || null,
      address: lead.address || `Address in ${lead.district}`,
      district: lead.district,
      consumerNumber: customOptions?.ksebConsumerNumber || null,
      ksebConsumerNumber: customOptions?.ksebConsumerNumber || null,
      ksebSection: customOptions?.ksebSection || null,
      ksebSubDivision: null,
      propertyType: "Residential Villa",
      notes: lead.requirementNotes,
      originalLeadId: lead.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!existingCustomer) {
      data.customers.push(customer);
    }

    // Create Project
    const projCount = data.projects.length + 1;
    const projPad = String(480 + projCount).padStart(5, "0");
    const projectNumber = `SOL-2026-${projPad}`;
    const systemSizeKw = customOptions?.systemSizeKw || lead.estimatedSystemSizeKw || 5.0;
    const projectValue = customOptions?.projectValue || (systemSizeKw * 57000);

    const project: Project = {
      id: `proj-${Date.now()}`,
      projectNumber,
      customerId: customer.id,
      leadId: lead.id,
      systemSizeKw,
      projectType: "RESIDENTIAL",
      inverterCapacityKw: systemSizeKw,
      inverterMake: "Growatt / Sungrow High Efficiency",
      panelMake: "Waaree / Vikram Solar TopCon Bi-facial",
      salespersonId: customOptions?.salespersonId || lead.assignedSalespersonId || "usr-super-admin",
      projectManagerId: customOptions?.projectManagerId || "usr-super-admin",
      siteSupervisorId: "usr-super-admin",
      currentStage: "BOOKING_CONFIRMED",
      overallStatus: "ON_TRACK",
      priority: lead.priority === "HOT" || lead.priority === "HIGH" ? "HIGH" : "MEDIUM",
      estimatedProjectValue: projectValue,
      accountsReferenceId: `ACC-INV-2026-${1000 + projCount}`,
      startDate: new Date().toISOString(),
      expectedCompletionDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      nextActionTitle: "Collect KYC documents, Electricity Bill and signed Agreement",
      nextActionOwnerId: lead.assignedSalespersonId || "usr-super-admin",
      nextActionDueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      nextActionStatus: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.projects.unshift(project);

    // Create Stage Trackers for Project
    // 1. Documents (Pure status tracking)
    const defaultDocChecklist = [
      { documentType: "AADHAAR" as const, title: "Aadhaar Card", isRequired: true },
      { documentType: "PAN" as const, title: "PAN Card", isRequired: true },
      { documentType: "ELECTRICITY_BILL" as const, title: "Latest KSEB Electricity Bill", isRequired: true },
      { documentType: "BANK_PASSBOOK" as const, title: "Bank Passbook", isRequired: true },
      { documentType: "CANCELLED_CHEQUE" as const, title: "Cancelled Cheque", isRequired: true },
      { documentType: "TAX_RECEIPT_PROPERTY" as const, title: "Building Tax Receipt / Ownership Proof", isRequired: true },
      { documentType: "CUSTOMER_PHOTO" as const, title: "Customer Photograph", isRequired: false },
      { documentType: "SITE_PHOTO" as const, title: "Roof & Existing Meter Photos", isRequired: false },
    ];

    defaultDocChecklist.forEach((doc, idx) => {
      data.documents.push({
        id: `doc-${project.id}-${idx + 1}`,
        projectId: project.id,
        documentType: doc.documentType,
        title: doc.title,
        isRequired: doc.isRequired,
        status: "PENDING",
        updatedById: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // 2. Loan Detail
    data.loanDetails.push({
      id: `loan-${project.id}`,
      projectId: project.id,
      loanRequired: false,
      status: "NOT_REQUIRED",
      updatedAt: new Date().toISOString(),
    });

    // 3. KSEB Detail
    data.ksebDetails.push({
      id: `kseb-${project.id}`,
      projectId: project.id,
      consumerNumber: customer.ksebConsumerNumber || null,
      sectionOffice: customer.ksebSection || null,
      status: "NOT_STARTED",
      feasibilityStatus: "Pending",
      agreementStatus: "Pending",
      inspectionStatus: "Not Scheduled",
      netMeterStatus: "Pending",
      updatedAt: new Date().toISOString(),
    });

    // 4. Installation Detail
    data.installationDetails.push({
      id: `inst-${project.id}`,
      projectId: project.id,
      installationTeamName: "Malabar Solar Crew",
      supervisorId: "usr-super-admin",
      status: "NOT_STARTED",
      checklist: [
        { id: "item-1", title: "Material & Component delivery verified at site", status: "PENDING" },
        { id: "item-2", title: "Installation team assigned & brief reviewed", status: "PENDING" },
        { id: "item-3", title: "Roof structure & mounting points prepared", status: "PENDING" },
        { id: "item-4", title: "Aluminium / GI mounting structure erected & torqued", status: "PENDING" },
        { id: "item-5", title: "Solar PV modules mounted & clamped properly", status: "PENDING" },
        { id: "item-6", title: "On-grid solar inverter mounted in shaded dry location", status: "PENDING" },
        { id: "item-7", title: "DC cabling & MC4 crimping completed with conduit", status: "PENDING" },
        { id: "item-8", title: "AC cabling & breaker/isolator switch box connected", status: "PENDING" },
        { id: "item-9", title: "Dedicated earthing pits (DC, AC, Inverter) installed", status: "PENDING" },
        { id: "item-10", title: "Lightning arrester (LA) installed with separate earthing", status: "PENDING" },
        { id: "item-11", title: "DCDB & ACDB surge protection devices (SPDs) verified", status: "PENDING" },
        { id: "item-12", title: "Voltage, polarity & insulation testing completed", status: "PENDING" },
        { id: "item-13", title: "Inverter trial run & generation testing verified", status: "PENDING" },
        { id: "item-14", title: "Customer handover, safety orientation & photos uploaded", status: "PENDING" },
      ],
      photos: [],
      updatedAt: new Date().toISOString(),
    });

    // 5. Subsidy Detail
    data.subsidyDetails.push({
      id: `sub-${project.id}`,
      projectId: project.id,
      subsidyApplicable: true,
      status: "NOT_STARTED",
      inspectionStatus: "Pending",
      approvalStatus: "Pending",
      creditStatus: "Pending",
      estimatedSubsidyAmount: systemSizeKw <= 2 ? 60000 : 78000,
      notes: "PM Surya Ghar Muft Bijli Yojana national subsidy.",
      updatedAt: new Date().toISOString(),
    });

    // Update Lead stage to BOOKED
    lead.currentStage = "BOOKED";
    lead.convertedToCustomerId = customer.id;
    lead.updatedAt = new Date().toISOString();

    // Create Audit Log
    this.createAuditLog({
      entityType: "PROJECT",
      entityId: project.id,
      userId: user?.id || "usr-super-admin",
      userName: user?.name || "Sales Executive",
      userRole: user?.role || "SALES_EXECUTIVE",
      action: "PROJECT_CREATED",
      field: "currentStage",
      oldValue: "LEAD_CONVERTED",
      newValue: "BOOKING_CONFIRMED",
      description: `Converted lead ${lead.leadNumber} to Customer ${customer.name} and initiated Solar Project ${project.projectNumber} (${systemSizeKw} kW).`,
    });

    saveDataFile(data);
    return { customer, project };
  },

  // Customers
  getCustomers(search?: string): Customer[] {
    const data = ensureDataFile();
    let customers = [...data.customers];

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.customerNumber.toLowerCase().includes(q) ||
          (c.ksebConsumerNumber && c.ksebConsumerNumber.includes(q)) ||
          c.district.toLowerCase().includes(q)
      );
    }

    return customers.map((c) => ({
      ...c,
      projects: data.projects.filter((p) => p.customerId === c.id),
    }));
  },

  getCustomerById(id: string): Customer | undefined {
    const data = ensureDataFile();
    const customer = data.customers.find((c) => c.id === id);
    if (!customer) return undefined;

    return {
      ...customer,
      projects: data.projects.filter((p) => p.customerId === customer.id),
    };
  },

  createCustomer(input: Omit<Customer, "id" | "customerNumber" | "createdAt" | "updatedAt">): Customer {
    const data = ensureDataFile();
    const count = data.customers.length + 1;
    const customerNumber = `CUST-2026-${String(count).padStart(4, "0")}`;

    const newCust: Customer = {
      ...input,
      id: `cust-${Date.now()}`,
      customerNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.customers.push(newCust);
    saveDataFile(data);
    return newCust;
  },

  updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const data = ensureDataFile();
    const idx = data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    const updated: Customer = {
      ...data.customers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    data.customers[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Projects
  getProjects(filters?: {
    stage?: string;
    status?: string;
    salespersonId?: string;
    projectManagerId?: string;
    district?: string;
    search?: string;
  }): Project[] {
    return this.getProjectsWithCounts(filters).projects;
  },

  getProjectsWithCounts(filters?: {
    stage?: string;
    status?: string;
    salespersonId?: string;
    projectManagerId?: string;
    district?: string;
    search?: string;
  }): {
    projects: Project[];
    total: number;
    stageCounts: Record<string, number>;
    healthCounts: Record<string, number>;
  } {
    const data = ensureDataFile();

    const matchFilters = (
      p: Project,
      f?: {
        stage?: string;
        status?: string;
        salespersonId?: string;
        projectManagerId?: string;
        district?: string;
        search?: string;
      }
    ) => {
      if (f?.stage && f.stage !== "ALL" && p.currentStage !== f.stage) return false;
      if (f?.status && f.status !== "ALL" && p.overallStatus !== f.status) return false;
      if (f?.salespersonId && f.salespersonId !== "ALL" && p.salespersonId !== f.salespersonId) return false;
      if (f?.projectManagerId && f.projectManagerId !== "ALL" && p.projectManagerId !== f.projectManagerId) return false;
      if (f?.district && f.district !== "ALL") {
        const cust = data.customers.find((c) => c.id === p.customerId);
        if (!cust || cust.district.toLowerCase() !== f.district.toLowerCase()) return false;
      }
      if (f?.search && f.search.trim()) {
        const q = f.search.trim().toLowerCase();
        const cust = data.customers.find((c) => c.id === p.customerId);
        const kseb = data.ksebDetails.find((k) => k.projectId === p.id);
        const loan = data.loanDetails.find((l) => l.projectId === p.id);

        const matches =
          p.projectNumber.toLowerCase().includes(q) ||
          (cust && (cust.name.toLowerCase().includes(q) || cust.phone.includes(q) || cust.district.toLowerCase().includes(q))) ||
          (kseb && (kseb.consumerNumber?.toLowerCase().includes(q) || kseb.applicationNumber?.toLowerCase().includes(q))) ||
          (loan && loan.applicationNumber?.toLowerCase().includes(q));

        if (!matches) return false;
      }
      return true;
    };

    const filtered = data.projects.filter((p) => matchFilters(p, filters));

    // Dynamic stage counts matching other active filters (status, district, search, etc.)
    const allStageIds: ProjectStage[] = [
      "BOOKING_CONFIRMED",
      "DOCUMENTS",
      "LOAN",
      "KSEB_DOCUMENTATION",
      "KSEB_APPLICATION",
      "INSTALLATION",
      "KSEB_INSPECTION",
      "NET_METER",
      "SUBSIDY",
      "COMPLETED",
    ];

    const stageCounts: Record<string, number> = {
      ALL: data.projects.filter((p) => matchFilters(p, { ...filters, stage: undefined })).length,
    };

    allStageIds.forEach((stageId) => {
      stageCounts[stageId] = data.projects.filter(
        (p) => p.currentStage === stageId && matchFilters(p, { ...filters, stage: undefined })
      ).length;
    });

    // Dynamic health counts matching other active filters (stage, district, search, etc.)
    const allHealthIds: ProjectHealth[] = ["ON_TRACK", "AT_RISK", "DELAYED", "ON_HOLD", "COMPLETED", "CANCELLED"];
    const healthCounts: Record<string, number> = {
      ALL: data.projects.filter((p) => matchFilters(p, { ...filters, status: undefined })).length,
    };

    allHealthIds.forEach((healthId) => {
      healthCounts[healthId] = data.projects.filter(
        (p) => p.overallStatus === healthId && matchFilters(p, { ...filters, status: undefined })
      ).length;
    });

    return {
      projects: filtered.map((p) => this.populateProject(p, data)),
      total: filtered.length,
      stageCounts,
      healthCounts,
    };
  },

  getProjectById(id: string): Project | undefined {
    const data = ensureDataFile();
    const project = data.projects.find((p) => p.id === id || p.projectNumber === id);
    if (!project) return undefined;

    return this.populateProject(project, data);
  },

  populateProject(p: Project, data: DatabaseSchema): Project {
    return {
      ...p,
      customer: data.customers.find((c) => c.id === p.customerId),
      salesperson: data.users.find((u) => u.id === p.salespersonId),
      projectManager: data.users.find((u) => u.id === p.projectManagerId),
      siteSupervisor: data.users.find((u) => u.id === p.siteSupervisorId),
      nextActionOwner: data.users.find((u) => u.id === p.nextActionOwnerId),
      documents: data.documents.filter((d) => d.projectId === p.id),
      loanDetail: data.loanDetails.find((l) => l.projectId === p.id) || null,
      ksebDetail: data.ksebDetails.find((k) => k.projectId === p.id) || null,
      installationDetail: data.installationDetails.find((i) => i.projectId === p.id) || null,
      subsidyDetail: data.subsidyDetails.find((s) => s.projectId === p.id) || null,
      tasks: data.tasks.filter((t) => t.projectId === p.id),
      followUps: data.followUps.filter((f) => f.projectId === p.id),
    };
  },

  updateProjectStage(
    projectId: string,
    newStage: ProjectStage,
    user: User,
    comment?: string
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    const current = data.projects[idx];
    const oldStage = current.currentStage;
    current.currentStage = newStage;
    current.updatedAt = new Date().toISOString();

    if (newStage === "COMPLETED") {
      current.actualCompletionDate = new Date().toISOString();
      current.overallStatus = "COMPLETED";
    }

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STAGE_CHANGE",
      field: "currentStage",
      oldValue: oldStage,
      newValue: newStage,
      description: `${user.name} changed project stage from ${oldStage} to ${newStage}.${comment ? ` Note: ${comment}` : ""}`,
    });

    saveDataFile(data);
    return this.populateProject(current, data);
  },

  updateProjectNextAction(
    projectId: string,
    action: {
      title: string;
      ownerId: string;
      dueDate: string;
      status?: string;
    },
    user: User
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    const current = data.projects[idx];
    const oldAction = current.nextActionTitle;

    current.nextActionTitle = action.title;
    current.nextActionOwnerId = action.ownerId;
    current.nextActionDueDate = action.dueDate;
    current.nextActionStatus = action.status || "PENDING";
    current.updatedAt = new Date().toISOString();

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "NEXT_ACTION_UPDATE",
      field: "nextActionTitle",
      oldValue: oldAction,
      newValue: action.title,
      description: `${user.name} updated Next Action to '${action.title}' (Assigned to: ${data.users.find((u) => u.id === action.ownerId)?.name || "Team"}).`,
    });

    saveDataFile(data);
    return this.populateProject(current, data);
  },

  updateProjectHealth(
    projectId: string,
    health: ProjectHealth,
    user: User,
    reason?: string
  ): Project | undefined {
    const data = ensureDataFile();
    const idx = data.projects.findIndex((p) => p.id === projectId);
    if (idx === -1) return undefined;

    const current = data.projects[idx];
    const oldHealth = current.overallStatus;
    current.overallStatus = health;
    current.updatedAt = new Date().toISOString();

    this.createAuditLog({
      entityType: "PROJECT",
      entityId: projectId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "STATUS_UPDATE",
      field: "overallStatus",
      oldValue: oldHealth,
      newValue: health,
      description: `${user.name} updated health status to ${health}.${reason ? ` Reason: ${reason}` : ""}`,
    });

    saveDataFile(data);
    return this.populateProject(current, data);
  },

  // Documents
  getDocuments(projectId: string): ProjectDocument[] {
    const data = ensureDataFile();
    return data.documents
      .filter((d) => d.projectId === projectId)
      .map((doc) => ({
        ...doc,
        updatedBy: data.users.find((u) => u.id === doc.updatedById),
      }));
  },

  updateDocument(
    docId: string,
    updates: Partial<ProjectDocument>,
    user: User
  ): ProjectDocument | undefined {
    const data = ensureDataFile();
    const idx = data.documents.findIndex((d) => d.id === docId);
    if (idx === -1) return undefined;

    const current = data.documents[idx];
    const updated: ProjectDocument = {
      ...current,
      ...updates,
      updatedById: user.id,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status && updates.status !== current.status) {
      const formatStatus = (s: string) => {
        if (s === "COLLECTED") return "Collected";
        if (s === "NOT_REQUIRED") return "Not Required";
        return "Pending";
      };

      this.createAuditLog({
        entityType: "DOCUMENT",
        entityId: current.projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: current.status,
        newValue: updates.status,
        description: `${user.name} changed ${current.title} FROM: ${formatStatus(current.status)} TO: ${formatStatus(updates.status)}`,
      });
    }

    data.documents[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Duties
  getDuties(filters?: { assignedTo?: string; status?: string; projectId?: string }): Duty[] {
    const data = ensureDataFile();
    let duties = [...(data.duties || [])];

    if (filters?.assignedTo && filters.assignedTo !== "ALL") {
      duties = duties.filter((d) => d.assignedTo === filters.assignedTo);
    }
    if (filters?.status && filters.status !== "ALL") {
      duties = duties.filter((d) => d.status === filters.status);
    }
    if (filters?.projectId) {
      duties = duties.filter((d) => d.projectId === filters.projectId);
    }

    return duties.map((d) => ({
      ...d,
      assignedUser: data.users.find((u) => u.id === d.assignedTo),
      assignedByUser: data.users.find((u) => u.id === d.assignedBy),
      project: d.projectId ? data.projects.find((p) => p.id === d.projectId) : null,
      lead: d.leadId ? data.leads.find((l) => l.id === d.leadId) : null,
      customer: d.customerId ? data.customers.find((c) => c.id === d.customerId) : null,
    }));
  },

  createDuty(duty: Omit<Duty, "id" | "createdAt" | "updatedAt">, user: User): Duty {
    const data = ensureDataFile();
    if (!data.duties) data.duties = [];

    const newDuty: Duty = {
      ...duty,
      id: `duty-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.duties.push(newDuty);

    this.createAuditLog({
      entityType: "DUTY",
      entityId: newDuty.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: "DUTY_ASSIGNED",
      description: `${user.name} assigned duty '${newDuty.title}' to ${data.users.find((u) => u.id === newDuty.assignedTo)?.name || "Employee"}`,
    });

    saveDataFile(data);
    return newDuty;
  },

  updateDuty(dutyId: string, updates: Partial<Duty>, user: User): Duty | undefined {
    const data = ensureDataFile();
    if (!data.duties) data.duties = [];

    const idx = data.duties.findIndex((d) => d.id === dutyId);
    if (idx === -1) return undefined;

    const current = data.duties[idx];
    const updated: Duty = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === "COMPLETED" && current.status !== "COMPLETED") {
      updated.completedAt = new Date().toISOString();
      this.createAuditLog({
        entityType: "DUTY",
        entityId: dutyId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "DUTY_COMPLETED",
        description: `${user.name} marked duty '${current.title}' as COMPLETED`,
      });
    }

    data.duties[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Stage Trackers
  updateLoanDetail(projectId: string, updates: Partial<LoanDetail>, user: User): LoanDetail {
    const data = ensureDataFile();
    let loan = data.loanDetails.find((l) => l.projectId === projectId);

    if (!loan) {
      loan = {
        id: `loan-${Date.now()}`,
        projectId,
        loanRequired: true,
        status: "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      };
      data.loanDetails.push(loan);
    }

    const oldStatus = loan.status;
    Object.assign(loan, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "LOAN",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed Loan status from ${oldStatus} to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return loan;
  },

  updateKsebDetail(projectId: string, updates: Partial<KsebDetail>, user: User): KsebDetail {
    const data = ensureDataFile();
    let kseb = data.ksebDetails.find((k) => k.projectId === projectId);

    if (!kseb) {
      kseb = {
        id: `kseb-${Date.now()}`,
        projectId,
        status: "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      };
      data.ksebDetails.push(kseb);
    }

    const oldStatus = kseb.status;
    Object.assign(kseb, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "KSEB",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed KSEB status from ${oldStatus} to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return kseb;
  },

  updateInstallationDetail(projectId: string, updates: Partial<InstallationDetail>, user: User): InstallationDetail {
    const data = ensureDataFile();
    let inst = data.installationDetails.find((i) => i.projectId === projectId);

    if (!inst) {
      inst = {
        id: `inst-${Date.now()}`,
        projectId,
        status: "NOT_STARTED",
        checklist: [],
        photos: [],
        updatedAt: new Date().toISOString(),
      };
      data.installationDetails.push(inst);
    }

    const oldStatus = inst.status;
    Object.assign(inst, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "INSTALLATION",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed Installation status to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return inst;
  },

  updateSubsidyDetail(projectId: string, updates: Partial<SubsidyDetail>, user: User): SubsidyDetail {
    const data = ensureDataFile();
    let sub = data.subsidyDetails.find((s) => s.projectId === projectId);

    if (!sub) {
      sub = {
        id: `sub-${Date.now()}`,
        projectId,
        subsidyApplicable: true,
        status: "NOT_STARTED",
        updatedAt: new Date().toISOString(),
      };
      data.subsidyDetails.push(sub);
    }

    const oldStatus = sub.status;
    Object.assign(sub, updates, { updatedAt: new Date().toISOString() });

    if (updates.status && updates.status !== oldStatus) {
      this.createAuditLog({
        entityType: "SUBSIDY",
        entityId: projectId,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: "STATUS_UPDATE",
        field: "status",
        oldValue: oldStatus,
        newValue: updates.status,
        description: `${user.name} changed PM Surya Ghar Subsidy status to ${updates.status}.`,
      });
    }

    saveDataFile(data);
    return sub;
  },

  // Follow-ups
  getFollowUps(filters?: { status?: string; assignedUserId?: string; category?: "overdue" | "today" | "upcoming" }): FollowUp[] {
    const data = ensureDataFile();
    let list = [...data.followUps];

    if (filters?.status) {
      list = list.filter((f) => f.status === filters.status);
    }
    if (filters?.assignedUserId) {
      list = list.filter((f) => f.assignedUserId === filters.assignedUserId);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    if (filters?.category === "overdue") {
      list = list.filter((f) => f.status === "PENDING" && new Date(f.dueDate).getTime() < todayStart);
    } else if (filters?.category === "today") {
      list = list.filter((f) => {
        const time = new Date(f.dueDate).getTime();
        return f.status === "PENDING" && time >= todayStart && time < todayEnd;
      });
    } else if (filters?.category === "upcoming") {
      list = list.filter((f) => {
        const time = new Date(f.dueDate).getTime();
        return f.status === "PENDING" && time >= todayEnd;
      });
    }

    return list.map((f) => ({
      ...f,
      assignedUser: data.users.find((u) => u.id === f.assignedUserId),
      lead: f.leadId ? data.leads.find((l) => l.id === f.leadId) : null,
      customer: f.customerId ? data.customers.find((c) => c.id === f.customerId) : null,
      project: f.projectId ? data.projects.find((p) => p.id === f.projectId) : null,
    }));
  },

  createFollowUp(input: Omit<FollowUp, "id" | "createdAt" | "updatedAt">): FollowUp {
    const data = ensureDataFile();
    const newFlw: FollowUp = {
      ...input,
      id: `flw-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.followUps.push(newFlw);
    saveDataFile(data);
    return newFlw;
  },

  updateFollowUp(id: string, updates: Partial<FollowUp>): FollowUp | undefined {
    const data = ensureDataFile();
    const idx = data.followUps.findIndex((f) => f.id === id);
    if (idx === -1) return undefined;

    const updated: FollowUp = {
      ...data.followUps[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status === "COMPLETED") {
      updated.completedAt = new Date().toISOString();
    }
    data.followUps[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Tasks
  getTasks(filters?: { projectId?: string; assignedUserId?: string; status?: string }): Task[] {
    const data = ensureDataFile();
    let tasks = [...data.tasks];

    if (filters?.projectId) {
      tasks = tasks.filter((t) => t.projectId === filters.projectId);
    }
    if (filters?.assignedUserId) {
      tasks = tasks.filter((t) => t.assignedUserId === filters.assignedUserId);
    }
    if (filters?.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    return tasks.map((t) => ({
      ...t,
      assignedUser: data.users.find((u) => u.id === t.assignedUserId),
      project: t.projectId ? data.projects.find((p) => p.id === t.projectId) : null,
      customer: t.customerId ? data.customers.find((c) => c.id === t.customerId) : null,
    }));
  },

  createTask(input: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const data = ensureDataFile();
    const newTask: Task = {
      ...input,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.tasks.push(newTask);
    saveDataFile(data);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const data = ensureDataFile();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;

    const updated: Task = {
      ...data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status === "COMPLETED") {
      updated.completedAt = new Date().toISOString();
    }
    data.tasks[idx] = updated;
    saveDataFile(data);
    return updated;
  },

  // Audit Logs
  getAuditLogs(filters?: { entityType?: string; entityId?: string }): AuditLog[] {
    const data = ensureDataFile();
    let logs = [...data.auditLogs];

    if (filters?.entityType && filters?.entityId) {
      logs = logs.filter((l) => l.entityType === filters.entityType && l.entityId === filters.entityId);
    } else if (filters?.entityId) {
      logs = logs.filter((l) => l.entityId === filters.entityId);
    }

    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createAuditLog(log: Omit<AuditLog, "id" | "createdAt">): AuditLog {
    const data = ensureDataFile();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(newLog);
    saveDataFile(data);
    return newLog;
  },

  // Notifications
  getNotifications(userId?: string): Notification[] {
    const data = ensureDataFile();
    let notifs = [...data.notifications];
    if (userId) {
      notifs = notifs.filter((n) => n.userId === userId || n.userId === "usr-super-admin");
    }
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  markNotificationRead(id: string): void {
    const data = ensureDataFile();
    const n = data.notifications.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      saveDataFile(data);
    }
  },

  // Notes
  getNotes(entityType: string, entityId: string): Note[] {
    const data = ensureDataFile();
    return data.notes
      .filter((n) => n.entityType === entityType && n.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createNote(input: Omit<Note, "id" | "createdAt">): Note {
    const data = ensureDataFile();
    const newNote: Note = {
      ...input,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    data.notes.unshift(newNote);
    saveDataFile(data);
    return newNote;
  },

  // Dashboard Stats & Needs Attention
  getDashboardStats(): DashboardStats {
    const data = ensureDataFile();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000;

    const totalLeads = data.leads.length;
    const newLeads = data.leads.filter((l) => l.currentStage === "NEW_LEAD").length;
    const activeProjects = data.projects.filter((p) => p.currentStage !== "COMPLETED" && p.overallStatus !== "CANCELLED").length;
    const completedProjects = data.projects.filter((p) => p.currentStage === "COMPLETED").length;

    const followUpsToday = data.followUps.filter((f) => {
      const time = new Date(f.dueDate).getTime();
      return f.status === "PENDING" && time >= todayStart && time < todayEnd;
    }).length;

    const overdueFollowUps = data.followUps.filter((f) => {
      const time = new Date(f.dueDate).getTime();
      return f.status === "PENDING" && time < todayStart;
    }).length;

    const projectsAtRisk = data.projects.filter((p) => p.overallStatus === "AT_RISK").length;
    const projectsDelayed = data.projects.filter((p) => p.overallStatus === "DELAYED").length;

    const totalCapacityKwSold = data.projects.reduce((sum, p) => sum + (p.systemSizeKw || 0), 0);

    // Leads by Stage
    const leadStageOrder: { stage: LeadStage; label: string }[] = [
      { stage: "NEW_LEAD", label: "New Lead" },
      { stage: "CONTACTED", label: "Contacted" },
      { stage: "QUALIFIED", label: "Qualified" },
      { stage: "SITE_SURVEY", label: "Site Survey" },
      { stage: "QUOTATION", label: "Quotation" },
      { stage: "NEGOTIATION", label: "Negotiation" },
      { stage: "BOOKED", label: "Booked" },
      { stage: "LOST", label: "Lost" },
    ];
    const leadsByStage = leadStageOrder.map((item) => ({
      ...item,
      count: data.leads.filter((l) => l.currentStage === item.stage).length,
    }));

    // Projects by Stage
    const projectsByStage = PROJECT_STAGES_CONFIG.map((stage) => ({
      stage: stage.id,
      label: stage.shortLabel,
      count: data.projects.filter((p) => p.currentStage === stage.id).length,
    }));

    // Needs Attention List
    const needsAttention: DashboardStats["needsAttention"] = [];

    // 1. Overdue Follow-ups
    data.followUps
      .filter((f) => f.status === "PENDING" && new Date(f.dueDate).getTime() < todayStart)
      .forEach((f) => {
        const lead = f.leadId ? data.leads.find((l) => l.id === f.leadId) : null;
        const cust = f.customerId ? data.customers.find((c) => c.id === f.customerId) : null;
        const name = lead?.customerName || cust?.name || "Client";
        needsAttention.push({
          id: f.id,
          type: "OVERDUE_FOLLOWUP",
          severity: "CRITICAL",
          title: `Overdue Follow-up: ${name} (${f.actionType})`,
          subtitle: f.notes || "Follow-up deadline elapsed",
          dueText: `Due: ${new Date(f.dueDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
          entityType: "FOLLOWUP",
          entityId: f.id,
          linkUrl: "/followups",
        });
      });

    // 2. Overdue Next Actions / Tasks on Projects
    data.projects
      .filter((p) => p.nextActionDueDate && new Date(p.nextActionDueDate).getTime() < todayStart && p.nextActionStatus !== "COMPLETED")
      .forEach((p) => {
        const cust = data.customers.find((c) => c.id === p.customerId);
        needsAttention.push({
          id: `na-${p.id}`,
          type: "OVERDUE_TASK",
          severity: "CRITICAL",
          title: `Overdue Next Action: ${p.nextActionTitle}`,
          subtitle: `Project #${p.projectNumber} - ${cust?.name || "Customer"} (${p.systemSizeKw} kW)`,
          dueText: `Overdue since ${new Date(p.nextActionDueDate!).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
          entityType: "PROJECT",
          entityId: p.id,
          linkUrl: `/projects/${p.id}`,
        });
      });

    // 3. Projects Delayed or At Risk
    data.projects
      .filter((p) => p.overallStatus === "DELAYED")
      .forEach((p) => {
        const cust = data.customers.find((c) => c.id === p.customerId);
        needsAttention.push({
          id: `del-${p.id}`,
          type: "OVERDUE_KSEB",
          severity: "CRITICAL",
          title: `Delayed Project: #${p.projectNumber} (${cust?.name})`,
          subtitle: `Stage: ${p.currentStage} | Priority: ${p.priority}`,
          dueText: "Immediate management review needed",
          entityType: "PROJECT",
          entityId: p.id,
          linkUrl: `/projects/${p.id}`,
        });
      });

    // 4. Projects stuck waiting for documents
    data.projects
      .filter((p) => p.currentStage === "DOCUMENTS" || p.currentStage === "BOOKING_CONFIRMED")
      .forEach((p) => {
        const pendingDocs = data.documents.filter(
          (d) => d.projectId === p.id && d.isRequired && d.status === "PENDING"
        );
        if (pendingDocs.length > 0) {
          const cust = data.customers.find((c) => c.id === p.customerId);
          needsAttention.push({
            id: `doc-pend-${p.id}`,
            type: "PENDING_DOCS",
            severity: "WARNING",
            title: `Pending Documents: ${cust?.name} (${pendingDocs.length} remaining)`,
            subtitle: `Project #${p.projectNumber} awaiting required customer documents`,
            dueText: "Awaiting Uploads",
            entityType: "PROJECT",
            entityId: p.id,
            linkUrl: `/projects/${p.id}?tab=documents`,
          });
        }
      });

    return {
      totalLeads,
      newLeads,
      activeProjects,
      completedProjects,
      followUpsToday,
      overdueFollowUps,
      projectsAtRisk,
      projectsDelayed,
      totalCapacityKwSold,
      leadsByStage,
      projectsByStage,
      needsAttention,
    };
  },

  // Global Search
  searchGlobal(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return { customers: [], projects: [], leads: [], tasks: [] };

    const data = ensureDataFile();

    const customers = data.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.customerNumber.toLowerCase().includes(q) ||
          (c.ksebConsumerNumber && c.ksebConsumerNumber.includes(q)) ||
          c.district.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const projects = data.projects
      .filter((p) => {
        const cust = data.customers.find((c) => c.id === p.customerId);
        const kseb = data.ksebDetails.find((k) => k.projectId === p.id);
        const loan = data.loanDetails.find((l) => l.projectId === p.id);
        return (
          p.projectNumber.toLowerCase().includes(q) ||
          (cust && (cust.name.toLowerCase().includes(q) || cust.phone.includes(q))) ||
          (kseb && (kseb.consumerNumber?.includes(q) || kseb.applicationNumber?.toLowerCase().includes(q))) ||
          (loan && loan.applicationNumber?.toLowerCase().includes(q))
        );
      })
      .slice(0, 5)
      .map((p) => this.populateProject(p, data));

    const leads = data.leads
      .filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.leadNumber.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const tasks = data.tasks
      .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
      .slice(0, 5);

    return { customers, projects, leads, tasks };
  },

  // Clear all dummy customer & operational data, preserve users
  clearAllCustomersAndData(): void {
    const data = ensureDataFile();
    data.customers = [];
    data.projects = [];
    data.leads = [];
    data.documents = [];
    data.loanDetails = [];
    data.ksebDetails = [];
    data.installationDetails = [];
    data.subsidyDetails = [];
    data.followUps = [];
    data.tasks = [];
    data.duties = [];
    data.notes = [];
    data.auditLogs = [];
    data.notifications = [];
    saveDataFile(data);
  },

  // Reset demo
  resetDemoData(): void {
    const seed = generateSeedData();
    saveDataFile(seed);
  },

  // ==========================================
  // SUPER ADMIN OPERATIONS & GLOBAL AUDIT
  // ==========================================

  getSuperAdminStats(): SuperAdminStats {
    const data = ensureDataFile();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const totalEmployees = data.users.length;
    const pendingApprovalsCount = data.users.filter((u) => u.approvalStatus === "PENDING").length;
    const activeEmployees = data.users.filter((u) => (u.status === "ACTIVE" || (u.status === undefined && u.active !== false)) && u.approvalStatus !== "PENDING" && u.approvalStatus !== "REJECTED").length;
    const inactiveEmployees = data.users.filter((u) => (u.status === "INACTIVE" || (u.status === undefined && u.active === false)) && u.approvalStatus !== "PENDING").length;
    const suspendedEmployees = data.users.filter((u) => u.status === "SUSPENDED").length;

    const activeAdmins = data.users.filter(
      (u) => (u.role === "ADMIN" || u.role === "SUPER_ADMIN") && u.status !== "INACTIVE" && u.status !== "SUSPENDED" && u.approvalStatus !== "PENDING" && u.approvalStatus !== "REJECTED"
    ).length;

    const activeProjects = data.projects.filter(
      (p) => p.currentStage !== "COMPLETED" && p.currentStage !== "CANCELLED"
    ).length;

    const delayedProjects = data.projects.filter((p) => p.overallStatus === "DELAYED").length;

    const overdueDuties = data.duties.filter(
      (d) => d.status !== "COMPLETED" && d.status !== "CANCELLED" && new Date(d.dueDate) < now
    ).length;

    const overdueTasks = data.tasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && new Date(t.dueDate) < now
    ).length;

    const todayFollowUps = data.followUps.filter(
      (f) => f.status === "PENDING" && f.dueDate && f.dueDate.startsWith(todayStr)
    ).length;

    const recentSecurityEventsCount = data.auditLogs.filter((l) => l.actionCategory === "SECURITY").length;
    const recentAdminActionsCount = data.auditLogs.filter((l) => l.userRole === "ADMIN").length;

    return {
      totalEmployees: data.users.filter((u) => u.approvalStatus !== "PENDING" && u.approvalStatus !== "REJECTED").length,
      activeEmployees,
      inactiveEmployees,
      suspendedEmployees,
      pendingApprovalsCount,
      activeAdmins,
      activeProjects,
      delayedProjects,
      overdueDuties,
      overdueTasks,
      todayFollowUps,
      recentSecurityEventsCount,
      recentAdminActionsCount,
    };
  },

  getEmployeesWithWorkload(filters?: {
    role?: string;
    department?: string;
    status?: string;
    search?: string;
  }): EmployeeWorkloadSummary[] {
    const data = ensureDataFile();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    let users = data.users.filter((u) => u.approvalStatus === "APPROVED" || u.superAdmin === true || u.role === "SUPER_ADMIN");

    if (filters?.role && filters.role !== "ALL") {
      users = users.filter((u) => u.role === filters.role);
    }
    if (filters?.department && filters.department !== "ALL") {
      users = users.filter((u) => u.department === filters.department);
    }
    if (filters?.status && filters.status !== "ALL") {
      users = users.filter((u) => (u.status || (u.active ? "ACTIVE" : "INACTIVE")) === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.employeeCode.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }

    return users.map((user) => {
      const activeLeadsCount = data.leads.filter(
        (l) => l.assignedSalespersonId === user.uid && l.currentStage !== "BOOKED" && l.currentStage !== "LOST"
      ).length;

      const activeProjectsCount = data.projects.filter(
        (p) =>
          (p.projectManagerId === user.uid ||
            p.salespersonId === user.uid ||
            p.siteSupervisorId === user.uid ||
            p.currentStageOwnerId === user.uid) &&
          p.currentStage !== "COMPLETED" &&
          p.currentStage !== "CANCELLED"
      ).length;

      const userDuties = data.duties.filter((d) => d.assignedTo === user.uid);
      const openDutiesCount = userDuties.filter((d) => d.status !== "COMPLETED" && d.status !== "CANCELLED").length;
      const overdueDutiesCount = userDuties.filter(
        (d) => d.status !== "COMPLETED" && d.status !== "CANCELLED" && new Date(d.dueDate) < now
      ).length;

      const userTasks = data.tasks.filter((t) => t.assignedUserId === user.uid);
      const todayTasksCount = userTasks.filter((t) => t.status !== "COMPLETED" && t.dueDate.startsWith(todayStr)).length;
      const upcomingTasksCount = userTasks.filter(
        (t) => t.status !== "COMPLETED" && new Date(t.dueDate) > now && !t.dueDate.startsWith(todayStr)
      ).length;
      const completedTasksCount = userTasks.filter((t) => t.status === "COMPLETED").length;

      // Effective permissions: Base + Grants - Denials
      const basePerms = user.role && ROLES_CONFIG[user.role] ? ROLES_CONFIG[user.role].permissions : [];
      const grants = user.customPermissions?.grants || [];
      const denials = new Set(user.customPermissions?.denials || []);
      const effectivePermsSet = new Set<Permission>([...basePerms, ...grants]);
      denials.forEach((d) => effectivePermsSet.delete(d));

      return {
        user: {
          ...user,
          status: user.status || (user.active ? "ACTIVE" : "INACTIVE"),
        },
        activeLeadsCount,
        activeProjectsCount,
        openDutiesCount,
        overdueDutiesCount,
        todayTasksCount,
        upcomingTasksCount,
        completedTasksCount,
        effectivePermissions: Array.from(effectivePermsSet),
      };
    });
  },

  getEmployeeWorkloadDetail(uid: string): {
    summary: EmployeeWorkloadSummary;
    projects: Project[];
    leads: Lead[];
    duties: Duty[];
    tasks: Task[];
    recentActivity: AuditLog[];
  } | null {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) return null;

    const summaries = this.getEmployeesWithWorkload();
    const summary = summaries.find((s) => s.user.uid === user.uid) || {
      user,
      activeLeadsCount: 0,
      activeProjectsCount: 0,
      openDutiesCount: 0,
      overdueDutiesCount: 0,
      todayTasksCount: 0,
      upcomingTasksCount: 0,
      completedTasksCount: 0,
      effectivePermissions: user.role && ROLES_CONFIG[user.role] ? ROLES_CONFIG[user.role].permissions : [],
    };

    const projects = data.projects.filter(
      (p) =>
        p.projectManagerId === user.uid ||
        p.salespersonId === user.uid ||
        p.siteSupervisorId === user.uid ||
        p.currentStageOwnerId === user.uid
    );

    const leads = data.leads.filter((l) => l.assignedSalespersonId === user.uid);
    const duties = data.duties.filter((d) => d.assignedTo === user.uid);
    const tasks = data.tasks.filter((t) => t.assignedUserId === user.uid);

    const recentActivity = data.auditLogs
      .filter((a) => a.userId === user.uid || a.targetUserId === user.uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return {
      summary,
      projects,
      leads,
      duties,
      tasks,
      recentActivity,
    };
  },

  updateEmployeeStatus(
    uid: string,
    newStatus: EmployeeStatus,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];

    // Self-Protection check
    if (targetUser.superAdmin || targetUser.role === "SUPER_ADMIN") {
      if (actor.uid === targetUser.uid && newStatus !== "ACTIVE") {
        return { success: false, error: "Super Administrator cannot demote or deactivate their own account." };
      }
      if (actor.role !== "SUPER_ADMIN") {
        return { success: false, error: "ADMIN accounts cannot modify a Super Administrator account." };
      }
    }

    const oldStatus = targetUser.status || (targetUser.active ? "ACTIVE" : "INACTIVE");
    targetUser.status = newStatus;
    targetUser.active = newStatus === "ACTIVE";
    targetUser.updatedAt = new Date().toISOString();

    // Log security audit event
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: newStatus === "SUSPENDED" ? "USER_SUSPENDED" : newStatus === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      field: "status",
      oldValue: oldStatus,
      newValue: newStatus,
      description: `${actor.name} changed status of ${targetUser.name} from ${oldStatus} to ${newStatus}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: newStatus === "SUSPENDED" ? "WARNING" : "NORMAL",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  changeEmployeeRole(
    uid: string,
    newRole: Role,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];

    // Only existing Super Admin can grant SUPER_ADMIN
    if (newRole === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
      return { success: false, error: "Only an existing Super Administrator can grant Super Admin privileges." };
    }

    // Super Admin cannot self-demote
    if ((targetUser.superAdmin || targetUser.role === "SUPER_ADMIN") && actor.uid === targetUser.uid && newRole !== "SUPER_ADMIN") {
      return { success: false, error: "Super Administrator cannot remove their own Super Admin privileges." };
    }

    // Admin cannot modify Super Admin
    if ((targetUser.superAdmin || targetUser.role === "SUPER_ADMIN") && actor.role !== "SUPER_ADMIN") {
      return { success: false, error: "ADMIN accounts cannot modify a Super Administrator account." };
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    targetUser.roleId = newRole;
    targetUser.superAdmin = newRole === "SUPER_ADMIN";
    targetUser.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "ROLE_CHANGED",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      field: "role",
      oldValue: oldRole,
      newValue: newRole,
      description: `${actor.name} changed role of ${targetUser.name} from ${oldRole} to ${newRole}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  updateEmployeeProfile(
    uid: string,
    updates: Partial<User>,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];

    // Restrict protected fields from direct profile patch
    if (updates.role && updates.role !== targetUser.role) {
      return this.changeEmployeeRole(uid, updates.role, actor);
    }

    if (updates.name) targetUser.name = updates.name;
    if (updates.phone) targetUser.phone = updates.phone;
    if (updates.department) targetUser.department = updates.department;
    if (updates.designation) targetUser.designation = updates.designation;
    if (updates.employeeCode) targetUser.employeeCode = updates.employeeCode;
    targetUser.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      description: `${actor.name} updated profile details for ${targetUser.name}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  updateEmployeePermissions(
    uid: string,
    customPermissions: CustomPermissionOverrides,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const userIndex = data.users.findIndex((u) => u.uid === uid || u.id === uid);
    if (userIndex === -1) {
      return { success: false, error: "Employee not found." };
    }

    const targetUser = data.users[userIndex];
    targetUser.customPermissions = customPermissions;
    targetUser.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "PERMISSION_CHANGED",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      description: `${actor.name} updated custom permission overrides for ${targetUser.name}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true, user: targetUser };
  },

  forceLogoutUser(
    uid: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; error?: string } {
    const data = ensureDataFile();
    const targetUser = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!targetUser) {
      return { success: false, error: "Employee not found." };
    }

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: targetUser.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "FORCE_LOGOUT",
      actionCategory: "SECURITY",
      targetUserId: targetUser.uid,
      targetUserName: targetUser.name,
      description: `${actor.name} forced logout and revoked active sessions for ${targetUser.name}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true };
  },

  reassignWorkAsSuperAdmin(
    type: "PROJECT" | "LEAD" | "DUTY",
    entityId: string,
    newOwnerId: string,
    reason: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; error?: string } {
    const data = ensureDataFile();
    const newOwner = data.users.find((u) => u.uid === newOwnerId || u.id === newOwnerId);
    if (!newOwner) {
      return { success: false, error: "Target employee not found." };
    }

    let oldOwnerName = "Unassigned";
    let entityTitle = entityId;

    if (type === "PROJECT") {
      const proj = data.projects.find((p) => p.id === entityId);
      if (!proj) return { success: false, error: "Project not found." };
      const oldOwner = data.users.find((u) => u.uid === proj.projectManagerId);
      oldOwnerName = oldOwner ? oldOwner.name : "Unassigned";
      entityTitle = proj.projectNumber;
      proj.projectManagerId = newOwner.uid;
      proj.updatedAt = new Date().toISOString();
    } else if (type === "LEAD") {
      const lead = data.leads.find((l) => l.id === entityId);
      if (!lead) return { success: false, error: "Lead not found." };
      const oldOwner = data.users.find((u) => u.uid === lead.assignedSalespersonId);
      oldOwnerName = oldOwner ? oldOwner.name : "Unassigned";
      entityTitle = `${lead.leadNumber} (${lead.customerName})`;
      lead.assignedSalespersonId = newOwner.uid;
      lead.updatedAt = new Date().toISOString();
    } else if (type === "DUTY") {
      const duty = data.duties.find((d) => d.id === entityId);
      if (!duty) return { success: false, error: "Duty not found." };
      const oldOwner = data.users.find((u) => u.uid === duty.assignedTo);
      oldOwnerName = oldOwner ? oldOwner.name : "Unassigned";
      entityTitle = duty.title;
      duty.assignedTo = newOwner.uid;
      duty.updatedAt = new Date().toISOString();
    }

    // Server generates explicit SUPER_ADMIN_OVERRIDE audit record
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: type,
      entityId,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "REASSIGN",
      actionCategory: "OVERRIDE",
      targetUserId: newOwner.uid,
      targetUserName: newOwner.name,
      oldValue: oldOwnerName,
      newValue: newOwner.name,
      isOverride: true,
      description: `SUPER_ADMIN_OVERRIDE: ${actor.name} reassigned ${type} ${entityTitle} from ${oldOwnerName} to ${newOwner.name}. Reason: ${reason || "Super Admin Operational Override"}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };

    data.auditLogs.unshift(audit);
    saveDataFile(data);

    return { success: true };
  },

  getGlobalActivity(options: {
    page?: number;
    limit?: number;
    userId?: string;
    role?: string;
    action?: string;
    actionCategory?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }): { logs: AuditLog[]; total: number; hasMore: boolean } {
    const data = ensureDataFile();
    let logs = [...data.auditLogs];

    if (options.userId && options.userId !== "ALL") {
      logs = logs.filter((l) => l.userId === options.userId || l.targetUserId === options.userId);
    }
    if (options.role && options.role !== "ALL") {
      logs = logs.filter((l) => l.userRole === options.role);
    }
    if (options.action && options.action !== "ALL") {
      logs = logs.filter((l) => l.action === options.action);
    }
    if (options.actionCategory && options.actionCategory !== "ALL") {
      logs = logs.filter((l) => l.actionCategory === options.actionCategory);
    }
    if (options.entityType && options.entityType !== "ALL") {
      logs = logs.filter((l) => l.entityType === options.entityType);
    }
    if (options.startDate) {
      const start = new Date(options.startDate).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() >= start);
    }
    if (options.endDate) {
      const end = new Date(options.endDate).getTime();
      logs = logs.filter((l) => new Date(l.createdAt).getTime() <= end);
    }

    const total = logs.length;
    const page = options.page || 1;
    const limit = options.limit || 25;
    const startIndex = (page - 1) * limit;
    const pagedLogs = logs.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    return { logs: pagedLogs, total, hasMore };
  },

  getAdminActivity(options: { page?: number; limit?: number; startDate?: string; endDate?: string }): {
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  } {
    return this.getGlobalActivity({
      ...options,
      role: "ADMIN",
    });
  },

  getSecurityEvents(options: { page?: number; limit?: number; startDate?: string; endDate?: string }): {
    logs: AuditLog[];
    total: number;
    hasMore: boolean;
  } {
    return this.getGlobalActivity({
      ...options,
      actionCategory: "SECURITY",
    });
  },

  bulkEmployeeOperation(
    operation: "ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "CHANGE_ROLE",
    userIds: string[],
    newRole?: Role,
    actor?: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { modifiedCount: number; errors: string[] } {
    const act = actor || { uid: "usr-super-admin", name: "Super Administrator", role: "SUPER_ADMIN" };
    let modifiedCount = 0;
    const errors: string[] = [];

    for (const uid of userIds) {
      if (operation === "ACTIVATE" || operation === "DEACTIVATE" || operation === "SUSPEND") {
        const status: EmployeeStatus = operation === "ACTIVATE" ? "ACTIVE" : operation === "SUSPEND" ? "SUSPENDED" : "INACTIVE";
        const res = this.updateEmployeeStatus(uid, status, act);
        if (res.success) modifiedCount++;
        else errors.push(`${uid}: ${res.error}`);
      } else if (operation === "CHANGE_ROLE" && newRole) {
        const res = this.changeEmployeeRole(uid, newRole, act);
        if (res.success) modifiedCount++;
        else errors.push(`${uid}: ${res.error}`);
      }
    }

    return { modifiedCount, errors };
  },

  // ==========================================
  // EMPLOYEE SELF-REGISTRATION & APPROVAL
  // ==========================================

  registerEmployee(input: {
    uid?: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    employeeCode?: string;
  }): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const existing = data.users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase() || (input.uid && (u.uid === input.uid || u.id === input.uid))
    );

    if (existing) {
      if (existing.approvalStatus === "PENDING") {
        return { success: false, error: "An account with this email is already awaiting administrator approval." };
      }
      return { success: false, error: "An account with this email address already exists." };
    }

    const uid = input.uid || `usr-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newUser: User = {
      id: uid,
      uid,
      employeeCode: input.employeeCode?.trim() || "PENDING",
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      role: null,
      roleId: null,
      superAdmin: false,
      approvalStatus: "PENDING",
      department: input.department.trim(),
      designation: input.designation.trim(),
      active: false,
      status: "INACTIVE",
      registeredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.users.push(newUser);

    // Generate Super Admin notification
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: "usr-super-admin",
      title: "New Employee Registration",
      message: `${newUser.name} has registered for a VERTX ENERGIES employee account (${newUser.department} - ${newUser.designation}).`,
      type: "INFO",
      linkUrl: "/super-admin/approvals",
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notification);

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: newUser.uid,
      userId: newUser.uid,
      userName: newUser.name,
      userRole: "PENDING_REGISTRATION",
      action: "CREATE",
      actionCategory: "USER_MANAGEMENT",
      targetUserId: newUser.uid,
      targetUserName: newUser.name,
      description: `${newUser.name} (${newUser.email}) submitted registration for ${newUser.department} (${newUser.designation}). Awaiting Super Admin approval.`,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return { success: true, user: newUser };
  },

  getApprovalQueue(filterStatus?: ApprovalStatus): User[] {
    const data = ensureDataFile();
    let queue = data.users.filter((u) => !u.superAdmin && u.role !== "SUPER_ADMIN");
    if (filterStatus) {
      queue = queue.filter((u) => u.approvalStatus === filterStatus);
    }
    return queue.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  approveEmployeeRegistration(
    uid: string,
    role: Role,
    employeeCode: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) {
      return { success: false, error: "Registration record not found." };
    }

    if (role === "SUPER_ADMIN") {
      return { success: false, error: "SUPER_ADMIN role cannot be assigned through standard registration approval." };
    }

    user.approvalStatus = "APPROVED";
    user.status = "ACTIVE";
    user.active = true;
    user.role = role;
    user.roleId = role;
    if (employeeCode?.trim()) {
      user.employeeCode = employeeCode.trim();
    }
    user.approvedAt = new Date().toISOString();
    user.approvedBy = actor.name;
    user.rejectionReason = null;
    user.updatedAt = new Date().toISOString();

    // Audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: user.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: user.uid,
      targetUserName: user.name,
      field: "approvalStatus",
      oldValue: "PENDING",
      newValue: `APPROVED (Role: ${role}, Code: ${user.employeeCode})`,
      description: `${actor.name} approved employee registration for ${user.name} and assigned role ${role} (Employee Code: ${user.employeeCode}).`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    // Notification for user
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.uid,
      title: "Account Approved",
      message: `Your VERTX ENERGIES CRM account has been approved with role ${role}. You now have full operational access.`,
      type: "SUCCESS",
      linkUrl: "/dashboard",
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notification);

    saveDataFile(data);
    return { success: true, user };
  },

  rejectEmployeeRegistration(
    uid: string,
    rejectionReason: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) {
      return { success: false, error: "Registration record not found." };
    }

    user.approvalStatus = "REJECTED";
    user.status = "INACTIVE";
    user.active = false;
    user.rejectionReason = rejectionReason?.trim() || "Registration was not approved by administration.";
    user.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: user.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: user.uid,
      targetUserName: user.name,
      field: "approvalStatus",
      oldValue: "PENDING",
      newValue: "REJECTED",
      description: `${actor.name} rejected employee registration for ${user.name}. Reason: ${user.rejectionReason}.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "WARNING",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return { success: true, user };
  },

  reopenEmployeeRegistration(
    uid: string,
    actor: { uid: string; name: string; role: string; ip?: string; userAgent?: string }
  ): { success: boolean; user?: User; error?: string } {
    const data = ensureDataFile();
    const user = data.users.find((u) => u.uid === uid || u.id === uid);
    if (!user) {
      return { success: false, error: "Registration record not found." };
    }

    user.approvalStatus = "PENDING";
    user.status = "INACTIVE";
    user.active = false;
    user.rejectionReason = null;
    user.updatedAt = new Date().toISOString();

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      entityType: "USER",
      entityId: user.uid,
      userId: actor.uid,
      userName: actor.name,
      userRole: actor.role,
      action: "UPDATE",
      actionCategory: "ADMIN_MANAGEMENT",
      targetUserId: user.uid,
      targetUserName: user.name,
      field: "approvalStatus",
      oldValue: "REJECTED",
      newValue: "PENDING",
      description: `${actor.name} reopened rejected registration for ${user.name} to PENDING approval.`,
      ipAddress: actor.ip || null,
      userAgent: actor.userAgent || null,
      severity: "NORMAL",
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(audit);

    saveDataFile(data);
    return { success: true, user };
  },
};

export { db as storage };
