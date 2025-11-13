import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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

function getTabFromPath(pathname) {
  if (pathname.includes('/my-products')) return 'my-products';
  if (pathname.includes('/analytics')) return 'analytics';
  if (pathname.includes('/gemini')) return 'gemini';
  if (pathname.includes('/slider')) return 'slider';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/sellers')) return 'sellers';
  if (pathname.includes('/buyers')) return 'buyers';
  return 'seller-products';
}

export default function AdminDashboard() {
  const location = useLocation();
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

        {/* Simplified dashboard: removed static sections */}
        <Tabs value={getTabFromPath(location.pathname)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
            <TabsTrigger value="seller-products" asChild>
              <Link to="/admin" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Seller Products</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="my-products" asChild>
              <Link to="/admin/my-products" className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>My Products</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="sellers" asChild>
              <Link to="/admin/sellers" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Producers</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="buyers" asChild>
              <Link to="/admin/buyers" className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Buyers</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="orders" asChild>
              <Link to="/admin/orders" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Orders</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="analytics" asChild>
              <Link to="/admin/analytics" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Analytics</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="gemini" asChild>
              <Link to="/admin/gemini" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Analysis</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="slider" asChild>
              <Link to="/admin/slider" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Slider</span>
              </Link>
            </TabsTrigger>
          </TabsList>

          {getTabFromPath(location.pathname) === 'seller-products' && (
            <TabsContent value="seller-products">
              <SellerProducts />
            </TabsContent>
          )}
          
          {getTabFromPath(location.pathname) === 'my-products' && (
            <TabsContent value="my-products">
              <AdminProducts />
            </TabsContent>
          )}
          
          {getTabFromPath(location.pathname) === 'analytics' && (
            <TabsContent value="analytics">
              <AdminAnalytics />
            </TabsContent>
          )}
          
          {getTabFromPath(location.pathname) === 'orders' && (
            <TabsContent value="orders">
              <AdminOrders />
            </TabsContent>
          )}

          {getTabFromPath(location.pathname) === 'gemini' && (
            <TabsContent value="gemini">
              <GeminiAnalysis />
            </TabsContent>
          )}

          {getTabFromPath(location.pathname) === 'slider' && (
            <TabsContent value="slider">
              <AdminSlider />
            </TabsContent>
          )}

          {getTabFromPath(location.pathname) === 'sellers' && (
            <TabsContent value="sellers">
              <AdminSellers />
            </TabsContent>
          )}

          {getTabFromPath(location.pathname) === 'buyers' && (
            <TabsContent value="buyers">
              <AdminBuyers />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Razorpay Configuration Modal */}
      <AdminRazorpayModal 
        isOpen={isRazorpayModalOpen} 
        onOpenChange={setIsRazorpayModalOpen} 
      />
    </div>
  );
}
