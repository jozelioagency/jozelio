ALTER TABLE `tenants` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `ban_expires_at` integer;--> statement-breakpoint
ALTER TABLE `tenants` ADD `is_warned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `warning_reason` text;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_expires_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `is_warned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `warning_reason` text;