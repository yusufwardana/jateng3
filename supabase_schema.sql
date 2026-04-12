-- Create a table for map data
CREATE TABLE map_data (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE map_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own map data" 
  ON map_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own map data" 
  ON map_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own map data" 
  ON map_data FOR UPDATE 
  USING (auth.uid() = user_id);
