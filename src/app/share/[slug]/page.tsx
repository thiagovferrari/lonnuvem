import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from('lon_folders')
    .select('name')
    .eq('slug', slug)
    .single();

  const title = data ? `${data.name} - Lon Nuvem` : 'Pasta não encontrada';
  return {
    title,
    description: `Acesse os arquivos e imagens da pasta "${data?.name || slug}" no Lon Nuvem.`,
  };
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: folder } = await supabase
    .from('lon_folders')
    .select('*')
    .eq('slug', slug)
    .eq('is_trash', false)
    .single();

  if (!folder) {
    return (
      <div>
        <h1>Pasta não encontrada</h1>
        <p>Esta pasta não existe ou foi removida.</p>
      </div>
    );
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

  const imageFiles = (files || []).filter(f => f.type?.startsWith('image/'));
  const otherFiles = (files || []).filter(f => !f.type?.startsWith('image/'));

  return (
    <div>
      <h1>{folder.name}</h1>
      <p className="subtitle">Pasta pública do Lon Nuvem — {(files || []).length} arquivo(s) | {(textBlocks || []).length} bloco(s) de texto</p>

      {/* BLOCOS DE TEXTO */}
      {(textBlocks && textBlocks.length > 0) && (
        <>
          <h2>Blocos de Texto</h2>
          {textBlocks.map((tb: any) => (
            <div key={tb.id} className="text-block">
              {tb.content || '(vazio)'}
            </div>
          ))}
        </>
      )}

      {/* IMAGENS */}
      {imageFiles.length > 0 && (
        <>
          <h2>Imagens ({imageFiles.length})</h2>
          {imageFiles.map((f: any) => (
            <div key={f.id} className="file-item">
              <img src={f.url} alt={f.name} />
              <div className="file-name">{f.name}</div>
              <a href={f.url} className="file-link" target="_blank" rel="noreferrer">{f.url}</a>
            </div>
          ))}
        </>
      )}

      {/* OUTROS ARQUIVOS */}
      {otherFiles.length > 0 && (
        <>
          <h2>Outros Arquivos ({otherFiles.length})</h2>
          {otherFiles.map((f: any) => (
            <div key={f.id} className="file-item">
              <div className="file-name">{f.name} <span className="badge">{f.type}</span></div>
              <a href={f.url} className="file-link" target="_blank" rel="noreferrer">{f.url}</a>
            </div>
          ))}
        </>
      )}

      {(files || []).length === 0 && (textBlocks || []).length === 0 && (
        <p className="empty">Esta pasta está vazia.</p>
      )}
    </div>
  );
}
