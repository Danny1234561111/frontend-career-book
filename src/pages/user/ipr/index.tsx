import React from 'react';
import styles from './ipr.module.scss';

const IprPage = () => {
  const iprCompetencies = [
    { name: 'React', current: 2, target: 3, status: 'in-progress' },
    { name: 'TypeScript', current: 1, target: 2, status: 'planned' },
    { name: 'Redux', current: 2, target: 2, status: 'completed' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Индивидуальный план развития</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.infoBar}>
          <div className={styles.positionGroup}>
            <div className={styles.position}>
              <span className={styles.label}>Текущая должность:</span>
              <span className={styles.value}>Специалист</span>
            </div>
            <div className={styles.position}>
              <span className={styles.label}>Целевая должность:</span>
              <span className={styles.value}>Ведущий специалист</span>
            </div>
          </div>
          <div className={styles.progress}>
            <span className={styles.value}>65%</span>
            <span className={styles.label}>прогресс</span>
          </div>
        </div>

        <div className={styles.kanban}>
          {['Запланировано', 'В работе', 'Готово к защите', 'Подтверждено'].map((column) => (
            <div key={column} className={styles.column}>
              <h3 className={styles.columnTitle}>{column}</h3>
              <div className={styles.cards}>
                {iprCompetencies.map((comp, index) => (
                  <div key={index} className={styles.card}>
                    <h4>{comp.name}</h4>
                    <p>Уровень: {comp.current} → {comp.target}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IprPage;