-- LucidCraft Database Schema
-- PostgreSQL DDL for progress tracking and lesson management

-- ============================================================================
-- LESSONS & TUTORIALS STRUCTURE
-- ============================================================================

-- Main lessons table - individual drawing lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_tag VARCHAR(100) NOT NULL, -- e.g., 'basic-shapes', 'advanced-shading'
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    est_minutes INTEGER DEFAULT 10, -- estimated completion time in minutes
    thumbnail_url TEXT, -- preview image for the lesson
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tutorials table - structured multi-lesson learning paths
CREATE TABLE tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    skill_tag VARCHAR(100) NOT NULL, -- primary skill focus
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    est_minutes INTEGER DEFAULT 60, -- total estimated time for entire tutorial
    thumbnail_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Checkpoints within tutorials - logical groupings of steps
CREATE TABLE checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL, -- sequence within tutorial (0-based)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tutorial_id, order_index) -- ensure unique ordering within tutorial
);

-- Individual steps within lessons or checkpoints
CREATE TABLE steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Parent relationship - either lesson_id OR checkpoint_id must be set
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN ('stroke-path', 'area-fill', 'dot-to-dot', 'layer-order')),
    order_index INTEGER NOT NULL, -- sequence within parent (0-based)
    
    -- Step configuration stored as JSONB for flexibility
    constraints JSONB, -- tool/size/color restrictions: {"tool": "pencil", "size_range": [1,5], "color": "#000", "locked": true}
    guide JSONB, -- visual guides and assets: {"tip": "text", "path": [...], "overlay": "url", "mask": {...}}
    rubric JSONB, -- evaluation criteria: {"threshold": 0.65, "coverageThreshold": 0.85, "tolerancePx": 12}
    hints JSONB, -- progressive hint system: [{"tier": 1, "text": "...", "action": "play_demo"}]
    on_success JSONB, -- rewards and unlocks: {"award": {"xp": 10, "stars": 3}, "unlock": "next_lesson_id"}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure step belongs to either lesson or checkpoint, not both
    CONSTRAINT step_parent_check CHECK (
        (lesson_id IS NOT NULL AND checkpoint_id IS NULL) OR 
        (lesson_id IS NULL AND checkpoint_id IS NOT NULL)
    ),
    
    -- Unique ordering within parent
    UNIQUE(lesson_id, order_index),
    UNIQUE(checkpoint_id, order_index)
);

-- ============================================================================
-- USER PROGRESS TRACKING
-- ============================================================================

-- Overall progress for lessons and tutorials
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Parent reference - either lesson_id OR tutorial_id
    parent_type VARCHAR(20) NOT NULL CHECK (parent_type IN ('lesson', 'tutorial')),
    parent_id UUID NOT NULL, -- references lessons.id or tutorials.id
    
    stars INTEGER DEFAULT 0 CHECK (stars >= 0), -- total stars earned
    last_step_id UUID REFERENCES steps(id) ON DELETE SET NULL, -- resume point
    completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage BETWEEN 0.00 AND 100.00),
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE, -- null if not completed
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one progress record per user per parent
    UNIQUE(user_id, parent_type, parent_id)
);

-- Individual step attempts and results
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
    
    result VARCHAR(20) NOT NULL CHECK (result IN ('pass', 'fail', 'skipped')),
    score DECIMAL(5,4), -- normalized score 0.0000-1.0000, null for skipped
    stars_earned INTEGER DEFAULT 0 CHECK (stars_earned BETWEEN 0 AND 3),
    
    -- Attempt metadata
    attempt_duration_ms INTEGER, -- time spent on this attempt
    hint_tier_reached INTEGER CHECK (hint_tier_reached BETWEEN 1 AND 3), -- highest hint tier shown
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Lessons and tutorials
CREATE INDEX idx_lessons_skill_tag ON lessons(skill_tag);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX idx_lessons_published ON lessons(is_published);
CREATE INDEX idx_tutorials_skill_tag ON tutorials(skill_tag);
CREATE INDEX idx_tutorials_published ON tutorials(is_published);

-- Structural relationships
CREATE INDEX idx_checkpoints_tutorial ON checkpoints(tutorial_id, order_index);
CREATE INDEX idx_steps_lesson ON steps(lesson_id, order_index);
CREATE INDEX idx_steps_checkpoint ON steps(checkpoint_id, order_index);
CREATE INDEX idx_steps_type ON steps(step_type);

-- Progress tracking
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_parent ON progress(parent_type, parent_id);
CREATE INDEX idx_progress_updated ON progress(updated_at);
CREATE INDEX idx_attempts_user_step ON attempts(user_id, step_id);
CREATE INDEX idx_attempts_step ON attempts(step_id);
CREATE INDEX idx_attempts_result ON attempts(result);
CREATE INDEX idx_attempts_created ON attempts(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can view published lessons" ON lessons
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view published tutorials" ON tutorials
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view checkpoints of published tutorials" ON checkpoints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutorials 
            WHERE tutorials.id = checkpoints.tutorial_id 
            AND tutorials.is_published = true
        )
    );

CREATE POLICY "Public can view steps of published content" ON steps
    FOR SELECT USING (
        (lesson_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM lessons 
            WHERE lessons.id = steps.lesson_id 
            AND lessons.is_published = true
        )) OR
        (checkpoint_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM checkpoints 
            JOIN tutorials ON tutorials.id = checkpoints.tutorial_id
            WHERE checkpoints.id = steps.checkpoint_id 
            AND tutorials.is_published = true
        ))
    );

-- User progress - users can only access their own data
CREATE POLICY "Users can manage their own progress" ON progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own attempts" ON attempts
    FOR ALL USING (auth.uid() = user_id);

-- Content creators can manage their own content
CREATE POLICY "Creators can manage their lessons" ON lessons
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Creators can manage their tutorials" ON tutorials
    FOR ALL USING (auth.uid() = created_by);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage(
    p_user_id UUID,
    p_parent_type VARCHAR(20),
    p_parent_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_steps INTEGER;
    completed_steps INTEGER;
BEGIN
    -- Count total steps for the parent
    IF p_parent_type = 'lesson' THEN
        SELECT COUNT(*) INTO total_steps
        FROM steps
        WHERE lesson_id = p_parent_id;
    ELSE -- tutorial
        SELECT COUNT(*) INTO total_steps
        FROM steps s
        JOIN checkpoints c ON s.checkpoint_id = c.id
        WHERE c.tutorial_id = p_parent_id;
    END IF;
    
    -- Count completed steps (with passing attempts)
    IF p_parent_type = 'lesson' THEN
        SELECT COUNT(DISTINCT s.id) INTO completed_steps
        FROM steps s
        JOIN attempts a ON s.id = a.step_id
        WHERE s.lesson_id = p_parent_id
        AND a.user_id = p_user_id
        AND a.result = 'pass';
    ELSE -- tutorial
        SELECT COUNT(DISTINCT s.id) INTO completed_steps
        FROM steps s
        JOIN checkpoints c ON s.checkpoint_id = c.id
        JOIN attempts a ON s.id = a.step_id
        WHERE c.tutorial_id = p_parent_id
        AND a.user_id = p_user_id
        AND a.result = 'pass';
    END IF;
    
    -- Return percentage
    IF total_steps = 0 THEN
        RETURN 0.00;
    ELSE
        RETURN ROUND((completed_steps::DECIMAL / total_steps::DECIMAL) * 100, 2);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA COMMENTS
-- ============================================================================

/*
Example lesson structure:
- Lesson: "Basic Circle Drawing"
  - Step 1: stroke-path (trace circle outline)
  - Step 2: area-fill (fill circle with color)
  - Step 3: stroke-path (add shading stroke)

Example tutorial structure:
- Tutorial: "Portrait Drawing Fundamentals"
  - Checkpoint 1: "Face Shape"
    - Step 1: stroke-path (outline face)
    - Step 2: dot-to-dot (place facial features)
  - Checkpoint 2: "Features"
    - Step 3: stroke-path (draw eyes)
    - Step 4: stroke-path (draw nose)
    - Step 5: stroke-path (draw mouth)
  - Checkpoint 3: "Shading"
    - Step 6: area-fill (shadow areas)
    - Step 7: layer-order (arrange depth)

Progress tracking:
- User completes steps → attempts table records each try
- Progress table tracks overall completion per lesson/tutorial
- Stars accumulate based on performance (1-3 stars per step)
- Resume functionality via last_step_id
*/
