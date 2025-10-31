-- Diet Plans table
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    goal TEXT NOT NULL, -- 'fat_loss', 'muscle_gain', 'weight_gain'
    description TEXT,
    daily_calories INTEGER,
    protein_grams INTEGER,
    carbs_grams INTEGER,
    fat_grams INTEGER,
    meals JSONB, -- Array of meal objects with details
    guidelines TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Diet Assignments table
CREATE TABLE IF NOT EXISTS public.member_diet_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    diet_plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.users(id), -- Admin who assigned
    assigned_date DATE DEFAULT CURRENT_DATE,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED'
    notes TEXT, -- Admin notes about the assignment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, status) -- Only one active diet per member
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diet_plans_goal ON public.diet_plans(goal);
CREATE INDEX IF NOT EXISTS idx_member_diet_assignments_member ON public.member_diet_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_diet_assignments_status ON public.member_diet_assignments(status);

-- Add triggers for updated_at (only if the function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_diet_plans_updated_at 
            BEFORE UPDATE ON public.diet_plans 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
            
        CREATE TRIGGER update_member_diet_assignments_updated_at 
            BEFORE UPDATE ON public.member_diet_assignments 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert the three diet plans
INSERT INTO public.diet_plans (name, goal, description, daily_calories, protein_grams, carbs_grams, fat_grams, meals, guidelines) VALUES
(
    'Fat Loss Diet Plan',
    'fat_loss',
    'A calorie-deficit diet plan designed to promote healthy fat loss while preserving muscle mass.',
    1800,
    140,
    150,
    60,
    '[
        {
            "name": "Breakfast",
            "time": "7:00 AM",
            "foods": [
                "2 whole eggs + 2 egg whites scrambled",
                "1 slice whole grain toast",
                "1/2 avocado",
                "1 cup green tea"
            ],
            "calories": 350
        },
        {
            "name": "Mid-Morning Snack",
            "time": "10:00 AM",
            "foods": [
                "1 apple",
                "10 almonds"
            ],
            "calories": 150
        },
        {
            "name": "Lunch",
            "time": "1:00 PM",
            "foods": [
                "150g grilled chicken breast",
                "1 cup quinoa",
                "Mixed green salad with olive oil dressing",
                "1 cup steamed broccoli"
            ],
            "calories": 500
        },
        {
            "name": "Afternoon Snack",
            "time": "4:00 PM",
            "foods": [
                "1 cup Greek yogurt (low-fat)",
                "1 tbsp honey",
                "1/4 cup berries"
            ],
            "calories": 200
        },
        {
            "name": "Dinner",
            "time": "7:00 PM",
            "foods": [
                "150g grilled fish (salmon/tuna)",
                "1 cup roasted vegetables",
                "1/2 cup brown rice"
            ],
            "calories": 450
        },
        {
            "name": "Evening Snack",
            "time": "9:00 PM",
            "foods": [
                "1 cup herbal tea",
                "5 walnuts"
            ],
            "calories": 150
        }
    ]'::jsonb,
    ARRAY[
        'Drink at least 3-4 liters of water daily',
        'Avoid processed foods and sugary drinks',
        'Eat every 3-4 hours to maintain metabolism',
        'Include 30-45 minutes of cardio exercise',
        'Get 7-8 hours of quality sleep',
        'Limit salt intake to reduce water retention',
        'Eat your last meal 2-3 hours before bedtime'
    ]
),
(
    'Muscle Gain Diet Plan',
    'muscle_gain',
    'A high-protein, calorie-surplus diet plan designed to support muscle growth and strength training.',
    2800,
    200,
    300,
    100,
    '[
        {
            "name": "Breakfast",
            "time": "7:00 AM",
            "foods": [
                "3 whole eggs + 2 egg whites",
                "2 slices whole grain toast",
                "1 banana",
                "1 cup whole milk",
                "1 tbsp peanut butter"
            ],
            "calories": 600
        },
        {
            "name": "Mid-Morning Snack",
            "time": "10:00 AM",
            "foods": [
                "Protein shake (30g whey protein)",
                "1 cup oats with honey",
                "1 handful mixed nuts"
            ],
            "calories": 450
        },
        {
            "name": "Lunch",
            "time": "1:00 PM",
            "foods": [
                "200g grilled chicken breast",
                "1.5 cups brown rice",
                "1 cup mixed vegetables",
                "1 tbsp olive oil"
            ],
            "calories": 700
        },
        {
            "name": "Pre-Workout Snack",
            "time": "4:00 PM",
            "foods": [
                "1 banana",
                "1 cup chocolate milk",
                "1 slice whole grain bread with honey"
            ],
            "calories": 300
        },
        {
            "name": "Post-Workout",
            "time": "6:00 PM",
            "foods": [
                "Protein shake (40g whey protein)",
                "1 large banana",
                "1 cup coconut water"
            ],
            "calories": 350
        },
        {
            "name": "Dinner",
            "time": "8:00 PM",
            "foods": [
                "200g lean beef or fish",
                "1 cup quinoa",
                "Roasted sweet potato",
                "Green salad with avocado"
            ],
            "calories": 650
        },
        {
            "name": "Before Bed",
            "time": "10:00 PM",
            "foods": [
                "1 cup Greek yogurt",
                "2 tbsp almond butter",
                "1 handful berries"
            ],
            "calories": 400
        }
    ]'::jsonb,
    ARRAY[
        'Consume 1.6-2.2g protein per kg body weight daily',
        'Eat within 30 minutes after workout',
        'Include complex carbohydrates for energy',
        'Stay hydrated with 4-5 liters of water daily',
        'Get adequate rest for muscle recovery',
        'Eat frequent meals every 2-3 hours',
        'Focus on compound exercises for maximum growth'
    ]
),
(
    'Weight Gain Diet Plan',
    'weight_gain',
    'A high-calorie diet plan designed for healthy weight gain and overall body mass increase.',
    3200,
    160,
    400,
    120,
    '[
        {
            "name": "Breakfast",
            "time": "7:00 AM",
            "foods": [
                "3 whole eggs scrambled in butter",
                "2 slices whole grain toast with butter",
                "1 cup whole milk",
                "1 banana with peanut butter",
                "1 glass fresh orange juice"
            ],
            "calories": 750
        },
        {
            "name": "Mid-Morning Snack",
            "time": "10:00 AM",
            "foods": [
                "Smoothie: 1 cup whole milk, 1 banana, 2 tbsp peanut butter, 1 tbsp honey",
                "2 whole grain crackers with cheese"
            ],
            "calories": 500
        },
        {
            "name": "Lunch",
            "time": "1:00 PM",
            "foods": [
                "200g grilled chicken thigh",
                "2 cups basmati rice",
                "1 cup dal (lentils)",
                "Mixed vegetable curry",
                "1 tbsp ghee"
            ],
            "calories": 800
        },
        {
            "name": "Afternoon Snack",
            "time": "4:00 PM",
            "foods": [
                "1 cup trail mix (nuts, dried fruits)",
                "1 glass whole milk",
                "2 dates stuffed with almonds"
            ],
            "calories": 400
        },
        {
            "name": "Pre-Dinner Snack",
            "time": "6:30 PM",
            "foods": [
                "Protein shake with whole milk",
                "1 large banana",
                "1 tbsp honey"
            ],
            "calories": 350
        },
        {
            "name": "Dinner",
            "time": "8:00 PM",
            "foods": [
                "200g salmon or mutton",
                "1.5 cups quinoa or rice",
                "Roasted vegetables with olive oil",
                "1 cup yogurt"
            ],
            "calories": 750
        },
        {
            "name": "Before Bed",
            "time": "10:30 PM",
            "foods": [
                "1 cup warm milk with turmeric",
                "2 tbsp almond butter",
                "1 handful cashews"
            ],
            "calories": 400
        }
    ]'::jsonb,
    ARRAY[
        'Eat calorie-dense, nutrient-rich foods',
        'Include healthy fats like nuts, avocado, olive oil',
        'Drink plenty of fluids, but not before meals',
        'Eat larger portions and frequent meals',
        'Include strength training to build muscle mass',
        'Get adequate sleep for proper weight gain',
        'Monitor progress weekly and adjust portions as needed',
        'Focus on whole foods rather than junk food'
    ]
);