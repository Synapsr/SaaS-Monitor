CREATE TABLE `revenuecat_daily_metrics` (
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`day` varchar(10) character set ascii collate ascii_bin NOT NULL,
	`currency` varchar(3) NOT NULL,
	`revenue` bigint NOT NULL DEFAULT 0,
	`mrr_new` bigint NOT NULL DEFAULT 0,
	`mrr_expansion` bigint NOT NULL DEFAULT 0,
	`mrr_reactivation` bigint NOT NULL DEFAULT 0,
	`mrr_contraction` bigint NOT NULL DEFAULT 0,
	`mrr_churn` bigint NOT NULL DEFAULT 0,
	`new_paying_customers` int NOT NULL DEFAULT 0,
	`new_customers` int NOT NULL DEFAULT 0,
	CONSTRAINT `revenuecat_daily_metrics_account_id_day_pk` PRIMARY KEY(`account_id`,`day`)
);
--> statement-breakpoint
CREATE TABLE `revenuecat_metrics` (
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`currency` varchar(3) NOT NULL,
	`mrr` bigint NOT NULL,
	`active_subscriptions` int NOT NULL DEFAULT 0,
	`active_trials` int NOT NULL DEFAULT 0,
	`overview_updated_at` datetime(6) NOT NULL,
	`products` json NOT NULL DEFAULT ('{}'),
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `revenuecat_metrics_account_id` PRIMARY KEY(`account_id`)
);
--> statement-breakpoint
ALTER TABLE `stripe_accounts` DROP INDEX `stripe_accounts_workspace_id_stripe_account_id_livemode_index`;--> statement-breakpoint
ALTER TABLE `stripe_accounts` ADD `provider` enum('stripe','revenuecat') DEFAULT 'stripe' NOT NULL;--> statement-breakpoint
ALTER TABLE `stripe_accounts` ADD CONSTRAINT `stripe_accounts_workspace_id_stripe_account_id_livemode_index` UNIQUE(`workspace_id`,`provider`,`stripe_account_id`,`livemode`);--> statement-breakpoint
ALTER TABLE `revenuecat_daily_metrics` ADD CONSTRAINT `revenuecat_daily_metrics_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenuecat_metrics` ADD CONSTRAINT `revenuecat_metrics_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `revenuecat_daily_metrics_account_id_day_index` ON `revenuecat_daily_metrics` (`account_id`,`day`);