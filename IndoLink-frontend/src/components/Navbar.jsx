import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { User, LogOut, ShoppingCart, Package as PackageIcon, BarChart3, Moon, Sun, Handshake } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'SELLER':
        return '/seller';
      case 'ADMIN':
        return '/admin';
      case 'BUYER':
        return '/buyer';
      case 'BROKER':
        return '/broker';
      default:
        return null;
    }
  };

  const getRoleIcon = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'SELLER':
        return <PackageIcon className="h-4 w-4" />;
      case 'ADMIN':
        return <BarChart3 className="h-4 w-4" />;
      case 'BUYER':
        return <ShoppingCart className="h-4 w-4" />;
      case 'BROKER':
        return <Handshake className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <nav className="bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo size={32} showText={true} textSize="text-xl" />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={toggleTheme} className="flex items-center">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="outline" className="flex items-center space-x-2">
                    {getRoleIcon()}
                    <span>Dashboard</span>
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
