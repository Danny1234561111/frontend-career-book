import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './materials.module.scss';

interface Material {
  name: string;
  type: string;
  competence: string;
  level: number;
  duration: number;
}

const MaterialsPage = () => {
  const location = useLocation();
  const [competenceFilter, setCompetenceFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Применяем фильтр из state, если он передан
  useEffect(() => {
    if (location.state?.filterByCompetency) {
      setCompetenceFilter(location.state.filterByCompetency);
    }
  }, [location.state]);

  const materials: Material[] = [
    { name: 'Продвинутый React', type: 'Видеокурс', competence: 'React', level: 3, duration: 4 },
    { name: 'TypeScript для начинающих', type: 'Статья', competence: 'TypeScript', level: 1, duration: 1 },
    { name: 'Redux Toolkit', type: 'Книга', competence: 'Redux', level: 2, duration: 6 },
    { name: 'Основы JavaScript', type: 'Видеокурс', competence: 'JavaScript', level: 1, duration: 8 },
    { name: 'Продвинутый TypeScript', type: 'Видеокурс', competence: 'TypeScript', level: 3, duration: 5 },
    { name: 'React хуки', type: 'Статья', competence: 'React', level: 2, duration: 1 },
  ];

  // Получаем уникальные значения для фильтров
  const competences = ['all', ...new Set(materials.map(m => m.competence))];
  const levels = ['all', ...new Set(materials.map(m => m.level))];
  const types = ['all', ...new Set(materials.map(m => m.type))];

  // Фильтрация материалов
  const filteredMaterials = materials.filter(material => {
    if (competenceFilter !== 'all' && material.competence !== competenceFilter) return false;
    if (levelFilter !== 'all' && material.level !== Number(levelFilter)) return false;
    if (typeFilter !== 'all' && material.type !== typeFilter) return false;
    return true;
  });

  const getLevelLabel = (level: number) => {
    const labels = ['', 'Начальный', 'Средний', 'Продвинутый'];
    return labels[level] || `Уровень ${level}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Каталог учебных материалов</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.filters}>
          <select 
            className={styles.filterSelect}
            value={competenceFilter}
            onChange={(e) => setCompetenceFilter(e.target.value)}
          >
            {competences.map(comp => (
              <option key={comp} value={comp}>
                {comp === 'all' ? 'Все компетенции' : comp}
              </option>
            ))}
          </select>
          
          <select 
            className={styles.filterSelect}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            {levels.map(level => (
              <option key={level} value={level}>
                {level === 'all' ? 'Все уровни' : getLevelLabel(Number(level))}
              </option>
            ))}
          </select>
          
          <select 
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {types.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Все типы' : type}
              </option>
            ))}
          </select>
        </div>

        {filteredMaterials.length > 0 ? (
          <div className={styles.grid}>
            {filteredMaterials.map((material, index) => (
              <div key={index} className={styles.card} data-type={material.type}>
                <h3>{material.name}</h3>
                <p>Тип: {material.type}</p>
                <p>Компетенция: {material.competence}</p>
                <p>Уровень: {getLevelLabel(material.level)}</p>
                <p>Длительность: {material.duration} ч</p>
                <a href="#" className={styles.link}>Перейти к материалу</a>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Материалы не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsPage;