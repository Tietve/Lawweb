export default function GlobalNotFound() {
  return (
    <html lang="vi">
      <head>
        <title>404 - Not Found</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              404
            </h1>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Trang không tồn tại
            </p>
            <a
              href="/vi"
              style={{ color: '#2563eb', textDecoration: 'underline' }}
            >
              Về trang chủ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
