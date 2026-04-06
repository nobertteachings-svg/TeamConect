-- Co-founder slot target per idea; existing ideas get 1 slot (current default behavior).
ALTER TABLE "StartupIdea" ADD COLUMN "coFounderSlotsWanted" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "StartupIdea" ADD CONSTRAINT "StartupIdea_coFounderSlotsWanted_check" CHECK ("coFounderSlotsWanted" >= 1 AND "coFounderSlotsWanted" <= 50);
