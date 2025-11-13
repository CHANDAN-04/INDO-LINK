import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ShoppingCart, Search, Filter, Package } from 'lucide-react';
import ProductCard from '../ProductCard';
import { useCart } from '../../contexts/CartContext';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function ProductCatalog({ initialSearch = '', initialCategory = 'all', searchTerm: searchProp, categoryFilter: categoryProp, hideFilters = false, imageSearchProducts = null }) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const queryClient = useQueryClient();
  const { addToCart } = useCart();

  const { data: allProducts, isLoading, error } = useQuery({
    queryKey: ['buyer-products'],
    queryFn: async () => {
      const response = await api.get('/products/buyer-products/');
      return response.data.results || response.data;
    },
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  // Use image search products if available, otherwise use all products
  const products = imageSearchProducts !== null ? imageSearchProducts : allProducts;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/products/categories/');
      return response.data;
    },
    select: (data) => {
      // Ensure we always return an array
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.results)) return data.results;
      if (data && Array.isArray(data.categories)) return data.categories;
      return [];
    },
  });

  const handleAddToCart = (product) => {
    // Persist to backend cart for authenticated buyers
    api.post('/orders/cart/', { 
      product_id: product.id, 
      quantity: 1,
      product_type: 'admin' // Since buyers only see admin products
    })
      .then(() => {
        addToCart(product);
        toast.success('Product added to cart!');
        queryClient.invalidateQueries(['cart']);
      })
      .catch(() => {
        // Fallback to client-only cart
        addToCart(product);
        toast.success('Product added to cart!');
      });
  };

  const effectiveSearch = typeof searchProp === 'string' ? searchProp : searchTerm;
  const effectiveCategory = typeof categoryProp === 'string' ? categoryProp : categoryFilter;

  // If image search products are provided, use them directly (already filtered by backend)
  // Otherwise, apply client-side filtering
  const filteredProducts = imageSearchProducts !== null 
    ? (products || []) // Use image search results as-is
    : (products?.filter(product => {
        const matchesSearch = effectiveSearch === '' || product.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                             product.description.toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesCategory = !effectiveCategory || effectiveCategory === 'all' || product.category === effectiveCategory || product.category === effectiveCategory?.toString();
        return matchesSearch && matchesCategory;
      }) || []);

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

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Package className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error loading products</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {hideFilters ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>
              Browse and purchase quality products from verified traders
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.isArray(categories) && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              userRole="buyer"
              onAddToCart={() => handleAddToCart(product)}
              data-testid={`product-card-${product.id}`}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
