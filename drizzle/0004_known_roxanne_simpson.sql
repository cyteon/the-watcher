CREATE TABLE `notification_targets` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `monitors` ADD `notify` text DEFAULT '[]' NOT NULL;