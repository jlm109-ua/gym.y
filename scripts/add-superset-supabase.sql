-- Add superset support to exercises table
ALTER TABLE exercises 
ADD COLUMN is_linked_to_previous BOOLEAN DEFAULT FALSE;

-- Add index for better performance when querying supersets
CREATE INDEX IF NOT EXISTS idx_exercises_linked ON exercises(workout_id, is_linked_to_previous);

-- Update existing exercises to have the default value
UPDATE exercises 
SET is_linked_to_previous = FALSE 
WHERE is_linked_to_previous IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN exercises.is_linked_to_previous IS 'Indicates if this exercise is linked to the previous one in a superset';
