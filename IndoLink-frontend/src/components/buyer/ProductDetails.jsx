import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Share2, 
  Package, 
  Truck, 
  Shield, 
  Star,
  Plus,
  Minus,
  Clock,
  MapPin
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      const response = await api.get(`/products/buyer-products/`);
      const products = response.data.results || response.data;
      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    },
  });

  const handleAddToCart = () => {
    if (!product) return;

    // Add to backend cart
    api.post('/orders/cart/', { 
      product_id: product.id, 
      quantity: quantity,
      product_type: 'admin' // Since buyers only see admin products
    })
      .then(() => {
        addToCart({ ...product, quantity });
        toast.success(`${quantity} item(s) added to cart!`);
        queryClient.invalidateQueries(['cart']);
      })
      .catch(() => {
        // Fallback to client-only cart
        addToCart({ ...product, quantity });
        toast.success(`${quantity} item(s) added to cart!`);
      });
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const getStockStatus = (qty) => {
    if (qty === 0) return { text: 'Out of stock', color: 'bg-red-100 text-red-800' };
    if (qty < 10) return { text: 'Limited stock', color: 'bg-orange-100 text-orange-800' };
    return { text: 'In stock', color: 'bg-green-100 text-green-800' };
  };

  const toAbsolute = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleShare = async () => {
    const productUrl = `${window.location.origin}/buyer/product/${product.id}`;
    const shareText = `Check out this amazing product: ${product.name} - ₹${parseFloat(product.price).toFixed(2)}`;
    
    try {
      // Try to use the Web Share API if available (mobile devices)
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: productUrl,
        });
        toast.success('Product shared successfully!');
      } else {
        // Fallback: Copy URL to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${productUrl}`);
        toast.success('Product link copied to clipboard!');
      }
    } catch (error) {
      // Final fallback: Copy just the URL
      try {
        await navigator.clipboard.writeText(productUrl);
        toast.success('Product link copied to clipboard!');
      } catch (clipboardError) {
        toast.error('Unable to share. Please copy the URL manually.');
      }
    }
  };

  const handleImageSelect = (index) => {
    setSelectedImageIndex(index);
    setImageLoading(true);
    setImageError(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Product not found</h3>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/buyer')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.quantity);
  const images = product.images && product.images.length > 0 ? product.images : [product.primary_image || product.image];
  const currentImage = `http://localhost:4000${product.image}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/buyer')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-square overflow-hidden rounded-lg relative group">
                {imageLoading && !imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                <img
                  src={toAbsolute(currentImage) || '/api/placeholder/600/600'}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/api/placeholder/600/600';
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  onLoad={() => {
                    setImageError(false);
                    setImageLoading(false);
                  }}
                />
                {imageError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                    selectedImageIndex === index ? 'border-primary shadow-md' : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <img
                    src={toAbsolute(image) || '/api/placeholder/80/80'}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/api/placeholder/80/80';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleShare}
                  title="Share this product"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <Badge className={stockStatus.color}>
                {stockStatus.text}
              </Badge>
              {product.is_admin_product && (
                <Badge className="bg-purple-100 text-purple-800">
                  Curated by Admin
                </Badge>
              )}
              {product.category_name && (
                <Badge variant="outline">
                  {product.category_name}
                </Badge>
              )}
            </div>
          </div>

          {/* Price */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      ₹{parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/unit</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">{product.quantity} {product.quantity_unit || 'units'} available</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quantity Selector */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-lg min-w-[3ch] text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-right">
                <span className="text-sm text-muted-foreground">Total: </span>
                <span className="text-xl font-bold">₹{(parseFloat(product.price) * quantity).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Add to Cart Button */}
          <Button
            className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add {quantity} to Cart
          </Button>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {product.seller_name && (
                  <div>
                    <span className="text-sm text-muted-foreground">Original Seller</span>
                    <p className="font-medium">{product.seller_name}</p>
                  </div>
                )}
                {product.admin_name && (
                  <div>
                    <span className="text-sm text-muted-foreground">Sold by</span>
                    <p className="font-medium">{product.admin_name}</p>
                  </div>
                )}
                {product.purchase_date && (
                  <div>
                    <span className="text-sm text-muted-foreground">Added on</span>
                    <p className="font-medium">{new Date(product.purchase_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Returns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery & Returns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Standard delivery in 3-5 business days</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">7-day return policy</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Free delivery on orders above ₹500</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
