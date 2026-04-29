import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: folder } = await supabase
    .from('lon_folders')
    .select('*')
    .eq('slug', slug)
    .eq('is_trash', false)
    .single();

  if (!folder) {
    return new Response('<html><body><h1>Pasta não encontrada</h1></body></html>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const { data: files } = await supabase
    .from('lon_files')
    .select('*')
    .eq('folder_id', folder.id)
    .eq('is_trash', false)
    .order('created_at', { ascending: false });

  const { data: textBlocks } = await supabase
    .from('lon_text_blocks')
    .select('*')
    .eq('folder_id', folder.id)
    .order('created_at', { ascending: true });

  const imageFiles = (files || []).filter((f: any) => f.type?.startsWith('image/'));
  const otherFiles = (files || []).filter((f: any) => !f.type?.startsWith('image/'));

  // Build pure HTML string - zero JavaScript, zero React
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${folder.name} - Lon Nuvem</title>
  <meta name="description" content="Pasta pública: ${folder.name}. Contém ${(files || []).length} arquivo(s) e ${(textBlocks || []).length} bloco(s) de texto.">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #1a1a1a; padding: 40px 20px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { font-size: 20px; margin: 32px 0 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; color: #374151; }
    .subtitle { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
    .text-block { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; white-space: pre-wrap; }
    .file-item { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .file-item img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 12px; display: block; }
    .file-name { font-weight: 600; margin-bottom: 4px; }
    .file-link { color: #2563eb; word-break: break-all; font-size: 13px; display: block; margin-top: 4px; }
    .empty { color: #9ca3af; padding: 20px; text-align: center; }
    .badge { display: inline-block; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #6b7280; margin-left: 8px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(folder.name)}</h1>
  <p class="subtitle">Pasta pública do Lon Nuvem — ${(files || []).length} arquivo(s) | ${(textBlocks || []).length} bloco(s) de texto</p>

  ${(textBlocks && textBlocks.length > 0) ? `
  <h2>Blocos de Texto</h2>
  ${textBlocks.map((tb: any) => `
  <div class="text-block">${escapeHtml(tb.content || '(vazio)')}</div>
  `).join('')}
  ` : ''}

  ${imageFiles.length > 0 ? `
  <h2>Imagens (${imageFiles.length})</h2>
  ${imageFiles.map((f: any) => `
  <div class="file-item">
    <img src="${escapeHtml(f.url)}" alt="${escapeHtml(f.name)}">
    <div class="file-name">${escapeHtml(f.name)}</div>
    <a class="file-link" href="${escapeHtml(f.url)}" target="_blank">${escapeHtml(f.url)}</a>
  </div>
  `).join('')}
  ` : ''}

  ${otherFiles.length > 0 ? `
  <h2>Outros Arquivos (${otherFiles.length})</h2>
  ${otherFiles.map((f: any) => `
  <div class="file-item">
    <div class="file-name">${escapeHtml(f.name)} <span class="badge">${escapeHtml(f.type || 'arquivo')}</span></div>
    <a class="file-link" href="${escapeHtml(f.url)}" target="_blank">${escapeHtml(f.url)}</a>
  </div>
  `).join('')}
  ` : ''}

  ${(files || []).length === 0 && (textBlocks || []).length === 0 ? `
  <p class="empty">Esta pasta está vazia.</p>
  ` : ''}

  <div class="footer">Lon Nuvem — Drive Minimalista</div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
