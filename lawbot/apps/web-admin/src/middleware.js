import { NextResponse } from 'next/server';
const publicPaths = ['/login'];
export function middleware(request) {
    const { pathname } = request.nextUrl;
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }
    const token = request.cookies.get('admin_token')?.value;
    if (!token && pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
}
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
