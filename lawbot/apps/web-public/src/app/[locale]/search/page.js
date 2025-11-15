'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, FileText, Filter, X } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default function SearchPage() {
    const t = useTranslations('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        dateFrom: '',
        dateTo: '',
    });
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim())
            return;
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            const mockResults = [
                {
                    id: '1',
                    title: 'Bộ luật Dân sự 2015',
                    code: '91/2015/QH13',
                    category: 'Luật Dân Sự',
                    date: '2015-11-24',
                    excerpt: 'Bộ luật này quy định về thể nhân, pháp nhân, quyền sở hữu và các quyền khác...',
                    relevance: 95,
                },
                {
                    id: '2',
                    title: 'Nghị định 45/2020/NĐ-CP',
                    code: '45/2020/NĐ-CP',
                    category: 'Luật Dân Sự',
                    date: '2020-04-08',
                    excerpt: 'Nghị định này quy định chi tiết một số điều của Bộ luật Dân sự...',
                    relevance: 87,
                },
                {
                    id: '3',
                    title: 'Luật Hợp đồng 2023',
                    code: '23/2023/QH15',
                    category: 'Luật Dân Sự',
                    date: '2023-06-15',
                    excerpt: 'Luật này quy định về giao kết hợp đồng, thực hiện hợp đồng...',
                    relevance: 82,
                },
            ];
            setResults(mockResults);
        }
        catch (error) {
            console.error('Search failed:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const clearFilters = () => {
        setFilters({
            category: '',
            dateFrom: '',
            dateTo: '',
        });
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-8 text-gray-900", children: "T\u00ECm Ki\u1EBFm V\u0103n B\u1EA3n Ph\u00E1p Lu\u1EADt" }), _jsxs("form", { onSubmit: handleSearch, className: "mb-8", children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: t('placeholder'), className: "w-full px-4 py-3 pr-32 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" }), _jsxs("div", { className: "absolute right-2 top-2 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setShowFilters(!showFilters), className: `p-2 rounded-lg transition-colors ${showFilters
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, "aria-label": "Toggle filters", children: _jsx(Filter, { className: "w-5 h-5" }) }), _jsxs("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2", children: [_jsx(Search, { className: "w-5 h-5" }), _jsx("span", { className: "hidden sm:inline", children: t('button') })] })] })] }), showFilters && (_jsxs("div", { className: "mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: "B\u1ED9 l\u1ECDc" }), _jsxs("button", { type: "button", onClick: clearFilters, className: "text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1", children: [_jsx(X, { className: "w-4 h-4" }), "X\u00F3a b\u1ED9 l\u1ECDc"] })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Danh m\u1EE5c" }), _jsxs("select", { value: filters.category, onChange: (e) => setFilters({ ...filters, category: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "T\u1EA5t c\u1EA3" }), _jsx("option", { value: "dan-su", children: "Lu\u1EADt D\u00E2n S\u1EF1" }), _jsx("option", { value: "lao-dong", children: "Lu\u1EADt Lao \u0110\u1ED9ng" }), _jsx("option", { value: "doanh-nghiep", children: "Lu\u1EADt Doanh Nghi\u1EC7p" }), _jsx("option", { value: "hinh-su", children: "Lu\u1EADt H\u00ECnh S\u1EF1" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "T\u1EEB ng\u00E0y" }), _jsx("input", { type: "date", value: filters.dateFrom, onChange: (e) => setFilters({ ...filters, dateFrom: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0110\u1EBFn ng\u00E0y" }), _jsx("input", { type: "date", value: filters.dateTo, onChange: (e) => setFilters({ ...filters, dateTo: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })] })] }))] }), loading && (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: t('loading') })] }) })), !loading && results.length > 0 && (_jsxs("div", { children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsxs("h2", { className: "text-xl font-semibold text-gray-900", children: [t('results'), " (", results.length, ")"] }) }), _jsx("div", { className: "space-y-4", children: results.map((result) => (_jsx("a", { href: "#", className: "block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx(FileText, { className: "w-6 h-6 text-gray-400 group-hover:text-blue-600 mt-1 flex-shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2", children: result.title }), _jsx("p", { className: "text-gray-600 mb-3", children: result.excerpt }), _jsxs("div", { className: "flex flex-wrap gap-3 text-sm", children: [_jsx("span", { className: "px-2 py-1 bg-blue-50 text-blue-700 rounded", children: result.code }), _jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-700 rounded", children: result.category }), _jsx("span", { className: "text-gray-500", children: result.date }), _jsxs("span", { className: "ml-auto text-blue-600 font-medium", children: [result.relevance, "% ph\u00F9 h\u1EE3p"] })] })] })] }) }, result.id))) })] })), !loading && results.length === 0 && query && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Search, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: t('noResults') }), _jsx("p", { className: "text-gray-600", children: "Th\u1EED s\u1EED d\u1EE5ng t\u1EEB kh\u00F3a kh\u00E1c ho\u1EB7c \u0111i\u1EC1u ch\u1EC9nh b\u1ED9 l\u1ECDc" })] })), !loading && results.length === 0 && !query && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Search, { className: "w-16 h-16 text-gray-300 mx-auto mb-4" }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "B\u1EAFt \u0111\u1EA7u t\u00ECm ki\u1EBFm" }), _jsx("p", { className: "text-gray-600", children: "Nh\u1EADp t\u1EEB kh\u00F3a \u0111\u1EC3 t\u00ECm ki\u1EBFm v\u0103n b\u1EA3n ph\u00E1p lu\u1EADt" })] }))] }));
}
