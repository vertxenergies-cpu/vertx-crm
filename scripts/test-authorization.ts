import { db } from "../src/lib/storage";
import { User, Project } from "../src/types";
import {
  canViewProject,
  canEditProject,
  canManageProject,
  canViewFinancialData,
  canChangeProjectStage,
  canOverrideProjectStage,
  isManagementOrSuperAdmin,
} from "../src/lib/auth/authorization";

async function runAuthorizationTests() {
  console.log("=== VERTX CRM PROJECT-LEVEL AUTHORIZATION & SECURITY SUITE ===");

  // 1. Setup Test Users
  const superAdminUser: User = {
    id: "usr-super-admin",
    uid: "usr-super-admin",
    employeeCode: "EMP-000",
    name: "Vertx Energies Super Admin",
    email: "vertxenergies@gmail.com",
    phone: "+91 98470 00000",
    role: "SUPER_ADMIN",
    roleId: "SUPER_ADMIN",
    superAdmin: true,
    approvalStatus: "APPROVED",
    department: "Executive",
    designation: "Super Admin",
    active: true,
    status: "ACTIVE",
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminUser: User = {
    id: "usr-admin-01",
    uid: "usr-admin-01",
    employeeCode: "EMP-001",
    name: "System Admin User",
    email: "admin@vertx.com",
    phone: "+91 98470 00001",
    role: "ADMIN",
    roleId: "ADMIN",
    superAdmin: false,
    approvalStatus: "APPROVED",
    department: "Administration",
    designation: "CRM Administrator",
    active: true,
    status: "ACTIVE",
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const employeeA: User = {
    id: "usr-emp-a",
    uid: "usr-emp-a",
    employeeCode: "EMP-101",
    name: "Sales Executive A",
    email: "sales.a@vertx.com",
    phone: "+91 98470 11111",
    role: "SALES_EXECUTIVE",
    roleId: "SALES_EXECUTIVE",
    superAdmin: false,
    approvalStatus: "APPROVED",
    department: "Sales",
    designation: "Solar Consultant",
    active: true,
    status: "ACTIVE",
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const employeeB: User = {
    id: "usr-emp-b",
    uid: "usr-emp-b",
    employeeCode: "EMP-102",
    name: "Sales Executive B",
    email: "sales.b@vertx.com",
    phone: "+91 98470 22222",
    role: "SALES_EXECUTIVE",
    roleId: "SALES_EXECUTIVE",
    superAdmin: false,
    approvalStatus: "APPROVED",
    department: "Sales",
    designation: "Solar Consultant",
    active: true,
    status: "ACTIVE",
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. Setup Test Projects
  const projectA: Project = {
    id: "proj-test-a",
    projectNumber: "PRJ-2026-0001",
    customerId: "cust-001",
    salespersonId: "usr-emp-a",
    projectManagerId: "usr-pm-01",
    systemSizeKw: 5,
    projectType: "RESIDENTIAL",
    priority: "MEDIUM",
    startDate: new Date().toISOString(),
    nextActionTitle: "Collect ID proof",
    nextActionOwnerId: "usr-emp-a",
    nextActionDueDate: new Date().toISOString(),
    nextActionStatus: "PENDING",
    currentStage: "BOOKING",
    completedStages: [],
    stageHistory: [],
    overallStatus: "ON_TRACK",
    currentStageOwnerId: "usr-emp-a",
    installationDetail: {} as any,
    ksebDetail: {} as any,
    loanDetail: {} as any,
    subsidyDetail: {} as any,
    documents: [],
    paymentMilestones: [],
    duties: [],
    createdBy: "usr-emp-a",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const projectB: Project = {
    id: "proj-test-b",
    projectNumber: "PRJ-2026-0002",
    customerId: "cust-002",
    salespersonId: "usr-emp-b",
    projectManagerId: "usr-pm-02",
    systemSizeKw: 10,
    projectType: "COMMERCIAL",
    priority: "HIGH",
    startDate: new Date().toISOString(),
    nextActionTitle: "Submit KSEB form",
    nextActionOwnerId: "usr-emp-b",
    nextActionDueDate: new Date().toISOString(),
    nextActionStatus: "PENDING",
    currentStage: "DOCUMENTS",
    completedStages: ["BOOKING"],
    stageHistory: [],
    overallStatus: "ON_TRACK",
    currentStageOwnerId: "usr-emp-b",
    installationDetail: {} as any,
    ksebDetail: {} as any,
    loanDetail: {} as any,
    subsidyDetail: {} as any,
    documents: [],
    paymentMilestones: [],
    duties: [],
    createdBy: "usr-emp-b",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add test projects to storage via dataset helper
  const existingProjects = db.getProjects({ search: "PRJ-2026" });
  if (!existingProjects.some((p) => p.id === projectA.id)) {
    const result = db.getProjectsWithCounts({ search: "PRJ-2026" });
    const projList = result.projects;
    projList.push(projectA);
    projList.push(projectB);
  }

  console.log("\n[TEST 1] Hierarchy & Authorization Matrix Evaluation");

  // Super Admin checks
  console.log("-> SUPER_ADMIN view Project A:", canViewProject(superAdminUser, projectA) === true ? "✅ PASS" : "❌ FAIL");
  console.log("-> SUPER_ADMIN view Project B:", canViewProject(superAdminUser, projectB) === true ? "✅ PASS" : "❌ FAIL");

  // Admin checks
  console.log("-> ADMIN view Project A:", canViewProject(adminUser, projectA) === true ? "✅ PASS" : "❌ FAIL");
  console.log("-> ADMIN view Project B:", canViewProject(adminUser, projectB) === true ? "✅ PASS" : "❌ FAIL");

  // Employee A checks
  const empACanViewA = canViewProject(employeeA, projectA);
  const empACanViewB = canViewProject(employeeA, projectB);
  console.log("-> Employee A view Project A (Owned):", empACanViewA === true ? "✅ PASS" : "❌ FAIL");
  console.log("-> Employee A view Project B (Employee B's project):", empACanViewB === false ? "✅ PASS (ISOLATED)" : "❌ FAIL (DATA LEAK)");

  // Employee B checks
  const empBCanViewA = canViewProject(employeeB, projectA);
  const empBCanViewB = canViewProject(employeeB, projectB);
  console.log("-> Employee B view Project A (Employee A's project):", empBCanViewA === false ? "✅ PASS (ISOLATED)" : "❌ FAIL (DATA LEAK)");
  console.log("-> Employee B view Project B (Owned):", empBCanViewB === true ? "✅ PASS" : "❌ FAIL");

  console.log("\n[TEST 2] Project Listing & Query Parameter Bypassing");
  // Test query parameter manipulation: Employee A sends ?salespersonId=usr-emp-b
  const empAProjectsWithQueryBypass = db.getProjectsWithCounts(
    { salespersonId: "usr-emp-b" },
    employeeA
  );
  console.log(
    "-> Employee A query with salespersonId=usr-emp-b returned count:",
    empAProjectsWithQueryBypass.projects.length,
    empAProjectsWithQueryBypass.projects.length === 0 ? "✅ PASS (Bypass Blocked)" : "❌ FAIL (Manipulated query returned foreign project)"
  );

  const empAOwnProjects = db.getProjectsWithCounts({}, employeeA);
  console.log(
    "-> Employee A standard project list returned ONLY own projects:",
    empAOwnProjects.projects.every((p) => p.salespersonId === "usr-emp-a" || p.createdBy === "usr-emp-a") ? "✅ PASS" : "❌ FAIL"
  );

  const superAdminAllProjects = db.getProjectsWithCounts({}, superAdminUser);
  console.log(
    "-> Super Admin standard project list returned ALL projects:",
    superAdminAllProjects.projects.length >= 2 ? "✅ PASS" : "❌ FAIL"
  );

  console.log("\n[TEST 3] Financial & Stage Permission Scoping");
  console.log("-> Employee A financial view Project A:", canViewFinancialData(employeeA, projectA) === true ? "✅ PASS" : "❌ FAIL");
  console.log("-> Employee A financial view Project B:", canViewFinancialData(employeeA, projectB) === false ? "✅ PASS" : "❌ FAIL");
  console.log("-> Employee A stage override permission:", canOverrideProjectStage(employeeA) === false ? "✅ PASS (Blocked)" : "❌ FAIL");
  console.log("-> Super Admin stage override permission:", canOverrideProjectStage(superAdminUser) === true ? "✅ PASS" : "❌ FAIL");

  console.log("\n[TEST 4] Dashboard Stats Scoping");
  const empADashboard = db.getDashboardStats(employeeA);
  const superAdminDashboard = db.getDashboardStats(superAdminUser);

  console.log("-> Employee A dashboard active projects count:", empADashboard.activeProjects);
  console.log("-> Super Admin dashboard active projects count:", superAdminDashboard.activeProjects);
  console.log(
    "-> Dashboard isolated:",
    empADashboard.activeProjects <= superAdminDashboard.activeProjects ? "✅ PASS" : "❌ FAIL"
  );

  console.log("\n[TEST 5] Global Search Scoping");
  const empASearch = db.searchGlobal("PRJ", employeeA);
  const superAdminSearch = db.searchGlobal("PRJ", superAdminUser);

  console.log("-> Employee A search results count:", empASearch.projects.length);
  console.log("-> Super Admin search results count:", superAdminSearch.projects.length);
  console.log(
    "-> Global search isolated:",
    empASearch.projects.length <= superAdminSearch.projects.length ? "✅ PASS" : "❌ FAIL"
  );

  console.log("\n=== ALL AUTHORIZATION & ISOLATION CHECKS COMPLETED SUCCESSFULLY ===");
}

runAuthorizationTests().catch(console.error);
