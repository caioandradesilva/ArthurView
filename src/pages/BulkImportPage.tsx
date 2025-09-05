import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';

interface ImportResult {
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{ row: number; error: string; data: any }>;
  created: {
    sites: number;
    containers: number;
    racks: number;
    asics: number;
  };
}

const BulkImportPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const breadcrumbItems = [
    { label: 'Assets', href: '/assets' },
    { label: 'Bulk Import' }
  ];

  const downloadTemplate = () => {
    // Create CSV template with headers and example data
    const headers = [
      'siteName',
      'siteLocation', 
      'siteCountry',
      'containerName',
      'rackName',
      'rackCapacity',
      'model',
      'ipAddress',
      'macAddress',
      'serialNumber',
      'hashRate',
      'positionLine',
      'positionColumn',
      'status',
      'clientId'
    ];

    const exampleData = [
      [
        'OHIO',
        'Ohio, United States',
        'US',
        'DC_11',
        'Rack 01',
        '24',
        'Antminer S19 Pro',
        '192.168.1.100',
        '00:1B:44:11:3A:B7',
        'S19PRO123456',
        '110.0',
        '1',
        '1',
        'offline',
        ''
      ],
      [
        'OHIO',
        'Ohio, United States',
        'US',
        'DC_11',
        'Rack 01',
        '24',
        'Antminer S19 Pro',
        '192.168.1.101',
        '00:1B:44:11:3A:B8',
        'S19PRO123457',
        '110.0',
        '1',
        '2',
        'offline',
        ''
      ]
    ];

    const csvContent = [headers, ...exampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'asic_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const processImport = async () => {
    if (!file || !userProfile) return;

    setImporting(true);
    const result: ImportResult = {
      totalRows: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      created: { sites: 0, containers: 0, racks: 0, asics: 0 }
    };

    try {
      const csvText = await file.text();
      const data = parseCSV(csvText);
      result.totalRows = data.length;

      // Caches to store IDs of processed entities
      const siteCache: { [key: string]: string } = {};
      const containerCache: { [key: string]: string } = {};
      const rackCache: { [key: string]: string } = {};

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // 1. Get or Create Site
          let siteId = siteCache[row.siteName];
          if (!siteId) {
            const sites = await FirestoreService.getSites();
            const existingSite = sites.find(s => s.name === row.siteName);
            
            if (existingSite) {
              siteId = existingSite.id;
            } else {
              siteId = await FirestoreService.createSite({
                name: row.siteName,
                location: row.siteLocation || 'Unknown',
                country: (row.siteCountry as 'BR' | 'US') || 'US',
                createdAt: new Date(),
                updatedAt: new Date()
              });
              result.created.sites++;
            }
            siteCache[row.siteName] = siteId;
          }

          // 2. Get or Create Container
          const containerKey = `${siteId}-${row.containerName}`;
          let containerId = containerCache[containerKey];
          if (!containerId) {
            const containers = await FirestoreService.getContainersBySite(siteId);
            const existingContainer = containers.find(c => c.name === row.containerName);
            
            if (existingContainer) {
              containerId = existingContainer.id;
            } else {
              containerId = await FirestoreService.createContainer({
                name: row.containerName,
                siteId: siteId,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              result.created.containers++;
            }
            containerCache[containerKey] = containerId;
          }

          // 3. Get or Create Rack
          const rackKey = `${containerId}-${row.rackName}`;
          let rackId = rackCache[rackKey];
          if (!rackId) {
            const racks = await FirestoreService.getRacksByContainer(containerId);
            const existingRack = racks.find(r => r.name === row.rackName);
            
            if (existingRack) {
              rackId = existingRack.id;
            } else {
              rackId = await FirestoreService.createRack({
                name: row.rackName,
                containerId: containerId,
                capacity: parseInt(row.rackCapacity) || 24,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              result.created.racks++;
            }
            rackCache[rackKey] = rackId;
          }

          // 4. Create ASIC (always create new ASICs)
          const containerNum = row.containerName.replace('DC_', '');
          const rackNum = row.rackName.replace('Rack ', '').padStart(2, '0');
          const location = `MDC-${containerNum}-${rackNum} (${row.positionLine},${row.positionColumn})`;

          const asicData = {
            rackId: rackId,
            siteId: siteId,
            model: row.model,
            ipAddress: row.ipAddress,
            macAddress: row.macAddress || '',
            serialNumber: row.serialNumber,
            hashRate: parseFloat(row.hashRate) || 0,
            position: {
              line: parseInt(row.positionLine) || 1,
              column: parseInt(row.positionColumn) || 1
            },
            location: location,
            status: (row.status as 'online' | 'offline' | 'maintenance' | 'error') || 'offline',
            ...(row.clientId && row.clientId.trim() && { clientId: row.clientId.trim() }),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await FirestoreService.createASIC(asicData);
          result.created.asics++;
          result.successfulImports++;

        } catch (error: any) {
          result.failedImports++;
          result.errors.push({
            row: i + 2, // +2 because CSV has header and is 1-indexed
            error: error.message,
            data: row
          });
        }
      }

      
      // Show success confirmation popup
      if (result.successfulImports > 0) {
        alert(`✅ Importação concluída com sucesso!\n\n` +
              `📊 Resumo:\n` +
              `• ${result.successfulImports} ASICs importados\n` +
              `• ${result.created.sites} sites criados\n` +
              `• ${result.created.containers} containers criados\n` +
              `• ${result.created.racks} racks criados\n` +
              `• ${result.created.asics} ASICs criados\n\n` +
              `${result.failedImports > 0 ? `⚠️ ${result.failedImports} falhas encontradas. Verifique os detalhes abaixo.` : '🎉 Todos os dados foram importados sem erros!'}`);
      } else if (result.failedImports > 0) {
        alert(`❌ Falha na importação!\n\n` +
              `${result.failedImports} linhas falharam na importação.\n` +
              `Verifique os erros detalhados abaixo e corrija o arquivo CSV.`);
      }
    } catch (error: any) {
      result.errors.push({
        row: 0,
        error: `File processing error: ${error.message}`,
        data: {}
      });
    }

    setImportResult(result);
    setImporting(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bulk Import Assets</h1>
          <p className="text-gray-600 mt-2">Import multiple ASICs and their hierarchy from a CSV file</p>
        </div>
        
        <Link
          to="/assets"
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assets</span>
        </Link>
      </div>

      {/* Step 1: Download Template */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="bg-primary-100 p-3 rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Download Template</h3>
            <p className="text-gray-600 mb-4">
              Download the CSV template with the correct column structure and example data.
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Template Columns</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-blue-800">
          <div><strong>siteName:</strong> Site identifier (e.g., OHIO)</div>
          <div><strong>siteLocation:</strong> Full site address</div>
          <div><strong>siteCountry:</strong> US or BR</div>
          <div><strong>containerName:</strong> Container ID (e.g., DC_11)</div>
          <div><strong>rackName:</strong> Rack identifier (e.g., Rack 01)</div>
          <div><strong>rackCapacity:</strong> Number of ASICs (default: 24)</div>
          <div><strong>model:</strong> ASIC model</div>
          <div><strong>ipAddress:</strong> ASIC IP address</div>
          <div><strong>macAddress:</strong> MAC address (optional)</div>
          <div><strong>serialNumber:</strong> Unique serial number</div>
          <div><strong>hashRate:</strong> Hash rate in TH/s</div>
          <div><strong>positionLine:</strong> Rack line position</div>
          <div><strong>positionColumn:</strong> Rack column position</div>
          <div><strong>status:</strong> online/offline/maintenance/error</div>
          <div><strong>clientId:</strong> Client ID (optional)</div>
        </div>
      </div>

      {/* Step 2: Upload File */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Upload className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Upload CSV File</h3>
            <p className="text-gray-600 mb-4">
              Upload your populated CSV file to import the assets.
            </p>
            
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-lg font-medium text-gray-900">Drop your CSV file here</p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Select CSV File
                  </label>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-4">
                <button
                  onClick={processImport}
                  disabled={importing}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Import...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Start Import</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h3>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Rows</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{importResult.totalRows}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Successful</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{importResult.successfulImports}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-1">{importResult.failedImports}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-900">Created</span>
              </div>
              <p className="text-sm text-purple-800 mt-1">
                {importResult.created.sites} sites, {importResult.created.containers} containers,<br />
                {importResult.created.racks} racks, {importResult.created.asics} ASICs
              </p>
            </div>
          </div>

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-3">Import Errors</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-red-800">Row {error.row}:</span>
                    <span className="text-red-700 ml-2">{error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importResult.successfulImports > 0 && (
            <div className="mt-4">
              <Link
                to="/assets"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <span>View Imported Assets</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImportPage;