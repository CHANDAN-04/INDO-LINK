import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { 
  Leaf, 
  TrendingUp, 
  ShoppingCart, 
  Brain,
  ShieldCheck,
  BarChart3,
  Check,
  ArrowRight,
  Star,
  Users,
  Globe,
  Zap,
  Award,
  Target,
  Heart,
  Truck,
  Clock,
  DollarSign,
  Package,
  Handshake
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if user is logged in
  React.useEffect(() => {
    if (user) {
      navigate(`/${user.role.toLowerCase()}`);
    }
  }, [user, navigate]);

  const selectRole = (role) => {
    localStorage.setItem('selectedRole', role);
    navigate('/register');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient text-primary-foreground py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-6">
            <Badge className="bg-white/20 text-white border-white/30 mb-4 px-4 py-2">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 10,000+ Businesses
            </Badge>
          </div>
          <h1 className="text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
            Connect Sellers to 
            <span className="block text-secondary">Global Markets</span>
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed" data-testid="text-hero-description">
            IndoLink empowers sellers, streamlines trading with AI insights, connects consumers to quality products, and enables brokers to earn commissions through our innovative universal marketplace platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-4"
              asChild
              data-testid="button-get-started"
            >
              <Link to="/register">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-black dark:text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
              asChild
              data-testid="button-learn-more"
            >
              <a href="#features">
                Watch Demo
              </a>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">10,000+</div>
              <div className="text-sm opacity-80">Active Sellers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">₹50M+</div>
              <div className="text-sm opacity-80">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">99.9%</div>
              <div className="text-sm opacity-80">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-20 bg-muted" id="roles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4" data-testid="text-roles-title">
              Choose Your Role
            </h3>
            <p className="text-lg text-muted-foreground" data-testid="text-roles-description">
              Join IndoLink as a Seller, Buyer, or Broker
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Seller Card */}
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-seller">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-4">Seller</h4>
                <p className="text-muted-foreground mb-6">
                  List your products and connect with buyers worldwide. Manage your inventory and track sales across any category.
                </p>
                <ul className="text-left text-sm text-muted-foreground mb-8 space-y-2">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-2" />
                    List any products
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-2" />
                    Manage inventory
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-2" />
                    Track sales
                  </li>
                </ul>
                <Button
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  onClick={() => selectRole('seller')}
                  data-testid="button-join-seller"
                >
                  Join as Seller
                </Button>
              </CardContent>
            </Card>

            {/* Buyer Card */}
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-buyer">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-4">Buyer</h4>
                <p className="text-muted-foreground mb-6">
                  Purchase quality products directly from verified sellers across all categories. Secure payments with Razorpay.
                </p>
                <ul className="text-left text-sm text-muted-foreground mb-8 space-y-2">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-purple-600 mr-2" />
                    Quality products
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-purple-600 mr-2" />
                    Secure payments
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-purple-600 mr-2" />
                    Order tracking
                  </li>
                </ul>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => selectRole('buyer')}
                  data-testid="button-join-buyer"
                >
                  Join as Buyer
                </Button>
              </CardContent>
            </Card>

            {/* Broker Card */}
            <Card className="hover:shadow-lg transition-shadow" data-testid="card-broker">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Handshake className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold text-foreground mb-4">Broker</h4>
                <p className="text-muted-foreground mb-6">
                  Earn commissions by connecting buyers and sellers. Get 5% commission on every transaction involving your referrals.
                </p>
                <ul className="text-left text-sm text-muted-foreground mb-8 space-y-2">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-blue-600 mr-2" />
                    5% commission on profits
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-blue-600 mr-2" />
                    Track your referrals
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-blue-600 mr-2" />
                    Real-time earnings
                  </li>
                </ul>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => selectRole('broker')}
                  data-testid="button-join-broker"
                >
                  Join as Broker
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Admin Login Section */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5" />
              <span>Admin? </span>
              <Button
                variant="link"
                className="p-0 h-auto text-primary hover:text-primary/80"
                onClick={() => navigate('/login')}
                data-testid="button-login-admin"
              >
                Login as Admin
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2">Features</Badge>
            <h3 className="text-4xl font-bold text-foreground mb-4" data-testid="text-features-title">
              Everything You Need for Success
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-features-description">
              Our comprehensive platform provides all the tools and features needed for successful universal marketplace trading
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card data-testid="card-ai-insights">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold mb-4">AI Market Insights</h4>
                <p className="text-muted-foreground mb-4">
                  Powered by Gemini AI for real-time market trend analysis and pricing optimization.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-primary mr-2" />
                    Real-time price predictions
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-primary mr-2" />
                    Market trend analysis
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-primary mr-2" />
                    Demand forecasting
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-secure-payments">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-black/10 text-secondary rounded-xl flex items-center justify-center mb-6 dark:bg-white/10">
                  <ShieldCheck className="w-8 h-8 text-black dark:text-white"/>
                </div>
                <h4 className="text-2xl font-bold mb-4">Secure Payments</h4>
                <p className="text-muted-foreground mb-4">
                  Integrated Razorpay payment gateway for safe and instant transactions.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-2" />
                    PCI DSS compliant
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-2" />
                    Multiple payment methods
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-secondary mr-2" />
                    Instant settlements
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-analytics">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Analytics Dashboard</h4>
                <p className="text-muted-foreground mb-4">
                  Comprehensive analytics and reporting tools for all stakeholders.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-purple-600 mr-2" />
                    Real-time metrics
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-purple-600 mr-2" />
                    Custom reports
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-purple-600 mr-2" />
                    Export capabilities
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* <Card>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                  <Truck className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Logistics Management</h4>
                <p className="text-muted-foreground mb-4">
                  Streamlined logistics and delivery tracking for seamless operations.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    Real-time tracking
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    Route optimization
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    Delivery notifications
                  </li>
                </ul>
              </CardContent>
            </Card> */}

            <Card>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Community Network</h4>
                <p className="text-muted-foreground mb-4">
                  Connect with farmers, traders, and buyers in our growing community.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-blue-600 mr-2" />
                    Verified profiles
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-blue-600 mr-2" />
                    Direct messaging
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-blue-600 mr-2" />
                    Knowledge sharing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Fast & Reliable</h4>
                <p className="text-muted-foreground mb-4">
                  Lightning-fast performance with 99.9% uptime guarantee.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-orange-600 mr-2" />
                    Sub-second response
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-orange-600 mr-2" />
                    24/7 monitoring
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-orange-600 mr-2" />
                    Auto-scaling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <Handshake className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-bold mb-4">Broker Network</h4>
                <p className="text-muted-foreground mb-4">
                  Earn commissions by connecting buyers and sellers in our growing marketplace.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-indigo-600 mr-2" />
                    5% commission on profits
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-indigo-600 mr-2" />
                    Real-time tracking
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 text-indigo-600 mr-2" />
                    Referral management
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of sellers and traders who are already using IndoLink to grow their business.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="text-lg px-8 py-4" asChild>
                <Link to="/register">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
