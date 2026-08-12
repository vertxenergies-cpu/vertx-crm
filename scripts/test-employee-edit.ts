import { storage } from "../src/lib/storage";
import { User, Project } from "../src/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runEmployeeEditTests() {
  console.log("=== VERTX CRM SUPER ADMIN EMPLOYEE EDIT SUITE ===\n");

  // 1. Setup mock test users
  const superAdminUser: User = {
    id: "usr-super-admin-01",
    uid: "usr-super-admin-01",
    employeeCode: "EMP-000",
    name: "Vertx Super Admin",
    email: "admin@vertx.com",
    phone: "+91 98000 00000",
    department: "Executive",
    designation: "Super Administrator",
    role: "SUPER_ADMIN",
    superAdmin: true,
    approvalStatus: "APPROVED",
    active: true,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminUser: User = {
    id: "usr-admin-01",
    uid: "usr-admin-01",
    employeeCode: "EMP-001",
    name: "System Admin",
    email: "sysadmin@vertx.com",
    phone: "+91 98000 00001",
    department: "IT",
    designation: "System Administrator",
    role: "ADMIN",
    superAdmin: false,
    approvalStatus: "APPROVED",
    active: true,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const employeeA: User = {
    id: "usr-emp-edit-a",
    uid: "usr-emp-edit-a",
    employeeCode: "EMP-101",
    name: "Chamal Ghosh",
    email: "chamal@vertx.com",
    phone: "+91 98000 11111",
    department: "Sales & Marketing",
    designation: "Solar Sales Consultant",
    role: "SALES_EXECUTIVE",
    superAdmin: false,
    approvalStatus: "APPROVED",
    active: true,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed storage
  storage.createUser(superAdminUser);
  storage.createUser(adminUser);
  storage.createUser(employeeA);

  const actorSuperAdmin = {
    uid: superAdminUser.uid,
    name: superAdminUser.name,
    role: "SUPER_ADMIN",
  };

  // TEST 1: Super Admin edits employee name
  console.log("[TEST 1] Super Admin edits employee name...");
  const res1 = storage.updateEmployeeProfile(
    employeeA.uid,
    { name: "Chamal Ghosh Kumar" },
    actorSuperAdmin
  );
  assert(res1.success === true, "Super admin name edit must succeed");
  assert(res1.user?.name === "Chamal Ghosh Kumar", "Name must be updated to Chamal Ghosh Kumar");
  assert(res1.user?.uid === employeeA.uid, "Firebase UID must remain unchanged");
  console.log("-> Super Admin name edit: ✅ PASS");

  // TEST 2: Super Admin changes designation
  console.log("\n[TEST 2] Super Admin changes designation...");
  const res2 = storage.updateEmployeeProfile(
    employeeA.uid,
    { designation: "Senior Solar EPC Strategist" },
    actorSuperAdmin
  );
  assert(res2.success === true, "Super admin designation edit must succeed");
  assert(res2.user?.designation === "Senior Solar EPC Strategist", "Designation must update");
  console.log("-> Super Admin designation edit: ✅ PASS");

  // TEST 3: Super Admin changes role
  console.log("\n[TEST 3] Super Admin changes role...");
  const res3 = storage.updateEmployeeProfile(
    employeeA.uid,
    { role: "PROJECT_MANAGER" },
    actorSuperAdmin
  );
  assert(res3.success === true, "Super admin role edit must succeed");
  assert(res3.user?.role === "PROJECT_MANAGER", "Role must update to PROJECT_MANAGER");
  console.log("-> Super Admin role edit: ✅ PASS");

  // TEST 4: Project ownership resolution test
  console.log("\n[TEST 7] Project ownership resolution check after name change...");
  const sampleProject: Project = {
    id: "proj-sample-1",
    projectNumber: "PRJ-2026-999",
    customerId: "cust-999",
    salespersonId: employeeA.uid, // "usr-emp-edit-a"
    projectManagerId: "usr-pm-999",
    systemSizeKw: 10,
    projectType: "RESIDENTIAL",
    priority: "HIGH",
    startDate: new Date().toISOString(),
    nextActionTitle: "Followup",
    nextActionOwnerId: employeeA.uid,
    nextActionDueDate: new Date().toISOString(),
    nextActionStatus: "PENDING",
    currentStage: "BOOKING",
    completedStages: [],
    stageHistory: [],
    overallStatus: "ON_TRACK",
    installationDetail: {} as any,
    ksebDetail: {} as any,
    loanDetail: {} as any,
    subsidyDetail: {} as any,
    documents: [],
    paymentMilestones: [],
    duties: [],
    createdBy: employeeA.uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Resolve user by salespersonId
  const users = storage.getUsers();
  const ownerUser = users.find((u) => u.id === sampleProject.salespersonId);
  assert(ownerUser !== undefined, "Salesperson user must be found by stable ID");
  assert(ownerUser?.name === "Chamal Ghosh Kumar", "Salesperson name resolved for project must automatically be updated name");
  console.log("-> Name change propagation to project owner resolution: ✅ PASS");

  // TEST 8: Audit log check for EMPLOYEE_PROFILE_UPDATED
  console.log("\n[TEST 8] Audit log verification...");
  const auditLogs = storage.getAuditLogs ? storage.getAuditLogs() : [];
  const profileEditAudit = auditLogs.find((a: any) => a.action === "EMPLOYEE_PROFILE_UPDATED" && a.targetUserId === employeeA.uid);
  assert(profileEditAudit !== undefined, "EMPLOYEE_PROFILE_UPDATED audit log entry must be created");
  assert(profileEditAudit?.userId === superAdminUser.uid, "Audit log actor must be Super Admin");
  console.log("-> EMPLOYEE_PROFILE_UPDATED audit log check: ✅ PASS");

  console.log("\n=== ALL SUPER ADMIN EMPLOYEE PROFILE EDIT TESTS PASSED ===");
}

runEmployeeEditTests();
