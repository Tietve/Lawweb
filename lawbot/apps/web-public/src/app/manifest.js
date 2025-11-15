export default function manifest() {
    return {
        name: 'LawBot - Tư Vấn Pháp Luật AI',
        short_name: 'LawBot',
        description: 'Giải đáp thắc mắc pháp lý 24/7 với AI',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
