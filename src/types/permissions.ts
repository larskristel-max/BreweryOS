// ── Operon BrewOS — Typed Role & Permissions Layer ──
// Role hierarchy: Owner > Brewmaster/Admin/Finance > Brewer > Brewer's Assistant > Viewer
// Role type is sourced from domain.ts (UserRole) to ensure DB ↔ frontend parity.

import type { UserRole } from "./domain";

export type Role = UserRole;

export interface Permissions {
  canCreateBatch: boolean;
  canExecutePackaging: boolean;
  canCompletePendingMovement: boolean;
  canOverrideReadiness: boolean;
  canAccessFinance: boolean;
  canAccessCompliance: boolean;
  canManageSettings: boolean;
  canLogObservation: boolean;
  canLogMeasurement: boolean;
  canResumeLetsBrew: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
}

export function resolvePermissions(role: Role): Permissions {
  switch (role) {
    case "owner":
      return {
        canCreateBatch: true,
        canExecutePackaging: true,
        canCompletePendingMovement: true,
        canOverrideReadiness: true,
        canAccessFinance: true,
        canAccessCompliance: true,
        canManageSettings: true,
        canLogObservation: true,
        canLogMeasurement: true,
        canResumeLetsBrew: true,
        canManageUsers: true,
        canViewReports: true,
      };
    case "brewmaster_admin":
      return {
        canCreateBatch: true,
        canExecutePackaging: true,
        canCompletePendingMovement: true,
        canOverrideReadiness: true,
        canAccessFinance: false,
        canAccessCompliance: true,
        canManageSettings: true,
        canLogObservation: true,
        canLogMeasurement: true,
        canResumeLetsBrew: true,
        canManageUsers: true,
        canViewReports: true,
      };
    case "finance":
      return {
        canCreateBatch: false,
        canExecutePackaging: false,
        canCompletePendingMovement: false,
        canOverrideReadiness: false,
        canAccessFinance: true,
        canAccessCompliance: true,
        canManageSettings: false,
        canLogObservation: false,
        canLogMeasurement: false,
        canResumeLetsBrew: false,
        canManageUsers: false,
        canViewReports: true,
      };
    case "brewer":
      return {
        canCreateBatch: true,
        canExecutePackaging: true,
        canCompletePendingMovement: true,
        canOverrideReadiness: false,
        canAccessFinance: false,
        canAccessCompliance: false,
        canManageSettings: false,
        canLogObservation: true,
        canLogMeasurement: true,
        canResumeLetsBrew: true,
        canManageUsers: false,
        canViewReports: false,
      };
    case "assistant":
      return {
        canCreateBatch: false,
        canExecutePackaging: false,
        canCompletePendingMovement: false,
        canOverrideReadiness: false,
        canAccessFinance: false,
        canAccessCompliance: false,
        canManageSettings: false,
        canLogObservation: true,
        canLogMeasurement: true,
        canResumeLetsBrew: true,
        canManageUsers: false,
        canViewReports: false,
      };
    case "viewer":
    default:
      return {
        canCreateBatch: false,
        canExecutePackaging: false,
        canCompletePendingMovement: false,
        canOverrideReadiness: false,
        canAccessFinance: false,
        canAccessCompliance: false,
        canManageSettings: false,
        canLogObservation: false,
        canLogMeasurement: false,
        canResumeLetsBrew: false,
        canManageUsers: false,
        canViewReports: false,
      };
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  brewmaster_admin: "Brewmaster / Admin",
  finance: "Finance",
  brewer: "Brewer",
  assistant: "Brewer's Assistant",
  viewer: "Viewer",
};

export type PermissionKey = keyof Permissions;

export const PERMISSION_ROLE_THRESHOLDS: Record<PermissionKey, Role[]> = {
  canCreateBatch: ["owner", "brewmaster_admin", "brewer"],
  canExecutePackaging: ["owner", "brewmaster_admin", "brewer"],
  canCompletePendingMovement: ["owner", "brewmaster_admin", "brewer"],
  canOverrideReadiness: ["owner", "brewmaster_admin"],
  canAccessFinance: ["owner", "finance"],
  canAccessCompliance: ["owner", "brewmaster_admin", "finance"],
  canManageSettings: ["owner", "brewmaster_admin"],
  canLogObservation: ["owner", "brewmaster_admin", "brewer", "assistant"],
  canLogMeasurement: ["owner", "brewmaster_admin", "brewer", "assistant"],
  canResumeLetsBrew: ["owner", "brewmaster_admin", "brewer", "assistant"],
  canManageUsers: ["owner", "brewmaster_admin"],
  canViewReports: ["owner", "brewmaster_admin", "finance"],
};

export function escalationMessage(action: PermissionKey): string {
  const roles = PERMISSION_ROLE_THRESHOLDS[action] ?? [];
  const labels = roles.map((r) => ROLE_LABELS[r]).join(", ");
  return `This action requires one of: ${labels}`;
}
