import { APP_CONSTANTS } from '@/constants'
import { z } from 'zod'

export const ResidentSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(APP_CONSTANTS.MIN_RESIDENT_NAME_LENGTH, 'Name must be at least 1 character')
    .max(
      APP_CONSTANTS.MAX_RESIDENT_NAME_LENGTH,
      `Name must be less than ${APP_CONSTANTS.MAX_RESIDENT_NAME_LENGTH} characters`
    )
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Name contains invalid characters'),
  dreamJob: z.string().min(1, 'Dream job is required'),
  currentStore: z.string().optional(),
})

export const UserStoreSchema = z.object({
  storeId: z.string(),
  residents: z.array(z.string()).max(APP_CONSTANTS.MAX_STORE_CAPACITY),
})

export const UserMissionSchema = z.object({
  missionId: z.string(),
  status: z.enum(['pending', 'completed']),
  addedAt: z.number(),
})

export const UserDataSchema = z.object({
  stores: z.array(UserStoreSchema),
  residents: z.array(ResidentSchema),
  missions: z.array(UserMissionSchema),
})

export type ValidationResult<T> = { success: true; data: T } | { success: false; error: string }

export function validateResident(data: unknown): ValidationResult<z.infer<typeof ResidentSchema>> {
  try {
    const result = ResidentSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: 'Invalid resident data' }
  }
}

export function validateResidentName(name: string): ValidationResult<string> {
  try {
    const result = z
      .string()
      .min(APP_CONSTANTS.MIN_RESIDENT_NAME_LENGTH)
      .max(APP_CONSTANTS.MAX_RESIDENT_NAME_LENGTH)
      .regex(/^[a-zA-Z0-9\s'-]+$/)
      .parse(name)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: 'Invalid name' }
  }
}

export function validateUserData(data: unknown): ValidationResult<z.infer<typeof UserDataSchema>> {
  try {
    const result = UserDataSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Data validation failed: ${error.issues[0].message}`,
      }
    }
    return { success: false, error: 'Invalid data format' }
  }
}
