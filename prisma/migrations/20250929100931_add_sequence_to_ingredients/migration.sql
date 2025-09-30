-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "min" REAL,
    "max" REAL,
    "mandatory" REAL,
    "indivisible" REAL,
    "carbo100g" REAL NOT NULL,
    "protein100g" REAL NOT NULL,
    "fat100g" REAL NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ingredient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ingredient" ("carbo100g", "createdAt", "fat100g", "id", "indivisible", "mandatory", "max", "min", "name", "protein100g", "updatedAt", "userId") SELECT "carbo100g", "createdAt", "fat100g", "id", "indivisible", "mandatory", "max", "min", "name", "protein100g", "updatedAt", "userId" FROM "Ingredient";
DROP TABLE "Ingredient";
ALTER TABLE "new_Ingredient" RENAME TO "Ingredient";
UPDATE "Ingredient"
SET "sequence" = (
  SELECT rn - 1
  FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt", "id") AS rn
    FROM "Ingredient"
  ) ranked
  WHERE ranked."id" = "Ingredient"."id"
);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
