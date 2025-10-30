import { supabase } from './supabase';

export interface GymService {
  id: string;
  name: string;
  description: string;
  category: 'equipment' | 'class' | 'facility' | 'service';
  isAvailable: boolean;
}

export interface GymInfo {
  id: string;
  title: string;
  content: string;
  category: 'hours' | 'contact' | 'facilities' | 'equipment' | 'services' | 'membership';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymContact {
  phone: string;
  email: string;
  address: string;
  website: string;
}

export interface GymHours {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

// Static gym information (can be moved to database later)
const staticGymInfo = {
  services: [
    {
      id: '1',
      name: 'Personal Training Sessions',
      description: 'One-on-one training with certified personal trainers',
      category: 'service' as const,
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Group Fitness Classes',
      description: 'Various group classes including yoga, aerobics, and strength training',
      category: 'class' as const,
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Cardio Equipment',
      description: 'Treadmills, ellipticals, stationary bikes, and rowing machines',
      category: 'equipment' as const,
      isAvailable: true,
    },
    {
      id: '4',
      name: 'Weight Training Area',
      description: 'Free weights, dumbbells, barbells, and weight machines',
      category: 'equipment' as const,
      isAvailable: true,
    },
    {
      id: '5',
      name: 'Locker Facilities',
      description: 'Secure lockers with changing rooms and showers',
      category: 'facility' as const,
      isAvailable: true,
    },
    {
      id: '6',
      name: 'Functional Training Area',
      description: 'Space for functional movements, TRX, and bodyweight exercises',
      category: 'equipment' as const,
      isAvailable: true,
    },
    {
      id: '7',
      name: 'Stretching Zone',
      description: 'Dedicated area for stretching and flexibility exercises',
      category: 'facility' as const,
      isAvailable: true,
    },
    {
      id: '8',
      name: 'Nutrition Consultation',
      description: 'Professional diet and nutrition guidance',
      category: 'service' as const,
      isAvailable: true,
    },
  ],
  
  contact: {
    phone: '+91 98765 43210',
    email: 'info@gymmanagement.com',
    address: '123 Fitness Street, Gym City, State 12345',
    website: 'www.gymmanagement.com',
  },
  
  hours: [
    { day: 'Monday', openTime: '05:00', closeTime: '23:00', isOpen: true },
    { day: 'Tuesday', openTime: '05:00', closeTime: '23:00', isOpen: true },
    { day: 'Wednesday', openTime: '05:00', closeTime: '23:00', isOpen: true },
    { day: 'Thursday', openTime: '05:00', closeTime: '23:00', isOpen: true },
    { day: 'Friday', openTime: '05:00', closeTime: '23:00', isOpen: true },
    { day: 'Saturday', openTime: '06:00', closeTime: '22:00', isOpen: true },
    { day: 'Sunday', openTime: '07:00', closeTime: '21:00', isOpen: true },
  ],
  
  facilities: [
    'Changing Rooms & Showers',
    'Parking Available',
    'Air Conditioning',
    'Water Fountain',
    'First Aid Station',
    'WiFi Access',
    'Towel Service',
    'Equipment Sanitization Stations',
  ],
};

class GymInfoService {
  // Get all gym services with optional filtering
  async getGymServices(category?: string, searchTerm?: string): Promise<GymService[]> {
    let services = staticGymInfo.services;
    
    // Filter by category if provided
    if (category && category !== 'all') {
      services = services.filter(service => service.category === category);
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      services = services.filter(service => 
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term)
      );
    }
    
    return services;
  }
  
  // Get gym contact information
  async getGymContact(): Promise<GymContact> {
    return staticGymInfo.contact;
  }
  
  // Get gym operating hours
  async getGymHours(): Promise<GymHours[]> {
    return staticGymInfo.hours;
  }
  
  // Get gym facilities
  async getGymFacilities(searchTerm?: string): Promise<string[]> {
    let facilities = staticGymInfo.facilities;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      facilities = facilities.filter(facility => 
        facility.toLowerCase().includes(term)
      );
    }
    
    return facilities;
  }
  
  // Get fee packages (public information)
  async getPublicFeePackages() {
    try {
      const { data, error } = await supabase
        .from('fee_packages')
        .select('id, name, description, amount, duration_months, features')
        .eq('is_active', true)
        .order('amount', { ascending: true });
      
      if (error) {
        console.error('Error fetching fee packages:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getPublicFeePackages:', error);
      return [];
    }
  }
  
  // Advanced search with multiple filters
  async advancedSearch(options: {
    searchTerm?: string;
    category?: string;
    availability?: boolean;
    priceRange?: { min: number; max: number };
  }) {
    const { searchTerm, category, availability, priceRange } = options;
    
    // Get all services first
    let services = await this.getGymServices();
    
    // Apply filters
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      services = services.filter(service => 
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term)
      );
    }
    
    if (category && category !== 'all') {
      services = services.filter(service => service.category === category);
    }
    
    if (availability !== undefined) {
      services = services.filter(service => service.isAvailable === availability);
    }
    
    // Get facilities
    let facilities = await this.getGymFacilities(searchTerm);
    
    // Get fee packages with price filtering
    let feePackages = await this.getPublicFeePackages();
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      feePackages = feePackages.filter(pkg => 
        pkg.name.toLowerCase().includes(term) ||
        pkg.description?.toLowerCase().includes(term)
      );
    }
    
    if (priceRange) {
      feePackages = feePackages.filter(pkg => 
        pkg.amount >= priceRange.min && pkg.amount <= priceRange.max
      );
    }
    
    // Search contact info
    const contact = await this.getGymContact();
    let contactMatches: any = null;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches = Object.entries(contact).filter(([, value]) => 
        value.toLowerCase().includes(term)
      );
      contactMatches = matches.length > 0 ? contact : null;
    }
    
    return {
      services,
      facilities,
      feePackages,
      contact: contactMatches,
      totalResults: services.length + facilities.length + feePackages.length + (contactMatches ? 1 : 0)
    };
  }

  // Search across all gym information
  async searchGymInfo(searchTerm: string) {
    return this.advancedSearch({ searchTerm });
  }
  
  // Get popular/featured services
  async getFeaturedServices(): Promise<GymService[]> {
    const allServices = await this.getGymServices();
    // Return first 6 services as "featured" - in a real app this would be based on popularity/admin selection
    return allServices.slice(0, 6);
  }
  
  // Get services by availability
  async getServicesByAvailability(isAvailable: boolean): Promise<GymService[]> {
    const allServices = await this.getGymServices();
    return allServices.filter(service => service.isAvailable === isAvailable);
  }
}

export const gymInfoService = new GymInfoService();