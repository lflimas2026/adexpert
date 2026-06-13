-- Migration: 0001_create_docs_backup.sql
-- Description: Create docs_backup table for D1

CREATE TABLE IF NOT EXISTS docs_backup (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
