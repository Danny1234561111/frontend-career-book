import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './manager-dashboard.module.scss';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Моковые данные
  const departmentData = {
    name: 'Отдел разработки',
    employeeCount: 12,
    avgProgress: 45,
    recentEvents: [
      { id: 1, text: 'Иванов И.И. получил новую оценку по компетенции "React"', date: '2024-03-15' },
      { id: 2, text: 'Обновлён учебный материал "TypeScript для начинающих"', date: '2024-03-14' },
      { id: 3, text: 'Изменены требования к должности "Ведущий разработчик"', date: '2024-03-13' },
    ]
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Главная</h1>
      </div>

      <div className={styles.content}>
        {/* Сводная панель с метриками */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{departmentData.employeeCount}</span>
            <span className={styles.statLabel}>Сотрудников</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{departmentData.avgProgress}%</span>
            <span className={styles.statLabel}>Средний прогресс</span>
          </div>
        </div>

        {/* Блок последних событий */}
        <div className={styles.eventsSection}>
          <h2>Последние события</h2>
          <div className={styles.eventsList}>
            {departmentData.recentEvents.map(event => (
              <div key={event.id} className={styles.eventItem}>
                <span className={styles.eventDate}>{event.date}</span>
                <span className={styles.eventText}>{event.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;