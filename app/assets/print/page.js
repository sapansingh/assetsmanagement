/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useSearchParams } from 'next/navigation';
import { useRef, useEffect, useState, Suspense } from 'react';
import { Printer, Download, X, FileText, CheckCircle, AlertCircle, Package, Smartphone, Car, User, Calendar } from 'lucide-react';
import Link from 'next/link';

// Wrap the main component with Suspense
const PrintableAssetForm = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading print form...</p>
        </div>
      </div>
    }>
      <PrintableAssetFormContent />
    </Suspense>
  );
};

// Create a separate component for the content that uses useSearchParams
const PrintableAssetFormContent = () => {
  const searchParams = useSearchParams();
  const printRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  
  // Get asset data from URL parameters or use default
  const assetData = {
    id: searchParams.get('id') || '1',
    type_name: searchParams.get('type_name') || 'GPS Tracker',
    brand_name: searchParams.get('brand_name') || 'Concox',
    model_name: searchParams.get('model_name') || 'GT06N',
    status: searchParams.get('status') || 'Issued',
    vehicleno: searchParams.get('vehicleno') || 'RJ14AB1234',
    imei_no: searchParams.get('imei_no') || '867584032145678',
    issued_to: searchParams.get('issued_to') || 'Rahul Sharma',
    received_from: searchParams.get('received_from') || '',
    issue_date: searchParams.get('issue_date') || '2024-01-15',
    received_date: searchParams.get('received_date') || '',
    device_status: searchParams.get('device_status') || 'Active',
    device_remark: searchParams.get('device_remark') || 'Working properly',
    gid: searchParams.get('gid') || 'GID001',
    recovery_name: searchParams.get('recovery_name') || '',
    recovery_status: searchParams.get('recovery_status') || '',
    prepared_by: searchParams.get('prepared_by') || 'John Doe',
    approved_by: searchParams.get('approved_by') || 'Sarah Smith',
    mail_date: searchParams.get('mail_date') || '',
    replace_device_sn_imei: searchParams.get('replace_device_sn_imei') || '',
    handover: searchParams.get('handover') || ''
  };

  // Get current date - safe for SSR
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Mark as mounted to handle client-only content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-print when component mounts
  useEffect(() => {
    if (!mounted) return;
    
    const timeoutId = setTimeout(() => {
      window.print();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [mounted]);

  const handlePrint = () => {
    window.print();
  };

  // Don't render client-specific content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading print preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Print Controls */}
      <div className="no-print mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Asset Issue/Receipt Form</h1>
            <p className="text-gray-600 mt-1">Print Preview - Ready for printing</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Form ID: AS-{assetData.id.toString().padStart(5, '0')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{currentDate}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg font-medium"
            >
              <Printer className="w-5 h-5" />
              Print Now
            </button>
            <Link
              href="/assets"
              className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <X className="w-5 h-5" />
              Back to Assets
            </Link>
          </div>
        </div>
      </div>

      {/* Printable Form Container */}
      <div className="no-print text-center mb-6">
        <p className="text-sm text-gray-500">This document is optimized for A4 paper printing</p>
      </div>

      {/* Printable Form - A4 Size */}
      <div ref={printRef} className="printable-form bg-white mx-auto border border-gray-300 shadow-none">
        {/* Header with Logo */}
        <div className="border-b-2 border-gray-800 px-6 py-5">
          <div className="flex justify-between items-start">
            {/* Company Logo and Info */}
            <img src="/images.png" alt="AssetFlow Pro Logo" className="w-32 h-auto mb-2" />
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <div className="text-white text-center">
                  <div className="text-lg font-bold">EGHS</div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ASSETFLOW PRO</h1>
                <p className="text-gray-700 text-sm font-medium">Enterprise Asset Management System</p>
                <div className="mt-1 text-xs text-gray-500">
                  <p></p>
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="text-right">
              <div className="inline-block border-2 border-gray-800 px-4 py-2">
                <div className="text-xs text-gray-700 uppercase tracking-wider font-semibold">
                  {assetData.status === 'Issued' ? 'ASSET ISSUE FORM' : 'ASSET RECEIPT FORM'}
                </div>
                <div className="text-xl font-bold text-blue-700 mt-1">
                  REF-{assetData.id.toString().padStart(5, '0')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="w-3 h-3" />
                    {currentDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Optimized for A4 */}
        <div className="px-6 py-6">
          {/* Asset Details Section in Table Format */}
          <div className="mb-4">
            {/* Main Asset Information Table */}
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th colSpan="4" className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                      ASSET INFORMATION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Basic Info */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200 w-1/4">Asset Type</td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 border-r border-gray-200 w-1/4">{assetData.type_name}</td>
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200 w-1/4">Brand</td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 w-1/4">{assetData.brand_name}</td>
                  </tr>
                  
                  {/* Row 2: Model & Serial */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Model</td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 border-r border-gray-200">{assetData.model_name}</td>
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">IMEI/Serial</td>
                    <td className="py-2 px-4 text-sm font-mono font-semibold text-gray-900">{assetData.imei_no || 'N/A'}</td>
                  </tr>
                  
                  {/* Row 3: Status */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Asset Status</td>
                    <td colSpan="3" className="py-2 px-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                        assetData.status === 'Issued'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {assetData.status === 'Issued' ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Issued
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Received
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Row 4: Transaction Details */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">
                      {assetData.status === 'Issued' ? 'Issued To' : 'Received From'}
                    </td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 border-r border-gray-200">
                      {assetData.status === 'Issued' ? assetData.issued_to : assetData.received_from}
                    </td>
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">
                      {assetData.status === 'Issued' ? 'Issue Date' : 'Received Date'}
                    </td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900">
                      {assetData.status === 'Issued' ? formatDate(assetData.issue_date) : formatDate(assetData.received_date)}
                    </td>
                  </tr>
                  
                  {/* Row 5: Vehicle & GID */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Vehicle No</td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900 border-r border-gray-200">{assetData.vehicleno || 'N/A'}</td>
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">GID</td>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-900">{assetData.gid || 'N/A'}</td>
                  </tr>
                  
                  {/* Row 6: Device Status */}
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Device Status</td>
                    <td colSpan="3" className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        {assetData.device_status === 'Active' || assetData.device_status === 'Good' ? (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${
                          assetData.device_status === 'Active' || assetData.device_status === 'Good'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {assetData.device_status}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Row 7: Remarks (if exists) */}
                  {assetData.device_remark && (
                    <tr>
                      <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Remarks</td>
                      <td colSpan="3" className="py-2 px-4 text-sm text-gray-700">
                        {assetData.device_remark}
                      </td>
                    </tr>
                  )}

                  {/* Row 8: Mail Date (if exists) */}
                  {assetData.mail_date && (
                    <tr>
                      <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Mail Date</td>
                      <td colSpan="3" className="py-2 px-4 text-sm text-gray-700">
                        <Calendar className="w-3 h-3 inline-block mr-1" />
                        Date: {formatDate(assetData.mail_date)}
                      </td>
                    </tr>
                  )}

                  {assetData.handover && (
                    <tr>
                      <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Handover</td>
                      <td colSpan="3" className="py-2 px-4 text-sm text-gray-700">
                        {assetData.handover}
                      </td>
                    </tr>
                  )}

                  {/* Row 9: Replace Device SN/IMEI (if exists) */}
                  {assetData.replace_device_sn_imei && (
                    <tr>
                      <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200">Replace Device SN/IMEI</td>
                      <td colSpan="3" className="py-2 px-4 text-sm text-gray-700">
                        {assetData.replace_device_sn_imei}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Recovery Information Table (if exists) */}
            {(assetData.recovery_name || assetData.recovery_status) && (
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th colSpan="4" className="py-2 px-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                        RECOVERY INFORMATION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {assetData.recovery_name && (
                        <>
                          <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200 w-1/4">Recovery Team</td>
                          <td className="py-2 px-4 text-sm font-semibold text-gray-900 border-r border-gray-200 w-1/4">{assetData.recovery_name}</td>
                        </>
                      )}
                      {assetData.recovery_status && (
                        <>
                          <td className="py-2 px-4 text-xs font-medium text-gray-500 border-r border-gray-200 w-1/4">Recovery Status</td>
                          <td className="py-2 px-4 text-sm font-semibold text-gray-900 w-1/4">{assetData.recovery_status}</td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="mt-4 pt-6 border-t-2 border-gray-300">
            <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider text-center">
              AUTHORIZED SIGNATURES & APPROVALS
            </h3>
            
            {/* Three Signatures in One Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Signature 1 - Issued/Received By */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {assetData.status === 'Issued' ? assetData.issued_to : assetData.received_from}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {assetData.status === 'Issued' ? 'Issued To' : 'Received By'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {assetData.status === 'Issued' ? 'Asset Recipient' : 'Asset Returner'}
                  </div>
                </div>
                
                <div className="relative mt-8">
                  <div className="border-t-2 border-gray-800 pt-4">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Signature</div>
                    <div className="text-xs text-gray-500 mt-2 font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date: {currentDate}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  </div>
                </div>
              </div>

              {/* Signature 2 - Prepared By */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-sm font-bold text-gray-900 mb-1">{assetData.prepared_by}</div>
                  <div className="text-xs text-gray-600 font-medium">Prepared By</div>
                  <div className="text-xs text-gray-500 mt-1">Asset Management Department</div>
                </div>
                
                <div className="relative mt-8">
                  <div className="border-t-2 border-gray-800 pt-4">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Signature</div>
                    <div className="text-xs text-gray-500 mt-2 font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date: {currentDate}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  </div>
                </div>
              </div>

              {/* Signature 3 - Approved By */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-sm font-bold text-gray-900 mb-1">{assetData.approved_by}</div>
                  <div className="text-xs text-gray-600 font-medium">Approved By</div>
                  <div className="text-xs text-gray-500 mt-1">Authorized Signatory</div>
                </div>
                
                <div className="relative mt-8">
                  <div className="border-t-2 border-gray-800 pt-4">
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Signature</div>
                    <div className="text-xs text-gray-500 mt-2 font-medium">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date: {currentDate}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-2 pt-6 border-t border-gray-300">
            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">TERMS & CONDITIONS</h3>
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-3">
                <ul className="text-[10px] text-gray-600 space-y-1">
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-gray-800 text-[10px]">1.</span>
                    <span>This document serves as an official record of asset transaction and must be retained for audit purposes.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-gray-800 text-[10px]">2.</span>
                    <span>The asset must be used exclusively for authorized business purposes and maintained properly.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-gray-800 text-[10px]">3.</span>
                    <span>Any damage, loss, or malfunction must be reported to the Asset Management Department within 24 hours.</span>
                  </li>
                </ul>
                <ul className="text-[10px] text-gray-600 space-y-1">
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-gray-800 text-[10px]">4.</span>
                    <span>The asset must be returned immediately upon request or upon termination of employment/assignment.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-gray-800 text-[10px]">5.</span>
                    <span>Unauthorized transfer, modification, or commercial use of the asset is strictly prohibited.</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="font-bold text-gray-800 text-[10px]">6.</span>
                    <span>The company reserves the right to audit asset usage and location at any time without prior notice.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-6 border-t-2 border-gray-300">
            <div className="grid grid-cols-3 gap-4 text-[10px] text-gray-500">
              <div>
                <div className="font-semibold text-gray-700 mb-0.5">For Inquiries:</div>
                <div>Asset Management IT Department</div>
                <div>Email: RJ_ITIS@EMRI.IN</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-700 mb-0.5">Document Control</div>
                <div>Version: 3.0</div>
                <div>Effective: Feb 2025</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-700 mb-0.5">Classification</div>
                <div>INTERNAL USE ONLY</div>
                <div>Confidential</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
              <p className="font-medium">Generated by AssetFlow Pro Management System</p>
              <p className="mt-0.5">Form ID: AS-{assetData.id.toString().padStart(5, '0')}-{new Date().getFullYear()}</p>
              <p className="mt-0.5">Printed on: {currentDate} • Page 1 of 1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.4in;
          }
          
          body * {
            visibility: hidden !important;
          }
          
          .printable-form,
          .printable-form * {
            visibility: visible !important;
          }
          
          .printable-form {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            min-height: 100vh !important;
          }
          
          .no-print,
          .no-print * {
            display: none !important;
          }
          
          /* Optimize for A4 */
          .printable-form {
            font-size: 11px !important;
          }
          
          .printable-form h1 {
            font-size: 20px !important;
          }
          
          .printable-form h2 {
            font-size: 16px !important;
          }
          
          .printable-form h3 {
            font-size: 13px !important;
          }
          
          /* Table styles for print */
          .printable-form table {
            font-size: 10px !important;
            border-collapse: collapse !important;
          }
          
          .printable-form th,
          .printable-form td {
            padding: 4px 8px !important;
            border: 1px solid #d1d5db !important;
          }
          
          .printable-form th {
            background-color: #f9fafb !important;
            font-weight: 600 !important;
          }
          
          /* Ensure proper spacing */
          .printable-form > div {
            margin: 0 !important;
            padding: 0.2in !important;
          }
          
          /* Signature section print optimization */
          .printable-form .grid.grid-cols-3 {
            gap: 0.2in !important;
          }
          
          /* Remove backgrounds for better printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* Screen styles */
        @media screen {
          .printable-form {
            max-width: 8.27in; /* A4 width */
            min-height: 11.69in; /* A4 height */
            margin: 0 auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          
          /* Table styles for screen */
          .printable-form table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .printable-form th,
          .printable-form td {
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            text-align: left;
          }
          
          .printable-form th {
            background-color: #f9fafb;
            font-weight: 600;
          }
          
          .printable-form tr:hover {
            background-color: #f9fafb;
          }
          
          /* Signature section screen styles */
          .printable-form .grid.grid-cols-3 {
            gap: 1rem;
          }
          
          .printable-form .grid.grid-cols-3 > div {
            padding: 0.5rem;
            border: 1px dashed #e5e7eb;
            border-radius: 0.375rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableAssetForm;