# Gym Management System

A comprehensive gym management system built with React, TypeScript, and Supabase.

## Features

- Member management
- Trainer management
- Class scheduling and booking
- Real-time updates
- Role-based access control

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)

## Setup Instructions

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Copy `.env.example` to `.env.local`
   - Update the environment variables with your Supabase credentials

3. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API services and Supabase client
├── types/         # TypeScript type definitions
├── utils/         # Utility functions and constants
└── contexts/      # React context providers
```

## Development

- Run `npm run dev` to start the development server
- Run `npm run build` to build for production
- Run `npm run preview` to preview the production build