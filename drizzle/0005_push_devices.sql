CREATE TABLE `push_devices` (
	`id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`screen_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`push_token` varchar(255) character set ascii collate ascii_bin NOT NULL,
	`platform` enum('ios','android') NOT NULL,
	`locale` varchar(35),
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	`updated_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `push_devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_devices_screen_id_push_token_index` UNIQUE(`screen_id`,`push_token`)
);
--> statement-breakpoint
ALTER TABLE `push_devices` ADD CONSTRAINT `push_devices_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `push_devices_push_token_index` ON `push_devices` (`push_token`);