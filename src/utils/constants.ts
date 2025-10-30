// Application constants
export const MEMBERSHIP_TYPES = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  VIP: 'vip'
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  MEMBER: 'member'
} as const

export const CLASS_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
} as const