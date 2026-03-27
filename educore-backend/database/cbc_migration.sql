-- 1. Student & Class Updates
ALTER TABLE students ADD COLUMN IF NOT EXISTS assessment_number VARCHAR(20) UNIQUE;
ALTER TABLE classes RENAME COLUMN form_level TO grade_level;

-- 2. Learning Areas (formerly Subjects)
ALTER TABLE subjects RENAME TO learning_areas;
ALTER TABLE learning_areas RENAME COLUMN name TO learning_area_name;

-- 3. Strands and Sub-strands
CREATE TABLE IF NOT EXISTS strands (
    id SERIAL PRIMARY KEY,
    learning_area_id INTEGER REFERENCES learning_areas(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_strands (
    id SERIAL PRIMARY KEY,
    strand_id INTEGER REFERENCES strands(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. CBC Assessments
CREATE TABLE IF NOT EXISTS cbc_assessments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    sub_strand_id INTEGER REFERENCES sub_strands(id),
    term VARCHAR(20),
    year INTEGER,
    level VARCHAR(5), -- EE, ME, AE, BE
    teacher_comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Seed CBC Grade levels (Kenya CBC structure)
-- Grades 1-9
DELETE FROM classes WHERE grade_level > 9; -- Cleanup old 8-4-4 forms if necessary
UPDATE classes SET name = 'Grade ' || grade_level || ' ' || stream;

-- Seed Sample Learning Areas for CBC
INSERT INTO learning_areas (learning_area_name, code, is_core) VALUES
  ('Literacy Activities', 'LIT', TRUE),
  ('Numeracy Activities', 'NUM', TRUE),
  ('Environmental Activities', 'ENV', TRUE),
  ('Hygiene and Nutrition', 'HYG', TRUE),
  ('Religious Education', 'CRE', TRUE),
  ('Creative Arts', 'ART', FALSE)
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Strands for Numeracy
INSERT INTO strands (learning_area_id, name) 
SELECT id, 'Numbers' FROM learning_areas WHERE code = 'NUM'
ON CONFLICT DO NOTHING;

-- Seed Sample Sub-strands for Numeracy -> Numbers
INSERT INTO sub_strands (strand_id, name)
SELECT id, 'Whole Numbers' FROM strands WHERE name = 'Numbers'
ON CONFLICT DO NOTHING;
INSERT INTO sub_strands (strand_id, name)
SELECT id, 'Addition' FROM strands WHERE name = 'Numbers'
ON CONFLICT DO NOTHING;
