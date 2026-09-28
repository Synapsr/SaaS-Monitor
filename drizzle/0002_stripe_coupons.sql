CREATE TABLE "stripe_coupons" (
	"account_id" uuid NOT NULL,
	"coupon_id" text NOT NULL,
	"terms" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_coupons_account_id_coupon_id_pk" PRIMARY KEY("account_id","coupon_id")
);
--> statement-breakpoint
ALTER TABLE "stripe_coupons" ADD CONSTRAINT "stripe_coupons_account_id_stripe_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE cascade ON UPDATE no action;