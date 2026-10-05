-- Only unreleased builds of the app registered phones, by their Expo token: they register again,
-- by installation, at their next launch.
DELETE FROM `push_devices`;--> statement-breakpoint
ALTER TABLE `push_devices` MODIFY COLUMN `push_token` varchar(255) character set ascii collate ascii_bin;--> statement-breakpoint
ALTER TABLE `push_devices` ADD `installation_id` varchar(36) character set ascii collate ascii_bin NOT NULL;--> statement-breakpoint
ALTER TABLE `push_devices` ADD `device_token` varchar(512) character set ascii collate ascii_bin;--> statement-breakpoint
ALTER TABLE `push_devices` ADD `apns_environment` enum('development','production');--> statement-breakpoint
ALTER TABLE `push_devices` ADD `enabled` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `push_devices` ADD `muted_events` json DEFAULT ('[]') NOT NULL;--> statement-breakpoint
-- Added before the previous unique key is dropped: the foreign key on `screen_id` needs an index.
ALTER TABLE `push_devices` ADD CONSTRAINT `push_devices_screen_id_installation_id_index` UNIQUE(`screen_id`,`installation_id`);--> statement-breakpoint
ALTER TABLE `push_devices` DROP INDEX `push_devices_screen_id_push_token_index`;--> statement-breakpoint
CREATE INDEX `push_devices_device_token_index` ON `push_devices` (`device_token`);
