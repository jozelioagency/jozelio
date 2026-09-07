CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tenants` ADD `is_banned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `whatsapp` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `telegram` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `subdomain_last_changed_at` integer;--> statement-breakpoint
ALTER TABLE `user` ADD `is_banned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `country` text;--> statement-breakpoint
ALTER TABLE `user` ADD `max_projects` integer DEFAULT 20 NOT NULL;