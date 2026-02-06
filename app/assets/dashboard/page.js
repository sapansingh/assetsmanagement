'use client';
import { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Upload, 
  Download, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Smartphone,
  Car,
  FileText,
  Printer,
  Filter,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Layers,
  Database,
  Shield,
  Clock,
  Battery,
  Wifi,
  Server,
  Cpu,
  HardDrive,
  Smartphone as Device,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Router,
  Network,
  CheckSquare,
  XSquare,
  AlertTriangle,
  Info,
  Box,
  Warehouse,
  Tag,
  DollarSign,
  Hash,
  Scale,
  Archive,
  Eye,
  TrendingDown,
  Percent,
  BarChart
} from 'lucide-react';
import { toast } from 'sonner';

// API service functions
const api = {
  async getDashboardStats() {
    const response = await fetch('/api/dashboard/stats');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch dashboard stats');
    }
    return response.json();
  },

  async getInventoryByType() {
    const response = await fetch('/api/dashboard/inventory-by-type');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch inventory by type');
    }
    return response.json();
  },

  async getRecentActivity() {
    const response = await fetch('/api/dashboard/recent-activity');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch recent activity');
    }
    return response.json();
  },

  async getStatusDistribution() {
    const response = await fetch('/api/dashboard/status-distribution');
    if (!response.ok) {
      const error = await response.json();
      throw new Error('Failed to fetch status distribution');
    }
    return response.json();
  }
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    // Assets data
    totalAssets: 0,
    issuedAssets: 0,
    receivedAssets: 0,
    inStockAssets: 0,
    deviceStats: {
      active: 0,
      faulty: 0,
      good: 0,
      damaged: 0
    },
    inventoryByType: [], // Assets by type
    recentActivity: [],
    statusDistribution: [],
    
    // New stock data
    stockByType: [], // Stock items by category
    stockSummary: {
      totalStockEntries: 0,
      assetTypes: 0,
      stockCategories: 0,
      totalStockQuantity: 0,
      totalStockValue: 0
    }
  });
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview'); // overview, assets, stock
  const [viewMode, setViewMode] = useState('assets'); // assets, stock, combined

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [stats, inventory, activity, distribution] = await Promise.all([
        api.getDashboardStats(),
        api.getInventoryByType(),
        api.getRecentActivity(),
        api.getStatusDistribution()
      ]);
      
      // Extract data from inventory response
      const inventoryData = inventory.data || [];
      const stockData = inventory.stockByType || [];
      const summaryData = inventory.summary || {
        totalAssets: 0,
        totalStockEntries: 0,
        assetTypes: 0,
        stockCategories: 0,
        totalStockQuantity: 0,
        totalStockValue: 0
      };
      
      setDashboardData({
        totalAssets: stats.data?.totalAssets || summaryData.totalAssets || 0,
        issuedAssets: stats.data?.issuedAssets || 0,
        receivedAssets: stats.data?.receivedAssets || 0,
        inStockAssets: stats.data?.inStockAssets || 0,
        deviceStats: stats.data?.deviceStats || {
          active: 0,
          faulty: 0,
          good: 0,
          damaged: 0
        },
        inventoryByType: inventoryData,
        recentActivity: activity.data || [],
        statusDistribution: distribution.data || [],
        
        // Stock data
        stockByType: stockData,
        stockSummary: {
          totalStockEntries: summaryData.totalStockEntries || 0,
          assetTypes: summaryData.assetTypes || 0,
          stockCategories: summaryData.stockCategories || 0,
          totalStockQuantity: summaryData.totalStockQuantity || 0,
          totalStockValue: summaryData.totalStockValue || 0
        }
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Refresh data
  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard data refreshed');
  };

  // Get icon for asset type
  const getTypeIcon = (typeName, isStock = false) => {
    const type = typeName?.toLowerCase() || '';
    
    if (isStock) {
      if (type.includes('electr')) return <Battery className="w-5 h-5" />;
      if (type.includes('mechan')) return <Cpu className="w-5 h-5" />;
      if (type.includes('tool')) return <HardDrive className="w-5 h-5" />;
      if (type.includes('consum')) return <Package className="w-5 h-5" />;
      if (type.includes('station')) return <FileText className="w-5 h-5" />;
      if (type.includes('safety')) return <Shield className="w-5 h-5" />;
      return <Box className="w-5 h-5" />;
    }
    
    if (type.includes('phone') || type.includes('mobile')) return <Smartphone className="w-5 h-5" />;
    if (type.includes('laptop')) return <Monitor className="w-5 h-5" />;
    if (type.includes('tablet')) return <Device className="w-5 h-5" />;
    if (type.includes('vehicle') || type.includes('car')) return <Car className="w-5 h-5" />;
    if (type.includes('server')) return <Server className="w-5 h-5" />;
    if (type.includes('router') || type.includes('network')) return <Router className="w-5 h-5" />;
    if (type.includes('camera')) return <Camera className="w-5 h-5" />;
    if (type.includes('headphone')) return <Headphones className="w-5 h-5" />;
    if (type.includes('keyboard')) return <Keyboard className="w-5 h-5" />;
    if (type.includes('mouse')) return <Mouse className="w-5 h-5" />;
    if (type.includes('cpu') || type.includes('processor')) return <Cpu className="w-5 h-5" />;
    if (type.includes('hard') || type.includes('drive') || type.includes('storage')) return <HardDrive className="w-5 h-5" />;
    if (type.includes('mdt') || type.includes('tracker')) return <Wifi className="w-5 h-5" />;
    
    return <Package className="w-5 h-5" />;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'issued': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'received': return 'bg-gradient-to-r from-emerald-500 to-green-500';
      case 'in stock': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-500';
    }
  };

  // Get device status color
  const getDeviceStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'good': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'faulty': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'damaged': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Calculate percentages
  const totalAssets = dashboardData.totalAssets || 1;
  const issuedPercentage = Math.round((dashboardData.issuedAssets / totalAssets) * 100);
  const receivedPercentage = Math.round((dashboardData.receivedAssets / totalAssets) * 100);
  const inStockPercentage = Math.round((dashboardData.inStockAssets / totalAssets) * 100);

  // Get top asset types
  const topAssetTypes = [...dashboardData.inventoryByType]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Get top stock categories
  const topStockCategories = [...dashboardData.stockByType]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Calculate combined totals
  const combinedTotal = dashboardData.totalAssets + dashboardData.stockSummary.totalStockEntries;
  const stockPercentage = Math.round((dashboardData.stockSummary.totalStockEntries / combinedTotal) * 100) || 0;
  const assetsPercentage = Math.round((dashboardData.totalAssets / combinedTotal) * 100) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Asset & Stock Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Complete overview of assets and stock inventory
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('assets')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'assets' ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  Assets
                </button>
                <button
                  onClick={() => setViewMode('stock')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'stock' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Box className="w-4 h-4 inline mr-2" />
                  Stock
                </button>
                <button
                  onClick={() => setViewMode('combined')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'combined' ? 'bg-purple-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  <Layers className="w-4 h-4 inline mr-2" />
                  Combined
                </button>
              </div>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <button
                onClick={handleRefresh}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Combined Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Items (Combined) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Items</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {combinedTotal.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Assets + Stock entries</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  {dashboardData.totalAssets}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Assets</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  {dashboardData.stockSummary.totalStockEntries}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Stock</div>
              </div>
            </div>
          </div>

          {/* Total Assets (Original) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Assets</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {dashboardData.totalAssets.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total assets inventory</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{assetsPercentage}% of total</span>
                <span className="font-medium">{dashboardData.totalAssets}</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                  style={{ width: `${assetsPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Stock */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {dashboardData.stockSummary.totalStockEntries.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Stock entries inventory</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{stockPercentage}% of total</span>
                <span className="font-medium">{dashboardData.stockSummary.totalStockEntries}</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  style={{ width: `${stockPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Stock Value */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock Value</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ₹{parseFloat(dashboardData.stockSummary.totalStockValue).toLocaleString('en-IN')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Total stock investment</p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Quantity: {parseFloat(dashboardData.stockSummary.totalStockQuantity).toLocaleString()}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Categories: {dashboardData.stockSummary.stockCategories}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Main Content - Tabs based on view mode */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inventory */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {viewMode === 'assets' ? 'Inventory by Asset Type' : 
                     viewMode === 'stock' ? 'Inventory by Stock Category' : 
                     'Inventory Overview'}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {viewMode === 'assets' ? 'Distribution of assets across different types' :
                     viewMode === 'stock' ? 'Stock items grouped by categories' :
                     'Combined view of assets and stock'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <PieChart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Show assets only */}
                {viewMode === 'assets' && dashboardData.inventoryByType.map((type, index) => (
                  <div key={`asset-${index}`} className="group">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          {getTypeIcon(type.type_name, false)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {type.type_name || 'Unknown Type'}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                              {type.issued} Issued
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                              {type.received} Received
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                              {type.inStock} In Stock
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {type.total}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {Math.round((type.total / totalAssets) * 100)}% of assets
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show stock only */}
                {viewMode === 'stock' && dashboardData.stockByType.map((stock, index) => (
                  <div key={`stock-${index}`} className="group">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-100 dark:border-emerald-800">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                          {getTypeIcon(stock.type_name, true)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {stock.type_name || 'Unknown Category'}
                          </h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Box className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Items: {stock.total}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Scale className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Qty: {parseFloat(stock.total_quantity || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                Value: ₹{parseFloat(stock.total_value || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                          {stock.total}
                        </div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400">
                          {Math.round((stock.total / dashboardData.stockSummary.totalStockEntries) * 100)}% of stock
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Show combined view */}
                {viewMode === 'combined' && (
                  <>
                    {/* Asset types */}
                    {topAssetTypes.map((type, index) => (
                      <div key={`combined-asset-${index}`} className="group">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                              <Package className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {type.type_name || 'Unknown'}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">Asset Type</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              {type.total}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Assets
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Stock categories */}
                    {topStockCategories.map((stock, index) => (
                      <div key={`combined-stock-${index}`} className="group">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                              <Box className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                {stock.type_name || 'Unknown'}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400">Stock Category</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              {stock.total}
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400">
                              Stock
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* No data message */}
                {((viewMode === 'assets' && dashboardData.inventoryByType.length === 0) ||
                  (viewMode === 'stock' && dashboardData.stockByType.length === 0)) && (
                  <div className="text-center py-8">
                    <Archive className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {viewMode === 'assets' ? 'No asset data found' : 'No stock data found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status & Activity */}
          <div className="space-y-6">
            {/* Device Status (Assets only) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Device Status</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${dashboardData.deviceStats.active > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {dashboardData.deviceStats.active} Active
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Active</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Devices in use</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.deviceStats.active}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Good</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Ready for use</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.deviceStats.good}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Faulty</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Needs repair</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.deviceStats.faulty}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <XSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Damaged</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Beyond repair</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.deviceStats.damaged}
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stock Summary</h2>
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <Box className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Total Entries</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Stock items count</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.stockSummary.totalStockEntries}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Categories</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Unique categories</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {dashboardData.stockSummary.stockCategories}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Scale className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Total Quantity</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Stock units</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {parseFloat(dashboardData.stockSummary.totalStockQuantity).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Total Value</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Stock investment</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    ₹{parseFloat(dashboardData.stockSummary.totalStockValue).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Asset Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Issued</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{dashboardData.issuedAssets}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Received</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{dashboardData.receivedAssets}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">In Stock</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{dashboardData.inStockAssets}</span>
              </div>
            </div>
          </div>

          {/* Top Asset Types */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Top Asset Types</h3>
            <div className="space-y-2">
              {topAssetTypes.slice(0, 3).map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(type.type_name, false)}
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                      {type.type_name || 'Unknown'}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{type.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Stock Categories */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Top Stock Categories</h3>
            <div className="space-y-2">
              {topStockCategories.slice(0, 3).map((stock, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(stock.type_name, true)}
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                      {stock.type_name || 'Unknown'}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{stock.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <Package className="w-4 h-4" />
                Manage Assets
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <Box className="w-4 h-4" />
                Manage Stock
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}