// Core types for the gym management system
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'trainer' | 'member'
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  user_id: string
  membership_type: string
  membership_start: string
  membership_end: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface Trainer {
  id: string
  user_id: string
  specialization: string[]
  experience_years: number
  certification: string[]
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  name: string
  description: string
  trainer_id: string
  capacity: number
  duration: number
  created_at: string
  updated_at: string
}

export interface ClassSchedule {
  id: string
  class_id: string
  date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  member_id: string
  class_schedule_id: string
  status: 'confirmed' | 'cancelled' | 'completed'
  booking_date: string
  created_at: string
  updated_at: string
}