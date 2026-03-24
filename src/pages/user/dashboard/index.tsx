import React from 'react';
import { useAppSelector } from '../../../store/strore';
import styles from './user_dashboard.module.scss';

const EmployeeDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  // Моковые данные
  const employeeData = {
    fullName: user?.name || 'Иванов Иван Иванович',
    currentPosition: 'Специалист',
    targetPosition: 'Ведущий специалист',
    progress: 65,
    completedCompetencies: 8,
    totalCompetencies: 15,
    recentUpdates: [
      { id: 1, text: 'Добавлен новый курс "Продвинутый React"', date: '2024-03-15' },
      { id: 2, text: 'Обновлены требования к должности "Ведущий специалист"', date: '2024-03-14' },
      { id: 3, text: 'Доступен новый материал по TypeScript', date: '2024-03-13' },
    ]
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Главный экран</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.welcomeSection}>
          <h2 className={styles.greeting}>{employeeData.fullName}</h2>
          <div className={styles.positionInfo}>
            <p>Текущая должность: <strong>{employeeData.currentPosition}</strong></p>
            <p>Целевая должность: <strong>{employeeData.targetPosition}</strong></p>
          </div>
        </div>

        {/* Прогресс развития */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Текущий прогресс развития</span>
            <span className={styles.progressPercent}>{employeeData.progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${employeeData.progress}%` }}
            />
          </div>
          <div className={styles.competenciesCount}>
            Выполнено компетенций: {employeeData.completedCompetencies}/{employeeData.totalCompetencies}
          </div>
        </div>

        {/* Блок последних обновлений */}
        <div className={styles.updatesSection}>
          <h2>Последние обновления</h2>
          <div className={styles.updatesList}>
            {employeeData.recentUpdates.map(update => (
              <div key={update.id} className={styles.updateItem}>
                <span className={styles.updateDate}>{update.date}</span>
                <span className={styles.updateText}>{update.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;