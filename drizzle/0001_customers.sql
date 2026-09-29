CREATE TABLE `customers` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`account_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`stripe_customer_id` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`name` text,
	`country` text,
	`occurred_at` datetime(6) NOT NULL,
	`origin` enum('backfill','live','reconcile') NOT NULL,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_account_id_stripe_customer_id_index` UNIQUE(`account_id`,`stripe_customer_id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_account_id_stripe_accounts_id_fk` FOREIGN KEY (`account_id`) REFERENCES `stripe_accounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customers_account_id_occurred_at_index` ON `customers` (`account_id`,`occurred_at`);