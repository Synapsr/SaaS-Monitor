DROP INDEX "stripe_accounts_workspace_id_stripe_account_id_index";--> statement-breakpoint
ALTER TABLE "stripe_accounts" ADD COLUMN "reconcile" jsonb;--> statement-breakpoint
ALTER TABLE "stripe_accounts" ADD COLUMN "last_event_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stripe_accounts" ADD COLUMN "sync_failures" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "mrr_movements_account_id_stripe_subscription_id_index" ON "mrr_movements" USING btree ("account_id","stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "mrr_movements_account_id_stripe_customer_id_index" ON "mrr_movements" USING btree ("account_id","stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_accounts_workspace_id_stripe_account_id_livemode_index" ON "stripe_accounts" USING btree ("workspace_id","stripe_account_id","livemode");