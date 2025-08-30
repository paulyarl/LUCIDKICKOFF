-- Seed initial templates (adjust image_path to match uploaded files in 'templates' bucket)
insert into public.templates (title, image_path, is_free, tags)
values
  ('Friendly Lion', 'bw/friendly-lion.png', true,  '{animals,beginner}'),
  ('Flower',        'bw/flower.png',        true,  '{nature,beginner}'),
  ('Castle',        'bw/castle.png',        false, '{architecture}'),
  ('Robot',         'bw/robot.png',         false, '{sci-fi}')
ON CONFLICT (id) DO NOTHING; -- safe if re-run, but note id is defaulted so this avoids duplicates only if you keep same IDs
