-- Insert sample exercise templates
INSERT INTO exercise_templates (name, session_type, muscle_tags) VALUES
-- PUSH exercises
('Press Banca', 'PUSH', '{"Pecho", "Tríceps"}'),
('Press Inclinado', 'PUSH', '{"Pecho", "Hombros"}'),
('Press Militar', 'PUSH', '{"Hombros", "Tríceps"}'),
('Fondos', 'PUSH', '{"Pecho", "Tríceps"}'),
('Press Francés', 'PUSH', '{"Tríceps"}'),
('Elevaciones Laterales', 'PUSH', '{"Hombros"}'),

-- PULL exercises
('Peso Muerto', 'PULL', '{"Espalda", "Isquiotibiales"}'),
('Dominadas', 'PULL', '{"Espalda", "Bíceps"}'),
('Remo con Barra', 'PULL', '{"Espalda", "Bíceps"}'),
('Curl de Bíceps', 'PULL', '{"Bíceps"}'),
('Remo en Polea', 'PULL', '{"Espalda"}'),
('Face Pull', 'PULL', '{"Hombros", "Espalda"}'),

-- LEG exercises
('Sentadilla', 'LEG', '{"Cuádriceps", "Glúteos"}'),
('Peso Muerto Rumano', 'LEG', '{"Isquiotibiales", "Glúteos"}'),
('Prensa de Piernas', 'LEG', '{"Cuádriceps", "Glúteos"}'),
('Zancadas', 'LEG', '{"Cuádriceps", "Glúteos"}'),
('Curl Femoral', 'LEG', '{"Isquiotibiales"}'),
('Extensión de Cuádriceps', 'LEG', '{"Cuádriceps"}'),
('Elevaciones de Pantorrilla', 'LEG', '{"Pantorrillas"}')

ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (theme, primary_color) VALUES ('light', 'blue')
ON CONFLICT DO NOTHING;
