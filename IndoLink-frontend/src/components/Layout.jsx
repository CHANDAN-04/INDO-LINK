import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import Logo from './Logo';
import { 
  LogOut, 
  Moon, 
  Sun, 
  ShoppingCart, 
  User,
  Leaf,
  TrendingUp,
  Home,
  Info,
  Sparkles
} from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { cartItems } = useCart();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SELLER':
        return 'bg-secondary text-secondary-foreground';
      case 'ADMIN':
        return 'bg-primary text-primary-foreground';
      case 'BUYER':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isDashboard = location.pathname.includes('dashboard') || location.pathname.includes('seller') || location.pathname.includes('admin') || location.pathname.includes('buyer');
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" data-testid="link-home">
                <Logo size={32} showText={true} textSize="text-xl" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                data-testid="button-mobile-menu"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex space-x-8">
              {!user && isLanding && (
                <>
                  <Button variant="ghost" asChild data-testid="button-features">
                    <a href="#features">Features</a>
                  </Button>
                  <Button variant="ghost" asChild data-testid="button-about">
                    <a href="#about">About</a>
                  </Button>
                </>
              )}

              {user && isDashboard && (
                <div className="flex space-x-8">
                  <Button
                    variant="ghost"
                    className={location.pathname.includes('overview') || location.pathname === `/${user.role.toLowerCase()}` ? 'text-foreground' : 'text-muted-foreground'}
                    asChild
                    data-testid="button-overview"
                  >
                    <Link to={`/${user.role.toLowerCase()}`}>
                      <Home className="w-4 h-4 mr-2" />
                      Overview
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className={location.pathname.includes('products') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                    asChild
                    data-testid="button-products"
                  >
                    <Link to={`/${user.role.toLowerCase()}/products`}>
                      {user.role === 'SELLER' && <Leaf className="w-4 h-4 mr-2" />}
                      {user.role === 'ADMIN' && <TrendingUp className="w-4 h-4 mr-2" />}
                      {user.role === 'BUYER' && <ShoppingCart className="w-4 h-4 mr-2" />}
                      Products
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className={location.pathname.includes('orders') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                    asChild
                    data-testid="button-orders"
                  >
                    <Link to={`/${user.role.toLowerCase()}/orders`}>Orders</Link>
                  </Button>

                  {user.role === 'ADMIN' && (
                    <Button
                      variant="ghost"
                      className={location.pathname.includes('analytics') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                      asChild
                      data-testid="button-analytics"
                    >
                      <Link to="/admin/analytics">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analytics
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
                data-testid="button-theme-toggle"
              >
                {theme === 'dark' ? 
                  <Sun className="h-4 w-4" /> : 
                  <Moon className="h-4 w-4" />
                }
              </Button>

              {/* Cart Icon (for buyers) */}
              {user?.role === 'BUYER' && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="relative"
                  data-testid="button-cart"
                >
                  <Link to="/buyer/cart">
                    <ShoppingCart className="h-4 w-4" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {cartItems.length}
                      </span>
                    )}
                  </Link>
                </Button>
              )}

              {/* Authentication */}
              {!user ? (
                <div className="flex space-x-4">
                  <Button variant="ghost" asChild data-testid="button-login">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild data-testid="button-register">
                    <Link to="/register">Register</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-username">
                      {user.first_name} {user.last_name}
                    </span>
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}
                      data-testid="text-role"
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {!isDashboard && !isAuth && (
        <footer className="bg-muted border-t border-border mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">IndoLink</h3>
              <p className="text-muted-foreground">
                Connecting sellers to global markets with AI-powered insights
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
