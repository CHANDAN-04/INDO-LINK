import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ShoppingCart, Eye, Edit, Trash2, Search, Filter, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminBuyers() {
  const queryClient = useQueryClient();
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingBuyer, setViewingBuyer] = useState(null);
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
  });

  const { data: buyersData, isLoading } = useQuery({
    queryKey: ['admin-buyers'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/buyers');
        return response.data;
      } catch (error) {
        console.error('Error fetching buyers:', error);
        return { buyers: [] };
      }
    },
  });

  const updateBuyerMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-buyers']);
      setIsEditModalOpen(false);
      toast.success('Buyer updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update buyer');
    },
  });

  const deleteBuyerMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-buyers']);
      toast.success('Buyer deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete buyer');
    },
  });

  const handleEdit = (buyer) => {
    setSelectedBuyer(buyer);
    setEditData({
      first_name: buyer.first_name || '',
      last_name: buyer.last_name || '',
      email: buyer.email || '',
      phone_number: buyer.phone_number || '',
      address: buyer.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedBuyer) return;
    updateBuyerMutation.mutate({
      id: selectedBuyer._id,
      data: editData,
    });
  };

  const handleDelete = (buyer) => {
    if (window.confirm(`Are you sure you want to delete "${buyer.username}"?`)) {
      deleteBuyerMutation.mutate(buyer._id);
    }
  };

  const handleView = (buyer) => {
    setViewingBuyer(buyer);
    setIsViewOpen(true);
  };

  const filteredBuyers = buyersData?.buyers?.filter(buyer => {
    const matchesSearch = buyer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading buyers...</p>
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
                <ShoppingCart className="h-5 w-5" />
                Buyers
              </CardTitle>
              <CardDescription>
                Manage and view all buyers on the platform
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
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
                placeholder="Search buyers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Buyers Display */}
          {filteredBuyers.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuyers.map((buyer) => (
                  <Card key={buyer._id} className="group hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-foreground">
                            {buyer.first_name} {buyer.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">@{buyer.username}</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{buyer.email}</span>
                        </div>
                        {buyer.phone_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{buyer.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {buyer.order_count || 0} orders
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleView(buyer)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(buyer)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(buyer)}
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
                    <TableHead>Buyer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuyers.map((buyer) => (
                    <TableRow key={buyer._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{buyer.first_name} {buyer.last_name}</div>
                          <div className="text-sm text-muted-foreground">@{buyer.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>{buyer.email}</TableCell>
                      <TableCell>{buyer.phone_number || 'N/A'}</TableCell>
                      <TableCell>{buyer.order_count || 0}</TableCell>
                      <TableCell>
                        {buyer.created_at ? new Date(buyer.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(buyer)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(buyer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(buyer)}
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
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No buyers found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'No buyers are currently registered'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Buyer Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingBuyer?.first_name} {viewingBuyer?.last_name}</DialogTitle>
            <DialogDescription>Buyer profile details</DialogDescription>
          </DialogHeader>
          {viewingBuyer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{viewingBuyer.first_name} {viewingBuyer.last_name}</h3>
                  <p className="text-muted-foreground">@{viewingBuyer.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground font-medium">{viewingBuyer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="text-foreground font-medium">{viewingBuyer.phone_number || 'N/A'}</p>
                </div>
              </div>
              {viewingBuyer.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="text-foreground">{viewingBuyer.address}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-foreground font-semibold">{viewingBuyer.order_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Joined Date</p>
                <p className="text-foreground">
                  {viewingBuyer.created_at ? new Date(viewingBuyer.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingBuyer); }}>Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Buyer Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Buyer
            </DialogTitle>
            <DialogDescription>
              Update buyer information
            </DialogDescription>
          </DialogHeader>

          {selectedBuyer && (
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
                <Button onClick={handleUpdate} disabled={updateBuyerMutation.isLoading}>
                  {updateBuyerMutation.isLoading ? 'Updating...' : 'Update Buyer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

