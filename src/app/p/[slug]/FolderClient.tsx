'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, FileText, Image as ImageIcon, File, Trash2, ExternalLink } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import styles from './page.module.css';

interface FileData {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface TextBlock {
  id: string;
  content: string;
}

export function FolderClient({ 
  initialFolder, 
  initialFiles, 
  initialTexts 
}: { 
  initialFolder: any, 
  initialFiles: FileData[], 
  initialTexts: TextBlock[] 
}) {
  const folder = initialFolder;
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>(initialTexts);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    if (!folder) return;
    setUploading(true);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${folder.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lon_nuvem')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('lon_nuvem')
          .getPublicUrl(filePath);

        const newFile = {
          folder_id: folder.id,
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        };

        const { data, error: dbError } = await supabase.from('lon_files').insert([newFile]).select();
        if (dbError) {
          console.error("DB Error:", dbError);
          alert("Erro ao salvar arquivo no banco: " + dbError.message);
        } else if (data) {
          setFiles(prev => [data[0], ...prev]);
        }
      } else {
        console.error("Upload Error:", uploadError);
        alert("Erro no upload do arquivo: " + uploadError.message);
      }
    }
    setUploading(false);
  };

  async function createTextBlock() {
    if (!folder) return;
    const { data } = await supabase
      .from('lon_text_blocks')
      .insert([{ folder_id: folder.id, content: '' }])
      .select();
    
    if (data) {
      setTextBlocks([...textBlocks, data[0]]);
    }
  }

  async function updateTextBlock(id: string, content: string) {
    const { error } = await supabase
      .from('lon_text_blocks')
      .update({ content })
      .eq('id', id);
    if (!error) {
      setTextBlocks(textBlocks.map(tb => tb.id === id ? { ...tb, content } : tb));
    }
  }

  async function deleteTextBlock(id: string) {
    const { error } = await supabase.from('lon_text_blocks').delete().eq('id', id);
    if (!error) {
      setTextBlocks(textBlocks.filter(tb => tb.id !== id));
    }
  }

  async function moveFileToTrash(id: string) {
    const { error } = await supabase
      .from('lon_files')
      .update({ is_trash: true, deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setFiles(files.filter(f => f.id !== id));
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{folder.name}</h1>
        <button className="btn-secondary" onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copiado!');
        }}>
          <ExternalLink size={16} /> Copiar Link Público
        </button>
      </div>

      <div className={styles.container}>
        <div 
          className={`${styles.uploadZone} ${dragActive ? styles.dragActive : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            style={{ display: 'none' }} 
          />
          <UploadCloud size={48} style={{ margin: '0 auto 16px' }} />
          <p>{uploading ? 'Enviando arquivos...' : 'Arraste arquivos aqui ou clique para selecionar'}</p>
        </div>

        <div>
          <div className={styles.sectionTitle}>
            Arquivos
          </div>
          <div className={styles.grid}>
            {files.length === 0 && (
               <div style={{ color: 'var(--text-secondary)' }}>Nenhum arquivo nesta pasta.</div>
            )}
            {files.map(f => {
              const isImage = f.type?.startsWith('image/');
              return (
                <div key={f.id} className={styles.fileCard}>
                  <div className={styles.fileActions}>
                    <button className={styles.actionBtn} onClick={() => moveFileToTrash(f.id)}><Trash2 size={14}/></button>
                  </div>
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <div className={styles.filePreview}>
                      {isImage ? (
                        <img src={f.url} alt={f.name} />
                      ) : f.type === 'application/pdf' ? (
                        <FileText size={32} />
                      ) : (
                        <File size={32} />
                      )}
                    </div>
                  </a>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName} title={f.name}>{f.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className={styles.sectionTitle}>
            Blocos de Texto
            <button className="btn-secondary" onClick={createTextBlock}>
              <FileText size={16} /> Novo Bloco
            </button>
          </div>
          <div className={styles.textBlocksList}>
            {textBlocks.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>Nenhum bloco de texto criado.</div>
            )}
            {textBlocks.map(tb => (
              <div key={tb.id} className={styles.textBlock}>
                <textarea 
                  defaultValue={tb.content}
                  placeholder="Escreva algo aqui..."
                  onBlur={(e) => updateTextBlock(tb.id, e.target.value)}
                />
                <div className={styles.textBlockActions}>
                  <button className="btn-icon" onClick={() => deleteTextBlock(tb.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Renderização extra invisível mas legível para SEO rígido se o componente cliente re-renderizar vazio, 
            embora com hydrate do Next.js o HTML já venha preenchido e isso não seja necessário. */}
      </div>
    </>
  );
}
