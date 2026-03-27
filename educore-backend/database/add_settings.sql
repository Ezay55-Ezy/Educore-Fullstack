CREATE TABLE IF NOT EXISTS settings (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(50) UNIQUE NOT NULL,
  value       TEXT,
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES ('institution_name', 'EduCore Academy') ON CONFLICT DO NOTHING;
