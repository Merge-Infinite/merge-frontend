CREATE TABLE "english_words" (
	"id" serial PRIMARY KEY NOT NULL,
	"lemma" text NOT NULL,
	"pos" text NOT NULL,
	"freq" integer
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"emoji" text,
	"is_new" boolean DEFAULT false NOT NULL,
	"explore" integer DEFAULT 0 NOT NULL,
	"reward" integer DEFAULT 0 NOT NULL,
	"mask" integer DEFAULT 0 NOT NULL,
	"dep" integer,
	"freq" integer,
	"is_basic" boolean DEFAULT false NOT NULL,
	CONSTRAINT "items_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingr_a_id" integer NOT NULL,
	"ingr_b_id" integer NOT NULL,
	"result_id" integer,
	"mask" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_item_unique" UNIQUE("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "word_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_word" text NOT NULL,
	"second_word" text NOT NULL,
	"result" text NOT NULL,
	"emoji" text
);
--> statement-breakpoint
ALTER TABLE "user_wallets" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_wallets" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_premium" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "friend_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_ingr_a_id_items_id_fk" FOREIGN KEY ("ingr_a_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_ingr_b_id_items_id_fk" FOREIGN KEY ("ingr_b_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_result_id_items_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventories" ADD CONSTRAINT "user_inventories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventories" ADD CONSTRAINT "user_inventories_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lemma_idx" ON "english_words" USING btree ("lemma");--> statement-breakpoint
CREATE INDEX "pos_idx" ON "english_words" USING btree ("pos");--> statement-breakpoint
CREATE INDEX "handle_idx" ON "items" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "emoji_idx" ON "items" USING btree ("emoji");--> statement-breakpoint
CREATE INDEX "is_basic_idx" ON "items" USING btree ("is_basic");--> statement-breakpoint
CREATE INDEX "ingr_a_id_idx" ON "recipes" USING btree ("ingr_a_id");--> statement-breakpoint
CREATE INDEX "ingr_b_id_idx" ON "recipes" USING btree ("ingr_b_id");--> statement-breakpoint
CREATE INDEX "result_id_idx" ON "recipes" USING btree ("result_id");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "user_inventories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "item_id_idx" ON "user_inventories" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "first_word_idx" ON "word_cache" USING btree ("first_word");--> statement-breakpoint
CREATE INDEX "second_word_idx" ON "word_cache" USING btree ("second_word");--> statement-breakpoint
CREATE INDEX "result_idx" ON "word_cache" USING btree ("result");--> statement-breakpoint
CREATE INDEX "wallet_address_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "referral_code_idx" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "referred_by_code_idx" ON "users" USING btree ("referred_by_code");--> statement-breakpoint
CREATE INDEX "telegram_id_idx" ON "users" USING btree ("telegram_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code");