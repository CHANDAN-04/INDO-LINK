import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Edit, Upload, X } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminSlider() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', product: '', order: 0, active: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin-slider'],
    queryFn: async () => {
      const res = await api.get('/slider/admin');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  // Fetch admin products for product selection
  const { data: adminProducts } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin-products');
        return response.data?.adminProducts || [];
      } catch (error) {
        console.error('Error fetching admin products:', error);
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ payload, imageFile }) => {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (payload.imageUrl) {
        formData.append('imageUrl', payload.imageUrl);
      }
      
      const res = await api.post('/slider/admin', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Slide created');
      queryClient.invalidateQueries(['admin-slider']);
      setIsOpen(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create slide'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload, imageFile }) => {
      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (payload.imageUrl) {
        formData.append('imageUrl', payload.imageUrl);
      }
      
      const res = await api.put(`/slider/admin/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Slide updated');
      queryClient.invalidateQueries(['admin-slider']);
      setIsOpen(false);
      setEditing(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update slide'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/slider/admin/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Slide deleted');
      queryClient.invalidateQueries(['admin-slider']);
    },
    onError: () => toast.error('Failed to delete slide'),
  });

  const resetForm = () => {
    setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', product: '', order: 0, active: true });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openNew = () => {
    setEditing(null);
    resetForm();
    setIsOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      subtitle: item.subtitle || '',
      imageUrl: item.imageUrl || '',
      linkUrl: item.linkUrl || '',
      product: item.product?._id || item.product || '',
      order: item.order || 0,
      active: !!item.active,
    });
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
    setIsOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Clear imageUrl when file is selected
      setForm(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProductChange = (productId) => {
    setForm(prev => ({ 
      ...prev, 
      product: productId,
      linkUrl: productId ? '' : prev.linkUrl // Clear linkUrl if product is selected
    }));
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!imageFile && !form.imageUrl && !imagePreview) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    const payload = { 
      ...form, 
      order: Number(form.order) || 0,
      // Don't send imageUrl if we have an image file
      imageUrl: imageFile ? undefined : form.imageUrl
    };
    
    if (editing) {
      updateMutation.mutate({ 
        id: editing._id || editing.id, 
        payload,
        imageFile: imageFile || undefined
      });
    } else {
      createMutation.mutate({ 
        payload,
        imageFile: imageFile || undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Homepage Slider</CardTitle>
            <CardDescription>Manage slides shown on the buyer landing page</CardDescription>
          </div>
          <Button onClick={openNew} className="flex items-center gap-2"><Plus className="h-4 w-4" />Add Slide</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items || []).map((it) => (
                  <TableRow key={it._id || it.id}>
                    <TableCell>
                      <img src={it.imageUrl} alt={it.title} className="h-12 w-24 object-cover rounded" />
                    </TableCell>
                    <TableCell>{it.title}</TableCell>
                    <TableCell>
                      {it.product ? (
                        <span className="text-sm font-medium">{it.product.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate max-w-[200px] text-muted-foreground">
                      {it.linkUrl || (it.product ? `/buyer/product/${it.product._id}` : '-')}
                    </TableCell>
                    <TableCell>{it.order}</TableCell>
                    <TableCell>{it.active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(it)}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(it._id || it.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editing ? 'Edit Slide' : 'Add Slide'}</DialogTitle>
            <DialogDescription>Slides appear on the buyer homepage hero.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter slide title" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Enter subtitle (optional)" />
            </div>
            
            <div>
              <Label>Image *</Label>
              <div className="space-y-2">
                {imagePreview && (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Or provide an image URL</p>
                <Input 
                  value={form.imageUrl} 
                  onChange={(e) => {
                    setForm({ ...form, imageUrl: e.target.value });
                    if (e.target.value) {
                      setImageFile(null);
                      setImagePreview(e.target.value);
                    }
                  }} 
                  placeholder="https://..." 
                  disabled={!!imageFile}
                />
              </div>
            </div>

            <div>
              <Label>Link to Product</Label>
              <Select value={form.product} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {adminProducts?.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Selecting a product will automatically set the link URL</p>
            </div>

            <div>
              <Label>Link URL</Label>
              <Input 
                value={form.linkUrl} 
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} 
                placeholder="/buyer?category=..." 
                disabled={!!form.product}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.product ? 'Link URL is automatically set when a product is selected' : 'Custom URL (optional)'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <span className="text-sm">Active</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t mt-6 flex-shrink-0 bg-background sticky bottom-0">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editing ? 'Update' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


