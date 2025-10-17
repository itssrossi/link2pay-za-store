export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'achievement' | 'streak' | 'special';
  unlockCriteria: {
    type: 'invoice_count' | 'revenue' | 'streak' | 'speed' | 'customer_count' | 'special';
    value: number;
    timeframe?: 'all_time' | 'weekly' | 'monthly' | 'daily';
  };
  points: number;
  color: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_invoice',
    name: 'First Steps',
    description: 'Sent your first invoice',
    icon: '🎯',
    category: 'milestone',
    unlockCriteria: { type: 'invoice_count', value: 1, timeframe: 'all_time' },
    points: 50,
    color: '#4C9F70'
  },
  {
    id: 'consistent_earner',
    name: 'Consistent Earner',
    description: '5 invoices in a week',
    icon: '💼',
    category: 'achievement',
    unlockCriteria: { type: 'invoice_count', value: 5, timeframe: 'weekly' },
    points: 100,
    color: '#3d8159'
  },
  {
    id: 'top_seller',
    name: 'Top Seller',
    description: 'Earned R1000+ in 7 days',
    icon: '💸',
    category: 'achievement',
    unlockCriteria: { type: 'revenue', value: 1000, timeframe: 'weekly' },
    points: 150,
    color: '#FFD700'
  },
  {
    id: 'on_fire',
    name: 'On Fire',
    description: '7 day invoice streak',
    icon: '🔥',
    category: 'streak',
    unlockCriteria: { type: 'streak', value: 7 },
    points: 200,
    color: '#FF6B35'
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: '30 day invoice streak',
    icon: '⚡',
    category: 'streak',
    unlockCriteria: { type: 'streak', value: 30 },
    points: 500,
    color: '#FFA500'
  },
  {
    id: 'invoice_master',
    name: 'Invoice Master',
    description: 'Sent 50 total invoices',
    icon: '👑',
    category: 'milestone',
    unlockCriteria: { type: 'invoice_count', value: 50, timeframe: 'all_time' },
    points: 300,
    color: '#9B59B6'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: '10 invoices in one day',
    icon: '⚡',
    category: 'achievement',
    unlockCriteria: { type: 'invoice_count', value: 10, timeframe: 'daily' },
    points: 150,
    color: '#E74C3C'
  },
  {
    id: 'relationship_builder',
    name: 'Relationship Builder',
    description: '5 repeat customers',
    icon: '🤝',
    category: 'achievement',
    unlockCriteria: { type: 'customer_count', value: 5 },
    points: 100,
    color: '#3498DB'
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined Link2Pay Beta',
    icon: '🌟',
    category: 'special',
    unlockCriteria: { type: 'special', value: 0 },
    points: 100,
    color: '#1ABC9C'
  }
];
