import React, { useState } from 'react';
import styles from './competencies-matrix.module.scss';

// Структура на основе реальных данных
interface Competency {
  id: string;
  name: string;
  blockId: string;
  blockName: string;
  description: string;
  levelDescriptions: {
    1: string;
    2: string;
    3: string;
  };
  defenseTasks?: string;
  acceptanceCriteria?: string;
  article?: string;
}

interface UserCompetency {
  userId: string;
  competencyId: string;
  level: 1 | 2 | 3;
  lastAssessed: string;
  comment?: string;
}

interface CompetenciesMatrixProps {
  editable?: boolean;
  onCompetencyUpdate?: (competencyId: string, level: number) => void;
  onEdit?: (competency: Competency) => void;
  onDelete?: (competencyId: string) => void;
  onViewDetails?: (competency: Competency) => void;
  userId?: string;
}

// Реальные данные из ТЗ
const mockCompetencies: Competency[] = [
  {
    id: '1',
    name: 'Работа со средой разработки 1С 8.2 и 8.3',
    blockId: 'dev-1c',
    blockName: 'Разработка и конфигурирование 1С',
    description: 'Сотрудник знает инструментарий и возможности платформ 1С 8.2 и 8.3, умеет создавать и модифицировать объекты конфигурации, работать с общими формами, отчетами и механизмами платформы.',
    levelDescriptions: {
      1: 'Знает основной интерфейс и базовые объекты конфигурации. Умеет вносить простые изменения в формы и отчеты под руководством. Умеет создавать простые внешние отчеты с использованием конструкторов.',
      2: 'Умеет самостоятельно создавать сложные отчеты и обработки с использованием скриптов, проводить нерегламентированные расчеты и операции с данными без привлечения разработчиков.',
      3: 'Способен работать с высокопроизводительными и сложными системами отчетности и обработки данных. Оптимизирует их для работы с большими объемами информации, создает универсальные механизмы для повторного использования.'
    }
  },
  {
    id: '2',
    name: 'Работа с языком запросов 1С и SQL',
    blockId: 'dev-1c',
    blockName: 'Разработка и конфигурирование 1С',
    description: 'Сотрудник умеет составлять сложные запросы к базе данных с использованием языка запросов 1С для получения данных из системы.',
    levelDescriptions: {
      1: 'Знает базовый синтаксис, знает в теории как писать простые запросы на выборку данных из одной таблицы с простыми условиями отбора.',
      2: 'Умеет составлять сложные запросы с соединениями таблиц, группировками, агрегатными функциями и вложенными подзапросами. Способен оптимизировать запросы.',
      3: 'Владеет глубокими знаниями по работе с запросами, временными таблицами и сложными аналитическими функциями.'
    }
  },
  {
    id: '3',
    name: 'Целеполагание: личное и командное',
    blockId: 'team-mgmt',
    blockName: 'Управление командами и проектами',
    description: 'Процесс определения и установления конкретных целей и задач, которые необходимо достичь на личном и командном уровнях.',
    levelDescriptions: {
      1: 'Понимает основы целеполагания, умеет ставить личные цели по SMART.',
      2: 'Умеет проводить сессии целеполагания с командой, связывать личные цели с командными.',
      3: 'Разрабатывает стратегии целеполагания для организации, обучает других, адаптирует цели под изменения.'
    },
    defenseTasks: '1. Написать личный план целей на ближайший год, используя метод SMART.\n2. Провести сессию по целеполаганию с командой.\n3. Подготовить отчет о достижении целей.',
    acceptanceCriteria: 'Четкость и структурированность формулировок целей. Способность участвовать в процессе целеполагания. Умение связывать цели с общей стратегией.'
  }
];

const mockUserCompetencies: UserCompetency[] = [
  { userId: '1', competencyId: '1', level: 2, lastAssessed: '2026-02-15' },
  { userId: '1', competencyId: '2', level: 1, lastAssessed: '2026-02-15' },
  { userId: '1', competencyId: '3', level: 2, lastAssessed: '2026-02-10' },
];

const CompetenciesMatrix: React.FC<CompetenciesMatrixProps> = ({ 
  editable = false, 
  onCompetencyUpdate,
  onEdit,
  onDelete,
  onViewDetails,
  userId = '1'
}) => {
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);

  // Получаем уникальные блоки
  const blocks = ['all', ...new Set(mockCompetencies.map(c => c.blockName))];

  const getLevelLabel = (level: number): string => {
    const labels = ['Нет', 'Базовые знания', 'Профессионал', 'Эксперт'];
    return labels[level] || 'Нет';
  };

  const getLevelClass = (level: number): string => {
    const classes = ['', styles.level1, styles.level2, styles.level3];
    return classes[level] || '';
  };

  const getUserLevel = (competencyId: string): number => {
    return mockUserCompetencies.find(uc => uc.competencyId === competencyId)?.level || 0;
  };

  const filteredCompetencies = mockCompetencies.filter(c => 
    selectedBlock === 'all' || c.blockName === selectedBlock
  );

  const handleRowClick = (competency: Competency) => {
    if (expandedCompetency === competency.id) {
      setExpandedCompetency(null);
    } else {
      setExpandedCompetency(competency.id);
    }
    onViewDetails?.(competency);
  };

  return (
    <div className={styles.matrix}>
      <div className={styles.header}>
        <h3>Матрица компетенций</h3>
        <div className={styles.filter}>
          <label>Блок компетенций:</label>
          <select 
            value={selectedBlock} 
            onChange={(e) => setSelectedBlock(e.target.value)}
            className={styles.blockSelect}
          >
            {blocks.map(block => (
              <option key={block} value={block}>
                {block === 'all' ? 'Все блоки' : block}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.table}>
        <div className={`${styles.row} ${styles.headerRow}`}>
          <div className={styles.cell}>Компетенция</div>
          <div className={styles.cell}>Блок</div>
          <div className={styles.cell}>Уровень сотрудника</div>
          <div className={styles.cell}>Описание уровня</div>
          {editable && <div className={styles.cell}>Действия</div>}
        </div>

        {filteredCompetencies.map(comp => {
          const userLevel = getUserLevel(comp.id);
          const isExpanded = expandedCompetency === comp.id;

          return (
            <React.Fragment key={comp.id}>
              <div 
                className={`${styles.row} ${styles.dataRow} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => handleRowClick(comp)}
              >
                <div className={styles.cell}>
                  <span className={styles.competencyName}>{comp.name}</span>
                </div>
                <div className={styles.cell}>
                  <span className={styles.blockBadge}>{comp.blockName}</span>
                </div>
                <div className={styles.cell}>
                  <div className={`${styles.levelBadge} ${getLevelClass(userLevel)}`}>
                    {getLevelLabel(userLevel)}
                  </div>
                </div>
                <div className={styles.cell}>
                  <div className={styles.levelDescription}>
                    {comp.levelDescriptions[userLevel as 1|2|3] || 'Нет описания'}
                  </div>
                </div>
                {editable && (
                  <div className={styles.cell}>
                    <div className={styles.actions}>
                      <button 
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(comp);
                        }}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(comp.id);
                        }}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className={styles.expandedDetails}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailSection}>
                      <h5>Полное описание</h5>
                      <p>{comp.description}</p>
                    </div>

                    <div className={styles.detailSection}>
                      <h5>Уровни владения</h5>
                      <div className={styles.levelsList}>
                        <div className={styles.levelItem}>
                          <span className={`${styles.levelTag} ${styles.level1}`}>Уровень 1 - Базовые знания</span>
                          <p>{comp.levelDescriptions[1]}</p>
                        </div>
                        <div className={styles.levelItem}>
                          <span className={`${styles.levelTag} ${styles.level2}`}>Уровень 2 - Профессионал</span>
                          <p>{comp.levelDescriptions[2]}</p>
                        </div>
                        <div className={styles.levelItem}>
                          <span className={`${styles.levelTag} ${styles.level3}`}>Уровень 3 - Эксперт</span>
                          <p>{comp.levelDescriptions[3]}</p>
                        </div>
                      </div>
                    </div>

                    {comp.defenseTasks && (
                      <div className={styles.detailSection}>
                        <h5>Задания для защиты</h5>
                        <p>{comp.defenseTasks}</p>
                      </div>
                    )}

                    {comp.acceptanceCriteria && (
                      <div className={styles.detailSection}>
                        <h5>Критерии приема</h5>
                        <p>{comp.acceptanceCriteria}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendTitle}>Уровни владения:</span>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.level1}`}></span>
          <span>1 - Базовые знания</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.level2}`}></span>
          <span>2 - Профессионал</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendColor} ${styles.level3}`}></span>
          <span>3 - Эксперт</span>
        </div>
      </div>
    </div>
  );
};

export default CompetenciesMatrix;