CREATE TABLE `push_milestones` (
	`screen_id` varchar(36) character set ascii collate ascii_bin NOT NULL,
	`milestone` varchar(100) character set ascii collate ascii_bin NOT NULL,
	`created_at` datetime(6) NOT NULL DEFAULT (now(6)),
	CONSTRAINT `push_milestones_screen_id_milestone_pk` PRIMARY KEY(`screen_id`,`milestone`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `notified_at` datetime(6);--> statement-breakpoint
ALTER TABLE `mrr_movements` ADD `notified_at` datetime(6);--> statement-breakpoint
ALTER TABLE `payments` ADD `notified_at` datetime(6);--> statement-breakpoint
ALTER TABLE `push_milestones` ADD CONSTRAINT `push_milestones_screen_id_screens_id_fk` FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON DELETE cascade ON UPDATE no action;