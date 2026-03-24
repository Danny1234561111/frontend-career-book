import React, { useState, useRef } from 'react';
import styles from './import-page.module.scss';

const ImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationStatus('idle');
      // Здесь будет загрузка и предпросмотр файла
      loadPreviewData(selectedFile);
    }
  };

  const loadPreviewData = (file: File) => {
    // Имитация загрузки данных для предпросмотра
    setPreviewData({
      sheetName: 'Профили',
      rowCount: 45,
      competencyCount: 42,
      ignoredRows: 3,
      previewRows: [
        ['Разработка 1С', 'Работа с отчетами', '1', '1', '2', '2', '3'],
        ['Разработка 1С', 'Работа с формами', '1', '1', '2', '2', '3'],
        ['Soft-skills', 'Коммуникация', '1', '1', '2', '2', '3'],
        ['Soft-skills', 'Управление проектами', '1', '1', '2', '2', '3'],
        ['Базы данных', 'SQL', '1', '1', '2', '2', '3'],
      ]
    });
  };

  const handleValidate = () => {
    // Имитация валидации
    setValidationStatus('success');
  };

  const handleImport = () => {
    // Имитация импорта
    alert('Импорт успешно завершен!\nСоздано моделей: 1\nСоздано компетенций: 42\nСоздано требований к должностям: 186');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Импорт матрицы компетенций из Excel</h1>

      <div className={styles.uploadSection}>
        <button 
          className={styles.selectFileBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          Выбрать файл
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        {file && (
          <span className={styles.fileName}>
            Выбран файл: {file.name}
          </span>
        )}
      </div>

      {previewData && (
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>Предпросмотр</h2>
          
          <div className={styles.previewInfo}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Лист:</span>
                <span className={styles.infoValue}>{previewData.sheetName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Строк данных:</span>
                <span className={styles.infoValue}>{previewData.rowCount}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Обнаружено компетенций:</span>
                <span className={styles.infoValue}>{previewData.competencyCount}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Игнорируемые строки:</span>
                <span className={styles.infoValue}>{previewData.ignoredRows}</span>
              </div>
            </div>
          </div>

          <div className={styles.previewTable}>
            <h3>Первые 5 строк файла:</h3>
            <table>
              <thead>
                <tr>
                  <th>Блок компетенций</th>
                  <th>Компетенция</th>
                  <th>Специалист</th>
                  <th>Спец. 2 кат.</th>
                  <th>Спец. 1 кат.</th>
                  <th>Ведущий</th>
                  <th>Главный</th>
                </tr>
              </thead>
              <tbody>
                {previewData.previewRows.map((row: string[], index: number) => (
                  <tr key={index}>
                    {row.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.validateBtn}
              onClick={handleValidate}
            >
              Проверить данные
            </button>

            {validationStatus === 'success' && (
              <div className={styles.successMessage}>
                <span className={styles.successIcon}>✓</span>
                Файл соответствует шаблону
              </div>
            )}

            {validationStatus === 'error' && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>✗</span>
                Ошибки валидации
                <ul className={styles.errorList}>
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationStatus === 'success' && (
              <button 
                className={styles.importBtn}
                onClick={handleImport}
              >
                Импортировать
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;