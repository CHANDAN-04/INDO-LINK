import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, TrendingUp, TrendingDown, ShoppingCart, Package as PackageIcon, Clock, MapPin, RefreshCw } from 'lucide-react';

const ProductCard = ({
  product,
  userRole,
  aiInsight,
  onAddToCart,
  onPurchaseAndRelist,
  onEdit,
  onDelete,
  onRelist,
  'data-testid': testId,
}) => {

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of stock', color: 'bg-red-100 text-red-800' };
    if (quantity < 10) return { text: 'Limited stock', color: 'bg-orange-100 text-orange-800' };
    return { text: 'In stock', color: 'bg-green-100 text-green-800' };
  };

  const getTrendBadge = (insight) => {
    if (!insight) return null;
    
    const trendColor = {
      up: 'bg-green-100 text-green-800',
      down: 'bg-red-100 text-red-800',
      stable: 'bg-blue-100 text-blue-800'
    }[insight.trendDirection];

    const TrendIcon = insight.trendDirection === 'up' ? TrendingUp : TrendingDown;
    
    return (
      <Badge className={`${trendColor} text-xs`}>
        <TrendIcon className="w-3 h-3 mr-1" />
        {insight.trendDirection === 'up' && `+${Math.round(insight.confidence * 100)}% trend`}
        {insight.trendDirection === 'down' && `${Math.round(insight.confidence * 100)}% trend`}
        {insight.trendDirection === 'stable' && 'Stable'}
      </Badge>
    );
  };

  const stockStatus = getStockStatus(product.quantity);
  const price = parseFloat(product.price);
  const suggestedPrice = aiInsight?.recommendedPrice || price * 1.15;

  const toAbsolute = (url) => {
    if (!url) return url;
    // Fix accidental alias-style paths
    if (url.startsWith('@uploads/')) url = `/${url.slice(1)}`; // -> /uploads/...
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg" data-testid={testId}>
      <div className="relative overflow-hidden">
        <img
          src={toAbsolute(product.image) || '/api/placeholder/400/200'}
          alt={product.name}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = '/api/placeholder/400/200';
          }}
        />
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {userRole === 'admin' && getTrendBadge(aiInsight) && (
            <div>
              {getTrendBadge(aiInsight)}
            </div>
          )}
          {stockStatus.text === 'Out of stock' && (
            <Badge className="bg-red-500 text-white">
              <PackageIcon className="w-3 h-3 mr-1" />
              Sold Out
            </Badge>
          )}
          {stockStatus.text === 'Limited stock' && (
            <Badge className="bg-orange-500 text-white">
              <Clock className="w-3 h-3 mr-1" />
              Limited
            </Badge>
          )}
        </div>

        {/* Action buttons overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm"
            data-testid={`button-view-details-${product.id}`}
            asChild
          >
            <Link to={`/buyer/product/${product.id}`}>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <CardContent className="p-6">
        {/* Header with badges */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-bold text-lg text-foreground mb-1" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              {userRole === 'buyer' && product.is_relisted && (
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  Curated
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Seller info for admin */}
        {userRole === 'admin' && !product.is_relisted && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-lg">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              by {product.seller_id} (Seller)
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
          {product.description}
        </p>

        {/* Price and stock info */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-2xl font-bold text-foreground" data-testid={`text-product-price-${product.id}`}>
                ₹{price.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground ml-1">/unit</span>
            </div>

            {userRole === 'admin' && aiInsight && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">AI Suggested</p>
                <p className={`text-lg font-semibold ${
                  suggestedPrice > price ? 'text-green-600' : 'text-orange-600'
                }`} data-testid={`text-suggested-price-${product.id}`}>
                  ₹{suggestedPrice.toFixed(2)}
                </p>
              </div>
            )}

          </div>

          {/* Stock info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PackageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {product.quantity} {product.quantity_unit || 'units'} available
              </span>
            </div>
            <Badge className={`${stockStatus.color} text-xs`}>
              {stockStatus.text}
            </Badge>
          </div>
        </div>

        {/* Action buttons based on user role */}
        {userRole === 'seller' && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 h-10"
                onClick={onEdit}
                data-testid={`button-edit-${product.id}`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10"
                onClick={onRelist}
                data-testid={`button-relist-${product.id}`}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Relist
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-10"
              onClick={onDelete}
              data-testid={`button-delete-${product.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}

        {userRole === 'admin' && !product.is_relisted && (
          <Button
            className="w-full h-10 bg-primary hover:bg-primary/90"
            onClick={onPurchaseAndRelist}
            disabled={product.quantity === 0}
            data-testid={`button-purchase-relist-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Purchase & Relist
          </Button>
        )}

        {userRole === 'buyer' && (
          <div className="flex space-x-2">
            <Button
              className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onAddToCart}
              disabled={product.quantity === 0}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4"
              data-testid={`button-view-details-${product.id}`}
              asChild
            >
              <Link to={`/buyer/product/${product.id}`}>
                <Eye className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
