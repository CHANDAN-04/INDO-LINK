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
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, Eye, Edit, Trash2, TrendingUp, ShoppingBag, DollarSign, Search, Filter, X } from 'lucide-react';
import ImageUpload from '../ui/ImageUpload';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    category: '',
    sellingPrice: 0,
    status: 'ACTIVE'
  });
  const [editImages, setEditImages] = useState([]);
  const [activeEditTab, setActiveEditTab] = useState('basic');

  // Fetch admin products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin-products');
        return response.data;
      } catch (error) {
        console.error('Error fetching admin products:', error);
        return { adminProducts: [], total: 0 };
      }
    },
    select: (data) => {
      if (data && Array.isArray(data.adminProducts)) return data;
      return { adminProducts: [], total: 0 };
    },
  });

  // Fetch admin product stats
  const { data: stats } = useQuery({
    queryKey: ['admin-product-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin-products/stats');
        return response.data;
      } catch (error) {
        console.error('Error fetching admin product stats:', error);
        return {
          totalProducts: 0,
          totalQuantity: 0,
          totalInvestment: 0,
          totalPotentialRevenue: 0,
          activeProducts: 0,
          potentialProfit: 0,
          availableQuantity: 0
        };
      }
    },
  });

  // Fetch categories for edit form
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/products/categories/');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      if (data && Array.isArray(data.categories)) return data.categories;
      return [];
    },
  });

  // Update admin product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data, images }) => {
      const formData = new FormData();
      
      // Add basic product data
      Object.keys(data).forEach(key => {
        if (key !== 'images' && data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      
      // Handle primary image
      const primaryImage = images.find(img => img.isPrimary);
      if (primaryImage) {
        if (primaryImage.file) {
          // New primary image file
          formData.append('image', primaryImage.file);
        } else if (primaryImage.isExisting && primaryImage.preview) {
          // Keep existing primary image - update images array to ensure it's included
          // The backend will handle this, but we need to make sure the image field is set
          // Actually, if it's existing and primary, the backend should keep it
        }
      } else {
        // No primary image selected - set to empty or first available
        if (images.length > 0 && images[0].preview) {
          // Use first image as primary if no primary is set
          if (images[0].file) {
            formData.append('image', images[0].file);
          }
        }
      }
      
      const response = await api.put(`/admin-products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Upload new non-primary images
      const newImages = images.filter(img => img.file && !img.isExisting && !img.isPrimary);
      for (const image of newImages) {
        const imageFormData = new FormData();
        imageFormData.append('image', image.file);
        
        try {
          await api.post(`/admin-products/${id}/images`, imageFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (error) {
          console.warn('Failed to upload additional image:', error);
        }
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-product-stats']);
      setIsEditModalOpen(false);
      setEditImages([]);
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async ({ productId, imageIndex }) => {
      await api.delete(`/admin-products/${productId}/images/${imageIndex}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete image');
      console.error('Error deleting image:', error);
    },
  });

  // Delete admin product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/admin-products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      queryClient.invalidateQueries(['admin-product-stats']);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditData({
      name: product.name || '',
      description: product.description || '',
      category: (product.category?._id || product.category || '').toString(),
      sellingPrice: product.sellingPrice || 0,
      status: product.status || 'ACTIVE'
    });
    
    // Convert product images to the format expected by ImageUpload
    const formattedImages = [];
    if (product.image) {
      formattedImages.push({
        id: 'primary-existing',
        preview: product.image,
        isPrimary: true,
        isUploading: false,
        isExisting: true
      });
    }
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img, index) => {
        if (img !== product.image) { // Don't duplicate primary image
          formattedImages.push({
            id: `existing-${index}`,
            preview: img,
            isPrimary: false,
            isUploading: false,
            isExisting: true
          });
        }
      });
    }
    setEditImages(formattedImages);
    setActiveEditTab('basic');
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedProduct) return;
    
    // Validation
    if (!editData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!editData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    if (!editData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!editData.sellingPrice || parseFloat(editData.sellingPrice) <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }
    
    updateProductMutation.mutate({
      id: selectedProduct._id,
      data: {
        ...editData,
        sellingPrice: parseFloat(editData.sellingPrice),
      },
      images: editImages
    });
  };

  const handleDeleteImage = (imageId) => {
    if (!selectedProduct) return;
    
    const image = editImages.find(img => img.id === imageId);
    if (!image) return;
    
    // Update local state immediately for better UX
    let updatedImages = editImages.filter(img => img.id !== imageId);
    
    // If we deleted the primary image, make the first remaining image primary
    if (image.isPrimary && updatedImages.length > 0) {
      updatedImages = updatedImages.map((img, idx) => ({
        ...img,
        isPrimary: idx === 0
      }));
    }
    setEditImages(updatedImages);
    
    // Delete from server if it's an existing image
    if (image.isExisting) {
      const imagesArray = selectedProduct.images || [];
      const isPrimaryImage = image.preview === selectedProduct.image;
      
      if (isPrimaryImage) {
        // Primary image deletion: update the product to set a new primary or remove it
        // This will be handled when the form is submitted, or we can update immediately
        // For now, just remove it from local state - it will be saved when user clicks Update
      } else {
        // Find the index in the images array (not primary)
        const imageIndex = imagesArray.findIndex(img => img === image.preview);
        if (imageIndex >= 0) {
          deleteImageMutation.mutate({ productId: selectedProduct._id, imageIndex });
        }
      }
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product._id);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { variant: 'default', label: 'Active' },
      SOLD_OUT: { variant: 'secondary', label: 'Sold Out' },
      INACTIVE: { variant: 'destructive', label: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.INACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SOLD_OUT':
        return 'bg-blue-100 text-blue-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const toAbsolute = (url) => {
    if (!url) return url;
    if (url.startsWith('@uploads/')) url = `/${url.slice(1)}`;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleView = (product) => {
    setViewingProduct(product);
    setIsViewOpen(true);
  };

  const filteredProducts = products?.adminProducts?.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sellerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl font-semibold">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Available Quantity</p>
                <p className="text-xl font-semibold">{stats.availableQuantity}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Investment</p>
                <p className="text-xl font-semibold">₹{stats.totalInvestment?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Potential Profit</p>
                <p className="text-xl font-semibold text-green-600">₹{stats.potentialProfit?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Products Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Inventory
              </CardTitle>
              <CardDescription>
                Products you've purchased from sellers and are managing for resale
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
                  <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Display */}
          {filteredProducts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const availableQuantity = (product.quantity || 0) - (product.soldQuantity || 0);
                  const profitPerUnit = (product.sellingPrice || 0) - (product.purchasePrice || 0);
                  return (
                    <Card key={product._id} className="group hover:shadow-xl transition-all duration-300">
                      <div className="relative overflow-hidden">
                        <img
                          src={toAbsolute(product.image) || '/placeholder-product.jpg'}
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
                              <p className="text-xs text-muted-foreground">Purchase Price</p>
                              <p className="text-lg font-semibold">₹{product.purchasePrice?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Selling Price</p>
                              <p className="text-lg font-semibold text-primary">₹{product.sellingPrice?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="font-medium">{availableQuantity}/{product.quantity || 0} {product.quantity_unit || 'units'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Profit/Unit</p>
                              <p className={`font-semibold ${profitPerUnit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{profitPerUnit.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Seller: {product.sellerName}</p>
                            <p>Category: {product.category?.name || 'N/A'}</p>
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
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(product)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Profit/Unit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={toAbsolute(product.image) || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category?.name || 'N/A'}</TableCell>
                      <TableCell>{product.sellerName}</TableCell>
                      <TableCell>₹{product.purchasePrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>₹{product.sellingPrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{(product.quantity || 0) - (product.soldQuantity || 0)}</span>
                          <span className="text-muted-foreground">/{product.quantity || 0} {product.quantity_unit || 'units'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          ((product.sellingPrice || 0) - (product.purchasePrice || 0)) > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          ₹{((product.sellingPrice || 0) - (product.purchasePrice || 0)).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(product)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Purchase products from sellers to start building your inventory'
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
            <DialogDescription>Product details and inventory information</DialogDescription>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <img
                src={toAbsolute(viewingProduct.image) || '/placeholder-product.jpg'}
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
                  <p className="text-foreground font-medium">{viewingProduct.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Seller</p>
                  <p className="text-foreground font-medium">{viewingProduct.sellerName || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Purchase Price</p>
                  <p className="text-foreground font-semibold">₹{viewingProduct.purchasePrice?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Selling Price</p>
                  <p className="text-foreground font-semibold text-primary">₹{viewingProduct.sellingPrice?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available Quantity</p>
                  <p className="text-foreground font-medium">
                    {(viewingProduct.quantity || 0) - (viewingProduct.soldQuantity || 0)} / {viewingProduct.quantity || 0} {viewingProduct.quantity_unit || 'units'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Profit per Unit</p>
                  <p className={`font-semibold ${
                    ((viewingProduct.sellingPrice || 0) - (viewingProduct.purchasePrice || 0)) > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ₹{((viewingProduct.sellingPrice || 0) - (viewingProduct.purchasePrice || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <div>{getStatusBadge(viewingProduct.status)}</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingProduct); }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Product
            </DialogTitle>
            <DialogDescription>
              Update product information, images, and pricing
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Purchase Price:</span>
                      <span className="font-medium">₹{selectedProduct.purchasePrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{selectedProduct.quantity} {selectedProduct.quantity_unit || 'units'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="images">Images & Media</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editName">Product Name *</Label>
                        <Input
                          id="editName"
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter product name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="editCategory">Category *</Label>
                        <Select 
                          value={editData.category} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(categories) && categories.map((category) => (
                              <SelectItem key={(category._id || category.id)} value={(category._id || category.id).toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="editSellingPrice">Selling Price (per unit) *</Label>
                        <Input
                          id="editSellingPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.sellingPrice}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            sellingPrice: parseFloat(e.target.value) || 0
                          }))}
                          placeholder="Enter selling price"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Profit per unit: ₹{(editData.sellingPrice - selectedProduct.purchasePrice).toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="editStatus">Status</Label>
                        <Select
                          value={editData.status}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SOLD_OUT">Sold Out</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="editDescription">Description *</Label>
                      <Textarea
                        id="editDescription"
                        value={editData.description}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your product in detail..."
                        rows={8}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Product Images</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      Upload high-quality images of your product. The first image will be used as the primary image.
                    </p>
                    <ImageUpload
                      images={editImages}
                      onImagesChange={setEditImages}
                      maxImages={5}
                      className="mt-4"
                      onDeleteImage={handleDeleteImage}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-4 border-t mt-6 flex-shrink-0 bg-background sticky bottom-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <div className="flex gap-3">
                  {activeEditTab === 'basic' && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveEditTab('images')}
                    >
                      Next: Manage Images
                    </Button>
                  )}
                  {activeEditTab === 'images' && (
                    <Button 
                      variant="outline"
                      onClick={() => setActiveEditTab('basic')}
                    >
                      Back: Basic Info
                    </Button>
                  )}
                  <Button 
                    onClick={handleUpdate}
                    disabled={updateProductMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}