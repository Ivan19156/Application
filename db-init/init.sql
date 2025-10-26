-- CREATE TABLE "Users" (
--     "Id" UUID PRIMARY KEY,
--     "Name" VARCHAR(100) NOT NULL,
--     "Email" VARCHAR(255) NOT NULL UNIQUE,
--     "PasswordHash" TEXT NOT NULL
-- );
-- CREATE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");


-- CREATE TABLE "Events" (
--     "Id" UUID PRIMARY KEY,
--     "Name" VARCHAR(200) NOT NULL,
--     "Description" TEXT NULL,
--     "DateTime" TIMESTAMPTZ NOT NULL,
--     "Location" VARCHAR(255) NOT NULL,
--     "Capacity" INTEGER NULL,
--     "Visibility" SMALLINT NOT NULL DEFAULT 0, 
--     "OrganizerId" UUID NOT NULL,
--     CONSTRAINT "FK_Events_Users_OrganizerId" FOREIGN KEY ("OrganizerId")
--         REFERENCES "Users" ("Id") ON DELETE CASCADE
-- );
-- CREATE INDEX IF NOT EXISTS "IX_Events_DateTime" ON "Events" ("DateTime");
-- CREATE INDEX IF NOT EXISTS "IX_Events_OrganizerId" ON "Events" ("OrganizerId");


-- CREATE TABLE "Participants" (
--     "UserId" UUID NOT NULL,
--     "EventId" UUID NOT NULL,
--     CONSTRAINT "PK_Participants" PRIMARY KEY ("UserId", "EventId"),
--     CONSTRAINT "FK_Participants_Users_UserId" FOREIGN KEY ("UserId")
--         REFERENCES "Users" ("Id") ON DELETE CASCADE,
--     CONSTRAINT "FK_Participants_Events_EventId" FOREIGN KEY ("EventId")
--         REFERENCES "Events" ("Id") ON DELETE CASCADE
-- );
-- CREATE INDEX IF NOT EXISTS "IX_Participants_EventId" ON "Participants" ("EventId");
-- CREATE INDEX IF NOT EXISTS "IX_Participants_UserId" ON "Participants" ("UserId");


-- CREATE TABLE "Tags" (
--     "Id" UUID PRIMARY KEY,
--     "Name" VARCHAR(50) NOT NULL UNIQUE
-- );
-- CREATE UNIQUE INDEX IF NOT EXISTS "IX_Tags_Name_Lower" ON "Tags" (lower("Name"));


-- CREATE TABLE "EventTags" (
--     "EventId" UUID NOT NULL,
--     "TagId" UUID NOT NULL,
--     CONSTRAINT "PK_EventTags" PRIMARY KEY ("EventId", "TagId"),
--     CONSTRAINT "FK_EventTags_Events_EventId" FOREIGN KEY ("EventId")
--         REFERENCES "Events" ("Id") ON DELETE CASCADE,
--     CONSTRAINT "FK_EventTags_Tags_TagId" FOREIGN KEY ("TagId")
--         REFERENCES "Tags" ("Id") ON DELETE CASCADE
-- );
-- CREATE INDEX IF NOT EXISTS "IX_EventTags_TagId" ON "EventTags" ("TagId");

CREATE TABLE "Users" (
    "Id" UUID PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(255) NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");


CREATE TABLE "Events" (
    "Id" UUID PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT NULL,
    "DateTime" TIMESTAMPTZ NOT NULL,
    "Location" VARCHAR(255) NOT NULL,
    "Capacity" INTEGER NULL,
    "Visibility" SMALLINT NOT NULL DEFAULT 0, 
    "OrganizerId" UUID NOT NULL,
    CONSTRAINT "FK_Events_Users_OrganizerId" FOREIGN KEY ("OrganizerId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_Events_DateTime" ON "Events" ("DateTime");
CREATE INDEX IF NOT EXISTS "IX_Events_OrganizerId" ON "Events" ("OrganizerId");


CREATE TABLE "Participants" (
    "UserId" UUID NOT NULL,
    "EventId" UUID NOT NULL,
    CONSTRAINT "PK_Participants" PRIMARY KEY ("UserId", "EventId"),
    CONSTRAINT "FK_Participants_Users_UserId" FOREIGN KEY ("UserId")
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Participants_Events_EventId" FOREIGN KEY ("EventId")
        REFERENCES "Events" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_Participants_EventId" ON "Participants" ("EventId");
CREATE INDEX IF NOT EXISTS "IX_Participants_UserId" ON "Participants" ("UserId");


CREATE TABLE "Tags" (
    "Id" UUID PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL -- 👈 Я прибрав 'UNIQUE' звідси
);
-- ✅ А цей індекс залишаємо, бо він реалізує case-insensitive унікальність
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Tags_Name_Lower" ON "Tags" (lower("Name"));


CREATE TABLE "EventTags" (
    "EventId" UUID NOT NULL,
    "TagId" UUID NOT NULL,
    CONSTRAINT "PK_EventTags" PRIMARY KEY ("EventId", "TagId"),
    CONSTRAINT "FK_EventTags_Events_EventId" FOREIGN KEY ("EventId")
        REFERENCES "Events" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_EventTags_Tags_TagId" FOREIGN KEY ("TagId")
        REFERENCES "Tags" ("Id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IX_EventTags_TagId" ON "EventTags" ("TagId");

