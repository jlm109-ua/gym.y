-- Create wellness_tracking table for daily wellness metrics
CREATE TABLE IF NOT EXISTS wellness_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
  motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create training_metrics table for calculated metrics
CREATE TABLE IF NOT EXISTS training_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  date DATE NOT NULL,
  estimated_1rm DECIMAL(5,2),
  total_volume DECIMAL(8,2),
  intensity_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercise_1rm table for 1RM tracking
CREATE TABLE IF NOT EXISTS exercise_1rm (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  estimated_1rm DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  calculation_method TEXT DEFAULT 'epley',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wellness_tracking_user_date ON wellness_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_training_metrics_user_exercise ON training_metrics(user_id, exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercise_1rm_user_exercise ON exercise_1rm(user_id, exercise_name);