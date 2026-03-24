import React, { useState } from 'react';
import styles from './monitoring_tab.module.scss';

interface MonitoringTabProps {
  userRole: 'admin' | 'manager' | 'user';
}

interface EventSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const MonitoringTab: React.FC<MonitoringTabProps> = ({ userRole }) => {
  const [settings, setSettings] = useState<EventSetting[]>([
    {
      id: 'training_assignment',
      label: 'Назначение обучения',
      description: 'Руководитель назначил новый материал в ИПР',
      enabled: true
    },
    {
      id: 'assessment_change',
      label: 'Изменение оценки',
      description: 'Руководитель зафиксировал новую оценку компетенции',
      enabled: true
    },
    {
      id: 'requirements_update',
      label: 'Обновление требований',
      description: 'Администратор обновил матрицу компетенций для вашей должности',
      enabled: false
    },
  ]);

  const managerSettings: EventSetting[] = [
    {
      id: 'department_assessments',
      label: 'Новые оценки подразделения',
      description: 'Сотрудники получили новые оценки компетенций',
      enabled: true
    },
    {
      id: 'materials_update',
      label: 'Обновление материалов',
      description: 'Добавлены или обновлены учебные материалы',
      enabled: true
    },
  ];

  // Добавляем настройки для руководителя
  const allSettings = userRole === 'manager' 
    ? [...settings, ...managerSettings]
    : settings;

  const handleToggle = (id: string) => {
    setSettings(allSettings.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const handleSave = () => {
    console.log('Сохранение настроек мониторинга:', settings);
    alert('Настройки сохранены');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Мониторинг изменений</h2>
      
      <div className={styles.description}>
        <p>Настройте отображение информационных событий на главном экране в блоке «Последние события».</p>
      </div>

      <div className={styles.settingsList}>
        {allSettings.map(setting => (
          <div key={setting.id} className={styles.settingItem}>
            <label className={styles.settingLabel}>
              <input
                type="checkbox"
                checked={setting.enabled}
                onChange={() => handleToggle(setting.id)}
                className={styles.checkbox}
              />
              <div className={styles.settingInfo}>
                <span className={styles.settingName}>{setting.label}</span>
                <span className={styles.settingDescription}>{setting.description}</span>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleSave}>
          Сохранить настройки
        </button>
      </div>

      <div className={styles.preview}>
        <h4>Пример отображения в блоке «Последние события»:</h4>
        <div className={styles.eventsPreview}>
          <div className={styles.eventItem}>
            <span className={styles.eventDate}>Сегодня</span>
            <span className={styles.eventText}>➕ Назначен курс "Продвинутый JavaScript"</span>
          </div>
          <div className={styles.eventItem}>
            <span className={styles.eventDate}>Вчера</span>
            <span className={styles.eventText}>📊 Оценка компетенции "React" изменена на 3</span>
          </div>
          <div className={styles.eventItem}>
            <span className={styles.eventDate}>15.03</span>
            <span className={styles.eventText}>📝 Обновлены требования к должности "Ведущий разработчик"</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringTab;