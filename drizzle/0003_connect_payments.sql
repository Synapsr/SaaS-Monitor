ALTER TABLE `payments` ADD `connected_account_id` varchar(255) character set ascii collate ascii_bin;--> statement-breakpoint
ALTER TABLE `payments` ADD `application_fee` bigint;