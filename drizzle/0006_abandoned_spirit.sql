CREATE TABLE "status_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"monitor_id" integer NOT NULL,
	"timestamp" integer NOT NULL,
	"status" text NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_updates" ADD CONSTRAINT "status_updates_monitor_id_monitors_id_fk" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heartbeats" DROP COLUMN "message";