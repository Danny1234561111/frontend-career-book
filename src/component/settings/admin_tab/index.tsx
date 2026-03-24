import React, { useState } from 'react';
import styles from './admin_tab.module.scss';

interface ImportLog {
  id: string;
  date: string;
  fileName: string;
  user: string;
  status: 'success' | 'error';
  details: string;
}

const AdminTab: React.FC = () => {
  const [importLogs] = useState<ImportLog[]>([
    { 
      id: '1', 
      date: '2026-03-10 14:30', 
      fileName: 'Матрица_IT_отдел.xlsx', 
      user: 'Администратор', 
      status: 'success',
      details: 'Создано 42 компетенции, 186 требований'
    },
    { 
      id: '2', 
      date: '2026-03-09 11:20', 
      fileName: 'Матрица_HR.xlsx', 
      user: 'Администратор', 
      status: 'success',
      details: 'Создано 15 компетенций, 45 требований'
    },
    { 
      id: '3', 
      date: '2026-03-08 16:45', 
      fileName: 'Матрица_Бухгалтерия.xlsx', 
      user: 'Администратор', 
      status: 'error',
      details: 'Ошибка валидации: неверный формат в строке 12'
    },
  ]);

  const handleDownloadTemplate = () => {
    console.log('Скачивание шаблона матрицы');
    // Здесь будет логика скачивания
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Администрирование системы</h2>

      <div className={styles.adminSection}>
        <h3>Управление импортом</h3>
        
        <div className={styles.templateBlock}>
          <h4>Шаблоны матриц компетенций</h4>
          <button className={styles.downloadBtn} onClick={handleDownloadTemplate}>
            📥 Скачать актуальный шаблон матрицы (.xlsx)
          </button>
        </div>

        <div className={styles.importLogBlock}>
          <h4>Журнал импорта</h4>
          
          <div className={styles.tableWrapper}>
            <table className={styles.importTable}>
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Имя файла</th>
                  <th>Пользователь</th>
                  <th>Статус</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.fileName}</td>
                    <td>{log.user}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[log.status]}`}>
                        {log.status === 'success' ? 'Успешно' : 'Ошибка валидации'}
                      </span>
                    </td>
                    <td>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Здесь могут быть другие системные параметры */}
    </div>
  );
};

export default AdminTab;