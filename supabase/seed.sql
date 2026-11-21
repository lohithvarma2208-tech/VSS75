-- KLU Commons: Database Seed Data
-- Fictional sample profiles, official KLU courses, rich academic resources, and community demo records.

-- Insert Categories
INSERT INTO public.categories (id, name, slug, description, icon, display_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Assignments', 'assignments', 'Coursework, homework problems, and programming tasks', 'FileText', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Programming', 'programming', 'Source code, snippets, and algorithmic solutions', 'Code2', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Lab Records', 'lab-records', 'Formal laboratory observations, writeups, and outputs', 'FlaskConical', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Lab Experiments', 'lab-experiments', 'Individual experiment instructions, procedures, and data tables', 'Microscope', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Mini Projects', 'mini-projects', 'Semester-end prototypes, small web/hardware builds', 'Layers', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Major Projects', 'major-projects', 'Capstone engineering initiatives and final year submissions', 'Award', 6),
  ('c1000000-0000-0000-0000-000000000007', 'DTIE Projects', 'dtie-projects', 'Design Thinking and Innovation in Engineering prototypes and reports', 'Lightbulb', 7),
  ('c1000000-0000-0000-0000-000000000008', 'Mathematics', 'mathematics', 'Discrete mathematics, linear algebra, calculus, and probability guides', 'Binary', 8),
  ('c1000000-0000-0000-0000-000000000009', 'Notes', 'notes', 'Classroom lecture summaries, unit breakdowns, and revision slides', 'BookOpen', 9),
  ('c1000000-0000-0000-0000-000000000010', 'Presentations', 'presentations', 'Seminar slide decks, project defense slides, and PPTs', 'Presentation', 10),
  ('c1000000-0000-0000-0000-000000000011', 'Reports', 'reports', 'Technical seminar documentation, internship reports, and case studies', 'FileSpreadsheet', 11),
  ('c1000000-0000-0000-0000-000000000012', 'Study Resources', 'study-resources', 'Question banks, previous year exam solutions, and reference cheatsheets', 'GraduationCap', 12),
  ('c1000000-0000-0000-0000-000000000013', 'Other Academic Resources', 'other', 'Miscellaneous academic toolchains, installation guides, and papers', 'FolderArchive', 13)
ON CONFLICT (name) DO NOTHING;

-- Insert Standard KLU Courses
INSERT INTO public.courses (id, code, name, department, semester) VALUES
  ('d1000000-0000-0000-0000-000000000001', '23CS2101', 'Data Structures & Algorithms', 'CSE', 'Sem 3'),
  ('d1000000-0000-0000-0000-000000000002', '23CS2202', 'Advanced Object Oriented Programming (Java)', 'CSE', 'Sem 3'),
  ('d1000000-0000-0000-0000-000000000003', '23CS3105', 'Design & Analysis of Algorithms', 'CSE', 'Sem 4'),
  ('d1000000-0000-0000-0000-000000000004', '23CS3106', 'Database Management Systems', 'CSE', 'Sem 4'),
  ('d1000000-0000-0000-0000-000000000005', '23DT1101', 'Design Thinking & Innovation in Engineering (DTIE)', 'General Engineering', 'Sem 2'),
  ('d1000000-0000-0000-0000-000000000006', '23MT2001', 'Discrete Mathematics & Graph Theory', 'Mathematics', 'Sem 3'),
  ('d1000000-0000-0000-0000-000000000007', '23CS3208', 'Operating Systems & System Programming', 'CSE', 'Sem 4'),
  ('d1000000-0000-0000-0000-000000000008', '23CS3309', 'Computer Networks & Protocols', 'CSE', 'Sem 5'),
  ('d1000000-0000-0000-0000-000000000009', '23AI2102', 'Applied Machine Learning Foundations', 'AI&DS', 'Sem 5'),
  ('d1000000-0000-0000-0000-000000000010', '23EC2203', 'Digital Logic & Computer Architecture', 'ECE', 'Sem 3')
ON CONFLICT (code) DO NOTHING;
