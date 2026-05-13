CREATE TABLE `heartbeats` (
	`id` integer PRIMARY KEY NOT NULL,
	`monitor_id` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`monitor_id` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`message` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `status_pages` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`monitors` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `status_pages_slug_unique` ON `status_pages` (`slug`);