CREATE TABLE "heartbeats" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"timestamp" integer NOT NULL,
	"status" text NOT NULL,
	"response_time" integer NOT NULL,
	"error_message" text
);
--> statement-breakpoint
ALTER TABLE "monitors" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;