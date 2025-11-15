'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
export default function ContentPage() {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('general');
    useEffect(() => {
        loadDocuments();
    }, []);
    const loadDocuments = async () => {
        try {
            const data = await api.get('/api/v1/admin/documents');
            setDocuments(data);
        }
        catch (error) {
            console.error('Failed to load documents:', error);
            setDocuments([
                {
                    id: '1',
                    filename: 'luat-lao-dong-2019.pdf',
                    category: 'general',
                    status: 'indexed',
                    size: 2048000,
                    uploaded_at: new Date().toISOString(),
                },
            ]);
        }
    };
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (!files)
            return;
        setUploading(true);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('document', file);
            formData.append('category', selectedCategory);
            try {
                await fetch('/api/v1/admin/documents', {
                    method: 'POST',
                    body: formData,
                });
            }
            catch (error) {
                console.error('Upload failed:', error);
            }
        }
        setUploading(false);
        loadDocuments();
        event.target.value = '';
    };
    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/v1/admin/documents/${id}`);
            loadDocuments();
        }
        catch (error) {
            console.error('Delete failed:', error);
        }
    };
    const handleReindex = async (id) => {
        try {
            await api.post(`/api/v1/admin/documents/${id}/reindex`, {});
            loadDocuments();
        }
        catch (error) {
            console.error('Reindex failed:', error);
        }
    };
    const getStatusBadge = (status) => {
        const colors = {
            uploaded: 'bg-blue-100 text-blue-800',
            processing: 'bg-yellow-100 text-yellow-800',
            indexed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        };
        const labels = {
            uploaded: 'Đã tải lên',
            processing: 'Đang xử lý',
            indexed: 'Đã lập chỉ mục',
            failed: 'Thất bại',
        };
        return (_jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`, children: labels[status] }));
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };
    return (_jsx(DashboardLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Qu\u1EA3n L\u00FD V\u0103n B\u1EA3n" }), _jsx("p", { className: "text-gray-600 mt-1", children: "T\u1EA3i l\u00EAn v\u00E0 qu\u1EA3n l\u00FD v\u0103n b\u1EA3n ph\u00E1p lu\u1EADt" })] }), _jsxs("div", { className: "bg-white rounded-lg shadow", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "T\u1EA3i L\u00EAn V\u0103n B\u1EA3n M\u1EDBi" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500", children: [_jsx("option", { value: "general", children: "T\u1ED5ng h\u1EE3p" }), _jsx("option", { value: "labor", children: "Lu\u1EADt lao \u0111\u1ED9ng" }), _jsx("option", { value: "civil", children: "Lu\u1EADt d\u00E2n s\u1EF1" }), _jsx("option", { value: "criminal", children: "Lu\u1EADt h\u00ECnh s\u1EF1" }), _jsx("option", { value: "administrative", children: "Lu\u1EADt h\u00E0nh ch\u00EDnh" })] }), _jsxs("label", { className: "flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors", children: [_jsx(Upload, { className: "w-4 h-4 mr-2" }), uploading ? 'Đang tải lên...' : 'Chọn File', _jsx("input", { type: "file", multiple: true, accept: ".pdf,.docx,.txt", onChange: handleFileUpload, disabled: uploading, className: "hidden" })] })] }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: "H\u1ED7 tr\u1EE3: PDF, DOCX, TXT. T\u1ED1i \u0111a 10MB m\u1ED7i file." })] }), _jsxs("div", { className: "p-6", children: [_jsxs("h3", { className: "font-semibold text-gray-900 mb-4", children: ["V\u0103n B\u1EA3n \u0110\u00E3 T\u1EA3i (", documents.length, ")"] }), _jsx("div", { className: "space-y-2", children: documents.map(doc => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-4 flex-1", children: [_jsx(FileText, { className: "w-8 h-8 text-primary-600" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: doc.filename }), _jsxs("div", { className: "flex items-center gap-4 mt-1", children: [_jsx("p", { className: "text-sm text-gray-500", children: formatFileSize(doc.size) }), _jsx("p", { className: "text-sm text-gray-500", children: formatDateTime(doc.uploaded_at) }), getStatusBadge(doc.status)] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handleReindex(doc.id), className: "p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors", title: "L\u1EADp l\u1EA1i ch\u1EC9 m\u1EE5c", children: _jsx(RefreshCw, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => handleDelete(doc.id), className: "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors", title: "X\u00F3a", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, doc.id))) }), documents.length === 0 && (_jsx("div", { className: "text-center py-12 text-gray-500", children: "Ch\u01B0a c\u00F3 v\u0103n b\u1EA3n n\u00E0o. H\u00E3y t\u1EA3i l\u00EAn v\u0103n b\u1EA3n \u0111\u1EA7u ti\u00EAn." }))] })] })] }) }));
}
