"use server";

import * as authActions from "@/actions/auth-actions";
import * as tenantActions from "@/actions/tenant-actions";
import * as menuActions from "@/actions/menu-actions";
import * as teamActions from "@/actions/team-actions";
import * as adminActions from "@/actions/admin-actions";
import * as notifActions from "@/actions/notification-actions";

export async function registerUser(...args: Parameters<typeof authActions.registerUser>) {
  return (authActions.registerUser as any)(...args);
}

export async function completeUserOnboarding(...args: Parameters<typeof authActions.completeUserOnboarding>) {
  return (authActions.completeUserOnboarding as any)(...args);
}

export async function getEmailByUsername(...args: Parameters<typeof authActions.getEmailByUsername>) {
  return (authActions.getEmailByUsername as any)(...args);
}

export async function deleteOwnAccount(...args: Parameters<typeof authActions.deleteOwnAccount>) {
  return (authActions.deleteOwnAccount as any)(...args);
}

export async function checkUserProjectPermission(...args: Parameters<typeof tenantActions.checkUserProjectPermission>) {
  return (tenantActions.checkUserProjectPermission as any)(...args);
}

export async function activateBocado(...args: Parameters<typeof tenantActions.activateBocado>) {
  return (tenantActions.activateBocado as any)(...args);
}

export async function updateTenantTier(...args: Parameters<typeof tenantActions.updateTenantTier>) {
  return (tenantActions.updateTenantTier as any)(...args);
}

export async function updateTenantLimits(...args: Parameters<typeof tenantActions.updateTenantLimits>) {
  return (tenantActions.updateTenantLimits as any)(...args);
}

export async function updateTenantProfile(...args: Parameters<typeof tenantActions.updateTenantProfile>) {
  return (tenantActions.updateTenantProfile as any)(...args);
}

export async function updateTenantLanguages(...args: Parameters<typeof tenantActions.updateTenantLanguages>) {
  return (tenantActions.updateTenantLanguages as any)(...args);
}

export async function translateText(...args: Parameters<typeof tenantActions.translateText>) {
  return (tenantActions.translateText as any)(...args);
}

export async function transferProject(...args: Parameters<typeof tenantActions.transferProject>) {
  return (tenantActions.transferProject as any)(...args);
}

export async function deleteProject(...args: Parameters<typeof tenantActions.deleteProject>) {
  return (tenantActions.deleteProject as any)(...args);
}

export async function createMenuItem(...args: Parameters<typeof menuActions.createMenuItem>) {
  return (menuActions.createMenuItem as any)(...args);
}

export async function updateMenuItem(...args: Parameters<typeof menuActions.updateMenuItem>) {
  return (menuActions.updateMenuItem as any)(...args);
}

export async function toggleMenuItemAvailability(...args: Parameters<typeof menuActions.toggleMenuItemAvailability>) {
  return (menuActions.toggleMenuItemAvailability as any)(...args);
}

export async function deleteMenuItem(...args: Parameters<typeof menuActions.deleteMenuItem>) {
  return (menuActions.deleteMenuItem as any)(...args);
}

export async function inviteTeamMember(...args: Parameters<typeof teamActions.inviteTeamMember>) {
  return (teamActions.inviteTeamMember as any)(...args);
}

export async function acceptInvitation(...args: Parameters<typeof teamActions.acceptInvitation>) {
  return (teamActions.acceptInvitation as any)(...args);
}

export async function removeTeamMember(...args: Parameters<typeof teamActions.removeTeamMember>) {
  return (teamActions.removeTeamMember as any)(...args);
}

export async function leaveProject(...args: Parameters<typeof teamActions.leaveProject>) {
  return (teamActions.leaveProject as any)(...args);
}

export async function respondToInvitation(...args: Parameters<typeof teamActions.respondToInvitation>) {
  return (teamActions.respondToInvitation as any)(...args);
}

export async function getPendingInvitations(...args: Parameters<typeof teamActions.getPendingInvitations>) {
  return (teamActions.getPendingInvitations as any)(...args);
}

export async function getTenantMembers(...args: Parameters<typeof teamActions.getTenantMembers>) {
  return (teamActions.getTenantMembers as any)(...args);
}

export async function deleteTenantByAdmin(...args: Parameters<typeof adminActions.deleteTenantByAdmin>) {
  return (adminActions.deleteTenantByAdmin as any)(...args);
}

export async function updateUserRoleByAdmin(...args: Parameters<typeof adminActions.updateUserRoleByAdmin>) {
  return (adminActions.updateUserRoleByAdmin as any)(...args);
}

export async function deleteUserByAdmin(...args: Parameters<typeof adminActions.deleteUserByAdmin>) {
  return (adminActions.deleteUserByAdmin as any)(...args);
}

export async function updateUserProfile(...args: Parameters<typeof adminActions.updateUserProfile>) {
  return (adminActions.updateUserProfile as any)(...args);
}

export async function getSystemSettings(...args: Parameters<typeof adminActions.getSystemSettings>) {
  return (adminActions.getSystemSettings as any)(...args);
}

export async function updateSystemSettings(...args: Parameters<typeof adminActions.updateSystemSettings>) {
  return (adminActions.updateSystemSettings as any)(...args);
}

export async function clearExpiredSessions(...args: Parameters<typeof adminActions.clearExpiredSessions>) {
  return (adminActions.clearExpiredSessions as any)(...args);
}

export async function vacuumDatabase(...args: Parameters<typeof adminActions.vacuumDatabase>) {
  return (adminActions.vacuumDatabase as any)(...args);
}

export async function toggleTenantBan(...args: Parameters<typeof adminActions.toggleTenantBan>) {
  return (adminActions.toggleTenantBan as any)(...args);
}

export async function toggleUserBan(...args: Parameters<typeof adminActions.toggleUserBan>) {
  return (adminActions.toggleUserBan as any)(...args);
}

export async function updateTenantBanAndWarning(...args: Parameters<typeof adminActions.updateTenantBanAndWarning>) {
  return (adminActions.updateTenantBanAndWarning as any)(...args);
}

export async function updateUserBanAndWarning(...args: Parameters<typeof adminActions.updateUserBanAndWarning>) {
  return (adminActions.updateUserBanAndWarning as any)(...args);
}

export async function updateUserMaxProjects(...args: Parameters<typeof adminActions.updateUserMaxProjects>) {
  return (adminActions.updateUserMaxProjects as any)(...args);
}

export async function sendMessageByAdmin(...args: Parameters<typeof adminActions.sendMessageByAdmin>) {
  return (adminActions.sendMessageByAdmin as any)(...args);
}

export async function sendGlobalMessageByAdmin(...args: Parameters<typeof adminActions.sendGlobalMessageByAdmin>) {
  return (adminActions.sendGlobalMessageByAdmin as any)(...args);
}

export async function getSystemNotifications(...args: Parameters<typeof notifActions.getSystemNotifications>) {
  return (notifActions.getSystemNotifications as any)(...args);
}

export async function markNotificationAsRead(...args: Parameters<typeof notifActions.markNotificationAsRead>) {
  return (notifActions.markNotificationAsRead as any)(...args);
}

export async function deleteNotification(...args: Parameters<typeof notifActions.deleteNotification>) {
  return (notifActions.deleteNotification as any)(...args);
}

