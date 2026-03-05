# IronLog: Modern Fitness & Strength Tracking Application

IronLog is a comprehensive, full-stack fitness tracking application designed specifically for gym-goers who want to monitor their strength enhancements, personal records (PRs), and body weight progress over time. The application is built with a focus on a high-performance, dynamic user interface and a rock-solid, secure data architecture.

---

## 🛠 Tech Stack & Architecture

This application operates using the **MERN** stack:
* **MongoDB & Mongoose (Database & ODM):** Handles structured schema enforcement and complex data aggregations.
* **Express.js & Node.js (Backend):** Serves RESTful API endpoints and manages business logic, parsing, and authentication.
* **React.js & Vite (Frontend):** Delivers a blazing-fast, strictly component-driven single-page application (SPA).
* **Environment:** Fully decoupled frontend and backend capable of independent deployment (e.g., Render for backend, Netlify/Vercel for frontend).

---

## 🚀 Core Features & Deep Dive

### 1. Authentication & Security
* **JWT-Based Sessions:** Upon registration or login, the backend signs a JSON Web Token (JWT) using a secure environment secret.
* **Password Hashing:** Passwords are never stored in plain text; they are hashed utilizing `bcryptjs` before entering MongoDB.
* **Data Isolation:** Every API route (except auth) runs through a `protect` middleware that parses the JWT, extracts the User ID, and forces database queries to *only* return documents matching that specific user.

### 2. First-Time Onboarding Experience
* New users are intercepted immediately upon their first login through a state flag (`onboardingCompleted` on the User model).
* A multi-step wizard asks for starting body weight, height, age, and gender.
* The system automatically generates the user's very first `BodyWeight` tracking document using this data, creating a clean baseline for their progress charts straight out of the gate.

### 3. Strict Exercise Dictionary (Library Management)
* **Data Integrity Protocol:** Users *cannot* type free-text exercise names when logging a workout. This prevents database corruption caused by typos (e.g., "Bench Press", "bench prss", "Bench-press" counting as separate routines).
* Users must first visit the **Exercises** page to register an exercise in their dictionary, assigning it an official Name and Muscle Category.
* All workout logging then flows through strict `<select>` dropdown menus referencing this official dictionary.

### 4. Workout Session Logging
* Users select a date and an exercise, then input their Sets, Reps, and Weight.
* The frontend immediately calculates an **Estimated 1-Rep Max (1RM)** dynamically as they type using the Brzycki formula: 
  `Weight * (36 / (37 - Reps))`
* Upon submitting, the session data is sent to the backend where the PR Evaluation Engine fires.

### 5. Automated Personal Record (PR) Engine
Every time a workout is logged, edited, or deleted, the backend `updatePR` function evaluates the math behind the scenes.
The database tracks several distinct types of PRs for *every single exercise*:
* **Heaviest Weight:** The absolute heaviest mathematical weight moved, regardless of reps.
* **Best Set:** The highest mathematical volume in a single set (`Weight * Reps`).
* **Estimated 1RM:** The highest theoretical max based on rep performance.
* **Rep-Range PRs:** The heaviest weight moved for a specific number of reps (e.g., "Heaviest 5-Rep Set").

If a user breaks a record, the backend tags the database row with `isPR: true`, and the React frontend fires an immediate visual "🏆 New PR!" confetti alert.

### 6. Body Weight Tracking
* Users can log daily weight fluctuations.
* The data is visualized using `Recharts` to draw historical trend lines.
* The user's *most recently logged body weight* is permanently cached as the defining variable used to determine their Strength Level ratio.

---

## 🏆 The "Strength Level" Intelligence System

The **Strength Level & Lifetime Stats** dashboard is the most computationally complex feature in the application. It aggregates a user's entire lifetime history into a single cohesive profile.

### The Big 3 Aggregator (Fuzzy Matching)
The system algorithmically searches the user's entire workout history for variations of the **"Big 3" powerlifting movements**:
* Bench Press (matches "chest press", "bench", ignores "incline", "dumbbell")
* Squat (matches "squat", ignores "hack", "goblet")
* Deadlift (matches "deadlift", ignores "romanian", "sumo")

The absolute heaviest weights achieved across these matched exercises are combined to calculate the user's **Powerlifting Total**.

### The Strength Classification Engine
Once the "Big 3" PRs are identified, the backend compares them directly against the user's most recent Body Weight measurement. It calculates a "Ratio to Bodyweight" for each lift and ranks the user against widely accepted, universal strength standards:

| Level | Bench Press | Squat | Deadlift |
| :--- | :--- | :--- | :--- |
| **Beginner** | 0.50x BW | 0.75x BW | 1.00x BW |
| **Novice** | 0.75x BW | 1.00x BW | 1.25x BW |
| **Intermediate** | 1.00x BW | 1.25x BW | 1.50x BW |
| **Advanced** | 1.25x BW | 1.50x BW | 2.00x BW |
| **Elite** | 1.50x BW | 2.00x BW | 2.50x BW |

*Logic:* A user only advances to the next classification tier if they meet or exceed the target ratio for **all three** lifts simultaneously. 

### Lifetime Aggregations
The backend uses native MongoDB `$aggregate` pipelines to mathematically calculate lifetime totals across potentially thousands of documents instantly:
* **Total Workouts:** Counts unique `date` occurrences.
* **Total Sets & Reps:** `$sum` calculations across all entries.
* **Cumulative Volume:** `$multiply` (`sets * reps * weight`), yielding the total tonnage the user has moved in their lifetime.

---

## 📱 Interface & Responsiveness
The frontend employs a deeply responsive design architecture.
* Components utilize custom React Hooks (like `useWindowWidth()`) to dynamically execute JavaScript-driven layout changes in real-time.
* The system transitions flawlessly from complex, multi-column data grids on 1080p Desktop displays down to vertical, touch-friendly stacked panels on mobile devices.
