import React, { useState, useEffect } from 'react';
import styles from './competency-form.module.scss';

interface CompetencyData {
  id?: string;
  name: string;
  blockId: string; // ID блока компетенций
  blockName: string; // Название блока для отображения
  description: string;
  level: 1 | 2 | 3; // Уровень компетенции (выбирается)
  defenseTasks?: string; // Задания для защиты
  acceptanceCriteria?: string; // Критерии приема
  article?: string; // Теоретическая статья
}

interface CompetencyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (competency: CompetencyData) => void;
  initialData?: CompetencyData | null;
  mode?: 'create' | 'edit';
}

// Данные блоков компетенций из ТЗ
const competencyBlocks = [
  { id: 'dev-1c', name: 'Разработка и конфигурирование 1С' },
  { id: 'proj-pm', name: 'Проектирование и жизненный цикл ПО' },
  { id: 'data-db', name: 'Работа с данными и СУБД' },
  { id: 'proj-mgmt', name: 'Управление проектами и ИТ-процессами' },
  { id: 'integration', name: 'Интеграция и смежные области' },
  { id: 'domain', name: 'Отраслевые и функциональные знания' },
  { id: 'admin', name: 'Административные и экспертные компетенции' },
  { id: 'team-mgmt', name: 'Управление командами и проектами' },
];

const levelLabels = {
  1: 'Базовые знания',
  2: 'Профессионал',
  3: 'Эксперт'
};

const CompetencyForm: React.FC<CompetencyFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  mode = 'create' 
}) => {
  const [formData, setFormData] = useState<CompetencyData>(
    initialData || {
      name: '',
      blockId: '',
      blockName: '',
      description: '',
      level: 1,
      defenseTasks: '',
      acceptanceCriteria: '',
      article: ''
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleBlockChange = (blockId: string) => {
    const selectedBlock = competencyBlocks.find(b => b.id === blockId);
    setFormData({
      ...formData,
      blockId,
      blockName: selectedBlock?.name || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    onClose();
  };

  const handleCancel = () => {
    if (mode === 'create') {
      setFormData({
        name: '',
        blockId: '',
        blockName: '',
        description: '',
        level: 1,
        defenseTasks: '',
        acceptanceCriteria: '',
        article: ''
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
          <h3>{mode === 'create' ? 'Добавить компетенцию' : 'Редактировать компетенцию'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.drawerContent}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Название компетенции *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                placeholder="Например: Работа со средой разработки 1С 8.2 и 8.3"
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Блок компетенций *</label>
                <select
                  value={formData.blockId}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  required
                >
                  <option value="">Выберите блок</option>
                  {competencyBlocks.map(block => (
                    <option key={block.id} value={block.id}>{block.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Уровень компетенции *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) as 1|2|3})}
                  required
                  className={styles.levelSelect}
                >
                  <option value="1">1 - Базовые знания</option>
                  <option value="2">2 - Профессионал</option>
                  <option value="3">3 - Эксперт</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Описание компетенции</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder="Общее описание компетенции..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Задания для защиты</label>
              <textarea
                value={formData.defenseTasks}
                onChange={(e) => setFormData({...formData, defenseTasks: e.target.value})}
                rows={4}
                placeholder="Практические задания для подтверждения владения компетенцией..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Критерии приема</label>
              <textarea
                value={formData.acceptanceCriteria}
                onChange={(e) => setFormData({...formData, acceptanceCriteria: e.target.value})}
                rows={4}
                placeholder="Критерии оценки выполнения заданий..."
              />
            </div>
          </form>
        </div>

        <div className={styles.drawerFooter}>
          <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
            Отмена
          </button>
          <button type="submit" onClick={handleSubmit} className={styles.submitBtn}>
            {mode === 'create' ? 'Создать компетенцию' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CompetencyForm;