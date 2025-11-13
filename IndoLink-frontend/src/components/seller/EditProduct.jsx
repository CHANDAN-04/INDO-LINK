import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import ImageUpload from '../ui/ImageUpload';
import api from '../../lib/api';

export default function EditProduct() {
  const location = useLocation();
  // Extract product ID from URL pathname: /seller/edit-product/{id}
  const productId = location.pathname.split('/edit-product/')[1];
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    quantity_unit: 'kg',
    status: 'ACTIVE'
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch product details
  const { data: product, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const response = await api.get(`/products/${productId}/`);
      return response.data;
    },
    enabled: !!productId,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await api.get('/products/categories/');
        return response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [
          { id: 1, name: 'Electronics' },
          { id: 2, name: 'Clothing' },
          { id: 3, name: 'Home & Garden' },
          { id: 4, name: 'Sports' },
          { id: 5, name: 'Books' },
          { id: 6, name: 'Health & Beauty' },
          { id: 7, name: 'Automotive' },
          { id: 8, name: 'Toys' }
        ];
      }
    },
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      if (data && Array.isArray(data.categories)) return data.categories;
      return [];
    },
  });

  // Update form data when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: (product.category?._id || product.category || '').toString(),
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        quantity_unit: product.quantity_unit || 'kg',
        status: product.status || 'ACTIVE'
      });

      // Convert product images to the format expected by ImageUpload
      const formattedImages = [];
      
      // Add primary image if it exists
      if (product.image) {
        formattedImages.push({
          id: 'primary-existing',
          preview: product.image,
          isPrimary: true,
          isUploading: false,
          isExisting: true,
          _id: null // Primary image is not in the images array
        });
      }
      
      // Add other images from images array
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        product.images.forEach((img, index) => {
          const imageUrl = img.imageUrl || (typeof img === 'string' ? img : null);
          if (imageUrl) {
            // Check if this is the primary image
            const isPrimary = imageUrl === product.image || img.isPrimary;
            formattedImages.push({
              id: img._id || img.id || `existing-${index}`,
              _id: img._id || img.id, // MongoDB document ID for deletion
              preview: imageUrl,
              isPrimary: isPrimary,
              isUploading: false,
              isExisting: true
            });
          }
        });
      }
      
      // If no primary image was found, mark first image as primary
      if (formattedImages.length > 0 && !formattedImages.some(img => img.isPrimary)) {
        formattedImages[0].isPrimary = true;
      }
      
      setImages(formattedImages);
    }
  }, [product]);

  const updateProductMutation = useMutation({
    mutationFn: async (productData) => {
      const formData = new FormData();
      
      // Add basic product data
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && productData[key] !== null && productData[key] !== undefined) {
          formData.append(key, productData[key]);
        }
      });
      
      // Handle primary image update
      const primaryImage = images.find(img => img.isPrimary);
      if (primaryImage) {
        if (primaryImage.file) {
          // New primary image file
          formData.append('image', primaryImage.file);
        } else if (primaryImage.isExisting && primaryImage.preview) {
          // Primary image is an existing image
          if (primaryImage.id !== 'primary-existing') {
            // Primary image changed to an existing image from the array
            // Only update if it's different from the original primary image
            if (product && primaryImage.preview !== product.image) {
              formData.append('image', primaryImage.preview);
            }
            // If primary-existing, don't append - backend will keep current image
          }
        }
      } else if (images.length > 0) {
        // No primary selected, use first image as primary
        if (images[0].file) {
          formData.append('image', images[0].file);
        } else if (images[0].preview) {
          formData.append('image', images[0].preview);
        }
      }
      
      const response = await api.patch(`/products/${productId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Upload new images (non-primary ones)
      const newImages = images.filter(img => img.file && !img.isExisting && !img.isPrimary);
      for (const image of newImages) {
        const imageFormData = new FormData();
        imageFormData.append('image', image.file);
        
        try {
          await api.post(`/products/${productId}/images/`, imageFormData, {
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
      queryClient.invalidateQueries(['seller-products']);
      queryClient.invalidateQueries(['seller-stats']);
      queryClient.invalidateQueries(['product', productId]);
      toast.success('Product updated successfully!');
      navigate('/seller');
    },
    onError: (error) => {
      toast.error('Failed to update product');
      console.error('Error updating product:', error);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId) => {
      await api.delete(`/products/${productId}/images/${imageId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product', productId]);
      queryClient.invalidateQueries(['seller-products']);
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete image');
      console.error('Error deleting image:', error);
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (value) => {
    setFormData({
      ...formData,
      category: value,
    });
  };

  const handleImageChange = (newImages) => {
    setImages(newImages);
  };

  const handleDeleteImage = (imageId) => {
    if (!productId) return;
    
    const image = images.find(img => img.id === imageId);
    if (!image) return;
    
    // Update local state immediately for better UX
    let updatedImages = images.filter(img => img.id !== imageId);
    
    // If we deleted the primary image, make the first remaining image primary
    if (image.isPrimary && updatedImages.length > 0) {
      updatedImages = updatedImages.map((img, idx) => ({
        ...img,
        isPrimary: idx === 0
      }));
    }
    setImages(updatedImages);
    
    // Delete from server if it's an existing image with a MongoDB _id
    if (image.isExisting && image._id) {
      deleteImageMutation.mutate(image._id);
    } else if (image.id === 'primary-existing') {
      // Primary image deletion - this will be handled by the update when form is submitted
      // For now, just remove it from local state
      toast.info('Primary image will be removed when you save the product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Product description is required');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      images: images,
    };

    updateProductMutation.mutate(productData);
  };

  if (!productId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product ID is missing</p>
        <Button onClick={() => navigate('/seller')} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product not found or error loading product</p>
        <p className="text-sm text-muted-foreground mt-2">
          {productError?.response?.data?.message || productError?.message || 'Please check the product ID'}
        </p>
        <Button onClick={() => navigate('/seller')} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Edit Product</span>
            <Badge variant="secondary">Step {activeTab === 'basic' ? '1' : '2'} of 2</Badge>
          </CardTitle>
          <CardDescription>
            Update your product information and images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="images">Images & Media</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={handleCategoryChange}>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          required
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity *</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            required
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="0"
                            className="flex-1"
                          />
                          <Select 
                            value={formData.quantity_unit} 
                            onValueChange={(value) => setFormData({...formData, quantity_unit: value})}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="ton">ton</SelectItem>
                              <SelectItem value="liter">liter</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="piece">piece</SelectItem>
                              <SelectItem value="dozen">dozen</SelectItem>
                              <SelectItem value="pack">pack</SelectItem>
                              <SelectItem value="box">box</SelectItem>
                              <SelectItem value="bag">bag</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your product in detail..."
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Product Images</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Upload high-quality images of your product. The first image will be used as the primary image.
                  </p>
                  <ImageUpload
                    images={images}
                    onImagesChange={handleImageChange}
                    maxImages={5}
                    className="mt-4"
                    onDeleteImage={handleDeleteImage}
                  />
                </div>
              </TabsContent>

              <div className="flex justify-between pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/seller')}
                >
                  Cancel
                </Button>
                <div className="flex space-x-3">
                  {activeTab === 'basic' && (
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab('images')}
                      variant="outline"
                    >
                      Next: Manage Images
                    </Button>
                  )}
                  {activeTab === 'images' && (
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab('basic')}
                      variant="outline"
                    >
                      Back: Basic Info
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={loading || updateProductMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {loading || updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
                  </Button>
                </div>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
