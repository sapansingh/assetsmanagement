'use client';
import Link from 'next/link';
import { useState, useMemo, useEffect, useCallback } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
// Import toast from sonner
import { toast } from 'sonner';
import { 
  Plus, 
  Download,
  Filter, 
  X, 
  Edit2, 
  Trash2, 
  Package, 
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Smartphone,
  Car,
  Search,
  Upload,
  Image as ImageIcon,
  FileText,
  Paperclip,
  Printer,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// API service functions
const api = {
  // Fetch assets with pagination and filters
  async getAssets(params = {}) {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || '',
      status: params.status === 'all' ? '' : params.status || '',
      device_status: params.device_status || ''
    }).toString();

    console.log('Fetching assets with params:', queryParams);
    
    const response = await fetch(`/api/assets?${queryParams}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch assets');
    }
    return response.json();
  },

  // Get single asset with images and documents
  async getAsset(id) {
    const response = await fetch(`/api/assets/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch asset');
    }
    return response.json();
  },

  // Create asset
  async createAsset(formData) {
    console.log('Sending FormData to create asset');
    
    // Log form data for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }
    
    const response = await fetch('/api/add', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create asset');
    }
    return response.json();
  },

  // Update asset
  async updateAsset(id, formData) {
    console.log('Updating asset:', id);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }
    
    const response = await fetch(`/api/update/${id}`, {
      method: 'PUT',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update asset');
    }
    return response.json();
  },

  // Delete asset
  async deleteAsset(id) {
    const response = await fetch(`/api/assets/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete asset');
    }
    return response.json();
  },

  // Upload files
  async uploadFiles(assetId, type, files) {
    const formData = new FormData();
    formData.append('assetId', assetId);
    formData.append('type', type);
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload files');
    }
    return response.json();
  }
};

export default function AssetsPage() {
  // State management
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDeviceStatus, setFilterDeviceStatus] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [editingAsset, setEditingAsset] = useState(null);
  
  // Add filter visibility state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [formData, setFormData] = useState({
    type_name: '',
    brand_name: '',
    model_name: '',
    status: 'In Stock',
    vehicleno: '',
    imei_no: '',
    ip_address: '',
    issued_to: '',
    received_from: '',
    issue_date: '',
    received_date: '',
    device_status: '',
    device_remark: '',
    gid: '',
    mail_date:'',
    recovery_name: '',
    recovery_status: '',
    replace_device_sn_imei:'', 
    prepared_by: 'sapan singh',
    approved_by: 'sapan singh'
  });
  
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [document, setDocument] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentName, setDocumentName] = useState('');
  const [viewingAsset, setViewingAsset] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [brand, setBrand] = useState([]);
  const [loadingBrand, setLoadingBrand] = useState(true);

  // Get unique values for filters
  const uniqueBrands = useMemo(() => {
    const brands = assets.map(asset => asset.brand_name).filter(Boolean);
    return ['all', ...new Set(brands)];
  }, [assets]);

  const uniqueDeviceStatuses = useMemo(() => {
    const statuses = assets.map(asset => asset.device_status).filter(Boolean);
    return ['all', ...new Set(statuses)];
  }, [assets]);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      imagePreviews.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [imagePreviews]);

  // Fetch types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/types');
        const json = await response.json();

        if (json.success) {
          const sorted = json.data.sort((a, b) =>
            a.type_name.localeCompare(b.type_name)
          );
          setTypes(sorted);
        }
      } catch (error) {
        console.error('Error fetching types:', error);
        toast.error(error.message || 'Failed to load types');
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  // Fetch brands
  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await fetch('/api/brands');
        const json = await response.json();

        if (json.success) {
          const sorted = json.data.sort((a, b) =>
            a.brand_name.localeCompare(b.brand_name)
          );
          setBrand(sorted);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast.error(error.message || 'Failed to load brands');
      } finally {
        setLoadingBrand(false);
      }
    };

    fetchBrand();
  }, []);

  // Fetch assets on component mount and when filters/page changes
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getAssets({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: filterStatus === 'all' ? '' : filterStatus
      });
      
      console.log('API Response:', response);
      
      if (response.success) {
        setAssets(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 10,
          total: response.data?.length || 0,
          totalPages: 1
        });
      } else {
        setAssets([]);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error(error.message || 'Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Initial fetch
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Filtered Assets (client-side filtering)
  const filteredAssets = useMemo(() => {
    if (!assets || assets.length === 0) return [];

    let filtered = [...assets];

    // Search filter (across multiple fields)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(asset => {
        return (
          (asset.type_name?.toLowerCase() || '').includes(searchLower) ||
          (asset.brand_name?.toLowerCase() || '').includes(searchLower) ||
          (asset.model_name?.toLowerCase() || '').includes(searchLower) ||
          (asset.vehicle_number?.toLowerCase() || '').includes(searchLower) ||
          (asset.imei_number?.toLowerCase() || '').includes(searchLower) ||
          (asset.ip_address?.toLowerCase() || '').includes(searchLower) ||
          (asset.issued_to?.toLowerCase() || '').includes(searchLower) ||
          (asset.received_from?.toLowerCase() || '').includes(searchLower) ||
          (asset.device_remark?.toLowerCase() || '').includes(searchLower) ||
          (asset.gid?.toLowerCase() || '').includes(searchLower)
        );
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }

    // Device status filter
    if (filterDeviceStatus !== 'all') {
      filtered = filtered.filter(asset => asset.device_status === filterDeviceStatus);
    }

    // Brand filter
    if (filterBrand !== 'all') {
      filtered = filtered.filter(asset => asset.brand_name === filterBrand);
    }

    return filtered;
  }, [assets, searchTerm, filterStatus, filterDeviceStatus, filterBrand]);

  // Handle search input with debounce
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDeviceStatus('all');
    setFilterBrand('all');
    setShowAdvancedFilters(false);
  };

  // Modal handlers
  const openViewModal = async (asset) => {
    try {
      setLoading(true);
      const response = await api.getAsset(asset.id);
      if (response.success) {
        setViewingAsset(response.data);
      }
    } catch (error) {
      console.error('Error fetching asset details:', error);
      toast.error(error.message || 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (asset = null) => {
    if (asset) {
      try {
        setLoading(true);
        const response = await api.getAsset(asset.id);
        if (response.success) {
          const assetData = response.data;
          setEditingAsset(assetData);
          setFormData({
            type_name: assetData.type_name || '',
            brand_name: assetData.brand_name || '',
            model_name: assetData.model_name || '',
            status: assetData.status || 'In Stock',
            vehicleno: assetData.vehicle_number || '',
            imei_no: assetData.imei_number || '',
            ip_address: assetData.ip_address || '',
            issued_to: assetData.issued_to || '',
            received_from: assetData.received_from || '',
            issue_date: assetData.issue_date ? assetData.issue_date.split('T')[0] : '',
            received_date: assetData.received_date ? assetData.received_date.split('T')[0] : '',
            device_status: assetData.device_status || '',
            device_remark: assetData.device_remark || '',
            gid: assetData.gid || '',
            replace_device_sn_imei: assetData.replace_device_sn_imei || '',
            mail_date:assetData.mail_date ? assetData.mail_date.split('T')[0] : '',
            recovery_name: assetData.recovery_name || '',
            recovery_status: assetData.recovery_status || '',
            prepared_by: assetData.prepared_by_name || 'sapan singh',
            approved_by: assetData.approved_by_name || 'sapan singh'
          });
          
          // Store existing images
          if (assetData.images && assetData.images.length > 0) {
            setExistingImages(assetData.images);
            const previews = assetData.images.map(img => ({
              preview: `/api/${assetData.id}/images/${img.id}`,
              name: img.image_name || `image_${img.id}`,
              isExisting: true,
              id: img.id
            }));
            setImagePreviews(previews);
          } else {
            setExistingImages([]);
            setImagePreviews([]);
          }
          
          // Load existing document
          if (assetData.documents && assetData.documents.length > 0) {
            setDocumentName(assetData.documents[0].document_name);
          } else {
            setDocumentName('');
          }
        }
      } catch (error) {
        console.error('Error loading asset for edit:', error);
        toast.error(error.message || 'Failed to load asset data');
        return;
      } finally {
        setLoading(false);
      }
    } else {
      setEditingAsset(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        type_name: '',
        brand_name: '',
        model_name: '',
        status: 'In Stock',
        vehicleno: '',
        imei_no: '',
        ip_address: '',
        issued_to: '',
        received_from: '',
        issue_date: today,
        received_date: today,
        device_status: '',
        device_remark: '',
        gid: '',
        mail_date:'',
        recovery_name: '',
        recovery_status: '',
        replace_device_sn_imei:'',
        prepared_by: 'sapan singh',
        approved_by: 'sapan singh'
      });
      setExistingImages([]);
      setImagePreviews([]);
      setDocumentName('');
      setImages([]);
      setDocument(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAsset(null);
    setExistingImages([]);
    setImagePreviews([]);
    setDocumentName('');
    setImages([]);
    setDocument(null);
    setFormData({
      type_name: '',
      brand_name: '',
      model_name: '',
      status: 'In Stock',
      vehicleno: '',
      imei_no: '',
      ip_address: '',
      issued_to: '',
      received_from: '',
      issue_date: '',
      received_date: '',
      device_status: '',
      device_remark: '',
      gid: '',
      recovery_name: '',
      recovery_status: '',
      mail_date:'',
      replace_device_sn_imei:'',
      prepared_by: 'sapan singh',
      approved_by: 'sapan singh'
    });
  };

  // Delete handlers
  const handleDeleteClick = (asset) => {
    setAssetToDelete(asset);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (assetToDelete) {
      try {
        setLoading(true);
        const response = await api.deleteAsset(assetToDelete.id);
        if (response.success) {
          // Remove from local state
          setAssets(assets.filter(a => a.id !== assetToDelete.id));
          toast.success('Asset deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting asset:', error);
        toast.error(error.message || 'Failed to delete asset');
      } finally {
        setLoading(false);
        setDeleteModalOpen(false);
        setAssetToDelete(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setAssetToDelete(null);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        // Skip images and document from formData since we handle them separately
        if (key !== 'images' && key !== 'document' && 
            formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add existing image IDs to preserve them
      existingImages.forEach(img => {
        formDataToSend.append('existingImages[]', img.id.toString());
      });
      
      // Add new images
      images.forEach((file) => {
        formDataToSend.append('images', file);
      });
      
      // Add document
      if (document) {
        formDataToSend.append('document', document);
      }
      
      console.log('📤 Sending FormData with entries:');
      let fileCount = 0;
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - "${value.name}" (${value.type}, ${value.size} bytes)`);
          fileCount++;
        } else {
          console.log(`${key}: "${value}"`);
        }
      }
      console.log(`Total files: ${fileCount}`);
      
      let response;
      if (editingAsset) {
        response = await api.updateAsset(editingAsset.id, formDataToSend);
      } else {
        response = await api.createAsset(formDataToSend);
      }
      
      if (response.success) {
        toast.success(
          editingAsset ? 'Asset updated successfully!' : 'Asset created successfully!'
        );
        closeModal();
        fetchAssets();
      }
    } catch (error) {
      console.error('❌ Error saving asset:', error);
      toast.error(
        error.message || (editingAsset ? 'Failed to update asset' : 'Failed to create asset')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Form input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        isNew: true
      }));
      
      // Update both states
      setImagePreviews(prev => [...prev, ...newImages]);
      setImages(prev => [...prev, ...files]); // Store actual File objects
    }
    e.target.value = ''; // Reset file input
  };

  const removeImage = (index) => {
    const imgToRemove = imagePreviews[index];
    
    // Check if it's an existing image
    if (imgToRemove.isExisting) {
      // Remove from existing images
      setExistingImages(prev => prev.filter(img => img.id !== imgToRemove.id));
    } else {
      // Remove blob URL if it's a new image
      if (imgToRemove.preview && imgToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imgToRemove.preview);
      }
      // Remove from images array
      const imageIndex = index - existingImages.length;
      if (imageIndex >= 0) {
        setImages(prev => prev.filter((_, i) => i !== imageIndex));
      }
    }
    
    // Remove from previews
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentName(file.name);
      setDocument(file); // Store actual File object
    }
    e.target.value = ''; // Reset file input
  };

  const removeDocument = () => {
    setDocumentName('');
    setDocument(null);
  };

  // Export functionality
  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/assets/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assets_${new Date().toISOString().split('T')[0]}.xlsx`;
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
const { user } = useAuth();
  // Print button
  const renderPrintButton = (asset) => {
    const params = new URLSearchParams({
      id: asset.id.toString(),
      type_name: asset.type_name || '',
      brand_name: asset.brand_name || '',
      model_name: asset.model_name || '',
      status: asset.status || '',
      vehicleno: asset.vehicle_number || '',
      imei_no: asset.imei_number || '',
      ip_address: asset.ip_address || '',
      issued_to: asset.issued_to || '',
      issue_date: asset.issue_date || '',
      device_status: asset.device_status || '',
      device_remark: asset.device_remark || '',
      gid: asset.gid || '',
      mail_date:asset.mail_date || '',
      replace_device_sn_imei: asset.replace_device_sn_imei || '',
      prepared_by: asset.prepared_by_name || 'sapan singh',
      approved_by: asset.approved_by_name || 'sapan singh',
      received_from: asset.received_from || '',
      received_date: asset.received_date || ''
    }).toString();



    return (
      <Link
        href={`/assets/print?${params}`}
        className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md flex items-center gap-2"
        title="Print Issue/Receipt Form"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Print</span>
      </Link>
    );
  };

  // Render loading state
  if (loading && assets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading assets...</p>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Asset Management
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage and track all your organizational assets efficiently
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
                onClick={() => openModal()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Add Asset
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
                  placeholder="Search by type, brand, model, vehicle, IMEI, IP, person..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {(searchTerm || filterStatus !== 'all' || filterDeviceStatus !== 'all' || filterBrand !== 'all') && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-3 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Reset</span>
                </button>
              )}
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                {/* Status Filter */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Status</option>
                    <option value="Issued">Issued</option>
                    <option value="Received">Received</option>
                    <option value="In Stock">In Stock</option>
                  </select>
                </div>

                {/* Device Status Filter */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Device Status
                  </label>
                  <select
                    value={filterDeviceStatus}
                    onChange={(e) => setFilterDeviceStatus(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Device Status</option>
                    {uniqueDeviceStatuses.filter(s => s !== 'all').map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Brand
                  </label>
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Brands</option>
                    {uniqueBrands.filter(b => b !== 'all').map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(filterStatus !== 'all' || filterDeviceStatus !== 'all' || filterBrand !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
                {filterStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    Status: {filterStatus}
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="ml-1 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterDeviceStatus !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">
                    Device: {filterDeviceStatus}
                    <button
                      onClick={() => setFilterDeviceStatus('all')}
                      className="ml-1 p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterBrand !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                    Brand: {filterBrand}
                    <button
                      onClick={() => setFilterBrand('all')}
                      className="ml-1 p-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
          {loading && assets.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500 dark:text-slate-400">Loading assets...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-700 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Asset Details</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Vehicle/IMEI</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Person</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Device Info</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
                              {asset.id}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">{asset.type_name || 'N/A'}</div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  {asset.brand_name || 'N/A'} - {asset.model_name || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              asset.status === 'Issued' 
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                                : asset.status === 'Received'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {asset.status === 'Issued' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                              {asset.status || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {asset.vehicle_number && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Car className="w-4 h-4 text-slate-400" />
                                  <span className="text-slate-700 dark:text-slate-300">{asset.vehicle_number}</span>
                                </div>
                              )}
                              {asset.imei_number && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Smartphone className="w-4 h-4 text-slate-400" />
                                  <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">{asset.imei_number}</span>
                                </div>
                              )}
                              {asset.ip_address && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Smartphone className="w-4 h-4 text-blue-400" />
                                  <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">IP: {asset.ip_address}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {asset.status === 'Issued' && asset.issued_to ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">Issued To: {asset.issued_to}</span>
                                </div>
                              ) : asset.status === 'Received' && asset.received_from ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">Received From: {asset.received_from}</span>
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {asset.issue_date && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    Issue: {new Date(asset.issue_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {asset.received_date && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    Received: {new Date(asset.received_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                asset.device_status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                asset.device_status === 'Faulty' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                asset.device_status === 'Good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                asset.device_status === 'Damaged' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}>
                                {asset.device_status || 'N/A'}
                              </div>
                              {asset.device_remark && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{asset.device_remark}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {renderPrintButton(asset)}
                              
                              {/* View Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openViewModal(asset);
                                }}
                                disabled={loading}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(asset);
                                }}
                                disabled={loading}
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(asset);
                                }}
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
                        <td colSpan="8" className="px-4 py-12 text-center">
                          <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">
                            {assets.length === 0 
                              ? 'No assets found. Add your first asset to get started.' 
                              : 'No assets match your current filters.'}
                          </p>
                          {assets.length > 0 && (
                            <button
                              onClick={resetFilters}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
              {filteredAssets.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredAssets.length} of {assets.length} assets
                    {(searchTerm || filterStatus !== 'all' || filterDeviceStatus !== 'all' || filterBrand !== 'all') && (
                      <span className="ml-2 text-indigo-600 dark:text-indigo-400">
                        (filtered from {assets.length} total)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Asset Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Asset Details</h2>
                  <p className="text-sm text-white/80">View asset information</p>
                </div>
              </div>
              <button
                onClick={() => setViewingAsset(null)}
                className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Loading asset details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Asset Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{viewingAsset.type_name}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{viewingAsset.brand_name} - {viewingAsset.model_name}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        viewingAsset.status === 'Issued' 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {viewingAsset.status === 'Issued' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {viewingAsset.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Device Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        viewingAsset.device_status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        viewingAsset.device_status === 'Faulty' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        viewingAsset.device_status === 'Good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {viewingAsset.device_status}
                      </span>
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assignment Details
                    </h4>
                    {viewingAsset.status === 'Issued' ? (
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Issued To</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.issued_to}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Issue Date</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {viewingAsset.issue_date ? new Date(viewingAsset.issue_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Received From</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.received_from}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Received Date</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {viewingAsset.received_date ? new Date(viewingAsset.received_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Device Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Device Details
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
                      {viewingAsset.vehicle_number && (
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Vehicle Number</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.vehicle_number}</p>
                        </div>
                      )}
                      {viewingAsset.imei_number && (
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">IMEI/Serial No</p>
                          <p className="font-mono font-semibold text-slate-900 dark:text-white">{viewingAsset.imei_number}</p>
                        </div>
                      )}
                      {viewingAsset.ip_address && (
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">IP Address</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.ip_address}</p>
                        </div>
                      )}
                      {viewingAsset.gid && (
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">GID</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.gid}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remarks */}
                  {viewingAsset.device_remark && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Remarks
                      </h4>
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                        <p className="text-slate-700 dark:text-slate-300">{viewingAsset.device_remark}</p>
                      </div>
                    </div>
                  )}

                  {/* Images Preview */}
                  {viewingAsset?.images && viewingAsset.images.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Images ({viewingAsset.images.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {viewingAsset.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={`/api/${viewingAsset.id}/images/${img.id}`}
                              alt={img.image_name || `Asset image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-105 cursor-pointer"
                              onClick={() => window.open(`/api/${viewingAsset.id}/images/${img.id}`, '_blank')}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-xs text-white truncate">{img.image_name || `Image ${index + 1}`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents Preview */}
                  {viewingAsset?.documents && viewingAsset.documents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Mail document ({viewingAsset.documents.length})
                      </h4>
                      <div className="space-y-2">
                        {viewingAsset.documents.map((doc, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                                  {doc.document_name}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {doc.document_type.toUpperCase()} • {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : ''}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`/api/${viewingAsset.id}/documents/${doc.id}`}
                              download={doc.document_name}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prepared By */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Prepared By</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.prepared_by_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Approved By</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{viewingAsset.approved_by_name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewingAsset(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewingAsset(null);
                  openModal(viewingAsset);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Asset
              </button>
            </div>
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
                  <AlertTriangle className="w-5 h-5" />
                </div>
                Confirm Delete
              </h2>
              <button
                onClick={handleDeleteCancel}
                className="relative z-10 p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:rotate-90"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Are you sure you want to delete this asset?
                  </h3>
                  {assetToDelete && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {assetToDelete.type_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Brand:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {assetToDelete.brand_name} - {assetToDelete.model_name}
                          </span>
                        </div>
                        {assetToDelete.status === 'Issued' ? (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">Issued To:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {assetToDelete.issued_to}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400">Received From:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {assetToDelete.received_from}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          ID: {assetToDelete.id}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                    This action cannot be undone. The asset will be permanently removed from the system.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
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
                    {loading ? 'Deleting...' : 'Delete Asset'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
              <h2 className="text-xl font-bold text-white relative z-10 flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {editingAsset ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                {editingAsset ? 'Edit Asset' : 'Add New Asset'}
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
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Asset Type */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                        Asset Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type_name"
                        value={formData.type_name}
                        onChange={handleInputChange}
                        required
                        disabled={submitting || loadingTypes}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Type</option>
                        {types.map((type) => (
                          <option key={type.id} value={type.type_name}>
                            {type.type_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Brand */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                        Brand <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="brand_name"
                        value={formData.brand_name}
                        onChange={handleInputChange}
                        required
                        disabled={submitting || loadingBrand}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Brand</option>
                        {brand.map((brandItem) => (
                          <option key={brandItem.id} value={brandItem.brand_name}>
                            {brandItem.brand_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Model */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                        Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="model_name"
                        value={formData.model_name}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter model name"
                      />
                    </div>

                    {/* Status */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="Issued">Issued</option>
                        <option value="Received">Received</option>
                        <option value="In Stock">In Stock</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* IP Address */}
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    IP Address
                  </label>
                  <input
                    type="text"
                    name="ip_address"
                    value={formData.ip_address || ''}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="192.168.1.1"
                    pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                    title="Please enter a valid IP address (e.g., 192.168.1.1)"
                  />
                </div>

                {/* Assignment Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Assignment Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Person Field (Issued To / Received From) */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {formData.status === 'Issued' ? 'Issued To' : formData.status === 'Received' ? 'Received From' : 'Stored By'} {formData.status !== 'In Stock' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name={formData.status === 'Issued' ? 'issued_to' : formData.status === 'Received' ? 'received_from' : 'stored_by'}
                        value={formData.status === 'Issued' ? formData.issued_to : formData.status === 'Received' ? formData.received_from : ''}
                        onChange={handleInputChange}
                        required={formData.status !== 'In Stock'}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={formData.status === 'Issued' ? "Enter person's name" : formData.status === 'Received' ? "Enter person's name" : "Enter storage location"}
                      />
                    </div>

                    {/* Date Field (Issue Date / Received Date) */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {formData.status === 'Issued' ? 'Issue Date' : formData.status === 'Received' ? 'Received Date' : 'Date'} {formData.status !== 'In Stock' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="date"
                        name={formData.status === 'Issued' ? 'issue_date' : 'received_date'}
                        value={formData.status === 'Issued' ? formData.issue_date : formData.received_date}
                        onChange={handleInputChange}
                        required={formData.status !== 'In Stock'}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Device Details Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Device Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vehicle No/Person */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        name="vehicleno"
                        value={formData.vehicleno}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="RJ14AB1234"
                      />
                    </div>

                    {/* IMEI/SERIAL No */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Serial / IMEI Number
                      </label>
                      <input
                        type="text"
                        name="imei_no"
                        value={formData.imei_no}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="867584032145678"
                      />
                    </div>

                    {/* GID */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        GID
                      </label>
                      <input
                        type="text"
                        name="gid"
                        value={formData.gid}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="GID001"
                      />
                    </div>

                    {/* Device Status */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Device Status
                      </label>
                      <select
                        name="device_status"
                        value={formData.device_status}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Status</option>
                        <option value="Replace With New">Replace With New</option>
                        <option value="New">New</option>
                        <option value="Good">Good</option>
                        <option value="Faulty">Faulty</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Under Repair">Under Repair</option>
                      </select>
                    </div>

                    {/* Device Remark */}
                    <div className="group col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Device Remark
                      </label>
                      <textarea
                        name="device_remark"
                        value={formData.device_remark}
                        onChange={handleInputChange}
                        rows="3"
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 placeholder-slate-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Any notes about the device"
                      />
                    </div>


                    {/* Date Field (Issue Date / Received Date) */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Mail Date
                      </label>
                      <input
                        type="date"
                        name="mail_date"
                        value={formData.mail_date}
                        onChange={handleInputChange}
                        required={formData.status !== 'In Stock'}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                        {/* Date Field (Issue Date / Received Date) */}

                        {(formData.status === 'Issued' || formData.status==='In Stock') && (  <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Replace Device Sn/IMEI No
                      </label>
                      <input
                        type="text"
                        name="replace_device_sn_imei"
                        value={formData.replace_device_sn_imei}
                        onChange={handleInputChange}
                        disabled={submitting}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>)}
                  


                  </div>
                </div>

                {/* File Uploads Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Attachments</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">(Optional)</span>
                  </div>
                  
                  {/* Document Upload */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Document Upload
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(PDF, DOC, DOCX,MSG)</span>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".msg,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="document-upload"
                        disabled={submitting}
                      />
                      <label
                        htmlFor="document-upload"
                        className={`flex items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group ${
                          submitting 
                            ? 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50' 
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <Paperclip className={`w-5 h-5 transition-colors ${
                          submitting 
                            ? 'text-slate-400' 
                            : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`} />
                        <span className={`text-sm transition-colors ${
                          submitting
                            ? 'text-slate-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          {documentName || 'Click to upload document'}
                        </span>
                      </label>
                    </div>
                    {documentName && (
                      <div className="mt-2 flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-700 dark:text-green-300 font-medium truncate">{documentName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={removeDocument}
                          disabled={submitting}
                          className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Images Upload */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Images Upload
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(Multiple images allowed)</span>
                      </div>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="images-upload"
                        disabled={submitting}
                      />
                      <label
                        htmlFor="images-upload"
                        className={`flex items-center justify-center gap-3 w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group ${
                          submitting 
                            ? 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50' 
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <ImageIcon className={`w-5 h-5 transition-colors ${
                          submitting 
                            ? 'text-slate-400' 
                            : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`} />
                        <span className={`text-sm transition-colors ${
                          submitting
                            ? 'text-slate-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        }`}>
                          Click to upload images
                        </span>
                      </label>
                    </div>
                    
                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviews.map((img, index) => (
                          <div
                            key={index}
                            className="relative group/img animate-in zoom-in-95 duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <img
                              src={img.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700 transition-transform group-hover/img:scale-105"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              disabled={submitting}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <p className="text-xs text-white truncate">{img.name}</p>
                              {img.isExisting && (
                                <p className="text-xs text-white/80">Existing Image</p>
                              )}
                            </div>
                          </div>
                        ))}
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-xl font-medium hover:scale-105 active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingAsset ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Update Asset
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Asset
                      </>
                    )}
                  </span>
                  {!submitting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}