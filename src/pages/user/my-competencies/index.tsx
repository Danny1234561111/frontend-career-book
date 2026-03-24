import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/strore';
import styles from './my-competencies.module.scss';

interface Competency {
  id: string;
  name: string;
  block: string;
  currentLevel: 1 | 2 | 3;
  targetLevel: 1 | 2 | 3;
  progress: number;
  materialsCount: number;
}

const MyCompetenciesPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [filterByBlock, setFilterByBlock] = useState<string>('all');

  // Моковые данные для текущего пользователя
  const myCompetencies: Competency[] = [
    { 
      id: '1',
      name: 'React', 
      block: 'Frontend', 
      currentLevel: 2, 
      targetLevel: 3, 
      progress: 66, 
      materialsCount: 3 
    },
    { 
      id: '2',
      name: 'TypeScript', 
      block: 'Frontend', 
      currentLevel: 1, 
      targetLevel: 2, 
      progress: 50, 
      materialsCount: 4 
    },
    { 
      id: '3',
      name: 'Redux', 
      block: 'Frontend', 
      currentLevel: 2, 
      targetLevel: 2, 
      progress: 100, 
      materialsCount: 2 
    },
    { 
      id: '4',
      name: 'Node.js', 
      block: 'Backend', 
      currentLevel: 1, 
      targetLevel: 2, 
      progress: 50, 
      materialsCount: 3 
    },
    { 
      id: '5',
      name: 'Коммуникация', 
      block: 'Soft-skills', 
      currentLevel: 2, 
      targetLevel: 2, 
      progress: 100, 
      materialsCount: 1 
    },
  ];

  // Получаем уникальные блоки для фильтра
  const blocks = ['all', ...new Set(myCompetencies.map(c => c.block))];

  // Фильтрация компетенций по блоку
  const filteredCompetencies = myCompetencies.filter(comp => 
    filterByBlock === 'all' || comp.block === filterByBlock
  );

  const getLevelLabel = (level: number) => {
    const labels = ['', 'Базовые знания', 'Профессионал', 'Эксперт'];
    return labels[level] || `Уровень ${level}`;
  };

  const handleViewMaterials = (competencyId: string, competencyName: string) => {
    // Переход на страницу материалов с фильтром по компетенции
    navigate('/materials', { 
      state: { 
        filterByCompetency: competencyName,
        competencyId: competencyId
      } 
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Мои компетенции</h1>
      </div>

      <div className={styles.content}>
        {/* Только один фильтр - по блоку компетенций */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Блок компетенций:</label>
            <select 
              className={styles.filterSelect}
              value={filterByBlock}
              onChange={(e) => setFilterByBlock(e.target.value)}
            >
              {blocks.map(block => (
                <option key={block} value={block}>
                  {block === 'all' ? 'Все блоки' : block}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Статистика пользователя */}
        <div className={styles.userStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {myCompetencies.filter(c => c.currentLevel >= c.targetLevel).length}
            </span>
            <span className={styles.statLabel}>Выполнено</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {myCompetencies.length}
            </span>
            <span className={styles.statLabel}>Всего</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {Math.round(myCompetencies.reduce((acc, c) => acc + c.progress, 0) / myCompetencies.length)}%
            </span>
            <span className={styles.statLabel}>Общий прогресс</span>
          </div>
        </div>

        {/* Таблица компетенций */}
        {filteredCompetencies.length > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Компетенция</th>
                  <th>Блок</th>
                  <th>Текущий уровень</th>
                  <th>Целевой уровень</th>
                  <th>Прогресс</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetencies.map((comp) => (
                  <tr key={comp.id}>
                    <td className={styles.competencyName}>{comp.name}</td>
                    <td>
                      <span className={styles.blockBadge}>{comp.block}</span>
                    </td>
                    <td>
                      <span className={`${styles.levelBadge} ${styles[`level${comp.currentLevel}`]}`}>
                        {getLevelLabel(comp.currentLevel)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.levelBadge} ${styles[`level${comp.targetLevel}`]}`}>
                        {getLevelLabel(comp.targetLevel)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ width: `${comp.progress}%` }}
                          />
                        </div>
                        <span className={styles.progressText}>{comp.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className={styles.materialsBtn}
                        onClick={() => handleViewMaterials(comp.id, comp.name)}
                      >
                        📚 {comp.materialsCount} материалов
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Компетенции не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCompetenciesPage;