'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function Armazenamento() {
  const [usedSpace, setUsedSpace] = useState(0);
  const [largeFiles, setLargeFiles] = useState<any[]>([]);
  const TOTAL_SPACE = 5 * 1024 * 1024 * 1024; // 5GB

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('lon_files')
        .select('name, size')
        .eq('is_trash', false)
        .order('size', { ascending: false });
      
      if (!error && data) {
        const total = data.reduce((acc, file) => acc + (file.size || 0), 0);
        setUsedSpace(total);
        setLargeFiles(data.slice(0, 10)); // Top 10 largest files
      }
    }
    fetchData();
  }, []);

  const percentage = Math.min((usedSpace / TOTAL_SPACE) * 100, 100);
  const usedFormatted = (usedSpace / (1024 * 1024)).toFixed(2) + ' MB';
  const totalFormatted = '5 GB';

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Armazenamento</h1>
      </div>

      <div className={styles.container}>
        <div className={styles.statsCard}>
          <div className={styles.statsHeader}>
            <div className={styles.title}>Espaço Utilizado</div>
            <div className={styles.percentage}>{percentage.toFixed(1)}%</div>
          </div>
          
          <div className={styles.barContainer}>
            <div className={styles.barFill} style={{ width: `${percentage}%` }}></div>
          </div>
          
          <div className={styles.details}>
            <span>{usedFormatted} em uso</span>
            <span>{totalFormatted} total</span>
          </div>
        </div>

        <div>
          <h2 className={styles.title} style={{ marginBottom: '16px' }}>Arquivos mais pesados</h2>
          <div className={styles.filesList}>
            {largeFiles.length === 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>Nenhum arquivo encontrado.</div>
            )}
            {largeFiles.map((f, i) => (
              <div key={i} className={styles.fileItem}>
                <span>{f.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {(f.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
