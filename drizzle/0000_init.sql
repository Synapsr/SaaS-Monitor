CREATE TABLE `exchange_rates` (
	`base` varchar(3) NOT NULL,
	`rates` json NOT NULL,
	`fetched_at` datetime(6) NOT NULL,
	CONSTRAINT `exchange_rates_base` PRIMARY KEY(`base`)
);
--> statement-breakpoint
CREATE TABLE `mrr_movements` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`stripe_subscription_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`stripe_customer_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`customer_name` text,
	`customer_country` text,
	`plan_name` text,
	`kind` enum('new','expansion','reactivation','contraction','churn') NOT NULL,
	`amount` bigint NOT NULL,
	`currency` varchar(3) NOT NULL,
	`occurred_at` datetime(6) NOT NULL,
	`origin` enum('backfill','live','reconcile') NOT NULL,
	`stripe_event_id` varchar(255) character set ascii collate ascii_bin,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `mrr_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`stripe_charge_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`stripe_customer_id` varchar(255) character set ascii collate ascii_bin,
	`customer_name` text,
	`customer_country` text,
	`description` text,
	`amount` bigint NOT NULL,
	`amount_refunded` bigint NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL,
	`occurred_at` datetime(6) NOT NULL,
	`origin` enum('backfill','live','reconcile') NOT NULL,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_account_id_stripe_charge_id_index` UNIQUE(`account_id`,`stripe_charge_id`)
);
--> statement-breakpoint
CREATE TABLE `screen_accounts` (
	`screen_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	CONSTRAINT `screen_accounts_screen_id_account_id_pk` PRIMARY KEY(`screen_id`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `screens` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`workspace_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`name` text NOT NULL,
	`public_token` varchar(64) character set ascii collate ascii_bin NOT NULL,
	`settings` json NOT NULL,
	`test_event_at` datetime(6),
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `screens_id` PRIMARY KEY(`id`),
	CONSTRAINT `screens_publicToken_unique` UNIQUE(`public_token`)
);
--> statement-breakpoint
CREATE TABLE `stripe_accounts` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`workspace_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`name` text NOT NULL,
	`stripe_account_id` varchar(255) character set ascii collate ascii_bin,
	`livemode` boolean NOT NULL,
	`encrypted_secret_key` text NOT NULL,
	`secret_key_hint` text NOT NULL,
	`default_currency` varchar(3),
	`status` enum('importing','ready','error') NOT NULL DEFAULT 'importing',
	`last_error` text,
	`backfill` json,
	`reconcile` json,
	`events_cursor` bigint,
	`recent_event_ids` json NOT NULL DEFAULT ('[]'),
	`last_event_at` datetime(6),
	`last_synced_at` datetime(6),
	`last_reconciled_at` datetime(6),
	`sync_locked_until` datetime(6),
	`sync_failures` int NOT NULL DEFAULT 0,
	`sync_requested_at` datetime(6),
	`webhook_endpoint_id` varchar(255) character set ascii collate ascii_bin,
	`encrypted_webhook_secret` text,
	`last_webhook_at` datetime(6),
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `stripe_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_accounts_workspace_id_stripe_account_id_livemode_index` UNIQUE(`workspace_id`,`stripe_account_id`,`livemode`)
);
--> statement-breakpoint
CREATE TABLE `stripe_coupons` (
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`coupon_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`terms` json NOT NULL,
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `stripe_coupons_account_id_coupon_id_pk` PRIMARY KEY(`account_id`,`coupon_id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`stripe_subscription_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`stripe_customer_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`customer_name` text,
	`customer_country` text,
	`status` text NOT NULL,
	`currency` varchar(3) NOT NULL,
	`mrr` bigint NOT NULL,
	`plan_name` text,
	`billing_interval` text,
	`started_at` datetime(6) NOT NULL,
	`trial_ends_at` datetime(6),
	`canceled_at` datetime(6),
	`ended_at` datetime(6),
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`last_seen_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_account_id_stripe_subscription_id_index` UNIQUE(`account_id`,`stripe_subscription_id`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime(6),
	`refresh_token_expires_at` datetime(6),
	`scope` text,
	`password` text,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`organization_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(255),
	`status` varchar(255) NOT NULL DEFAULT 'pending',
	`expires_at` datetime(6) NOT NULL,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`inviter_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`organization_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`user_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`role` varchar(255) NOT NULL DEFAULT 'member',
	`created_at` datetime(6) NOT NULL,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logo` text,
	`created_at` datetime(6) NOT NULL,
	`metadata` text,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`expires_at` datetime(6) NOT NULL,
	`token` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`active_organization_id` text,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime(6) NOT NULL,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mrr_movements` ADD CONSTRAINT `mrr_movements_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `screen_accounts` ADD CONSTRAINT `screen_accounts_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `screen_accounts` ADD CONSTRAINT `screen_accounts_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `screens` ADD CONSTRAINT `screens_workspace_id_organizations_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stripe_accounts` ADD CONSTRAINT `stripe_accounts_workspace_id_organizations_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stripe_coupons` ADD CONSTRAINT `stripe_coupons_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_inviter_id_users_id_fk` FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mrr_movements_account_id_occurred_at_index` ON `mrr_movements` (`account_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `mrr_movements_account_id_stripe_subscription_id_index` ON `mrr_movements` (`account_id`,`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `mrr_movements_account_id_stripe_customer_id_index` ON `mrr_movements` (`account_id`,`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `payments_account_id_occurred_at_index` ON `payments` (`account_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `screens_workspace_id_index` ON `screens` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `stripe_accounts_workspace_id_index` ON `stripe_accounts` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_account_id_stripe_customer_id_index` ON `subscriptions` (`account_id`,`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `invitations_organizationId_idx` ON `invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE INDEX `members_organizationId_idx` ON `members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `members_userId_idx` ON `members` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);