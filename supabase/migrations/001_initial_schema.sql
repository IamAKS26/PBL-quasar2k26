-- PBL Platform Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Schools table (for multi-tenancy)
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'admin')),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GROUPS & PROJECTS
-- =============================================

-- Groups (Teams)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  project_status TEXT NOT NULL DEFAULT 'pending_topic' CHECK (project_status IN ('pending_topic', 'active')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students (links users to groups)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  personal_xp INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Mastery Scores
CREATE TABLE mastery_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  math INTEGER DEFAULT 0 CHECK (math >= 0 AND math <= 100),
  science INTEGER DEFAULT 0 CHECK (science >= 0 AND science <= 100),
  creativity INTEGER DEFAULT 0 CHECK (creativity >= 0 AND creativity <= 100),
  leadership INTEGER DEFAULT 0 CHECK (leadership >= 0 AND leadership <= 100),
  average_score DECIMAL(5,2) GENERATED ALWAYS AS ((math + science + creativity + leadership) / 4.0) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE UNIQUE,
  topic TEXT NOT NULL,
  driving_question TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Phases
CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  deadline TIMESTAMPTZ,
  phase_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase_order)
);

-- Rubrics
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rubric Criteria
CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_points INTEGER NOT NULL,
  criteria_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rubric_id, criteria_order)
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMPTZ,
  is_overdue BOOLEAN DEFAULT FALSE,
  rubric_id UUID REFERENCES rubrics(id) ON DELETE SET NULL,
  task_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phase_id, task_order)
);

-- =============================================
-- SUBMISSIONS & FEEDBACK
-- =============================================

-- Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('github', 'image')),
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  revision_count INTEGER DEFAULT 0,
  UNIQUE(task_id, student_id)
);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  teacher_comment TEXT NOT NULL,
  rubric_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GAMIFICATION
-- =============================================

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Badges (many-to-many)
CREATE TABLE group_badges (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, badge_id)
);

-- Student Personal Badges
CREATE TABLE student_badges (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, badge_id)
);

-- =============================================
-- ANALYTICS & ACTIVITY
-- =============================================

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('task_started', 'task_completed', 'submission_made', 'phase_unlocked')),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Resources (linked to projects)
CREATE TABLE project_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  uri TEXT NOT NULL,
  resource_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, resource_order)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_groups_teacher ON groups(teacher_id);
CREATE INDEX idx_groups_school ON groups(school_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_group ON students(group_id);
CREATE INDEX idx_projects_group ON projects(group_id);
CREATE INDEX idx_phases_project ON project_phases(project_id);
CREATE INDEX idx_tasks_phase ON tasks(phase_id);
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_activity_logs_student ON activity_logs(student_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_feedback_submission ON feedback(submission_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;

-- User Profiles: Users can read all profiles, update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Groups: Teachers see their own groups, students see their group
CREATE POLICY "Teachers see own groups"
  ON groups FOR SELECT
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM students
      WHERE students.group_id = groups.id
      AND students.user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create groups"
  ON groups FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own groups"
  ON groups FOR UPDATE
  USING (teacher_id = auth.uid());

-- Students: Can view students in same group
CREATE POLICY "Students viewable by group members"
  ON students FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM students s2
      WHERE s2.group_id = students.group_id
      AND s2.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = students.group_id
      AND groups.teacher_id = auth.uid()
    )
  );

-- Submissions: Students can submit, teachers can review
CREATE POLICY "Students can create submissions"
  ON submissions FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Students can view own submissions"
  ON submissions FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN project_phases pp ON t.phase_id = pp.id
      JOIN projects p ON pp.project_id = p.id
      JOIN groups g ON p.group_id = g.id
      WHERE t.id = submissions.task_id
      AND g.teacher_id = auth.uid()
    )
  );

-- Activity Logs: Students create, teachers view
CREATE POLICY "Students can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  ));

CREATE POLICY "View activity logs in own context"
  ON activity_logs FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM students s
      JOIN groups g ON s.group_id = g.id
      WHERE s.id = activity_logs.student_id
      AND g.teacher_id = auth.uid()
    )
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON project_phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student'); -- Default role
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA: Default Badges
-- =============================================

INSERT INTO badges (id, name, icon, description, color) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'First Step', '🚀', 'Complete your first task', 'bg-blue-100 text-blue-600'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Momentum', '🔥', 'Complete 3 tasks', 'bg-orange-100 text-orange-600'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Phase Master', '✨', 'Complete a project phase', 'bg-purple-100 text-purple-600'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Halfway There', '⛰️', 'Reach 50% project completion', 'bg-teal-100 text-teal-600'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Champion', '🏆', 'Complete the entire project', 'bg-yellow-100 text-yellow-600');
