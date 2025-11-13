import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ShoppingCart, Eye, Package, CreditCard, AlertCircle, Search, Filter } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function SellerProducts() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [purchaseData, setPurchaseData] = useState({
    quantity: 1,
    sellingPrice: 0
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['seller-products-for-admin'],
    queryFn: async () => {
      try {
        const response = await api.get('/products/seller-products/');
        return response.data;
      } catch (error) {
        console.error('Error fetching seller products:', error);
        // Return empty array if API fails
        return [];
      }
    },
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  const createPaymentOrderMutation = useMutation({
    mutationFn: async ({ productId, quantity, sellingPrice }) => {
      const response = await api.post('/payments/admin/create-order', { 
        productId, 
        quantity, 
        sellingPrice 
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Load Razorpay script and initiate payment
      loadRazorpayScript().then(() => {
        initiatePayment(data);
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create payment order');
      setPaymentLoading(false);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      const response = await api.post('/payments/admin/verify', paymentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['seller-products-for-admin']);
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['dashboard-metrics']);
      toast.success('Payment successful! Product purchased.');
      setIsPaymentModalOpen(false);
      setSelectedProduct(null);
      setPaymentLoading(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Payment verification failed');
      setPaymentLoading(false);
    },
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = (paymentData) => {
    const options = {
      key: paymentData.key_id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'IndoLink Admin Purchase',
      description: `Purchase ${paymentData.product.name}`,
      order_id: paymentData.order_id,
      handler: function (response) {
        // Verify payment
        verifyPaymentMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          database_order_id: paymentData.database_order_id,
        });
      },
      prefill: {
        name: 'Admin',
        email: 'admin@indolink.com',
      },
      theme: {
        color: '#3B82F6',
      },
      modal: {
        ondismiss: function() {
          setPaymentLoading(false);
          toast.info('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePurchase = (product) => {
    setSelectedProduct(product);
    setPurchaseData({
      quantity: 1,
      sellingPrice: Math.round(product.price * 1.2) // Default 20% markup
    });
    setIsPaymentModalOpen(true);
  };

  const handleView = (product) => {
    setViewingProduct(product);
    setIsViewOpen(true);
  };

  const toAbsolute = (url) => {
    if (!url) return url;
    if (url.startsWith('@uploads/')) url = `/${url.slice(1)}`;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const confirmPurchase = () => {
    if (!selectedProduct) return;
    
    if (purchaseData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    
    if (purchaseData.quantity > selectedProduct.quantity) {
      toast.error(`Only ${selectedProduct.quantity} items available`);
      return;
    }
    
    if (purchaseData.sellingPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }
    
    setPaymentLoading(true);
    createPaymentOrderMutation.mutate({
      productId: selectedProduct.id,
      quantity: purchaseData.quantity,
      sellingPrice: purchaseData.sellingPrice
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Products from Sellers</CardTitle>
              <CardDescription>
                Browse and purchase products from farmers to re-list in the marketplace
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Package className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Display */}
          {filteredProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-xl transition-all duration-300">
                    <div className="relative overflow-hidden">
                      <img
                        src={toAbsolute(product.primary_image || product.image) || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </div>
                      <div className="absolute top-3 left-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg text-foreground mb-2">{product.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">₹{product.price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Quantity</p>
                            <p className="font-medium">{product.quantity} {product.quantity_unit || 'units'}</p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Seller: {product.seller_name}</p>
                          <p>Category: {product.category_name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handlePurchase(product)}
                          disabled={paymentLoading || product.status !== 'ACTIVE'}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Purchase
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={toAbsolute(product.primary_image || product.image) || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                          />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.seller_name}</TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>₹{product.price}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleView(product)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handlePurchase(product)}
                            disabled={paymentLoading || product.status !== 'ACTIVE'}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Purchase
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No seller products are currently available for purchase'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Product Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name}</DialogTitle>
            <DialogDescription>Product details from seller</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <img
                src={toAbsolute(viewingProduct.primary_image || viewingProduct.image) || '/placeholder-product.jpg'}
                alt={viewingProduct.name}
                className="w-full h-64 object-cover rounded"
                onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
              />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground whitespace-pre-wrap">{viewingProduct.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="text-foreground font-medium">{viewingProduct.category_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seller</p>
                  <p className="text-foreground font-medium">{viewingProduct.seller_name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-foreground font-semibold">₹{viewingProduct.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity Available</p>
                  <p className="text-foreground font-medium">{viewingProduct.quantity} {viewingProduct.quantity_unit || 'units'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className={getStatusColor(viewingProduct.status)}>
                  {viewingProduct.status}
                </Badge>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                <Button 
                  onClick={() => { 
                    setIsViewOpen(false); 
                    handlePurchase(viewingProduct); 
                  }}
                  disabled={viewingProduct.status !== 'ACTIVE'}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>
              You are about to purchase this product from the seller. Payment will be processed through their Razorpay account.
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Seller:</span>
                      <span className="font-medium">{selectedProduct.seller_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Unit Price:</span>
                      <span className="font-semibold">₹{selectedProduct.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available:</span>
                      <span className="font-medium">{selectedProduct.quantity} {selectedProduct.quantity_unit || 'units'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Purchase</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedProduct.quantity}
                    value={purchaseData.quantity}
                    onChange={(e) => setPurchaseData(prev => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1
                    }))}
                    placeholder="Enter quantity"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {selectedProduct.quantity} {selectedProduct.quantity_unit || 'units'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Your Selling Price (per unit)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseData.sellingPrice}
                    onChange={(e) => setPurchaseData(prev => ({
                      ...prev,
                      sellingPrice: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter your selling price"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost: ₹{selectedProduct.price} × {purchaseData.quantity} = ₹{(selectedProduct.price * purchaseData.quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600">
                    Potential profit: ₹{((purchaseData.sellingPrice - selectedProduct.price) * purchaseData.quantity).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Payment Process:</p>
                  <p>Payment will be made directly to the seller's Razorpay account. After successful payment, the products will be added to your admin inventory.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6 flex-shrink-0 bg-background sticky bottom-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={paymentLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmPurchase}
                  disabled={paymentLoading}
                  className="min-w-[120px]"
                >
                  {paymentLoading ? 'Processing...' : 'Proceed to Pay'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
