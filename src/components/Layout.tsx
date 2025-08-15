
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Home, Package, FileText, Settings, LogOut, MessageCircle } from 'lucide-react';
import MobileStickyGrowthCTA from '@/components/MobileStickyGrowthCTA';
import GrowthApplicationForm from '@/components/GrowthApplicationForm';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showGrowthForm, setShowGrowthForm] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Invoice', href: '/invoice-builder', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
                <img 
                  src="/lovable-uploads/e6db2000-16be-4362-bb02-9bb7800e39bd.png" 
                  alt="Link2Pay" 
                  className="h-16 sm:h-20 w-auto"
                />
              </Link>
              
              <div className="hidden md:flex space-x-4 lg:space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-2 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#4C9F70] text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:block">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#4C9F70] text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem disabled>
                  <span className="text-sm text-gray-600 truncate">{user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open('https://chat.whatsapp.com/KYXoVylp0K85kGxiqCSf5m?mode=ems_copy_t', '_blank')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Contact Support</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Navigation - Updated to remove Store Builder and Orders */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-1 rounded-md ${
                  isActive
                    ? 'bg-[#4C9F70] text-white'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Sticky Growth CTA - only show on dashboard */}
      {location.pathname === '/dashboard' && (
        <MobileStickyGrowthCTA onClick={() => setShowGrowthForm(true)} />
      )}

      <GrowthApplicationForm 
        isOpen={showGrowthForm} 
        onClose={() => setShowGrowthForm(false)} 
      />
    </div>
  );
};

export default Layout;
