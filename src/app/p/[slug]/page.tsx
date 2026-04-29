import { supabase } from '@/lib/supabase';
import { FolderClient } from './FolderClient';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const { data } = await supabase
    .from('lon_folders')
    .select('name')
    .eq('slug', resolvedParams.slug)
    .single();

  return {
    title: data ? `${data.name} - Lon Nuvem` : 'Pasta não encontrada',
    description: `Pasta contendo arquivos e textos.`,
  };
}

export default async function FolderPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  
  const { data: folderData } = await supabase
    .from('lon_folders')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .eq('is_trash', false)
    .single();

  if (!folderData) {
    return <div className="page-header">Pasta não encontrada ou enviada para a lixeira.</div>;
  }

  const { data: filesData } = await supabase
    .from('lon_files')
    .select('*')
    .eq('folder_id', folderData.id)
    .eq('is_trash', false)
    .order('created_at', { ascending: false });

  const { data: textsData } = await supabase
    .from('lon_text_blocks')
    .select('*')
    .eq('folder_id', folderData.id)
    .order('created_at', { ascending: true });

  return (
    <>
      <FolderClient 
        initialFolder={folderData} 
        initialFiles={filesData || []} 
        initialTexts={textsData || []} 
      />
      
      {/* Fallback explicit semantic block for strict dumb bots that scrape pure HTML without executing JS */}
      <div style={{ display: 'none' }} aria-hidden="true" className="bot-seo-content">
        <article>
          <h1>{folderData.name} - Conteúdos da Pasta</h1>
          <section>
            <h2>Textos</h2>
            {textsData?.map((tb) => (
              <p key={tb.id}>{tb.content}</p>
            ))}
          </section>
          <section>
            <h2>Arquivos e Imagens</h2>
            <ul>
              {filesData?.map((f) => (
                <li key={f.id}>
                  {f.name} - <a href={f.url}>Link do arquivo</a>
                  {f.type?.startsWith('image/') && <img src={f.url} alt={f.name} />}
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </>
  );
}
