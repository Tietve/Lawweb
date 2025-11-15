'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, ChevronRight } from 'lucide-react';
export default function CategoriesPage() {
    const t = useTranslations('categories');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchCategories();
    }, []);
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const mockCategories = [
                {
                    id: '1',
                    name: 'Luật Dân Sự',
                    description: 'Các quy định về dân sự, hợp đồng, thừa kế',
                    documentCount: 45,
                },
                {
                    id: '2',
                    name: 'Luật Lao Động',
                    description: 'Quyền và nghĩa vụ của người lao động',
                    documentCount: 32,
                },
                {
                    id: '3',
                    name: 'Luật Doanh Nghiệp',
                    description: 'Thành lập, hoạt động và giải thể doanh nghiệp',
                    documentCount: 28,
                },
                {
                    id: '4',
                    name: 'Luật Hình Sự',
                    description: 'Các tội phạm và hình phạt',
                    documentCount: 56,
                },
                {
                    id: '5',
                    name: 'Luật Đất Đai',
                    description: 'Quyền sử dụng đất và quản lý đất đai',
                    documentCount: 38,
                },
            ];
            setCategories(mockCategories);
        }
        catch (error) {
            console.error('Failed to fetch categories:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        const mockDocs = [
            {
                id: '1',
                title: `${category.name} 2015`,
                code: '91/2015/QH13',
                date: '2015-11-24',
            },
            {
                id: '2',
                title: `Nghị định hướng dẫn thi hành ${category.name}`,
                code: '45/2020/NĐ-CP',
                date: '2020-04-08',
            },
            {
                id: '3',
                title: `Thông tư số 01 về ${category.name}`,
                code: '01/2021/TT-BTP',
                date: '2021-01-15',
            },
        ];
        setDocuments(mockDocs);
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: t('loading') })] }) }));
    }
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-8 text-gray-900", children: t('title') }), _jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [_jsx("div", { className: "space-y-4", children: categories.map((category) => (_jsx("div", { onClick: () => handleCategoryClick(category), className: `p-6 rounded-lg border-2 cursor-pointer transition-all ${selectedCategory?.id === category.id
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300 bg-white'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold mb-2 text-gray-900", children: category.name }), _jsx("p", { className: "text-gray-600 mb-2", children: category.description }), _jsxs("p", { className: "text-sm text-gray-500", children: [category.documentCount, " v\u0103n b\u1EA3n"] })] }), _jsx(ChevronRight, { className: `w-6 h-6 transition-colors ${selectedCategory?.id === category.id
                                            ? 'text-blue-600'
                                            : 'text-gray-400'}` })] }) }, category.id))) }), _jsx("div", { className: "sticky top-24 h-fit", children: selectedCategory ? (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-gray-900", children: selectedCategory.name }), _jsx("p", { className: "text-gray-600 mb-6", children: selectedCategory.description }), _jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "font-semibold text-gray-900", children: [t('documents'), ":"] }), documents.map((doc) => (_jsxs("a", { href: "#", className: "flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group", children: [_jsx(FileText, { className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 mt-0.5" }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 group-hover:text-blue-600 mb-1", children: doc.title }), _jsxs("div", { className: "text-sm text-gray-500", children: [_jsx("span", { children: doc.code }), _jsx("span", { className: "mx-2", children: "\u2022" }), _jsx("span", { children: doc.date })] })] })] }, doc.id)))] })] })) : (_jsxs("div", { className: "bg-gray-50 rounded-lg border border-gray-200 p-12 text-center", children: [_jsx(FileText, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Ch\u1ECDn m\u1ED9t danh m\u1EE5c \u0111\u1EC3 xem chi ti\u1EBFt v\u0103n b\u1EA3n" })] })) })] })] }));
}
