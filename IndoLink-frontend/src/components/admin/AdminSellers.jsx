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
import { Users, Eye, Edit, Trash2, Package, Search, Filter, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminSellers() {
  const queryClient = useQueryClient();
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingSeller, setViewingSeller] = useState(null);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
  });

  const { data: sellersData, isLoading } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/sellers');
        return response.data;
      } catch (error) {
        console.error('Error fetching sellers:', error);
        return { sellers: [] };
      }
    },
  });

  const updateSellerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sellers']);
      setIsEditModalOpen(false);
      toast.success('Seller updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update seller');
    },
  });

  const deleteSellerMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-sellers']);
      toast.success('Seller deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete seller');
    },
  });

  const handleEdit = (seller) => {
    setSelectedSeller(seller);
    setEditData({
      first_name: seller.first_name || '',
      last_name: seller.last_name || '',
      email: seller.email || '',
      phone_number: seller.phone_number || '',
      address: seller.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSeller) return;
    updateSellerMutation.mutate({
      id: selectedSeller._id,
      data: editData,
    });
  };

  const handleDelete = (seller) => {
    if (window.confirm(`Are you sure you want to delete "${seller.username}"?`)) {
      deleteSellerMutation.mutate(seller._id);
    }
  };

  const handleView = (seller) => {
    setViewingSeller(seller);
    setIsViewOpen(true);
  };

  const filteredSellers = sellersData?.sellers?.filter(seller => {
    const matchesSearch = seller.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sellers...</p>
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Producers (Sellers)
              </CardTitle>
              <CardDescription>
                Manage and view all sellers/producers on the platform
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Users className="h-4 w-4 mr-2" />
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
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sellers Display */}
          {filteredSellers.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSellers.map((seller) => (
                  <Card key={seller._id} className="group hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-foreground">
                            {seller.first_name} {seller.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">@{seller.username}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{seller.email}</span>
                        </div>
                        {seller.phone_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{seller.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {seller.product_count || 0} products ({seller.active_product_count || 0} active)
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleView(seller)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(seller)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(seller)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
                    <TableHead>Seller</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Active Products</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.map((seller) => (
                    <TableRow key={seller._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{seller.first_name} {seller.last_name}</div>
                          <div className="text-sm text-muted-foreground">@{seller.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{seller.email}</TableCell>
                      <TableCell>{seller.phone_number || 'N/A'}</TableCell>
                      <TableCell>{seller.product_count || 0}</TableCell>
                      <TableCell>{seller.active_product_count || 0}</TableCell>
                      <TableCell>
                        {seller.created_at ? new Date(seller.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(seller)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(seller)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(seller)}
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
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No sellers found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'No sellers are currently registered'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Seller Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingSeller?.first_name} {viewingSeller?.last_name}</DialogTitle>
            <DialogDescription>Seller profile details</DialogDescription>
          </DialogHeader>
          {viewingSeller && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewingSeller.first_name} {viewingSeller.last_name}</h3>
                  <p className="text-muted-foreground">@{viewingSeller.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-medium">{viewingSeller.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="text-foreground font-medium">{viewingSeller.phone_number || 'N/A'}</p>
                </div>
              </div>
              {viewingSeller.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="text-foreground">{viewingSeller.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                  <p className="text-foreground font-semibold">{viewingSeller.product_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Products</p>
                  <p className="text-foreground font-semibold">{viewingSeller.active_product_count || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Joined Date</p>
                <p className="text-foreground">
                  {viewingSeller.created_at ? new Date(viewingSeller.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingSeller); }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Seller Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Seller
            </DialogTitle>
            <DialogDescription>
              Update seller information
            </DialogDescription>
          </DialogHeader>

          {selectedSeller && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editData.first_name}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editData.last_name}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editData.phone_number}
                  onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updateSellerMutation.isLoading}>
                  {updateSellerMutation.isLoading ? 'Updating...' : 'Update Seller'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

