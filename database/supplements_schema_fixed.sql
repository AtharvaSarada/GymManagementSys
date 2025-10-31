-- Supplements table for the supplement store
CREATE TABLE IF NOT EXISTS public.supplements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'General',
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_supplements_available ON public.supplements(is_available);
CREATE INDEX IF NOT EXISTS idx_supplements_category ON public.supplements(category);

-- Add trigger for updated_at (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_supplements_updated_at 
            BEFORE UPDATE ON public.supplements 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample supplements
INSERT INTO public.supplements (name, description, price, category, stock_quantity, is_available) VALUES
('Whey Protein Powder', 'High-quality whey protein for muscle building and recovery', 2500.00, 'Protein', 50, true),
('Creatine Monohydrate', 'Pure creatine monohydrate for strength and power enhancement', 1200.00, 'Performance', 30, true),
('BCAA Energy Drink', 'Branched-chain amino acids with natural caffeine for workout energy', 800.00, 'Energy', 40, true),
('Multivitamin Complex', 'Complete daily multivitamin with essential minerals', 600.00, 'Health', 60, true),
('Pre-Workout Booster', 'Advanced pre-workout formula for enhanced performance', 1800.00, 'Performance', 25, true);