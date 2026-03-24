import React, { useState, useEffect } from 'react';
import styles from './material-form.module.scss';

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (material: MaterialData) => void;
  initialData?: MaterialData;
  mode?: 'create' | 'edit';
}

export interface MaterialData {
  name: string;
  type: 'video' | 'article' | 'book' | 'course';
  competencyIds: string[]; // массив ID компетенций
  url: string;
  description?: string;
}

// Моковые данные компетенций по блокам
const competencyBlocks = [
  {
    id: 'block1',
    name: 'Разработка и конфигурирование 1С',
    competencies: [
      { id: 'c1', name: 'Работа со средой разработки 1С 8.2 и 8.3' },
      { id: 'c2', name: 'Работа с языком запросов 1С и SQL' },
      { id: 'c3', name: 'Знание функций нескольких конфигураций 1С' },
    ]
  },
  {
    id: 'block2',
    name: 'Управление командами и проектами',
    competencies: [
      { id: 'c4', name: 'Целеполагание: личное и командное' },
      { id: 'c5', name: 'Планирование в оценке задач' },
      { id: 'c6', name: 'Делегирование' },
    ]
  },
  {
    id: 'block3',
    name: 'Проектирование и жизненный цикл ПО',
    competencies: [
      { id: 'c7', name: 'Технология создания и внедрения ПО' },
      { id: 'c8', name: 'Формирование и согласование требований к архитектуре' },
    ]
  },
  {
    id: 'block4',
    name: 'Работа с данными и СУБД',
    competencies: [
      { id: 'c9', name: 'Механизмы интеграции программных комплексов' },
    ]
  },
  {
    id: 'block5',
    name: 'Отраслевые и функциональные знания',
    competencies: [
      { id: 'c10', name: 'Знание предметной области учета' },
    ]
  }
];

const MaterialForm: React.FC<MaterialFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  mode = 'create' 
}) => {
  const [formData, setFormData] = useState<MaterialData>(
    initialData || {
      name: '',
      type: 'article',
      competencyIds: [],
      url: '',
      description: ''
    }
  );

  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => 
      prev.includes(blockId) 
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  const handleCompetencyToggle = (competencyId: string) => {
    setFormData(prev => ({
      ...prev,
      competencyIds: prev.competencyIds.includes(competencyId)
        ? prev.competencyIds.filter(id => id !== competencyId)
        : [...prev.competencyIds, competencyId]
    }));
  };

  const handleSelectAllInBlock = (blockId: string, competencyIds: string[]) => {
    const allSelected = competencyIds.every(id => formData.competencyIds.includes(id));
    
    setFormData(prev => ({
      ...prev,
      competencyIds: allSelected
        ? prev.competencyIds.filter(id => !competencyIds.includes(id))
        : [...new Set([...prev.competencyIds, ...competencyIds])]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.competencyIds.length === 0) {
      alert('Выберите хотя бы одну компетенцию');
      return;
    }
    
    onSubmit?.(formData);
    onClose();
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setFormData({
        name: '',
        type: 'article',
        competencyIds: [],
        url: '',
        description: ''
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <h3>{mode === 'create' ? 'Добавить материал' : 'Редактировать материал'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.drawerContent}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Наименование *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Введите название материала"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Тип материала *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                required
              >
                <option value="video">🎥 Видеокурс</option>
                <option value="article">📄 Статья</option>
                <option value="book">📚 Книга</option>
                <option value="course">🎓 Курс</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Ссылка на материал *</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                required
                placeholder="https://..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Краткое описание материала"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Привязка к компетенциям *</label>
              <p className={styles.hint}>Выберите компетенции, к которым относится этот материал</p>
              
              <div className={styles.competenciesTree}>
                {competencyBlocks.map(block => (
                  <div key={block.id} className={styles.blockItem}>
                    <div 
                      className={styles.blockHeader}
                      onClick={() => toggleBlock(block.id)}
                    >
                      <span className={styles.expandIcon}>
                        {expandedBlocks.includes(block.id) ? '▼' : '▶'}
                      </span>
                      <span className={styles.blockName}>{block.name}</span>
                      <button 
                        type="button"
                        className={styles.selectAllBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllInBlock(
                            block.id, 
                            block.competencies.map(c => c.id)
                          );
                        }}
                      >
                        {block.competencies.every(c => formData.competencyIds.includes(c.id))
                          ? 'Снять все'
                          : 'Выбрать все'
                        }
                      </button>
                    </div>

                    {expandedBlocks.includes(block.id) && (
                      <div className={styles.competenciesList}>
                        {block.competencies.map(comp => (
                          <label key={comp.id} className={styles.competencyItem}>
                            <input
                              type="checkbox"
                              checked={formData.competencyIds.includes(comp.id)}
                              onChange={() => handleCompetencyToggle(comp.id)}
                            />
                            <span className={styles.competencyName}>{comp.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className={styles.selectedCount}>
                Выбрано компетенций: <strong>{formData.competencyIds.length}</strong>
              </div>
            </div>
          </form>
        </div>

        <div className={styles.drawerFooter}>
          <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
            Отмена
          </button>
          <button type="submit" onClick={handleSubmit} className={styles.submitBtn}>
            {mode === 'create' ? 'Создать материал' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </>
  );
};

export default MaterialForm;