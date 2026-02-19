-- Supabase schema for Sylva tree species prediction
-- Contains tables for species embeddings, predictions, and user history

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Species table with embeddings
CREATE TABLE IF NOT EXISTS species (
    id SERIAL PRIMARY KEY,
    scientific_name TEXT NOT NULL,
    common_name TEXT,
    description TEXT,
    embedding vector(384),  -- Adjust dimension based on model
    created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions history table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    predicted_species_id INTEGER REFERENCES species(id),
    confidence_score FLOAT,
    bioclim_values JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS species_embedding_idx 
ON species 
USING ivfflat (embedding vector_cosine_ops);

-- Row Level Security
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to species
CREATE POLICY "Public read access to species" 
ON species FOR SELECT 
USING (true);

-- Allow authenticated users to insert predictions
CREATE POLICY "Users can insert their predictions" 
ON predictions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own predictions
CREATE POLICY "Users can read own predictions" 
ON predictions FOR SELECT 
USING (auth.uid() = user_id);
