# Diet Management System Setup Instructions

## Database Setup

To complete the diet management system implementation, you need to run the diet plans schema in your Supabase database:

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

### Step 2: Run the Diet Plans Schema
1. Copy the contents of `database/diet_plans_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the SQL

This will:
- Create the `diet_plans` table with comprehensive nutrition data
- Create the `member_diet_assignments` table for tracking assignments
- Add performance indexes
- Insert 3 comprehensive diet plans (Fat Loss, Muscle Gain, Weight Gain)

### Step 3: Verify Setup
After running the SQL, you should see:
- A new `diet_plans` table with 3 diet plans
- A new `member_diet_assignments` table for tracking assignments
- Proper indexes for performance

## Features Implemented

### ✅ **Three Comprehensive Diet Plans**

#### 1. **Fat Loss Diet Plan** 🔥
- **Goal**: Healthy fat loss while preserving muscle mass
- **Daily Calories**: 1,800
- **Macros**: 140g protein, 150g carbs, 60g fat
- **6 Meals**: Breakfast, Mid-Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack
- **Guidelines**: Water intake, avoid processed foods, cardio exercise, sleep recommendations

#### 2. **Muscle Gain Diet Plan** 💪
- **Goal**: Support muscle growth and strength training
- **Daily Calories**: 2,800
- **Macros**: 200g protein, 300g carbs, 100g fat
- **7 Meals**: Including pre/post-workout nutrition
- **Guidelines**: High protein intake, post-workout nutrition, compound exercises

#### 3. **Weight Gain Diet Plan** 📈
- **Goal**: Healthy weight gain and overall body mass increase
- **Daily Calories**: 3,200
- **Macros**: 160g protein, 400g carbs, 120g fat
- **7 Meals**: Calorie-dense, nutrient-rich foods
- **Guidelines**: Healthy fats, frequent meals, strength training

### ✅ **Admin Diet Management Dashboard**

**Navigation**: Admin Dashboard → Diet Management

#### **Diet Plans Tab**
- **View All Plans**: See the 3 comprehensive diet plans
- **Nutrition Overview**: Calories, protein, carbs, fats for each plan
- **Meal Breakdown**: Number of meals and calorie distribution
- **Goal Categories**: Visual badges for fat loss, muscle gain, weight gain

#### **Assign Diet Tab**
- **Member Selection**: Dropdown of all gym members
- **Diet Plan Selection**: Choose from the 3 available plans
- **Assignment Notes**: Add personalized instructions
- **End Date**: Optional assignment duration
- **Automatic Notifications**: Member gets notified when diet is assigned

#### **Active Assignments Tab**
- **Assignment Overview**: Table of all diet assignments
- **Member Details**: Name, membership number
- **Diet Plan Info**: Assigned plan with goal badge
- **Status Management**: Mark assignments as completed or cancelled
- **Assignment History**: Track all diet assignments

### ✅ **Member Diet Plan Dashboard**

**Navigation**: Member Dashboard → My Diet Plan

#### **Diet Plan Overview**
- **Personalized Header**: Shows assigned diet plan with goal-specific colors
- **Assignment Details**: When assigned, duration, assigned by admin
- **Nutrition Targets**: Daily calories, protein, carbs, fats with visual indicators

#### **Daily Meal Plan**
- **Interactive Meal Cards**: Click to view detailed meal information
- **Meal Timing**: Specific times for each meal
- **Calorie Breakdown**: Calories per meal
- **Food Lists**: Detailed food items for each meal

#### **Guidelines & Instructions**
- **Important Guidelines**: Goal-specific nutrition and lifestyle tips
- **Special Instructions**: Admin notes and personalized recommendations
- **Progress Tracking**: Visual indicators and recommendations

### ✅ **Notification System Integration**

#### **Automatic Notifications**
- **Diet Assignment**: Member receives notification when diet is assigned
- **Notification Type**: 'DIET_ASSIGNED' with personalized message
- **Dashboard Integration**: Notifications appear in member's notification center

### ✅ **Complete User Flow**

#### **Admin Workflow**:
1. **Admin Dashboard** → Diet Management
2. **View Diet Plans**: Review the 3 available plans
3. **Assign Diet**: Select member and appropriate diet plan
4. **Add Notes**: Include personalized instructions
5. **Confirm Assignment**: Member gets automatic notification

#### **Member Workflow**:
1. **Receive Notification**: "New Diet Plan Assigned"
2. **Member Dashboard** → My Diet Plan
3. **View Plan Details**: Nutrition targets, meal plan, guidelines
4. **Follow Daily Meals**: Detailed meal timing and food lists
5. **Track Progress**: Follow guidelines and recommendations

### ✅ **Key Benefits**

- **Personalized Nutrition**: 3 scientifically-designed diet plans for different goals
- **Complete Meal Planning**: Detailed daily meal schedules with specific foods
- **Admin Control**: Full assignment and tracking capabilities
- **Member Engagement**: Interactive, visually appealing diet plan interface
- **Automatic Notifications**: Seamless communication between admin and members
- **Progress Tracking**: Assignment history and status management

## Database Tables Created

### **diet_plans Table**
- Stores the 3 comprehensive diet plans
- Includes nutrition data, meals (JSON), and guidelines
- Goal-based categorization (fat_loss, muscle_gain, weight_gain)

### **member_diet_assignments Table**
- Tracks which member has which diet plan
- Assignment dates, status, and admin notes
- Ensures only one active diet per member
- Full audit trail of diet assignments

## Usage Instructions

### **For Admins:**
1. **Access Diet Management** from admin dashboard
2. **Review Available Plans** in the Diet Plans tab
3. **Assign Diets** to members based on their goals
4. **Monitor Assignments** in the Active Assignments tab
5. **Update Status** as members progress or complete plans

### **For Members:**
1. **Check Notifications** for diet assignment alerts
2. **View Diet Plan** in member dashboard
3. **Follow Daily Meals** with specific timing and foods
4. **Read Guidelines** for best results
5. **Contact Admin** for modifications or questions

## Technical Features

- **Responsive Design**: Works on all devices
- **Interactive UI**: Click meals for detailed information
- **Real-time Updates**: Instant notifications and status changes
- **Data Validation**: Proper form validation and error handling
- **Performance Optimized**: Efficient database queries and caching

The diet management system is now fully integrated and ready to help members achieve their fitness goals! 🎉