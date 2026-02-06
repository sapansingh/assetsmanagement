"use client";

import { useState } from "react";
import AssetModal from "../components/AssetModal";

export default function AssetsPage() {
  const [assets, setAssets] = useState([
    {
      id: 1,
      asset_code: "LAP-001",
      asset_name: "Dell Latitude",
      category: "Laptop",
      serial_number: "SN12345",
      current_status: "available",
      asset_condition: "good",
      request_status: "pending",
    },
    {
      id: 2,
      asset_code: "MON-002",
      asset_name: "Samsung Monitor",
      category: "Monitor",
      serial_number: "SN67890",
      current_status: "issued",
      asset_condition: "fair",
      request_status: "approved",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [asset, setAsset] = useState({});
  const [search, setSearch] = useState("");

  const saveAsset = () => {
    if (asset.id) {
      setAssets(assets.map(a => (a.id === asset.id ? asset : a)));
    } else {
      setAssets([...assets, { ...asset, id: Date.now() }]);
    }
    setShowModal(false);
    setAsset({});
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  const filteredAssets = assets.filter(
    a =>
      a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">
            Asset Management
          </h1>
          <p className="text-slate-500 mt-1">Track, manage & approve assets</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-[1.02] transition"
        >
          + Add Asset
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <input
          className="border rounded-lg px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Search by name or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="text-slate-600">
              <th className="p-4 text-left">Code</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Serial</th>
              <th className="p-4">Status</th>
              <th className="p-4">Condition</th>
              <th className="p-4">Request</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50 transition group">
                <td className="p-4 font-mono text-xs text-slate-600">{a.asset_code}</td>
                <td className="p-4 font-semibold text-slate-800">{a.asset_name}</td>
                <td className="p-4 text-center">{a.category}</td>
                <td className="p-4 text-center">{a.serial_number}</td>
                <td className="p-4 text-center">
                  <StatusBadge value={a.current_status} />
                </td>
                <td className="p-4 text-center capitalize">{a.asset_condition}</td>
                <td className="p-4 text-center">
                  <RequestBadge value={a.request_status} />
                </td>
                <td className="p-4 text-right space-x-3 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => { setAsset(a); setShowModal(true); }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAsset(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500">
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AssetModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={saveAsset}
        asset={asset}
        setAsset={setAsset}
      />
    </div>
  );
}

/* Status Badge */
function StatusBadge({ value }) {
  const colors = {
    available: "bg-green-100 text-green-700",
    issued: "bg-yellow-100 text-yellow-700",
    under_maintenance: "bg-orange-100 text-orange-700",
    retired: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[value]}`}>
      {value.replace("_", " ")}
    </span>
  );
}

function RequestBadge({ value }) {
  // Default to 'pending' if undefined
  const status = value || "pending";

  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

