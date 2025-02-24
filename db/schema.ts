import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    telegramId: bigint("telegram_id", { mode: "number" }).notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    username: text("username"),
    walletAddress: text("wallet_address"),
    photoUrl: text("photo_url"),
    isPremium: boolean("is_premium").default(false).notNull(),
    languageCode: text("language_code"),
    referralCode: text("referral_code").notNull().unique(),
    friendCount: integer("friend_count").default(0).notNull(),
    referredByCode: text("referred_by_code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("wallet_address_idx").on(table.walletAddress),
    index("referral_code_idx").on(table.referralCode),
    index("referred_by_code_idx").on(table.referredByCode),
    index("telegram_id_idx").on(table.telegramId),
  ]
);

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    handle: text("handle").notNull().unique(),
    emoji: text("emoji"),
    isNew: boolean("is_new").default(false).notNull(),
    explore: integer("explore").default(0).notNull(),
    reward: integer("reward").default(0).notNull(),
    mask: integer("mask").default(0).notNull(),
    dep: integer("dep"),
    freq: integer("freq"),
    isBasic: boolean("is_basic").default(false).notNull(),
  },
  (table) => {
    return [
      index("handle_idx").on(table.handle),
      index("emoji_idx").on(table.emoji),
      index("is_basic_idx").on(table.isBasic),
    ];
  }
);

export const userInventories = pgTable(
  "user_inventories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    amount: integer("amount").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => {
    return [
      index("user_id_idx").on(table.userId),
      index("item_id_idx").on(table.itemId),
      unique("user_item_unique").on(table.userId, table.itemId),
    ];
  }
);

export const recipes = pgTable(
  "recipes",
  {
    id: serial("id").primaryKey(),
    ingrAId: integer("ingr_a_id")
      .notNull()
      .references(() => items.id),
    ingrBId: integer("ingr_b_id")
      .notNull()
      .references(() => items.id),
    resultId: integer("result_id").references(() => items.id),
    mask: integer("mask").default(0).notNull(),
  },
  (table) => {
    return [
      index("ingr_a_id_idx").on(table.ingrAId),
      index("ingr_b_id_idx").on(table.ingrBId),
      index("result_id_idx").on(table.resultId),
    ];
  }
);

export const englishWords = pgTable(
  "english_words",
  {
    id: serial("id").primaryKey(),
    lemma: text("lemma").notNull(),
    pos: text("pos").notNull(),
    freq: integer("freq"),
  },
  (table) => {
    return [index("lemma_idx").on(table.lemma), index("pos_idx").on(table.pos)];
  }
);

export const wordCache = pgTable(
  "word_cache",
  {
    id: serial("id").primaryKey(),
    firstWord: text("first_word").notNull(),
    secondWord: text("second_word").notNull(),
    result: text("result").notNull(),
    emoji: text("emoji"),
  },
  (table) => {
    return [
      index("first_word_idx").on(table.firstWord),
      index("second_word_idx").on(table.secondWord),
      index("result_idx").on(table.result),
    ];
  }
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userInventories: many(userInventories),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  userInventories: many(userInventories),
  resultRecipes: many(recipes, { relationName: "ResultItem" }),
  ingredientARecipes: many(recipes, { relationName: "IngredientA" }),
  ingredientBRecipes: many(recipes, { relationName: "IngredientB" }),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  ingredientA: one(items, {
    fields: [recipes.ingrAId],
    references: [items.id],
    relationName: "IngredientA",
  }),
  ingredientB: one(items, {
    fields: [recipes.ingrBId],
    references: [items.id],
    relationName: "IngredientB",
  }),
  result: one(items, {
    fields: [recipes.resultId],
    references: [items.id],
    relationName: "ResultItem",
  }),
}));

export const userInventoriesRelations = relations(
  userInventories,
  ({ one }) => ({
    user: one(users, {
      fields: [userInventories.userId],
      references: [users.id],
    }),
    item: one(items, {
      fields: [userInventories.itemId],
      references: [items.id],
    }),
  })
);
