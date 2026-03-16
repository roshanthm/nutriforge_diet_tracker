
# NutriForge

NutriForge is a modern nutrition and calorie tracking web application designed to help users gain weight in a structured and data-driven way. The platform allows users to set weight goals, calculate daily calorie requirements, track food intake, and monitor nutritional progress through a clean and interactive dashboard.

The application combines real nutrition databases with the flexibility to add custom foods, making it suitable for global diets as well as regional cuisines such as Kerala foods and bakery items.

---

## Overview

NutriForge was built to solve a common problem in fitness and nutrition tracking: many people understand they need more calories to gain weight but lack a simple system to track their diet consistently.

The application provides a structured environment where users can define their target weight, calculate daily caloric requirements, and track daily food consumption while monitoring macronutrients and weight progress.

---

## Key Features

### Goal-Based Nutrition Planning

Users can configure their personal fitness targets including:

- Current weight
- Target weight
- Height and age
- Activity level
- Duration to achieve the goal

The system calculates:

- Basal Metabolic Rate (BMR)
- Maintenance calories
- Calorie surplus required for weight gain
- Recommended daily calorie intake

---

### Daily Calorie Tracking

Users can log meals across multiple categories:

- Breakfast
- Lunch
- Dinner
- Snacks

Each entry records:

- Serving size
- Calories
- Protein
- Carbohydrates
- Fat

The dashboard continuously displays calories consumed versus the daily calorie goal.

---

### Large Food Database

The application integrates external nutrition databases to access a wide variety of foods.

Supported sources include:

- USDA FoodData Central API
- Open Food Facts API

These databases provide nutritional data for:

- Fruits and vegetables
- Packaged foods
- Restaurant meals
- Bakery items
- Meat and seafood
- Dairy products
- Snacks and desserts

---

### Regional Food Support

To support local diets, NutriForge includes regional foods that may not exist in global nutrition APIs.

Kerala cuisine and bakery foods are supported, including:

- Egg Puffs
- Chicken Puffs
- Meat Cutlets
- Pazham Pori
- Sweetna
- Vettu Cake
- Dilkush
- Coconut Buns
- Kottayam Churuttu
- Ghee Cake

Traditional Kerala meals are also included, such as:

- Appam
- Puttu
- Kadala Curry
- Idiyappam
- Parotta
- Chicken Curry
- Fish Curry
- Avial

---

### Custom Food Entry

If a food item is not available through the API database, users can manually add it.

Custom food fields include:

- Food name
- Serving size in grams
- Calories
- Protein
- Carbohydrates
- Fat

User-added foods are stored locally and become searchable within the application.

---

### Nutrition Analytics

NutriForge provides visual insights through interactive charts and dashboards.

Users can track:

- Daily calorie progress
- Macronutrient distribution
- Weekly nutrition summaries
- Weight progress over time

These analytics help users understand whether they are consistently meeting their nutritional goals.

---

### Smart Food Suggestions

When users fall short of their daily calorie targets, the system recommends foods that can help reach the required calorie intake.

Examples include:

- Peanut butter sandwiches
- Protein shakes
- Banana smoothies
- Rice with chicken

---

## Technology Stack

Frontend

- React
- Vite
- Tailwind CSS

Backend

- Node.js
- Firebase Authentication

Data Sources

- USDA FoodData Central API
- Open Food Facts API

Visualization

- Chart.js
- Recharts

