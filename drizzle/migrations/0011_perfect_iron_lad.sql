ALTER TABLE `tenants` ADD `google_maps_link` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `has_branches` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `branches_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `hide_branding` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `advanced_colors_json` text DEFAULT '{}' NOT NULL;