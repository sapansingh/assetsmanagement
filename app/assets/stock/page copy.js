'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Download,
  Filter, 
  X, 
  Edit2, 
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
  ClipboardList
} from 'lucide-react';

// API service functions
const api = {
  // Fetch stock entries with pagination and filters
  async getStockEntries(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      category: params.category === 'all' ? '' : params.category || '',
      warehouse: params.warehouse === 'all' ? '' : params.warehouse || ''
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
  }
};

export default function StockPage() {
  // State management
  const [stockEntries, setStockEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  
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
  
  const [billFile, setBillFile] = useState(null);
  const [billFileName, setBillFileName] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    const categories = stockEntries.map(entry => entry.category).filter(Boolean);
    return ['all', ...new Set(categories)];
  }, [stockEntries]);

  const uniqueWarehouses = useMemo(() => {
    const warehouses = stockEntries.map(entry => entry.warehouse).filter(Boolean);
    return ['all', ...new Set(warehouses)];
  }, [stockEntries]);

  // Fetch stock entries
  const fetchStockEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getStockEntries({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        category: filterCategory,
        warehouse: filterWarehouse
      });
      
      if (response.success) {
        setStockEntries(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 10,
          total: response.data?.length || 0,
          totalPages: 1
        });
      } else {
        setStockEntries([]);
      }
    } catch (error) {
      console.error('Error fetching stock entries:', error);
      toast.error(error.message || 'Failed to load stock entries');
      setStockEntries([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filterCategory, filterWarehouse]);

  // Initial fetch
  useEffect(() => {
    fetchStockEntries();
  }, [fetchStockEntries]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    if (!stockEntries || stockEntries.length === 0) return [];

    let filtered = [...stockEntries];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        return (
          (entry.product_name?.toLowerCase() || '').includes(searchLower) ||
          (entry.category?.toLowerCase() || '').includes(searchLower) ||
          (entry.supplier?.toLowerCase() || '').includes(searchLower) ||
          (entry.batch_number?.toLowerCase() || '').includes(searchLower) ||
          (entry.description?.toLowerCase() || '').includes(searchLower)
        );
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

    return filtered;
  }, [stockEntries, searchTerm, filterCategory, filterWarehouse]);

  // Handle search with debounce
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setFilterWarehouse('all');
    setShowAdvancedFilters(false);
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

  // Delete handlers
  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (entryToDelete) {
      try {
        setLoading(true);
        const response = await api.deleteStockEntry(entryToDelete.id);
        if (response.success) {
          setStockEntries(stockEntries.filter(e => e.id !== entryToDelete.id));
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
        fetchStockEntries();
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

  // Export functionality
  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/stock/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_entries_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export started successfully');
      } else {
        throw new Error('Failed to export');
      }
    } catch (error) {
      toast.error('Export failed. Please try again.');
    }
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

  // Render loading state
  if (loading && stockEntries.length === 0) {
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
                onClick={exportToExcel}
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
                    disabled={loading}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Categories</option>
                    {uniqueCategories.filter(c => c !== 'all').map((category) => (
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
                    disabled={loading}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Warehouses</option>
                    {uniqueWarehouses.filter(w => w !== 'all').map((warehouse) => (
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
          {loading && stockEntries.length === 0 ? (
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
                            {stockEntries.length === 0 
                              ? 'No stock entries found. Add your first stock entry.' 
                              : 'No entries match your current filters.'}
                          </p>
                          {stockEntries.length > 0 && (
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
              
              {/* Results Count */}
              {filteredEntries.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredEntries.length} of {stockEntries.length} entries
                    {(searchTerm || filterCategory !== 'all' || filterWarehouse !== 'all') && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                        (filtered from {stockEntries.length} total)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Stock Value: ₹
                      {filteredEntries.reduce((sum, entry) => 
                        sum + (entry.quantity * entry.purchase_price), 0
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Stock Entry Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Stock Entry Details</h2>
                  <p className="text-sm text-white/80">View complete stock information</p>
                </div>
              </div>
              <button
                onClick={() => setViewingEntry(null)}
                className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              <div className="space-y-6">
                {/* Product Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingEntry.product_name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{viewingEntry.category}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Entry Date</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {new Date(viewingEntry.entry_date).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Supplier</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{viewingEntry.supplier}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Batch Number</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {viewingEntry.batch_number || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Warehouse</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{viewingEntry.warehouse}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Quantity</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {viewingEntry.quantity} {viewingEntry.unit}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Purchase Price</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ₹{parseFloat(viewingEntry.purchase_price).toFixed(2)} per {viewingEntry.unit}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Selling Price</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ₹{parseFloat(viewingEntry.selling_price).toFixed(2)} per {viewingEntry.unit}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Value</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ₹{(viewingEntry.quantity * viewingEntry.purchase_price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expiry Date */}
                {viewingEntry.expiry_date && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">Expiry Date</p>
                        <p className="text-amber-700 dark:text-amber-400">
                          {new Date(viewingEntry.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {viewingEntry.description && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Description
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewingEntry.description}</p>
                    </div>
                  </div>
                )}

                {/* Bill Information */}
                {viewingEntry.bill_filename && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Bill / Invoice
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {viewingEntry.bill_filename}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              PDF • {viewingEntry.bill_filesize ? `${Math.round(viewingEntry.bill_filesize / 1024)} KB` : ''}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/stock/${viewingEntry.id}/bill`}
                          download={viewingEntry.bill_filename}
                          className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Current Stock</p>
                      <p className={`text-xl font-bold ${
                        viewingEntry.current_stock > 0 
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {viewingEntry.current_stock || 0} {viewingEntry.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Rack Location</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {viewingEntry.rack_number || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prepared By */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Prepared By</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{viewingEntry.prepared_by}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Approved By</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{viewingEntry.approved_by}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewingEntry(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Close
              </button>
              {viewingEntry.bill_filename && (
                <a
                  href={`/api/stock/${viewingEntry.id}/bill`}
                  download={viewingEntry.bill_filename}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Bill
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 animate-pulse"></div>
              <h2 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Plus className="w-5 h-5" />
                </div>
                New Stock Entry
              </h2>
              <button
                onClick={closeModal}
                className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                        value={formData.entry_date}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.product_name}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.supplier}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter supplier name"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity & Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.unit}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.batch_number}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.purchase_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.selling_price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          formData.quantity && formData.purchase_price 
                            ? (parseFloat(formData.quantity) * parseFloat(formData.purchase_price)).toFixed(2)
                            : '0.00'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storage & Additional Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Warehouse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
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
                        value={formData.warehouse}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.rack_number}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        value={formData.expiry_date}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Description */}
                    <div className="group col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-emerald-400 dark:hover:border-emerald-500 placeholder-slate-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Any additional notes about this stock entry"
                      />
                    </div>
                  </div>
                </div>

                {/* Bill Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Bill / Invoice Upload</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">(Optional)</span>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Bill (PDF only)
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleBillUpload}
                        className="hidden"
                        id="bill-upload"
                        disabled={submitting}
                      />
                      <label
                        htmlFor="bill-upload"
                        className={`flex items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 group ${
                          submitting 
                            ? 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50' 
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <Paperclip className={`w-5 h-5 transition-colors ${
                          submitting 
                            ? 'text-slate-400' 
                            : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        }`} />
                        <span className={`text-sm transition-colors ${
                          submitting
                            ? 'text-slate-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        }`}>
                          {billFileName || 'Click to upload bill/invoice (PDF)'}
                        </span>
                      </label>
                    </div>
                    {billFileName && (
                      <div className="mt-2 flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium truncate">{billFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeBill}
                          disabled={submitting}
                          className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-xl font-medium hover:scale-105 active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Stock Entry
                      </>
                    )}
                  </span>
                  {!submitting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-rose-600/20 to-pink-600/20 animate-pulse"></div>
              <h2 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5" />
                </div>
                Confirm Delete
              </h2>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Are you sure you want to delete this stock entry?
                  </h3>
                  {entryToDelete && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {entryToDelete.product_name}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Quantity: {entryToDelete.quantity} {entryToDelete.unit}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Value: ₹{(entryToDelete.quantity * entryToDelete.purchase_price).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          ID: {entryToDelete.id} • Entry Date: {new Date(entryToDelete.entry_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                    This action cannot be undone. All associated bill files will also be deleted.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 font-medium hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:via-rose-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-xl font-medium hover:scale-105 active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {loading ? 'Deleting...' : 'Delete Entry'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}