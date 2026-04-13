CREATE TABLE `monitors` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`paused` integer DEFAULT false NOT NULL,
	`target` text NOT NULL,
	`interval` integer NOT NULL
);
