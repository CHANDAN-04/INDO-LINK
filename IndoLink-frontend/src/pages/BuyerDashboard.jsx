import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ShoppingCart, Package, History, Search, Camera, Upload, X } from 'lucide-react';
import ProductCatalog from '../components/buyer/ProductCatalog';
import ProductDetails from '../components/buyer/ProductDetails';
import Cart from '../components/buyer/Cart';
import OrderHistory from '../components/buyer/OrderHistory';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCart } from '../contexts/CartContext';
import api from '../lib/api';
import Logo from '../components/Logo';
import { toast } from 'sonner';

export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const safeCartItems = cartItems || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [imageSearchMode, setImageSearchMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [imageSearchResults, setImageSearchResults] = useState(null); // Store image search results

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories/');
      return Array.isArray(res.data) ? res.data : res.data?.results || res.data?.categories || [];
    },
  });

  const { data: slides } = useQuery({
    queryKey: ['slider-items'],
    queryFn: async () => {
      const res = await api.get('/slider/');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const searchByImageMutation = useMutation({
    mutationFn: async (imageFile) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await api.post('/products/search-by-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Image search results:', data);
      setImageSearchResults(data); // Store the search results
      if (data.matched_categories && data.matched_categories.length > 0) {
        setCategoryFilter(data.matched_categories[0].id);
      }
      setSearchTerm(data.detected_category || '');
      if (data.total_results > 0) {
        toast.success(`Found ${data.total_results} products in ${data.detected_category}`);
      } else {
        toast.info(`No products found matching ${data.detected_category}. Try a different image.`);
      }
      setImageSearchMode(false);
      setImagePreview(null);
      setSelectedImage(null);
    },
    onError: () => {
      toast.error('Failed to search by image');
      setImageSearchMode(false);
      setImagePreview(null);
      setSelectedImage(null);
    },
  });

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCamera = async () => {
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Prefer back camera on mobile
        audio: false 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Unable to access camera. Please check permissions or try choosing an image file instead.');
      // Fallback to file picker
      cameraInputRef.current?.click();
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !stream) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setImagePreview(canvas.toDataURL('image/jpeg'));
        handleCloseCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleCloseCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleCameraFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Attach stream to video element when camera opens
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleSearchByImage = () => {
    if (selectedImage) searchByImageMutation.mutate(selectedImage);
  };

  const handleResetImageSearch = () => {
    handleCloseCamera();
    setImageSearchMode(false);
    setImagePreview(null);
    setSelectedImage(null);
    setImageSearchResults(null); // Clear search results
    setCategoryFilter('all');
    setSearchTerm('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Storefront Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for products..."
                  className="w-64 pl-9 pr-3 py-2 rounded-md border bg-background text-foreground"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setImageSearchMode(!imageSearchMode)}
                className="flex items-center gap-2"
              >
                {imageSearchMode ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                {imageSearchMode ? 'Cancel' : 'Image Search'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/buyer/cart')}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Cart ({safeCartItems.length})
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={categoryFilter === 'all' ? 'secondary' : 'outline'} onClick={() => setCategoryFilter('all')}>All</Button>
            {Array.isArray(categories) && categories.map((c) => (
              <Button key={(c._id || c.id)} size="sm" variant={categoryFilter === (c._id || c.id).toString() ? 'secondary' : 'outline'} onClick={() => setCategoryFilter((c._id || c.id).toString())}>{c.name}</Button>
            ))}
          </div>
          
          {/* Image Search UI */}
          {imageSearchMode && (
            <div className="mt-4 p-4 bg-background border rounded-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex gap-2 flex-wrap">
                  {/* Upload File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </label>
                  
                  {/* Camera Capture Input - Using both user and environment for compatibility */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result);
                          setShowCamera(false);
                        };
                        reader.onerror = () => toast.error('Failed to read captured image');
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="camera-capture"
                  />
                  <Button
                    type="button"
                    onClick={handleOpenCamera}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                </div>
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSearchByImage}
                    disabled={!selectedImage || searchByImageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {searchByImageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetImageSearch}
                    disabled={searchByImageMutation.isPending}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Slider */}
        <Card>
          <CardContent className="p-0">
            <div className="relative overflow-x-auto whitespace-nowrap rounded-md">
              {(slides || []).length > 0 ? (
                (slides || []).map((s) => (
                  <a key={s._id || s.id} href={s.linkUrl || '#'} className="inline-block align-top w-full">
                    <img src={s.imageUrl} alt={s.title || 'slide'} className="w-full h-56 md:h-72 lg:h-80 object-cover" />
                  </a>
                ))
              ) : (
                <div className="w-full h-56 md:h-72 lg:h-80 bg-muted flex items-center justify-center text-muted-foreground">Hero slider</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Body Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8 mb-6">
          <Button onClick={() => navigate('/buyer')} variant={location.pathname === '/buyer' || location.pathname === '/buyer/' ? 'default' : 'outline'} className="w-full justify-start">
            <Package className="h-4 w-4 mr-2" />
            Products
          </Button>
          <Button onClick={() => navigate('/buyer/cart')} variant={location.pathname === '/buyer/cart' ? 'default' : 'outline'} className="w-full justify-start">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({safeCartItems.length})
          </Button>
          <Button onClick={() => navigate('/buyer/orders')} variant={location.pathname === '/buyer/orders' ? 'default' : 'outline'} className="w-full justify-start">
            <History className="h-4 w-4 mr-2" />
            Orders
          </Button>
        </div>

        {/* Content Area with Routes */}
        <div>
          <Routes>
            <Route index element={<ProductCatalog 
              hideFilters 
              searchTerm={searchTerm} 
              categoryFilter={categoryFilter}
              imageSearchProducts={imageSearchResults?.products || null}
            />} />
            <Route path="products" element={<ProductCatalog 
              hideFilters 
              searchTerm={searchTerm} 
              categoryFilter={categoryFilter}
              imageSearchProducts={imageSearchResults?.products || null}
            />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="cart" element={<Cart />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="*" element={
              <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Page not found</p>
                <Button onClick={() => navigate('/buyer')}>Back to Products</Button>
              </div>
            } />
          </Routes>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Take a Photo</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseCamera}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full"
                style={{ maxHeight: '70vh' }}
              />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={handleCloseCamera} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleCapturePhoto} className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Capture Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}