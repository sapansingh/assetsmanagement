'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Download,
  Filter, 
  X, 
  Trash2, 
  Package, 
  Calendar,
  User,
  Search,
  Upload,
  FileText,
  Paperclip,
  AlertCircle,
  CheckCircle,
  Box,
  Warehouse,
  Tag,
  DollarSign,
  Hash,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Scale,
  Archive,
  ClipboardList,
  Edit,
  Save
} from 'lucide-react';

// API service functions
const api = {
  // Fetch ALL stock entries (no filters applied)
  async getStockEntries(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: 1000, // Fetch more entries for client-side filtering
      ...(params.search && { search: params.search }) // Keep search for initial large datasets
    }).toString();

    const response = await fetch(`/api/stock?${queryParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch stock entries');
    }
    return response.json();
  },

  // Create stock entry
  async createStockEntry(formData) {
    console.log('Sending FormData to create stock entry');
    
    const response = await fetch('/api/stock', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create stock entry');
    }
    return response.json();
  },

  // Delete stock entry
  async deleteStockEntry(id) {
    const response = await fetch(`/api/stock/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete stock entry');
    }
    return response.json();
  },

  // Update stock entry
  async updateStockEntry(id, formData) {
    console.log(`Sending FormData to update stock entry ${id}`);
    
    const response = await fetch(`/api/stock/${id}`, {
      method: 'PUT',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update stock entry');
    }
    return response.json();
  },

  // Get single stock entry
  async getStockEntry(id) {
    const response = await fetch(`/api/stock/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch stock entry');
    }
    return response.json();
  }
};

export default function StockPage() {
  // State management
  const [allStockEntries, setAllStockEntries] = useState([]); // Store ALL entries
  const [filteredEntries, setFilteredEntries] = useState([]); // Store filtered entries for display
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    product_name: '',
    category: '',
    supplier: '',
    quantity: '',
    unit: '',
    purchase_price: '',
    selling_price: '',
    expiry_date: '',
    batch_number: '',
    warehouse: '',
    rack_number: '',
    description: '',
    prepared_by: 'sapan singh',
    approved_by: 'sapan singh'
  });
  
  const [editFormData, setEditFormData] = useState({
    entry_date: '',
    product_name: '',
    category: '',
    supplier: '',
    quantity: '',
    unit: '',
    purchase_price: '',
    selling_price: '',
    expiry_date: '',
    batch_number: '',
    warehouse: '',
    rack_number: '',
    description: '',
    prepared_by: 'sapan singh',
    approved_by: 'sapan singh'
  });
  
  const [billFile, setBillFile] = useState(null);
  const [billFileName, setBillFileName] = useState('');
  
  const [editBillFile, setEditBillFile] = useState(null);
  const [editBillFileName, setEditBillFileName] = useState('');
  const [existingBillFileName, setExistingBillFileName] = useState('');
  const [removeExistingBill, setRemoveExistingBill] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Get unique values for filters from ALL data
  const uniqueCategories = useMemo(() => {
    const categories = allStockEntries
      .map(entry => entry.category)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['all', ...categories];
  }, [allStockEntries]);

  const uniqueWarehouses = useMemo(() => {
    const warehouses = allStockEntries
      .map(entry => entry.warehouse)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['all', ...warehouses];
  }, [allStockEntries]);

  // Fetch ALL stock entries initially
  const fetchStockEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getStockEntries();
      
      if (response.success) {
        const allEntries = response.data || [];
        setAllStockEntries(allEntries);
        setFilteredEntries(allEntries); // Initially show all entries
        setPagination(prev => ({
          ...prev,
          total: allEntries.length,
          totalPages: Math.ceil(allEntries.length / prev.limit)
        }));
      } else {
        setAllStockEntries([]);
        setFilteredEntries([]);
      }
    } catch (error) {
      console.error('Error fetching stock entries:', error);
      toast.error(error.message || 'Failed to load stock entries');
      setAllStockEntries([]);
      setFilteredEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStockEntries();
  }, [fetchStockEntries]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    if (allStockEntries.length === 0) {
      setFilteredEntries([]);
      return;
    }

    let filtered = [...allStockEntries];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const searchableFields = [
          entry.product_name?.toLowerCase() || '',
          entry.category?.toLowerCase() || '',
          entry.supplier?.toLowerCase() || '',
          entry.batch_number?.toLowerCase() || '',
          entry.description?.toLowerCase() || '',
          entry.warehouse?.toLowerCase() || ''
        ];
        return searchableFields.some(field => field.includes(searchLower));
      });
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === filterCategory);
    }

    // Warehouse filter
    if (filterWarehouse !== 'all') {
      filtered = filtered.filter(entry => entry.warehouse === filterWarehouse);
    }

    // Update pagination
    setPagination(prev => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit),
      page: 1 // Reset to first page when filters change
    }));

    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedFiltered = filtered.slice(startIndex, endIndex);

    setFilteredEntries(paginatedFiltered);
  }, [allStockEntries, searchTerm, filterCategory, filterWarehouse, pagination.page, pagination.limit]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterWarehouse('all');
    setShowAdvancedFilters(false);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Modal handlers
  const openViewModal = (entry) => {
    setViewingEntry(entry);
  };

  const openModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      entry_date: today,
      product_name: '',
      category: '',
      supplier: '',
      quantity: '',
      unit: '',
      purchase_price: '',
      selling_price: '',
      expiry_date: '',
      batch_number: '',
      warehouse: '',
      rack_number: '',
      description: '',
      prepared_by: 'sapan singh',
      approved_by: 'sapan singh'
    });
    setBillFile(null);
    setBillFileName('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      entry_date: new Date().toISOString().split('T')[0],
      product_name: '',
      category: '',
      supplier: '',
      quantity: '',
      unit: '',
      purchase_price: '',
      selling_price: '',
      expiry_date: '',
      batch_number: '',
      warehouse: '',
      rack_number: '',
      description: '',
      prepared_by: 'sapan singh',
      approved_by: 'sapan singh'
    });
    setBillFile(null);
    setBillFileName('');
  };

  // Edit handlers
  const handleEditClick = async (entry) => {
    try {
      setLoading(true);
      const response = await api.getStockEntry(entry.id);
      
      if (response.success) {
        const data = response.data;
        setEditFormData({
          entry_date: data.entry_date.split('T')[0],
          product_name: data.product_name,
          category: data.category,
          supplier: data.supplier,
          quantity: data.quantity,
          unit: data.unit,
          purchase_price: data.purchase_price,
          selling_price: data.selling_price,
          expiry_date: data.expiry_date ? data.expiry_date.split('T')[0] : '',
          batch_number: data.batch_number || '',
          warehouse: data.warehouse,
          rack_number: data.rack_number || '',
          description: data.description || '',
          prepared_by: data.prepared_by || 'sapan singh',
          approved_by: data.approved_by || 'sapan singh'
        });
        setEditingEntry(entry);
        setEditBillFile(null);
        setEditBillFileName(data.bill_filename || '');
        setExistingBillFileName(data.bill_filename || '');
        setRemoveExistingBill(false);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching stock entry:', error);
      toast.error(error.message || 'Failed to load stock entry for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(editFormData).forEach(key => {
        if (editFormData[key] !== undefined && editFormData[key] !== null) {
          formDataToSend.append(key, editFormData[key]);
        }
      });
      
      // Add bill PDF if new file uploaded
      if (editBillFile) {
        formDataToSend.append('bill_pdf', editBillFile);
      }
      
      // If remove existing bill checkbox is checked
      if (removeExistingBill) {
        formDataToSend.append('clear_bill', 'true');
      }
      
      console.log(`📤 Sending Update FormData for entry ${editingEntry.id}`);
      
      const response = await api.updateStockEntry(editingEntry.id, formDataToSend);
      
      if (response.success) {
        toast.success('Stock entry updated successfully!');
        closeEditModal();
        fetchStockEntries(); // Refresh the data
      }
    } catch (error) {
      console.error('❌ Error updating stock entry:', error);
      toast.error(error.message || 'Failed to update stock entry');
    } finally {
      setSubmitting(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEntry(null);
    setEditFormData({
      entry_date: '',
      product_name: '',
      category: '',
      supplier: '',
      quantity: '',
      unit: '',
      purchase_price: '',
      selling_price: '',
      expiry_date: '',
      batch_number: '',
      warehouse: '',
      rack_number: '',
      description: '',
      prepared_by: 'sapan singh',
      approved_by: 'sapan singh'
    });
    setEditBillFile(null);
    setEditBillFileName('');
    setExistingBillFileName('');
    setRemoveExistingBill(false);
  };

  const handleEditBillUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setEditBillFileName(file.name);
      setEditBillFile(file);
    } else {
      toast.error('Please upload a PDF file');
    }
    e.target.value = '';
  };

  const removeEditBill = () => {
    setEditBillFileName('');
    setEditBillFile(null);
  };

  // Delete handlers
// Add this to your handleDeleteClick function
const handleDeleteClick = (entry) => {
  console.log('Delete button clicked for entry:', entry);
  console.log('Entry ID:', entry?.id);
  setEntryToDelete(entry);
  setDeleteModalOpen(true);
};

  const handleDeleteConfirm = async () => {
    if (entryToDelete) {
      try {
        setLoading(true);
        const response = await api.deleteStockEntry(entryToDelete.id);
        if (response.success) {
          // Remove from both all entries and filtered entries
          setAllStockEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
          setFilteredEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
          toast.success('Stock entry deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting stock entry:', error);
        toast.error(error.message || 'Failed to delete stock entry');
      } finally {
        setLoading(false);
        setDeleteModalOpen(false);
        setEntryToDelete(null);
      }
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add bill PDF
      if (billFile) {
        formDataToSend.append('bill_pdf', billFile);
      }
      
      console.log('📤 Sending Stock Entry FormData');
      
      const response = await api.createStockEntry(formDataToSend);
      
      if (response.success) {
        toast.success('Stock entry added successfully!');
        closeModal();
        fetchStockEntries(); // Refresh the data
      }
    } catch (error) {
      console.error('❌ Error adding stock entry:', error);
      toast.error(error.message || 'Failed to add stock entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBillUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setBillFileName(file.name);
      setBillFile(file);
    } else {
      toast.error('Please upload a PDF file');
    }
    e.target.value = '';
  };

  const removeBill = () => {
    setBillFileName('');
    setBillFile(null);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Categories data
  const categories = [
    'Electronics', 'Electrical', 'Mechanical', 'Tools', 'Consumables',
    'Stationery', 'Safety Equipment', 'Office Supplies', 'IT Equipment',
    'Vehicles Parts', 'Construction Materials', 'Chemicals', 'Others'
  ];

  const units = [
    'Pieces', 'Kilograms', 'Liters', 'Meters', 'Boxes',
    'Packets', 'Bottles', 'Cartons', 'Rolls', 'Sets'
  ];

  // Calculate total displayed entries for the current view
  const totalDisplayedEntries = useMemo(() => {
    let filtered = [...allStockEntries];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const searchableFields = [
          entry.product_name?.toLowerCase() || '',
          entry.category?.toLowerCase() || '',
          entry.supplier?.toLowerCase() || '',
          entry.batch_number?.toLowerCase() || '',
          entry.description?.toLowerCase() || '',
          entry.warehouse?.toLowerCase() || ''
        ];
        return searchableFields.some(field => field.includes(searchLower));
      });
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === filterCategory);
    }

    if (filterWarehouse !== 'all') {
      filtered = filtered.filter(entry => entry.warehouse === filterWarehouse);
    }

    return filtered.length;
  }, [allStockEntries, searchTerm, filterCategory, filterWarehouse]);

  // Calculate total value of displayed entries
  const totalDisplayedValue = useMemo(() => {
    let filtered = [...allStockEntries];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        const searchableFields = [
          entry.product_name?.toLowerCase() || '',
          entry.category?.toLowerCase() || '',
          entry.supplier?.toLowerCase() || '',
          entry.batch_number?.toLowerCase() || '',
          entry.description?.toLowerCase() || '',
          entry.warehouse?.toLowerCase() || ''
        ];
        return searchableFields.some(field => field.includes(searchLower));
      });
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === filterCategory);
    }

    if (filterWarehouse !== 'all') {
      filtered = filtered.filter(entry => entry.warehouse === filterWarehouse);
    }

    return filtered.reduce((sum, entry) => 
      sum + (entry.quantity * entry.purchase_price), 0
    ).toFixed(2);
  }, [allStockEntries, searchTerm, filterCategory, filterWarehouse]);

  // Render loading state
  if (loading && allStockEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading stock entries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
                Stock Management
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Track and manage all your stock entries with bills
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <button
                onClick={() => {
                  // Export functionality remains API-based
                  toast.info('Export functionality will be implemented');
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={openModal}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                New Stock Entry
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by product, category, supplier, batch..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              
              {/* Toggle Advanced Filters */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Filters {showAdvancedFilters ? <ChevronUp className="inline w-4 h-4 ml-1" /> : <ChevronDown className="inline w-4 h-4 ml-1" />}
                </span>
              </button>

              {/* Reset Filters */}
              {(searchTerm || filterCategory !== 'all' || filterWarehouse !== 'all') && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-3 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Reset</span>
                </button>
              )}
            </div>
{deleteModalOpen && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
      <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Trash2 className="w-5 h-5" />
          </div>
          Delete Stock Entry
        </h2>
        <button
          onClick={() => {
            setDeleteModalOpen(false);
            setEntryToDelete(null);
          }}
          className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Are you sure?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              This will permanently delete the stock entry
              {entryToDelete && (
                <>
                  {' '}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {entryToDelete.product_name}
                  </span>{' '}
                  with ID: {entryToDelete.id}
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          This action cannot be undone. All associated data including bill files will be permanently removed.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setDeleteModalOpen(false);
              setEntryToDelete(null);
            }}
            disabled={loading}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={loading}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete Entry
          </button>
        </div>
      </div>
    </div>
  </div>
)}


{viewingEntry && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
      <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Eye className="w-5 h-5" />
          </div>
          Stock Entry Details
        </h2>
        <button
          onClick={() => setViewingEntry(null)}
          className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Product Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Product Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{viewingEntry.product_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Category:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{viewingEntry.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Batch Number:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{viewingEntry.batch_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Description:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right">{viewingEntry.description || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Quantity & Pricing */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-green-600 dark:text-green-400" />
                Quantity & Pricing
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{viewingEntry.quantity} {viewingEntry.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Purchase Price:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">₹{parseFloat(viewingEntry.purchase_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Selling Price:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">₹{parseFloat(viewingEntry.selling_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-600">
                  <span className="text-slate-600 dark:text-slate-400">Total Value:</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">
                    ₹{(viewingEntry.quantity * viewingEntry.purchase_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Storage Info */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Storage Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Warehouse:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{viewingEntry.warehouse}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Rack Number:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{viewingEntry.rack_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Current Stock:</span>
                  <span className={`font-semibold ${viewingEntry.current_stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {viewingEntry.current_stock || 0} {viewingEntry.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier & Dates */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Supplier & Dates
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Supplier:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{viewingEntry.supplier}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Entry Date:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(viewingEntry.entry_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Expiry Date:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {viewingEntry.expiry_date ? new Date(viewingEntry.expiry_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {viewingEntry.bill_filename && (
                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-600">
                    <span className="text-slate-600 dark:text-slate-400">Bill File:</span>
                    <a
                      href={`/api/stock/${viewingEntry.id}/bill`}
                      download={viewingEntry.bill_filename}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Bill
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-end">
            <button
              onClick={() => setViewingEntry(null)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                {/* Category Filter */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    disabled={loading || allStockEntries.length === 0}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories
                      .filter(c => c !== 'all')
                      .map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Warehouse Filter */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Warehouse
                  </label>
                  <select
                    value={filterWarehouse}
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    disabled={loading || allStockEntries.length === 0}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Warehouses</option>
                    {uniqueWarehouses
                      .filter(w => w !== 'all')
                      .map((warehouse) => (
                        <option key={warehouse} value={warehouse}>
                          {warehouse}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(filterCategory !== 'all' || filterWarehouse !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
                {filterCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm">
                    Category: {filterCategory}
                    <button
                      onClick={() => setFilterCategory('all')}
                      className="ml-1 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterWarehouse !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Warehouse: {filterWarehouse}
                    <button
                      onClick={() => setFilterWarehouse('all')}
                      className="ml-1 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stock Entries Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
          {loading && allStockEntries.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400">Loading stock entries...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Product Details</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Quantity & Unit</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Price Details</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Stock Info</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Supplier & Bill</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredEntries.length > 0 ? (
                      filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                              {entry.id}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                                <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">{entry.product_name}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  <span className="inline-flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {entry.category}
                                  </span>
                                </div>
                                {entry.batch_number && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Batch: {entry.batch_number}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-slate-400" />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {entry.quantity} {entry.unit}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Scale className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600 dark:text-slate-400">Unit: {entry.unit}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Purchase: </span>
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    ₹{parseFloat(entry.purchase_price).toFixed(2)}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm">
                                  <span className="text-slate-600 dark:text-slate-400">Selling: </span>
                                  <span className="font-semibold text-slate-900 dark:text-white">
                                    ₹{parseFloat(entry.selling_price).toFixed(2)}
                                  </span>
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Total: ₹{(entry.quantity * entry.purchase_price).toFixed(2)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Warehouse className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {entry.warehouse}
                                </span>
                              </div>
                              {entry.rack_number && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Hash className="w-3 h-3 text-slate-400" />
                                  <span className="text-slate-600 dark:text-slate-400">Rack: {entry.rack_number}</span>
                                </div>
                              )}
                              <div className="mt-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  entry.current_stock > 0 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                  {entry.current_stock > 0 ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3" />
                                  )}
                                  Stock: {entry.current_stock || 0}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                                  {entry.supplier}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {new Date(entry.entry_date).toLocaleDateString()}
                                </span>
                              </div>
                              {entry.bill_filename && (
                                <div className="flex items-center gap-2 mt-2">
                                  <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[120px]">
                                    {entry.bill_filename}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {/* View Button */}
                              <button
                                onClick={() => openViewModal(entry)}
                                disabled={loading}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEditClick(entry)}
                                disabled={loading}
                                className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              {/* Download Bill Button */}
                              {entry.bill_filename && (
                                <a
                                  href={`/api/stock/${entry.id}/bill`}
                                  download={entry.bill_filename}
                                  className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                  title="Download Bill"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              )}
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteClick(entry)}
                                disabled={loading}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center">
                          <Archive className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {allStockEntries.length === 0 
                              ? 'No stock entries found. Add your first stock entry.' 
                              : 'No entries match your current filters.'}
                          </p>
                          {allStockEntries.length > 0 && (
                            <button
                              onClick={resetFilters}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Filter className="w-4 h-4" />
                              Clear All Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Results Count and Pagination */}
              {filteredEntries.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 space-y-4 md:space-y-0">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredEntries.length} of {totalDisplayedEntries} filtered entries
                    {(searchTerm || filterCategory !== 'all' || filterWarehouse !== 'all') && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                        (from {allStockEntries.length} total entries)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Filtered Value: ₹{totalDisplayedValue}
                    </div>
                    
                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1 || loading}
                          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages || loading}
                          className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Stock Entry Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-amber-600/20 to-orange-600/20 animate-pulse"></div>
              <h2 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Edit className="w-5 h-5" />
                </div>
                Edit Stock Entry
              </h2>
              <button
                onClick={closeEditModal}
                className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Product Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Entry Date */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Entry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="entry_date"
                        value={editFormData.entry_date}
                        onChange={handleEditInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Product Name */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="product_name"
                        value={editFormData.product_name}
                        onChange={handleEditInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter product name"
                      />
                    </div>

                    {/* Category */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="category"
                        value={editFormData.category}
                        onChange={handleEditInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Supplier */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="supplier"
                        value={editFormData.supplier}
                        onChange={handleEditInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter supplier name"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity & Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Scale className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Quantity & Pricing</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Quantity */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        value={editFormData.quantity}
                        onChange={handleEditInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter quantity"
                      />
                    </div>

                    {/* Unit */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="unit"
                        value={editFormData.unit}
                        onChange={handleEditInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    {/* Batch Number */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        name="batch_number"
                        value={editFormData.batch_number}
                        onChange={handleEditInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter batch number"
                      />
                    </div>

                    {/* Purchase Price */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Purchase Price (per unit) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="purchase_price"
                        value={editFormData.purchase_price}
                        onChange={handleEditInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter purchase price"
                      />
                    </div>

                    {/* Selling Price */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Selling Price (per unit) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="selling_price"
                        value={editFormData.selling_price}
                        onChange={handleEditInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter selling price"
                      />
                    </div>

                    {/* Total Price (Calculated) */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Total Value
                      </label>
                      <div className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white">
                        ₹{
                          editFormData.quantity && editFormData.purchase_price 
                            ? (parseFloat(editFormData.quantity) * parseFloat(editFormData.purchase_price)).toFixed(2)
                            : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage & Additional Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Warehouse className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Storage & Additional Info</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warehouse */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Warehouse <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="warehouse"
                        value={editFormData.warehouse}
                        onChange={handleEditInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter warehouse name"
                      />
                    </div>

                    {/* Rack Number */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Rack Number
                      </label>
                      <input
                        type="text"
                        name="rack_number"
                        value={editFormData.rack_number}
                        onChange={handleEditInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter rack number"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={editFormData.expiry_date}
                        onChange={handleEditInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Description */}
                    <div className="group col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        rows="3"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-yellow-400 dark:hover:border-yellow-500 placeholder-slate-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Any additional notes about this stock entry"
                      />
                    </div>
                  </div>
                </div>

                {/* Bill Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Bill / Invoice Upload</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">(Optional)</span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Existing Bill */}
                    {existingBillFileName && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-700 dark:text-blue-300">
                                Current Bill: {existingBillFileName}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                You can keep, replace, or remove this bill
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/stock/${editingEntry?.id}/bill`}
                              download={existingBillFileName}
                              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        </div>
                        
                        {/* Remove existing bill checkbox */}
                        <div className="mt-4 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="remove-bill"
                            checked={removeExistingBill}
                            onChange={(e) => setRemoveExistingBill(e.target.checked)}
                            disabled={submitting}
                            className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                          />
                          <label htmlFor="remove-bill" className="text-sm text-slate-700 dark:text-slate-300">
                            Remove existing bill
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload New Bill */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {existingBillFileName ? 'Replace Bill (PDF only)' : 'Upload Bill (PDF only)'}
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleEditBillUpload}
                          className="hidden"
                          id="edit-bill-upload"
                          disabled={submitting || removeExistingBill}
                        />
                        <label
                          htmlFor="edit-bill-upload"
                          className={`flex items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-yellow-400 dark:hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 group ${
                            submitting || removeExistingBill
                              ? 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50' 
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          <Paperclip className={`w-5 h-5 transition-colors ${
                            submitting || removeExistingBill
                              ? 'text-slate-400' 
                              : 'text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400'
                          }`} />
                          <span className={`text-sm transition-colors ${
                            submitting || removeExistingBill
                              ? 'text-slate-400'
                              : 'text-slate-600 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400'
                          }`}>
                            {editBillFileName || 'Click to upload bill/invoice (PDF)'}
                          </span>
                        </label>
                      </div>
                      {editBillFileName && (
                        <div className="mt-2 flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm text-yellow-700 dark:text-yellow-300 font-medium truncate">{editBillFileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeEditBill}
                            disabled={submitting}
                            className="p-1 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={submitting}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:via-amber-700 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-xl font-medium hover:scale-105 active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Stock Entry
                      </>
                    )}
                  </span>
                  {!submitting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note: The other modals (View, Delete, Add) remain exactly the same */}
      {/* Add all other modal components from your original code here */}
      {/* ... View Modal, Delete Modal, Add Modal ... */}
    </div>
  );
}