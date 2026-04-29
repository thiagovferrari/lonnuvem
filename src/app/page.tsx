'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import styles from './page.module.css';

interface LonFolder {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function Home() {
  const [folders, setFolders] = useState<LonFolder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchFolders();
  }, []);

  async function fetchFolders() {
    const { data, error } = await supabase
      .from('lon_folders')
      .select('*')
      .eq('is_trash', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFolders(data);
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const slug = uuidv4().split('-')[0] + '-' + newFolderName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data, error } = await supabase
      .from('lon_folders')
      .insert([{ name: newFolderName, slug }])
      .select();

    if (!error && data) {
      setFolders([data[0], ...folders]);
      setIsModalOpen(false);
      setNewFolderName('');
    } else {
      alert('Erro ao criar pasta.');
    }
  }

  async function moveToTrash(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const { error } = await supabase
      .from('lon_folders')
      .update({ is_trash: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setFolders(folders.filter(f => f.id !== id));
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Todas as Pastas</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Nova Pasta
        </button>
      </div>

      <div className={styles.grid}>
        {folders.map(folder => (
          <div 
            key={folder.id} 
            className={styles.folderCard}
            onClick={() => router.push(`/p/${folder.slug}`)}
          >
            <div className={styles.folderActions}>
              <button className={styles.actionBtn} onClick={(e) => moveToTrash(e, folder.id)} title="Mover para lixeira">
                <Trash2 size={16} />
              </button>
            </div>
            <div className={styles.folderIcon}>
              <Folder size={32} />
            </div>
            <div className={styles.folderName}>{folder.name}</div>
          </div>
        ))}
        {folders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            Nenhuma pasta criada ainda.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Criar Nova Pasta</h2>
            <form onSubmit={handleCreateFolder}>
              <input
                type="text"
                className="input-base"
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
