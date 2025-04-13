-- Database schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (typically managed by Supabase Auth)
-- Note: You may not need to create this table manually as Supabase Auth creates an 'auth.users' table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up Row Level Security (RLS) for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own data" ON users
    FOR ALL USING (auth.uid() = user_id);

-- Stories table
CREATE TABLE stories (
    story_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    background TEXT,
    character_num INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Set up Row Level Security (RLS) for stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own stories" ON stories
    FOR ALL USING (auth.uid() = user_id);

-- Characters table
CREATE TABLE characters (
    character_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL,
    name TEXT NOT NULL,
    character TEXT,
    background TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_story FOREIGN KEY (story_id) REFERENCES stories(story_id) ON DELETE CASCADE
);

-- Set up Row Level Security (RLS) for characters
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access characters for their stories" ON characters
    FOR ALL USING (EXISTS (
        SELECT 1 FROM stories
        WHERE stories.story_id = characters.story_id
        AND stories.user_id = auth.uid()
    ));

-- Create indexes for foreign keys to improve query performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_characters_story_id ON characters(story_id);

-- Add triggers to automatically update the updated_at column
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_stories
BEFORE UPDATE ON stories
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_characters
BEFORE UPDATE ON characters
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Function to create characters for a story based on character_num
CREATE OR REPLACE FUNCTION create_characters_for_story(
    story_id_param UUID,
    character_count INTEGER
)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..character_count LOOP
        INSERT INTO characters (
            story_id,
            name
        ) VALUES (
            story_id_param,
            'Character ' || i
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle story creation with characters
CREATE OR REPLACE FUNCTION create_story_with_characters(
    title_param TEXT,
    background_param TEXT,
    character_num_param INTEGER,
    user_id_param UUID
)
RETURNS UUID AS $$
DECLARE
    new_story_id UUID;
BEGIN
    -- Insert the story
    INSERT INTO stories (
        title,
        background,
        character_num,
        user_id
    ) VALUES (
        title_param,
        background_param,
        character_num_param,
        user_id_param
    ) RETURNING story_id INTO new_story_id;
    
    -- Create the specified number of characters
    PERFORM create_characters_for_story(new_story_id, character_num_param);
    
    RETURN new_story_id;
END;
$$ LANGUAGE plpgsql;
