import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { CreditCard, Eye, EyeOff, AlertCircle, CheckCircle, Settings, Loader2, Shield, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export default function AdminRazorpayModal({ isOpen, onOpenChange }) {
  const [formData, setFormData] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  // Fetch existing Razorpay details
  const { data: razorpayData, isLoading } = useQuery({
    queryKey: ['admin-razorpay-details'],
    queryFn: async () => {
      const response = await api.get('/auth/razorpay-details');
      return response.data;
    },
    enabled: isOpen,
  });

  // Update Razorpay details mutation
  const updateRazorpayMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/razorpay-details', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-razorpay-details']);
      toast.success('Admin Razorpay details updated successfully!');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update Razorpay details');
    },
  });

  useEffect(() => {
    if (razorpayData && !isEditing) {
      setFormData({
        razorpay_key_id: razorpayData.razorpay_key_id || '',
        razorpay_key_secret: '' // Never pre-fill secret for security
      });
    }
  }, [razorpayData, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validate form
    const newErrors = {};
    
    if (!formData.razorpay_key_id.trim()) {
      newErrors.razorpay_key_id = 'Razorpay Key ID is required';
    } else if (!formData.razorpay_key_id.startsWith('rzp_')) {
      newErrors.razorpay_key_id = 'Invalid Razorpay Key ID format';
    }
    
    if (!formData.razorpay_key_secret.trim()) {
      newErrors.razorpay_key_secret = 'Razorpay Key Secret is required';
    } else if (formData.razorpay_key_secret.length < 20) {
      newErrors.razorpay_key_secret = 'Key Secret seems too short';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateRazorpayMutation.mutate(formData);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData(prev => ({
      ...prev,
      razorpay_key_secret: '' // Clear secret when editing
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (razorpayData) {
      setFormData({
        razorpay_key_id: razorpayData.razorpay_key_id || '',
        razorpay_key_secret: ''
      });
    }
  };

  const isConfigured = razorpayData?.razorpay_key_id;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            Admin Razorpay Configuration
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure Razorpay payment gateway for buyer payments. This allows customers to pay for their orders securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Status Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-full bg-green-100">
                  {isConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                Payment Gateway Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isConfigured ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-green-700 font-medium">Razorpay is configured and ready</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Buyers can now make secure payments for their orders through Razorpay.
                  </p>
                  <Alert className="bg-green-50 border-green-200">
                    <Shield className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Key ID:</strong> <span className="font-mono">{razorpayData.razorpay_key_id}</span>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <p className="text-orange-700 font-medium">Razorpay not configured</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Set up your Razorpay credentials to enable secure payment processing for buyers.
                  </p>
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Configure your Razorpay account to start accepting payments from buyers.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Razorpay Credentials
              </CardTitle>
              <CardDescription>
                Enter your Razorpay API credentials. You can find these in your{' '}
                <a 
                  href="https://dashboard.razorpay.com/app/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Razorpay Dashboard <ExternalLink className="h-3 w-3" />
                </a>
                {' '}under Settings → API Keys.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading configuration...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="razorpay_key_id" className="text-sm font-medium">
                      Razorpay Key ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="razorpay_key_id"
                      name="razorpay_key_id"
                      type="text"
                      placeholder="rzp_test_xxxxxxxxxx or rzp_live_xxxxxxxxxx"
                      value={formData.razorpay_key_id}
                      onChange={handleInputChange}
                      disabled={!isEditing && isConfigured}
                      className={`font-mono ${errors.razorpay_key_id ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.razorpay_key_id && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.razorpay_key_id}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      This is your public key and is safe to share
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="razorpay_key_secret" className="text-sm font-medium">
                      Razorpay Key Secret <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="razorpay_key_secret"
                        name="razorpay_key_secret"
                        type={showSecret ? "text" : "password"}
                        placeholder={isConfigured && !isEditing ? "••••••••••••••••" : "Enter your Razorpay Key Secret"}
                        value={formData.razorpay_key_secret}
                        onChange={handleInputChange}
                        disabled={!isEditing && isConfigured}
                        className={`font-mono pr-10 ${errors.razorpay_key_secret ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSecret(!showSecret)}
                        disabled={!isEditing && isConfigured}
                      >
                        {showSecret ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.razorpay_key_secret && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.razorpay_key_secret}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Keep this secret secure and never share it publicly
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    {isEditing || !isConfigured ? (
                      <>
                        <Button
                          type="submit"
                          disabled={updateRazorpayMutation.isPending}
                          className="flex-1"
                          size="lg"
                        >
                          {updateRazorpayMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Save Configuration
                            </>
                          )}
                        </Button>
                        {isConfigured && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={updateRazorpayMutation.isPending}
                            size="lg"
                            className="sm:w-auto"
                          >
                            Cancel
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEdit}
                        className="flex-1"
                        size="lg"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Configuration
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Buyer places order</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customer adds items to cart and proceeds to checkout
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Secure payment processing</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payment is processed through Razorpay using your configured credentials
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Order confirmation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Order is confirmed and payment is received in your Razorpay account
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
