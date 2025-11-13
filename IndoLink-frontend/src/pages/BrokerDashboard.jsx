import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Logo from '../components/Logo';

const BrokerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchEarnings();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/broker/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/broker/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await api.get('/broker/earnings?limit=10');
      setEarnings(response.data.earnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const copyBrokerCode = () => {
    if (dashboardData?.broker_code) {
      navigator.clipboard.writeText(dashboardData.broker_code);
      toast.success('Broker code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Broker Profile Not Found</h2>
          <p className="text-muted-foreground">Please contact support to set up your broker account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Broker Code */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold">Broker Dashboard</span>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {dashboardData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your Broker Code</h3>
                  <p className="text-sm opacity-90">Share this code with buyers and sellers to earn commissions</p>
                </div>
                <div className="flex items-center space-x-3">
                  <code className="bg-white/20 text-white px-4 py-2 rounded-lg font-mono text-lg font-bold border border-white/30">
                    {dashboardData.broker_code}
                  </code>
                  <Button
                    onClick={copyBrokerCode}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.total_users}</div>
              <p className="text-xs text-muted-foreground">
                Buyers and sellers using your code
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.total_earnings?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                5% commission from profits
              </p>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.total_commission_paid?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                Total commissions processed
              </p>
            </CardContent>
          </Card> */}
        </div>

        {/* Recent Earnings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings.length > 0 ? (
                  earnings.map((earning, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{earning.product?.name || 'Product'}</p>
                        <p className="text-sm text-muted-foreground">
                          Seller: {earning.seller?.username} | Buyer: {earning.buyer?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Profit: ₹{earning.profit?.toFixed(2)} | Commission: 5%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{earning.commission_amount?.toFixed(2)}</p>
                        <Badge variant={earning.status === 'PAID' ? 'default' : 'secondary'}>
                          {earning.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No earnings yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                      <div>
                        <p className="font-medium text-foreground">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                      </div>
                      <Badge variant={user.role === 'SELLER' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
