export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 40px 20px; max-width: 900px; margin: 0 auto; }
          h1 { font-size: 28px; margin-bottom: 8px; }
          h2 { font-size: 20px; margin: 32px 0 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .subtitle { color: #666; margin-bottom: 32px; font-size: 14px; }
          .text-block { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin-bottom: 16px; white-space: pre-wrap; line-height: 1.6; }
          .file-item { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .file-item img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 12px; display: block; }
          .file-name { font-weight: 600; margin-bottom: 4px; }
          .file-link { color: #0066cc; word-break: break-all; font-size: 13px; display: block; margin-top: 4px; }
          .empty { color: #999; padding: 20px; }
          .badge { display: inline-block; background: #e8e8e8; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #666; margin-left: 8px; }
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
