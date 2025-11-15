import { jsx as _jsx } from "react/jsx-runtime";
import './globals.css';
export const metadata = {
    title: 'LawBot Admin Dashboard',
    description: 'Admin dashboard for LawBot management',
};
export default function RootLayout({ children, }) {
    return (_jsx("html", { lang: "vi", children: _jsx("body", { children: children }) }));
}
