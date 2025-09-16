import { memo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: ReactNode;
  onClick?: () => void;
  clickable?: boolean;
  clickText?: string;
  isLargeValue?: boolean;
}

const StatsCard = memo(({ 
  title, 
  value, 
  icon, 
  subtitle, 
  onClick, 
  clickable = false, 
  clickText,
  isLargeValue = false 
}: StatsCardProps) => {
  const cardClass = `p-3 sm:p-4 lg:p-6 ${
    clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
  }`;

  return (
    <Card className={cardClass} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <div className={`font-bold ${isLargeValue ? 'text-xl sm:text-2xl' : 'text-2xl'}`}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </div>
        {clickable && clickText && (
          <p className="text-xs text-blue-600 mt-1">{clickText}</p>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;