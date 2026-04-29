'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folder, Trash2, Cloud, HardDrive, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Sidebar() {
  const pathname = usePathname();
  const [usedSpace, setUsedSpace] = useState(0);
  const TOTAL_SPACE = 5 * 1024 * 1024 * 1024; // 5GB

  useEffect(() => {
    async function fetchStorageSpace() {
      const { data, error } = await supabase
        .from('lon_files')
        .select('size')
        .eq('is_trash', false);
      
      if (!error && data) {
        const total = data.reduce((acc, file) => acc + (file.size || 0), 0);
        setUsedSpace(total);
      }
    }
    fetchStorageSpace();
  }, [pathname]);

  const percentage = Math.min((usedSpace / TOTAL_SPACE) * 100, 100);
  const usedFormatted = (usedSpace / (1024 * 1024)).toFixed(2) + ' MB';
  const totalFormatted = '5 GB';

  return (
    <aside className={`glass-panel ${styles.sidebar}`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Cloud size={18} />
        </div>
        <div className={styles.logoText}>Lon Nuvem</div>
      </div>

      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
          <Folder size={18} />
          Todas as Pastas
        </Link>
        <Link href="/lixeira" className={`${styles.navItem} ${pathname === '/lixeira' ? styles.active : ''}`}>
          <Trash2 size={18} />
          Lixeira
        </Link>
        <Link href="/armazenamento" className={`${styles.navItem} ${pathname === '/armazenamento' ? styles.active : ''}`}>
          <HardDrive size={18} />
          Armazenamento
        </Link>
      </nav>

      <div className={styles.storage}>
        <div className={styles.storageHeader}>
          <span>Espaço Usado</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className={styles.storageBar}>
          <div className={styles.storageFill} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className={styles.storageText}>
          {usedFormatted} de {totalFormatted}
        </div>
      </div>
    </aside>
  );
}
