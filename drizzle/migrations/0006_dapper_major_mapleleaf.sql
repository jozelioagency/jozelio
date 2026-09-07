ALTER TABLE `tenant_members` ADD `invite_token` text;--> statement-breakpoint
ALTER TABLE `tenant_members` ADD `invite_expires_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_members_invite_token_unique` ON `tenant_members` (`invite_token`);