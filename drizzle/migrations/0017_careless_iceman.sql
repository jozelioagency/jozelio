ALTER TABLE `tenants` ADD `custom_subdomain_cooldown` integer;--> statement-breakpoint
CREATE TABLE `accounting_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'EGP' NOT NULL,
	`tenant_id` text,
	`entity_name` text,
	`status` text DEFAULT 'paid' NOT NULL,
	`payment_method` text DEFAULT 'other' NOT NULL,
	`invoice_number` text,
	`notes` text,
	`transaction_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_accounting_type_date` ON `accounting_transactions` (`type`,`transaction_date`);--> statement-breakpoint
CREATE INDEX `idx_accounting_tenant` ON `accounting_transactions` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_analytics_visitor_hash` ON `analytics_events` (`visitor_hash`);