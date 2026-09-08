"use server";

import * as authActions from "@/actions/auth-actions";
import * as tenantActions from "@/actions/tenant-actions";
import * as menuActions from "@/actions/menu-actions";
import * as teamActions from "@/actions/team-actions";
import * as adminActions from "@/actions/admin-actions";
import * as notifActions from "@/actions/notification-actions";

export async function registerUser(...args: Parameters<typeof authActions.registerUser>) {
  return authActions.registerUser(...args);
}

export async function completeUserOnboarding(...args: Parameters<typeof authActions.completeUserOnboarding>) {
  return authActions.completeUserOnboarding(...args);
}

export async function getEmailByUsername(...args: Parameters<typeof authActions.getEmailByUsername>) {
  return authActions.getEmailByUsername(...args);
}

export async function deleteOwnAccount(...args: Parameters<typeof authActions.deleteOwnAccount>) {
  return authActions.deleteOwnAccount(...args);
}

export async function checkUserProjectPermission(...args: Parameters<typeof tenantActions.checkUserProjectPermission>) {
  return tenantActions.checkUserProjectPermission(...args);
}

export async function activateBocado(...args: Parameters<typeof tenantActions.activateBocado>) {
  return tenantActions.activateBocado(...args);
}

export async function updateTenantTier(...args: Parameters<typeof tenantActions.updateTenantTier>) {
  return tenantActions.updateTenantTier(...args);
}

export async function updateTenantLimits(...args: Parameters<typeof tenantActions.updateTenantLimits>) {
  return tenantActions.updateTenantLimits(...args);
}

export async function updateTenantProfile(...args: Parameters<typeof tenantActions.updateTenantProfile>) {
  return tenantActions.updateTenantProfile(...args);
}

export async function updateTenantLanguages(...args: Parameters<typeof tenantActions.updateTenantLanguages>) {
  return tenantActions.updateTenantLanguages(...args);
}

export async function translateText(...args: Parameters<typeof tenantActions.translateText>) {
  return tenantActions.translateText(...args);
}

export async function transferProject(...args: Parameters<typeof tenantActions.transferProject>) {
  return tenantActions.transferProject(...args);
}

export async function deleteProject(...args: Parameters<typeof tenantActions.deleteProject>) {
  return tenantActions.deleteProject(...args);
}

export async function createMenuItem(...args: Parameters<typeof menuActions.createMenuItem>) {
  return menuActions.createMenuItem(...args);
}

export async function updateMenuItem(...args: Parameters<typeof menuActions.updateMenuItem>) {
  return menuActions.updateMenuItem(...args);
}

export async function toggleMenuItemAvailability(...args: Parameters<typeof menuActions.toggleMenuItemAvailability>) {
  return menuActions.toggleMenuItemAvailability(...args);
}

export async function deleteMenuItem(...args: Parameters<typeof menuActions.deleteMenuItem>) {
  return menuActions.deleteMenuItem(...args);
}

export async function inviteTeamMember(...args: Parameters<typeof teamActions.inviteTeamMember>) {
  return teamActions.inviteTeamMember(...args);
}

export async function acceptInvitation(...args: Parameters<typeof teamActions.acceptInvitation>) {
  return teamActions.acceptInvitation(...args);
}

export async function removeTeamMember(...args: Parameters<typeof teamActions.removeTeamMember>) {
  return teamActions.removeTeamMember(...args);
}

export async function leaveProject(...args: Parameters<typeof teamActions.leaveProject>) {
  return teamActions.leaveProject(...args);
}

export async function respondToInvitation(...args: Parameters<typeof teamActions.respondToInvitation>) {
  return teamActions.respondToInvitation(...args);
}

export async function getPendingInvitations(...args: Parameters<typeof teamActions.getPendingInvitations>) {
  return teamActions.getPendingInvitations(...args);
}

export async function getTenantMembers(...args: Parameters<typeof teamActions.getTenantMembers>) {
  return teamActions.getTenantMembers(...args);
}

export async function deleteTenantByAdmin(...args: Parameters<typeof adminActions.deleteTenantByAdmin>) {
  return adminActions.deleteTenantByAdmin(...args);
}

export async function updateUserRoleByAdmin(...args: Parameters<typeof adminActions.updateUserRoleByAdmin>) {
  return adminActions.updateUserRoleByAdmin(...args);
}

export async function deleteUserByAdmin(...args: Parameters<typeof adminActions.deleteUserByAdmin>) {
  return adminActions.deleteUserByAdmin(...args);
}

export async function updateUserProfile(...args: Parameters<typeof adminActions.updateUserProfile>) {
  return adminActions.updateUserProfile(...args);
}

export async function getSystemSettings(...args: Parameters<typeof adminActions.getSystemSettings>) {
  return adminActions.getSystemSettings(...args);
}

export async function updateSystemSettings(...args: Parameters<typeof adminActions.updateSystemSettings>) {
  return adminActions.updateSystemSettings(...args);
}

export async function clearExpiredSessions(...args: Parameters<typeof adminActions.clearExpiredSessions>) {
  return adminActions.clearExpiredSessions(...args);
}

export async function vacuumDatabase(...args: Parameters<typeof adminActions.vacuumDatabase>) {
  return adminActions.vacuumDatabase(...args);
}

export async function toggleTenantBan(...args: Parameters<typeof adminActions.toggleTenantBan>) {
  return adminActions.toggleTenantBan(...args);
}

export async function toggleUserBan(...args: Parameters<typeof adminActions.toggleUserBan>) {
  return adminActions.toggleUserBan(...args);
}

export async function updateTenantBanAndWarning(...args: Parameters<typeof adminActions.updateTenantBanAndWarning>) {
  return adminActions.updateTenantBanAndWarning(...args);
}

export async function updateUserBanAndWarning(...args: Parameters<typeof adminActions.updateUserBanAndWarning>) {
  return adminActions.updateUserBanAndWarning(...args);
}

export async function updateUserMaxProjects(...args: Parameters<typeof adminActions.updateUserMaxProjects>) {
  return adminActions.updateUserMaxProjects(...args);
}

export async function sendMessageByAdmin(...args: Parameters<typeof adminActions.sendMessageByAdmin>) {
  return adminActions.sendMessageByAdmin(...args);
}

export async function sendGlobalMessageByAdmin(...args: Parameters<typeof adminActions.sendGlobalMessageByAdmin>) {
  return adminActions.sendGlobalMessageByAdmin(...args);
}

export async function getSystemNotifications(...args: Parameters<typeof notifActions.getSystemNotifications>) {
  return notifActions.getSystemNotifications(...args);
}

export async function markNotificationAsRead(...args: Parameters<typeof notifActions.markNotificationAsRead>) {
  return notifActions.markNotificationAsRead(...args);
}

export async function deleteNotification(...args: Parameters<typeof notifActions.deleteNotification>) {
  return notifActions.deleteNotification(...args);
}

export async function getAccountingSummary(...args: Parameters<typeof adminActions.getAccountingSummary>) {
  return adminActions.getAccountingSummary(...args);
}

export async function createAccountingTransaction(...args: Parameters<typeof adminActions.createAccountingTransaction>) {
  return adminActions.createAccountingTransaction(...args);
}

export async function updateAccountingTransaction(...args: Parameters<typeof adminActions.updateAccountingTransaction>) {
  return adminActions.updateAccountingTransaction(...args);
}

export async function deleteAccountingTransaction(...args: Parameters<typeof adminActions.deleteAccountingTransaction>) {
  return adminActions.deleteAccountingTransaction(...args);
}

export async function seedInitialAccountingData(...args: Parameters<typeof adminActions.seedInitialAccountingData>) {
  return adminActions.seedInitialAccountingData(...args);
}

export async function exportFullPlatformData(...args: Parameters<typeof adminActions.exportFullPlatformData>) {
  return adminActions.exportFullPlatformData(...args);
}

