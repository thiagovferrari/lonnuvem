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
      {/* Bot-friendly metadata for GPT crawler implicitly happens via next SSR HTML output */}
      <FolderClient 
        initialFolder={folderData} 
        initialFiles={filesData || []} 
        initialTexts={textsData || []} 
      />
    </>
  );
}
