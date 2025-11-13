import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Package, Plus, BarChart3, Settings, Leaf, TrendingUp, DollarSign, Users, Eye, ShoppingCart, Star, Calendar, ArrowUp, ArrowDown, Activity, CreditCard } from 'lucide-react';
import ProductList from '../components/seller/ProductList';
import AddProduct from '../components/seller/AddProduct';
import EditProduct from '../components/seller/EditProduct';
import SellerOrders from '../components/seller/SellerOrders';
import RazorpayModal from '../components/seller/RazorpayModal';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import Logo from '../components/Logo';

export default function SellerDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('products');
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  const getTabFromPath = (pathname) => {
    if (pathname.includes('/add-product')) return 'add-product';
    if (pathname.includes('/edit-product')) return 'edit-product';
    if (pathname.includes('/orders')) return 'orders';
    return 'products';
  };

  // Fetch seller stats
  const { data: stats } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/products/seller/stats/');
        return response.data;
      } catch (error) {
        console.error('Error fetching seller stats:', error);
        // Return default stats if API fails
        return {
          total_products: 0,
          total_sales: 0,
          total_orders: 0,
          average_rating: 0,
          active_products: 0,
          sold_products: 0,
          recent_products: 0
        };
      }
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
                  <Package className="h-8 w-8 text-secondary" />
                  Seller Dashboard
                </span>
              </h1>
              <p className="text-muted-foreground">Manage your products and track sales across all categories</p>
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
              <Link to="/seller/add-product">
                <Button className="flex items-center space-x-2" size="lg">
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Products</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.total_products || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.active_products || 0} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Products Sold</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.sold_products || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    To admin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-foreground">{stats?.recent_products || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    New products
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs value={getTabFromPath(location.pathname)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
            <TabsTrigger value="products" asChild>
              <Link to="/seller" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>My Products</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="add-product" asChild>
              <Link to="/seller/add-product" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="orders" asChild>
              <Link to="/seller/orders" className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Orders</span>
              </Link>
            </TabsTrigger>
            {getTabFromPath(location.pathname) === 'edit-product' && (
              <TabsTrigger value="edit-product" asChild>
                <Link to={location.pathname} className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Edit Product</span>
                </Link>
              </TabsTrigger>
            )}
          </TabsList>

          {getTabFromPath(location.pathname) === 'products' && (
            <TabsContent value="products">
              <ProductList />
            </TabsContent>
          )}
          
          {getTabFromPath(location.pathname) === 'add-product' && (
            <TabsContent value="add-product">
              <AddProduct />
            </TabsContent>
          )}
          
          {getTabFromPath(location.pathname) === 'edit-product' && (
            <TabsContent value="edit-product">
              <EditProduct />
            </TabsContent>
          )}
          
          {getTabFromPath(location.pathname) === 'orders' && (
            <TabsContent value="orders">
              <SellerOrders />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Razorpay Modal */}
      <RazorpayModal 
        isOpen={isRazorpayModalOpen} 
        onOpenChange={setIsRazorpayModalOpen} 
      />
    </div>
  );
}
