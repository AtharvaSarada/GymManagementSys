import { supabase } from './supabase';
import type { FeePackage } from '../types/database';

export class FeePackageService {
  // Get all active fee packages
  static async getActiveFeePackages(): Promise<FeePackage[]> {
    const { data, error } = await supabase
      .from('fee_packages')
      .select('*')
      .eq('is_active', true)
      .order('duration_months', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch fee packages: ${error.message}`);
    }

    return data || [];
  }

  // Get all fee packages (including inactive)
  static async getAllFeePackages(): Promise<FeePackage[]> {
    const { data, error } = await supabase
      .from('fee_packages')
      .select('*')
      .order('duration_months', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch fee packages: ${error.message}`);
    }

    return data || [];
  }

  // Get fee package by ID
  static async getFeePackageById(id: string): Promise<FeePackage | null> {
    const { data, error } = await supabase
      .from('fee_packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Package not found
      }
      throw new Error(`Failed to fetch fee package: ${error.message}`);
    }

    return data;
  }

  // Create new fee package
  static async createFeePackage(packageData: {
    name: string;
    description?: string;
    amount: number;
    duration_months: number;
    features?: string[];
    is_active?: boolean;
  }): Promise<FeePackage> {
    const { data, error } = await supabase
      .from('fee_packages')
      .insert({
        ...packageData,
        features: packageData.features || [],
        is_active: packageData.is_active ?? true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create fee package: ${error.message}`);
    }

    return data;
  }

  // Update fee package
  static async updateFeePackage(id: string, packageData: {
    name?: string;
    description?: string;
    amount?: number;
    duration_months?: number;
    features?: string[];
    is_active?: boolean;
  }): Promise<FeePackage> {
    const { data, error } = await supabase
      .from('fee_packages')
      .update(packageData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fee package: ${error.message}`);
    }

    return data;
  }

  // Delete fee package
  static async deleteFeePackage(id: string): Promise<void> {
    const { error } = await supabase
      .from('fee_packages')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete fee package: ${error.message}`);
    }
  }

  // Create default fee packages
  static async createDefaultFeePackages(): Promise<FeePackage[]> {
    const defaultPackages = [
      {
        name: "Monthly Membership",
        description: "1 month gym access with basic facilities",
        amount: 1500,
        duration_months: 1,
        features: ["Gym access", "Basic equipment", "Locker facility"],
        is_active: true
      },
      {
        name: "Quarterly Membership", 
        description: "3 months gym access with additional benefits",
        amount: 4000,
        duration_months: 3,
        features: ["Gym access", "Basic equipment", "Locker facility", "Group classes"],
        is_active: true
      },
      {
        name: "Half-Yearly Membership",
        description: "6 months gym access with premium benefits", 
        amount: 7500,
        duration_months: 6,
        features: ["Gym access", "All equipment", "Locker facility", "Group classes", "Personal trainer consultation"],
        is_active: true
      },
      {
        name: "Annual Membership",
        description: "12 months gym access with all premium benefits",
        amount: 14000,
        duration_months: 12,
        features: ["Gym access", "All equipment", "Locker facility", "Group classes", "Personal trainer sessions", "Diet consultation", "Priority booking"],
        is_active: true
      }
    ];

    const createdPackages: FeePackage[] = [];

    for (const packageData of defaultPackages) {
      try {
        const created = await this.createFeePackage(packageData);
        createdPackages.push(created);
      } catch (error) {
        console.error(`Failed to create package ${packageData.name}:`, error);
      }
    }

    return createdPackages;
  }
}