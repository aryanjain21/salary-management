/*
  Warnings:

  - You are about to drop the column `currency` on the `SalaryChange` table. All the data in the column will be lost.
  - Added the required column `newCurrency` to the `SalaryChange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oldCurrency` to the `SalaryChange` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalaryChange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "oldSalary" INTEGER NOT NULL,
    "oldCurrency" TEXT NOT NULL,
    "newSalary" INTEGER NOT NULL,
    "newCurrency" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryChange_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SalaryChange" ("changedAt", "employeeId", "id", "newSalary", "oldSalary", "reason") SELECT "changedAt", "employeeId", "id", "newSalary", "oldSalary", "reason" FROM "SalaryChange";
DROP TABLE "SalaryChange";
ALTER TABLE "new_SalaryChange" RENAME TO "SalaryChange";
CREATE INDEX "SalaryChange_employeeId_changedAt_idx" ON "SalaryChange"("employeeId", "changedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
