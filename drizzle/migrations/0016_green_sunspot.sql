CREATE INDEX IF NOT EXISTS `idx_analytics_tenant_created` ON `analytics_events` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_menu_items_tenant_id` ON `menu_items` (`tenant_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_menu_items_category` ON `menu_items` (`category`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_notifications_user_read` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_tenant_members_tenant_id` ON `tenant_members` (`tenant_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_tenant_members_user_id` ON `tenant_members` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_tenant_members_email` ON `tenant_members` (`email`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_tenants_subdomain` ON `tenants` (`subdomain`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_tenants_user_id` ON `tenants` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_tenants_custom_domain` ON `tenants` (`custom_domain`);