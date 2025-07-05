-- Create physical progress table for weight and height tracking
CREATE TABLE IF NOT EXISTS physical_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    weight NUMERIC(5,2), -- Weight in kg (e.g., 75.50)
    height NUMERIC(5,2), -- Height in cm (e.g., 175.00)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_physical_progress_user_date ON physical_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_physical_progress_date ON physical_progress(date);

-- Add comments for documentation
COMMENT ON TABLE physical_progress IS 'Stores physical progress data including weight and height measurements';
COMMENT ON COLUMN physical_progress.weight IS 'Weight in kilograms with 2 decimal precision';
COMMENT ON COLUMN physical_progress.height IS 'Height in centimeters with 2 decimal precision';
COMMENT ON COLUMN physical_progress.date IS 'Date of the measurement (one measurement per day per user)';

-- Insert some sample data (optional)
INSERT INTO physical_progress (user_id, date, weight, height) VALUES
('550e8400-e29b-41d4-a716-446655440000', '2024-12-01', 75.5, 175.0),
('550e8400-e29b-41d4-a716-446655440000', '2024-12-15', 74.8, 175.0),
('550e8400-e29b-41d4-a716-446655440000', '2025-01-01', 74.2, 175.0),
('550e8400-e29b-41d4-a716-446655440000', '2025-01-15', 73.9, 175.0)
ON CONFLICT (user_id, date) DO NOTHING;
