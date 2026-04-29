'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UploadCloud, FileText, File, Trash2, ExternalLink, Save, Share2, Loader2 } from 'lucide-react';
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  const [generatingLink, setGeneratingLink] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);
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

  // Generate a static HTML file and upload it to Supabase Storage
  async function generatePublicPage() {
    setGeneratingLink(true);
    
    const imageFiles = files.filter(f => f.type?.startsWith('image/'));
    const otherFiles = files.filter(f => !f.type?.startsWith('image/'));

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(folder.name)} - Lon Nuvem</title>
<meta name="description" content="Pasta publica: ${escapeHtml(folder.name)}. Contem ${files.length} arquivo(s) e ${textBlocks.length} bloco(s) de texto.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#1a1a1a;padding:40px 20px;max-width:900px;margin:0 auto;line-height:1.6}
h1{font-size:28px;margin-bottom:4px}
h2{font-size:20px;margin:32px 0 16px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;color:#374151}
.sub{color:#6b7280;margin-bottom:32px;font-size:14px}
.tb{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;white-space:pre-wrap}
.fi{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:16px}
.fi img{max-width:100%;height:auto;border-radius:8px;margin-bottom:12px;display:block}
.fn{font-weight:600;margin-bottom:4px}
.fl{color:#2563eb;word-break:break-all;font-size:13px;display:block;margin-top:4px}
.em{color:#9ca3af;padding:20px;text-align:center}
.bd{display:inline-block;background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:12px;color:#6b7280;margin-left:8px}
.ft{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center}
</style>
</head>
<body>
<h1>${escapeHtml(folder.name)}</h1>
<p class="sub">Pasta publica do Lon Nuvem — ${files.length} arquivo(s) | ${textBlocks.length} bloco(s) de texto</p>
${textBlocks.length > 0 ? `<h2>Blocos de Texto</h2>
${textBlocks.map(tb => `<div class="tb">${escapeHtml(tb.content || '(vazio)')}</div>`).join('\n')}` : ''}
${imageFiles.length > 0 ? `<h2>Imagens (${imageFiles.length})</h2>
${imageFiles.map(f => `<div class="fi">
<img src="${escapeHtml(f.url)}" alt="${escapeHtml(f.name)}">
<div class="fn">${escapeHtml(f.name)}</div>
<a class="fl" href="${escapeHtml(f.url)}" target="_blank">${escapeHtml(f.url)}</a>
</div>`).join('\n')}` : ''}
${otherFiles.length > 0 ? `<h2>Outros Arquivos (${otherFiles.length})</h2>
${otherFiles.map(f => `<div class="fi">
<div class="fn">${escapeHtml(f.name)} <span class="bd">${escapeHtml(f.type || 'arquivo')}</span></div>
<a class="fl" href="${escapeHtml(f.url)}" target="_blank">${escapeHtml(f.url)}</a>
</div>`).join('\n')}` : ''}
${files.length === 0 && textBlocks.length === 0 ? '<p class="em">Esta pasta esta vazia.</p>' : ''}
<div class="ft">Lon Nuvem</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const filePath = `_share/${folder.slug}.html`;

    // Delete old version if exists
    await supabase.storage.from('lon_nuvem').remove([filePath]);

    // Upload new HTML
    const { error } = await supabase.storage
      .from('lon_nuvem')
      .upload(filePath, blob, {
        contentType: 'text/html',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading share page:', error);
      alert('Erro ao gerar página: ' + error.message);
      setGeneratingLink(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('lon_nuvem')
      .getPublicUrl(filePath);

    setPublicLink(publicUrl);
    navigator.clipboard.writeText(publicUrl);
    alert('Link público gerado e copiado!\n\n' + publicUrl);
    setGeneratingLink(false);
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{folder.name}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={generatePublicPage} disabled={generatingLink}>
            {generatingLink ? <Loader2 size={16} className="spinning" /> : <Share2 size={16} />}
            {generatingLink ? 'Gerando...' : 'Gerar Link para IA'}
          </button>
        </div>
      </div>

      {publicLink && (
        <div style={{ 
          margin: '0 32px 16px', 
          padding: '12px 16px', 
          background: '#ecfdf5', 
          border: '1px solid #a7f3d0', 
          borderRadius: '12px',
          fontSize: '13px',
          wordBreak: 'break-all'
        }}>
          <strong>Link público (cole no ChatGPT):</strong><br/>
          <a href={publicLink} target="_blank" rel="noreferrer" style={{ color: '#059669' }}>{publicLink}</a>
        </div>
      )}

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
                  id={`text-${tb.id}`}
                  defaultValue={tb.content}
                  placeholder="Escreva algo aqui..."
                />
                <div className={styles.textBlockActions}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      const val = (document.getElementById(`text-${tb.id}`) as HTMLTextAreaElement).value;
                      updateTextBlock(tb.id, val);
                      alert('Texto salvo!');
                    }}
                  >
                    <Save size={16} /> Salvar
                  </button>
                  <button className="btn-icon" onClick={() => deleteTextBlock(tb.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                    <a 
                      href={f.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={styles.fileUrl}
                      title={f.url}
                    >{f.url}</a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  );
}
