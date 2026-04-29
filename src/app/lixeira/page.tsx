'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, File, RotateCcw, Trash2 } from 'lucide-react';
import styles from './page.module.css';

interface TrashItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  deleted_at: string;
}

export default function Lixeira() {
  const [items, setItems] = useState<TrashItem[]>([]);

  useEffect(() => {
    fetchTrash();
  }, []);

  async function fetchTrash() {
    const { data: folders } = await supabase
      .from('lon_folders')
      .select('id, name, deleted_at')
      .eq('is_trash', true);

    const { data: files } = await supabase
      .from('lon_files')
      .select('id, name, deleted_at')
      .eq('is_trash', true);

    const allItems: TrashItem[] = [
      ...(folders || []).map(f => ({ ...f, type: 'folder' as const })),
      ...(files || []).map(f => ({ ...f, type: 'file' as const }))
    ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

    setItems(allItems);
  }

  async function restoreItem(id: string, type: 'folder' | 'file') {
    const table = type === 'folder' ? 'lon_folders' : 'lon_files';
    const { error } = await supabase
      .from(table)
      .update({ is_trash: false, deleted_at: null })
      .eq('id', id);

    if (!error) {
      setItems(items.filter(i => i.id !== id));
    }
  }

  async function deletePermanently(id: string, type: 'folder' | 'file') {
    const table = type === 'folder' ? 'lon_folders' : 'lon_files';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (!error) {
      setItems(items.filter(i => i.id !== id));
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Lixeira</h1>
      </div>

      <div className={styles.list}>
        {items.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            A lixeira está vazia.
          </div>
        )}
        {items.map(item => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemInfo}>
              <div className={styles.itemIcon}>
                {item.type === 'folder' ? <Folder size={20} /> : <File size={20} />}
              </div>
              <div>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemType}>{item.type === 'folder' ? 'Pasta' : 'Arquivo'} - Excluído em {new Date(item.deleted_at).toLocaleDateString()}</div>
              </div>
            </div>
            <div className={styles.itemActions}>
              <button className="btn-secondary" onClick={() => restoreItem(item.id, item.type)}>
                <RotateCcw size={16} /> Restaurar
              </button>
              <button 
                className="btn-secondary" 
                style={{ color: 'var(--danger-color)' }}
                onClick={() => deletePermanently(item.id, item.type)}
              >
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
