import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Edit, Trash2, Eye, Package, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ProductCard from '../ProductCard';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [isRelistModalOpen, setIsRelistModalOpen] = useState(false);
  const [relistingProduct, setRelistingProduct] = useState(null);
  const [relistData, setRelistData] = useState({ quantity: '1', price: '' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['seller-products'],
    queryFn: async () => {
      try {
        const response = await api.get('/products/seller-products');
        return response.data.results || response.data;
      } catch (error) {
        console.error('Error fetching products:', error);
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
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}/`);
        toast.success('Product deleted successfully');
        refetch();
      } catch (error) {
        toast.error('Failed to delete product');
        console.error('Delete error:', error);
      }
    }
  };

  const handleEdit = (productId) => {
    navigate(`/seller/edit-product/${productId}`);
  };

  const handleView = (productId) => {
    const p = products.find((x) => x.id === productId);
    if (p) {
      setViewingProduct(p);
      setIsViewOpen(true);
    }
  };

  const handleRelist = (product) => {
    setRelistingProduct(product);
    setRelistData({ 
      quantity: '1', 
      price: product.price.toString() 
    });
    setIsRelistModalOpen(true);
  };

  const relistMutation = useMutation({
    mutationFn: async ({ productId, data }) => {
      const response = await api.post(`/products/${productId}/relist`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Product relisted successfully!');
      refetch();
      setIsRelistModalOpen(false);
      setRelistingProduct(null);
      setRelistData({ quantity: '1', price: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to relist product');
    },
  });

  const confirmRelist = () => {
    if (!relistingProduct) return;
    
    if (!relistData.quantity || parseInt(relistData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    
    if (!relistData.price || parseFloat(relistData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    relistMutation.mutate({
      productId: relistingProduct.id,
      data: {
        quantity: parseInt(relistData.quantity),
        price: parseFloat(relistData.price),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Products</h2>
          <p className="text-muted-foreground">Manage your listed products across all categories and track their performance</p>
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {/* Products Display */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                userRole="seller"
                onEdit={() => handleEdit(product.id)}
                onDelete={() => handleDelete(product.id)}
                onRelist={() => handleRelist(product)}
                data-testid={`product-card-${product.id}`}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
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
                        <div>
                          <div className="font-medium text-foreground">{product.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.category_name}</TableCell>
                      <TableCell className="font-semibold text-foreground">₹{product.price}</TableCell>
                      <TableCell className="text-muted-foreground">{product.quantity}</TableCell>
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
                            onClick={() => handleView(product.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(product.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRelist(product)}
                            title="Relist this product"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="gradient-card">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first product to the marketplace'
              }
            </p>
            <Button asChild className="primary-gradient">
              <a href="/seller/add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name}</DialogTitle>
            <DialogDescription>Preview of your product details as seen by you.</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <img
                src={toAbsolute(viewingProduct.primary_image || viewingProduct.image)}
                alt={viewingProduct.name}
                className="w-full h-64 object-cover rounded"
                onError={(e) => { e.currentTarget.src = '/api/placeholder/400/200'; }}
              />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="text-foreground font-medium">{viewingProduct.category_name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-foreground font-semibold">₹{viewingProduct.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                  <p className="text-foreground">{viewingProduct.quantity} {viewingProduct.quantity_unit || 'units'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-foreground whitespace-pre-wrap">{viewingProduct.description}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingProduct.id); }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Relist Modal */}
      <Dialog open={isRelistModalOpen} onOpenChange={setIsRelistModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Relist Product
            </DialogTitle>
            <DialogDescription>
              Create a new listing based on this product with updated quantity and price.
            </DialogDescription>
          </DialogHeader>

          {relistingProduct && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{relistingProduct.name}</h4>
                    <p className="text-sm text-muted-foreground">{relistingProduct.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Original Price:</span>
                      <span className="font-medium">₹{relistingProduct.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <label htmlFor="relist-quantity" className="block text-sm font-medium mb-2">
                    New Quantity *
                  </label>
                  <Input
                    id="relist-quantity"
                    type="number"
                    min="1"
                    value={relistData.quantity}
                    onChange={(e) => setRelistData({ ...relistData, quantity: e.target.value })}
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label htmlFor="relist-price" className="block text-sm font-medium mb-2">
                    New Price (₹) *
                  </label>
                  <Input
                    id="relist-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={relistData.price}
                    onChange={(e) => setRelistData({ ...relistData, price: e.target.value })}
                    placeholder="Enter price"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will create a new product listing with the same details but updated quantity and price. The original product will remain unchanged.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6 flex-shrink-0 bg-background sticky bottom-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsRelistModalOpen(false)}
                  disabled={relistMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmRelist}
                  disabled={relistMutation.isPending}
                  className="min-w-[120px]"
                >
                  {relistMutation.isPending ? 'Relisting...' : 'Relist Product'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
