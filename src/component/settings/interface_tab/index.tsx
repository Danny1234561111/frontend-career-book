import React, { useState, useEffect } from 'react';
import styles from './interface_tab.module.scss';

type Theme = 'light' | 'dark' | 'system';

const InterfaceTab: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', systemTheme);
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('theme', theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Настройки интерфейса</h2>

      <div className={styles.settingsCard}>
        <h3>Тема оформления</h3>
        
        <div className={styles.themeOptions}>
          <label className={`${styles.themeOption} ${theme === 'light' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => handleThemeChange('light')}
            />
            <div className={styles.themePreview}>
              <div className={styles.previewLight}>
                <div className={styles.previewHeader}></div>
                <div className={styles.previewContent}></div>
              </div>
            </div>
            <span>Светлая</span>
          </label>

          <label className={`${styles.themeOption} ${theme === 'dark' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => handleThemeChange('dark')}
            />
            <div className={styles.themePreview}>
              <div className={styles.previewDark}>
                <div className={styles.previewHeader}></div>
                <div className={styles.previewContent}></div>
              </div>
            </div>
            <span>Тёмная</span>
          </label>

          <label className={`${styles.themeOption} ${theme === 'system' ? styles.selected : ''}`}>
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === 'system'}
              onChange={() => handleThemeChange('system')}
            />
            <div className={styles.themePreview}>
              <div className={styles.previewSystem}>
                <div className={styles.previewLight}></div>
                <div className={styles.previewDark}></div>
              </div>
            </div>
            <span>Системная</span>
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Сохранить настройки интерфейса
          </button>
          {saved && (
            <span className={styles.successMessage}>✓ Настройки сохранены</span>
          )}
        </div>

        <div className={styles.note}>
          <p>Тема оформления будет синхронизирована при входе с разных устройств.</p>
        </div>
      </div>
    </div>
  );
};

export default InterfaceTab;