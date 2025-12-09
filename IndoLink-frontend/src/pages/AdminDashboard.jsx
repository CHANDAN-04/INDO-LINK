import { useState } from 'react';
import { Link, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { BarChart3, Package, ShoppingCart, Brain, TrendingUp, DollarSign, Users, Activity, CreditCard } from 'lucide-react';
import SellerProducts from '../components/admin/SellerProducts';
import AdminProducts from '../components/admin/AdminProducts';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import GeminiAnalysis from '../components/admin/GeminiAnalysis';
import AdminOrders from '../components/admin/AdminOrders';
import AdminSlider from '../components/admin/AdminSlider';
import AdminRazorpayModal from '../components/admin/AdminRazorpayModal';
import AdminSellers from '../components/admin/AdminSellers';
import AdminBuyers from '../components/admin/AdminBuyers';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Logo from '../components/Logo';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats/');
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  Admin Dashboard
                </span>
              </h1>
              <p className="text-muted-foreground">Manage marketplace and analyze trends with AI across all categories</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex items-center space-x-2" 
                size="lg"
                onClick={() => setIsRazorpayModalOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
                <span>Payment Setup</span>
              </Button>
              <Link to="/admin/analytics">
                <Button variant="outline" className="flex items-center space-x-2" size="lg">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-xl font-bold text-foreground">{stats?.total_products || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Sellers</p>
                  <p className="text-xl font-bold text-foreground">{stats?.active_sellers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Platform Revenue</p>
                  <p className="text-xl font-bold text-foreground">₹{stats?.revenue || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-xl font-bold text-foreground">{stats?.total_orders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Button onClick={() => navigate('/admin')} variant={location.pathname === '/admin' || location.pathname === '/admin/' ? 'default' : 'outline'} className="w-full justify-start">
            <Package className="h-4 w-4 mr-2" />
            Seller Products
          </Button>
          <Button onClick={() => navigate('/admin/my-products')} variant={location.pathname === '/admin/my-products' ? 'default' : 'outline'} className="w-full justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            My Products
          </Button>
          <Button onClick={() => navigate('/admin/sellers')} variant={location.pathname === '/admin/sellers' ? 'default' : 'outline'} className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Producers
          </Button>
          <Button onClick={() => navigate('/admin/buyers')} variant={location.pathname === '/admin/buyers' ? 'default' : 'outline'} className="w-full justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buyers
          </Button>
          <Button onClick={() => navigate('/admin/orders')} variant={location.pathname === '/admin/orders' ? 'default' : 'outline'} className="w-full justify-start">
            <Activity className="h-4 w-4 mr-2" />
            Orders
          </Button>
          <Button onClick={() => navigate('/admin/analytics')} variant={location.pathname === '/admin/analytics' ? 'default' : 'outline'} className="w-full justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => navigate('/admin/gemini')} variant={location.pathname === '/admin/gemini' ? 'default' : 'outline'} className="w-full justify-start">
            <Brain className="h-4 w-4 mr-2" />
            AI Analysis
          </Button>
          <Button onClick={() => navigate('/admin/slider')} variant={location.pathname === '/admin/slider' ? 'default' : 'outline'} className="w-full justify-start">
            <Activity className="h-4 w-4 mr-2" />
            Slider
          </Button>
        </div>

        {/* Content Area */}
        <Routes>
          <Route index element={<SellerProducts />} />
          <Route path="my-products" element={<AdminProducts />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="sellers" element={<AdminSellers />} />
          <Route path="buyers" element={<AdminBuyers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="gemini" element={<GeminiAnalysis />} />
          <Route path="slider" element={<AdminSlider />} />
        </Routes>
      </div>

      {/* Razorpay Configuration Modal */}
      <AdminRazorpayModal 
        isOpen={isRazorpayModalOpen} 
        onOpenChange={setIsRazorpayModalOpen} 
      />
    </div>
  );
}
