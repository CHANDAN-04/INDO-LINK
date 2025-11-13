import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { CreditCard, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

export default function RazorpayModal({ isOpen, onOpenChange }) {
  const [formData, setFormData] = useState({
    razorpay_key_id: '',
    razorpay_key_secret: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing Razorpay details
  const { data: razorpayData, isLoading } = useQuery({
    queryKey: ['razorpay-details'],
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
      queryClient.invalidateQueries(['razorpay-details']);
      toast.success('Razorpay details updated successfully!');
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
        razorpay_key_secret: razorpayData.razorpay_key_secret === '***HIDDEN***' ? '' : razorpayData.razorpay_key_secret || ''
      });
    }
  }, [razorpayData, isEditing]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.razorpay_key_id.trim()) {
      toast.error('Razorpay Key ID is required');
      return;
    }
    
    if (!formData.razorpay_key_secret.trim()) {
      toast.error('Razorpay Key Secret is required');
      return;
    }

    updateRazorpayMutation.mutate(formData);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      razorpay_key_id: razorpayData?.razorpay_key_id || '',
      razorpay_key_secret: ''
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      razorpay_key_id: razorpayData?.razorpay_key_id || '',
      razorpay_key_secret: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Razorpay Payment Details
          </DialogTitle>
          <DialogDescription>
            Configure your Razorpay account details to receive payments from admin purchases.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Status Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {razorpayData?.has_razorpay_details ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Payment Details Configured</p>
                        <p className="text-xs text-green-600">You can receive payments from admin purchases</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Payment Details Required</p>
                        <p className="text-xs text-amber-600">Configure your Razorpay details to receive payments</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="razorpay_key_id">Razorpay Key ID *</Label>
                <Input
                  id="razorpay_key_id"
                  name="razorpay_key_id"
                  type="text"
                  required
                  value={formData.razorpay_key_id}
                  onChange={handleChange}
                  placeholder="rzp_test_xxxxxxxxxx"
                  disabled={!isEditing && razorpayData?.has_razorpay_details}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razorpay_key_secret">Razorpay Key Secret *</Label>
                <div className="relative">
                  <Input
                    id="razorpay_key_secret"
                    name="razorpay_key_secret"
                    type={showSecret ? "text" : "password"}
                    required
                    value={formData.razorpay_key_secret}
                    onChange={handleChange}
                    placeholder={razorpayData?.has_razorpay_details && !isEditing ? "***HIDDEN***" : "Enter your secret key"}
                    disabled={!isEditing && razorpayData?.has_razorpay_details}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowSecret(!showSecret)}
                    disabled={!isEditing && razorpayData?.has_razorpay_details}
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Help Text */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>How to get your Razorpay keys:</strong><br />
                  1. Log in to your Razorpay Dashboard<br />
                  2. Go to Settings → API Keys<br />
                  3. Generate or copy your Key ID and Secret<br />
                  4. Use test keys for testing, live keys for production
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t mt-6 flex-shrink-0 bg-background sticky bottom-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                
                {razorpayData?.has_razorpay_details && !isEditing ? (
                  <Button 
                    type="button" 
                    onClick={handleEdit}
                  >
                    Edit Details
                  </Button>
                ) : (
                  <>
                    {isEditing && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={updateRazorpayMutation.isPending}
                      className="min-w-[100px]"
                    >
                      {updateRazorpayMutation.isPending ? 'Saving...' : 'Save Details'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
