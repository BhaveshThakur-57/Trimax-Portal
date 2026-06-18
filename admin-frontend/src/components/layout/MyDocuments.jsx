import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FolderOpen, FileText, Upload, Eye, Download, X, Trash2, CheckCircle, Image } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MyDocuments = () => {
  const [documents, setDocuments]               = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploadModal, setUploadModal]           = useState(false);
  const [uploadCategory, setUploadCategory]     = useState('Other');
  const [pendingFile, setPendingFile]           = useState(null);
  const [uploading, setUploading]               = useState(false);
  const [uploadProgress, setUploadProgress]     = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [success, setSuccess]                   = useState('');
  const [error, setError]                       = useState('');
  const [viewDoc, setViewDoc]                   = useState(null);
  const [dragOver, setDragOver]                 = useState(false);
  const [docxHtml, setDocxHtml]                 = useState('');
  const [docxLoading, setDocxLoading]           = useState(false);
  const fileInputRef                            = useRef();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const categories = ['All', 'Onboarding', 'Identity', 'Tax', 'Benefits', 'Other'];
  const token      = () => localStorage.getItem('token');
  const headers    = () => ({ Authorization: `Bearer ${token()}` });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_URL}/api/documents/my-documents`, { headers: headers() });
      const data = await res.json();
      if (data.success) setDocuments(data.data || []);
      else setError(data.message || 'Failed to fetch documents');
    } catch { setError('Failed to load documents'); }
    finally  { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocuments(); }, []);

  useEffect(() => {
    if (!viewDoc) { setDocxHtml(''); return; }
    const isDocx = viewDoc.mimeType?.includes('word') ||
                   viewDoc.mimeType?.includes('document') ||
                   ['.docx', '.doc'].includes(viewDoc.fileExtension);
    if (!isDocx) { setDocxHtml(''); return; }

    const convertDocx = async () => {
      try {
        setDocxLoading(true);
        const res    = await fetch(`${API_URL}/api/documents/view/${viewDoc._id}`, { headers: headers() });
        const buffer = await res.arrayBuffer();
        const mammoth = await import('mammoth');
        const result  = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setDocxHtml(result.value);
      } catch (err) {
        console.error('DOCX convert error:', err);
        setDocxHtml('<p style="color:red">Preview failed. Please download.</p>');
      } finally { setDocxLoading(false); }
    };
    convertDocx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDoc]);

  const handleUpload = async (file, category) => {
    if (!file) return;
    const allowed = [
      'application/pdf', 'image/jpeg', 'image/png', 'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) { setError('Only PDF, Word, JPG, PNG files allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be under 10MB'); return; }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    const interval = setInterval(() => {
      setUploadProgress(p => { if (p >= 80) { clearInterval(interval); return p; } return p + 15; });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('category', category);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

      const res  = await fetch(`${API_URL}/api/documents/upload`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body:    formData,
      });
      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success) {
        setSuccess(`"${file.name}" uploaded successfully!`);
        setTimeout(() => setSuccess(''), 3000);
        fetchDocuments();
        setUploadModal(false);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch { setError('Upload failed. Please try again.'); }
    finally  { setUploading(false); setUploadProgress(0); clearInterval(interval); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res  = await fetch(`${API_URL}/api/documents/${id}`, { method: 'DELETE', headers: headers() });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d._id !== id));
        if (viewDoc?._id === id) setViewDoc(null);
        setSuccess('Document deleted');
        setTimeout(() => setSuccess(''), 2000);
      } else setError(data.message || 'Delete failed');
    } catch { setError('Delete failed'); }
  };

  const handleDownload = async (doc) => {
    try {
      const res  = await fetch(`${API_URL}/api/documents/download/${doc._id}`, { headers: headers() });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = doc.name + (doc.fileExtension || '');
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Download failed'); }
  };

  const previewUrl = (doc) => `${API_URL}/api/documents/view/${doc._id}?token=${token()}`;

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setPendingFile(file); setUploadModal(true); }
  };

  const getFileIcon = (mime = '') => {
    if (mime.includes('pdf'))                               return { bg:'bg-red-100',    color:'text-red-600'    };
    if (mime.includes('word') || mime.includes('document')) return { bg:'bg-blue-100',   color:'text-blue-600'   };
    if (mime.includes('image'))                             return { bg:'bg-green-100',  color:'text-green-600'  };
    return                                                         { bg:'bg-brand-100', color:'text-brand-600' };
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredDocs = selectedCategory === 'All'
    ? documents
    : documents.filter(d => d.category === selectedCategory);

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <FolderOpen size={30} strokeWidth={2.5} className="relative z-10 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-[34px] font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-slate-700 via-brand-800 to-brand-600 tracking-tight leading-tight pb-1 mb-0.5">
              My Documents
            </h1>
            <p className="text-[14px] sm:text-[15px] font-medium text-slate-500">
              Upload, view and download your official documents
            </p>
          </div>
        </div>
        <button
          onClick={() => setUploadModal(true)}
          className="px-3 py-2 sm:px-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 sm:gap-2 font-medium text-sm sm:text-base flex-shrink-0"
        >
          <Upload size={16} />
          <span className="hidden xs:inline">Upload </span>Doc
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <CheckCircle size={16} className="flex-shrink-0" /> <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="flex-shrink-0"><X size={16} /></button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between mb-2">
            <span className="text-blue-700 text-sm font-medium">Uploading...</span>
            <span className="text-blue-600 text-sm font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Drag & Drop Zone — hidden on touch-only mobile to avoid accidental taps */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => setUploadModal(true)}
        className={`border-2 border-dashed rounded-2xl p-5 sm:p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <Upload size={26} className={`mx-auto mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className={`text-sm font-medium ${dragOver ? 'text-blue-600' : 'text-gray-600'}`}>
          {dragOver ? '📂 Drop here!' : 'Drag & drop or tap to upload'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, Word, JPG, PNG — Max 10MB</p>
      </div>

      <input ref={fileInputRef} type="file" className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={e => { if (e.target.files[0]) { setPendingFile(e.target.files[0]); setUploadModal(true); }}}
      />

      {/* Category Filter — horizontally scrollable */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-xs sm:text-sm flex-shrink-0 ${
              selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1 opacity-60 text-xs">({documents.filter(d => d.category === cat).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FileText className="mx-auto text-gray-300 mb-4" size={56} />
          <p className="text-gray-500 font-medium">No documents found</p>
          <p className="text-gray-400 text-sm mt-1">Upload using the button above</p>
        </div>
      ) : (
        /* 1 col mobile, 2 col tablet, 3 col desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredDocs.map(doc => {
            const icon  = getFileIcon(doc.mimeType);
            const isImg = doc.mimeType?.includes('image');
            return (
              <div key={doc._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all group"
              >
                {/* Top row: icon + category + delete */}
                <div className="flex items-start justify-between mb-3">
                  {isImg ? (
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200 flex-shrink-0">
                      <img src={previewUrl(doc)} alt={doc.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`p-3 ${icon.bg} rounded-2xl flex-shrink-0`}>
                      <FileText className={icon.color} size={22} />
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {doc.category}
                    </span>
                    {/* Delete always visible on mobile (no hover needed), hidden on desktop until hover */}
                    <button onClick={() => handleDelete(doc._id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Document name */}
                <h3 className="font-semibold text-gray-800 mb-1 truncate text-sm" title={doc.name}>{doc.name}</h3>

                {/* Meta info */}
                <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                  <p>{formatSize(doc.fileSize)} • {(doc.fileExtension || '').toUpperCase().replace('.','')}</p>
                  <p>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</p>
                </div>

                {/* Employee Name Badge */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '11px', flexShrink: 0
                  }}>
                    {(doc.uploadedBy?.name || currentUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {doc.uploadedBy?.name || currentUser.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {doc.uploadedBy?.employeeId || currentUser.employeeId || ''}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setViewDoc(doc)}
                    className="flex-1 px-2 py-2 sm:px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium">
                    <Eye size={14} /> View
                  </button>
                  <button onClick={() => handleDownload(doc)}
                    className="flex-1 px-2 py-2 sm:px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium">
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload Modal ── */}
      {uploadModal && createPortal((
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4"
          onClick={() => { setUploadModal(false); setPendingFile(null); }}
        >
          {/* Bottom sheet on mobile, centered card on sm+ */}
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — visible only on mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Upload Document</h2>
              <button onClick={() => { setUploadModal(false); setPendingFile(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Employee info preview in modal */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-brand-50 rounded-2xl border border-blue-100">
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '14px', flexShrink: 0
                }}>
                  {(currentUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name || 'Employee'}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser.employeeId || ''}{currentUser.department ? ` • ${currentUser.department}` : ''}
                  </p>
                </div>
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex-shrink-0">
                  Uploading
                </span>
              </div>

              {pendingFile ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    {pendingFile.type.includes('image')
                      ? <Image size={20} className="text-blue-600" />
                      : <FileText size={20} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{pendingFile.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(pendingFile.size)}</p>
                  </div>
                  <button onClick={() => setPendingFile(null)} className="p-1 hover:bg-blue-200 rounded flex-shrink-0">
                    <X size={14} className="text-blue-600" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={e => setPendingFile(e.target.files[0])}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['Onboarding','Identity','Tax','Benefits','Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => { setUploadModal(false); setPendingFile(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Cancel
              </button>
              <button onClick={() => pendingFile && handleUpload(pendingFile, uploadCategory)}
                disabled={!pendingFile || uploading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2">
                <Upload size={16} /> Upload
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* ── Preview Modal ── */}
      {viewDoc && createPortal((
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-2 sm:p-4"
          onClick={() => setViewDoc(null)}
        >
          {/* Full-height on mobile, max-w on desktop */}
          <div
            className="bg-white rounded-2xl sm:rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl"
            style={{ height: 'calc(100dvh - 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-3 sm:p-4 border-b flex-shrink-0 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`p-1.5 sm:p-2 ${getFileIcon(viewDoc.mimeType).bg} rounded-lg flex-shrink-0`}>
                  <FileText size={16} className={getFileIcon(viewDoc.mimeType).color} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">{viewDoc.name}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {viewDoc.uploadedBy?.name || currentUser.name} • {viewDoc.category} • {formatSize(viewDoc.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button onClick={() => handleDownload(viewDoc)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium">
                  <Download size={14} />
                  <span className="hidden xs:inline">Download</span>
                </button>
                <button onClick={() => setViewDoc(null)} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-hidden rounded-b-xl sm:rounded-b-2xl bg-gray-100">
              {viewDoc.mimeType?.includes('image') ? (
                <div className="w-full h-full flex items-center justify-center p-4 sm:p-6">
                  <img src={previewUrl(viewDoc)} alt={viewDoc.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : viewDoc.mimeType?.includes('pdf') ? (
                <iframe src={previewUrl(viewDoc)} className="w-full h-full rounded-b-xl sm:rounded-b-2xl" title={viewDoc.name} />
              ) : (viewDoc.mimeType?.includes('word') || viewDoc.mimeType?.includes('document')) ? (
                <div className="w-full h-full overflow-auto bg-white">
                  {docxLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
                      <p className="text-gray-500 text-sm">Loading document...</p>
                    </div>
                  ) : (
                    <div className="max-w-3xl mx-auto p-4 sm:p-8">
                      <div className="flex items-center gap-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                        <div className="p-1.5 bg-blue-600 rounded">
                          <FileText size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">{viewDoc.name}.docx</span>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded flex-shrink-0">Word Document</span>
                      </div>
                      <div
                        style={{  fontSize: '14px', lineHeight: '1.8', color: '#1a1a1a' }}
                        dangerouslySetInnerHTML={{ __html: docxHtml || '<p class="text-gray-400">Content not loaded...</p>' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FileText size={64} className="mb-4 text-gray-300" />
                  <p className="font-medium">Preview not available</p>
                  <button onClick={() => handleDownload(viewDoc)}
                    className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium">
                    <Download size={16} /> Download
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default MyDocuments;