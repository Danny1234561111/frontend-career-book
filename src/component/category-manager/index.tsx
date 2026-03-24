import React, { useState } from 'react';
import styles from './category_manager.module.scss';

interface CompetencyBlock {
  id: string;
  name: string;
  competencies: CompetencyItem[];
}

interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  level: 1 | 2 | 3;
  materials: MaterialItem[]; // материалы внутри компетенции
}

interface MaterialItem {
  id: string;
  name: string;
  type: 'video' | 'article' | 'book' | 'course';
  url: string;
  targetLevel: 1 | 2 | 3;
}

const CategoryManager: React.FC = () => {
  const [blocks, setBlocks] = useState<CompetencyBlock[]>([
    {
      id: '1',
      name: 'Разработка и конфигурирование 1С',
      competencies: [
        { 
          id: 'c1', 
          name: 'Работа со средой разработки 1С 8.2 и 8.3', 
          description: 'Описание компетенции', 
          level: 2,
          materials: [
            { id: 'm1', name: 'Видеокурс по работе в 1С', type: 'video', url: 'https://example.com', targetLevel: 2 },
            { id: 'm2', name: 'Статья по объектам конфигурации', type: 'article', url: 'https://example.com', targetLevel: 1 }
          ]
        },
        { 
          id: 'c2', 
          name: 'Работа с языком запросов 1С и SQL', 
          description: 'Описание компетенции', 
          level: 2,
          materials: [
            { id: 'm3', name: 'Книга по SQL для 1С', type: 'book', url: 'https://example.com', targetLevel: 2 }
          ]
        },
        { 
          id: 'c3', 
          name: 'Знание функций нескольких конфигураций 1С', 
          description: 'Описание компетенции', 
          level: 1,
          materials: []
        },
      ]
    },
    {
      id: '2',
      name: 'Управление командами и проектами',
      competencies: [
        { 
          id: 'c4', 
          name: 'Целеполагание: личное и командное', 
          description: 'Описание компетенции', 
          level: 2,
          materials: []
        },
        { 
          id: 'c5', 
          name: 'Планирование в оценке задач', 
          description: 'Описание компетенции', 
          level: 2,
          materials: []
        },
        { 
          id: 'c6', 
          name: 'Делегирование', 
          description: 'Описание компетенции', 
          level: 1,
          materials: []
        },
      ]
    },
    {
      id: '3',
      name: 'Проектирование и жизненный цикл ПО',
      competencies: [
        { 
          id: 'c7', 
          name: 'Технология создания и внедрения ПО', 
          description: 'Описание компетенции', 
          level: 3,
          materials: []
        },
        { 
          id: 'c8', 
          name: 'Формирование и согласование требований к архитектуре', 
          description: 'Описание компетенции', 
          level: 2,
          materials: []
        },
      ]
    },
  ]);

  const [newBlockName, setNewBlockName] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
  const [expandedCompetencies, setExpandedCompetencies] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<{
    type: 'competency' | 'material';
    item: CompetencyItem | MaterialItem;
    sourceBlockId: string;
    sourceCompetencyId?: string;
  } | null>(null);

  const handleAddBlock = () => {
    if (newBlockName.trim()) {
      const newBlock: CompetencyBlock = {
        id: Date.now().toString(),
        name: newBlockName.trim(),
        competencies: []
      };
      setBlocks([...blocks, newBlock]);
      setNewBlockName('');
      toggleBlockExpand(newBlock.id);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот блок компетенций?')) {
      setBlocks(blocks.filter(block => block.id !== blockId));
    }
  };

  const handleDuplicateBlock = (block: CompetencyBlock) => {
    const duplicatedBlock: CompetencyBlock = {
      id: Date.now().toString(),
      name: `${block.name} (копия)`,
      competencies: block.competencies.map(comp => ({
        ...comp,
        id: `${comp.id}-copy-${Date.now()}-${Math.random()}`,
        materials: comp.materials.map(mat => ({
          ...mat,
          id: `${mat.id}-copy-${Date.now()}-${Math.random()}`
        }))
      }))
    };
    setBlocks([...blocks, duplicatedBlock]);
    toggleBlockExpand(duplicatedBlock.id);
  };

  const toggleBlockExpand = (blockId: string) => {
    setExpandedBlocks(prev => 
      prev.includes(blockId) 
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };

  const toggleCompetencyExpand = (competencyId: string) => {
    setExpandedCompetencies(prev => 
      prev.includes(competencyId) 
        ? prev.filter(id => id !== competencyId)
        : [...prev, competencyId]
    );
  };

  const handleDragStart = (
    item: CompetencyItem | MaterialItem,
    type: 'competency' | 'material',
    sourceBlockId: string,
    sourceCompetencyId?: string
  ) => {
    setDraggedItem({
      type,
      item,
      sourceBlockId,
      sourceCompetencyId
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetBlockId: string, targetCompetencyId?: string) => {
    if (!draggedItem) return;

    // Если перетаскиваем в то же место
    if (draggedItem.sourceBlockId === targetBlockId && 
        draggedItem.sourceCompetencyId === targetCompetencyId) {
      setDraggedItem(null);
      return;
    }

    setBlocks(prevBlocks => {
      const sourceBlock = prevBlocks.find(b => b.id === draggedItem.sourceBlockId);
      const targetBlock = prevBlocks.find(b => b.id === targetBlockId);
      
      if (!sourceBlock || !targetBlock) return prevBlocks;

      if (draggedItem.type === 'competency') {
        // Перетаскивание компетенции между блоками
        const competency = draggedItem.item as CompetencyItem;
        
        return prevBlocks.map(block => {
          if (block.id === draggedItem.sourceBlockId) {
            return {
              ...block,
              competencies: block.competencies.filter(c => c.id !== competency.id)
            };
          }
          if (block.id === targetBlockId) {
            const competencyCopy = {
              ...competency,
              id: `${competency.id}-moved-${Date.now()}`,
              materials: [...competency.materials] // копируем материалы
            };
            return {
              ...block,
              competencies: [...block.competencies, competencyCopy]
            };
          }
          return block;
        });
      } else {
        // Перетаскивание материала между компетенциями
        const material = draggedItem.item as MaterialItem;
        
        if (!targetCompetencyId) return prevBlocks;

        return prevBlocks.map(block => {
          if (block.id === targetBlockId) {
            return {
              ...block,
              competencies: block.competencies.map(comp => {
                if (comp.id === targetCompetencyId) {
                  // Добавляем материал в целевую компетенцию
                  const materialCopy = {
                    ...material,
                    id: `${material.id}-moved-${Date.now()}`
                  };
                  return {
                    ...comp,
                    materials: [...comp.materials, materialCopy]
                  };
                }
                if (draggedItem.sourceCompetencyId && comp.id === draggedItem.sourceCompetencyId) {
                  // Удаляем материал из исходной компетенции
                  return {
                    ...comp,
                    materials: comp.materials.filter(m => m.id !== material.id)
                  };
                }
                return comp;
              })
            };
          }
          return block;
        });
      }
    });

    setDraggedItem(null);
  };

  const handleDuplicateCompetency = (competency: CompetencyItem, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const competencyCopy = {
      ...competency,
      id: `${competency.id}-copy-${Date.now()}-${Math.random()}`,
      materials: competency.materials.map(mat => ({
        ...mat,
        id: `${mat.id}-copy-${Date.now()}-${Math.random()}`
      }))
    };

    const updatedBlocks = blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          competencies: [...b.competencies, competencyCopy]
        };
      }
      return b;
    });

    setBlocks(updatedBlocks);
    toggleCompetencyExpand(competencyCopy.id);
  };

  const handleDuplicateMaterial = (material: MaterialItem, competencyId: string, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const materialCopy = {
      ...material,
      id: `${material.id}-copy-${Date.now()}-${Math.random()}`
    };

    const updatedBlocks = blocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          competencies: b.competencies.map(comp => {
            if (comp.id === competencyId) {
              return {
                ...comp,
                materials: [...comp.materials, materialCopy]
              };
            }
            return comp;
          })
        };
      }
      return b;
    });

    setBlocks(updatedBlocks);
  };

  const getLevelLabel = (level: number) => {
    const labels = ['', 'Базовые знания', 'Профессионал', 'Эксперт'];
    return labels[level] || '';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      video: '🎥',
      article: '📄',
      book: '📚',
      course: '🎓'
    };
    return icons[type as keyof typeof icons] || '📁';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Управление блоками компетенций</h3>
        <div className={styles.addBlock}>
          <input
            type="text"
            value={newBlockName}
            onChange={(e) => setNewBlockName(e.target.value)}
            placeholder="Название нового блока"
            onKeyPress={(e) => e.key === 'Enter' && handleAddBlock()}
          />
          <button onClick={handleAddBlock} className={styles.addBtn}>
            + Добавить блок
          </button>
        </div>
      </div>

      <div className={styles.blocksList}>
        {blocks.map(block => (
          <div key={block.id} className={styles.block}>
            <div className={styles.blockHeader} onClick={() => toggleBlockExpand(block.id)}>
              <div className={styles.blockTitle}>
                <span className={styles.expandIcon}>
                  {expandedBlocks.includes(block.id) ? '▼' : '▶'}
                </span>
                <h4>{block.name}</h4>
                <span className={styles.itemCount}>
                  {block.competencies.length} компетенций
                </span>
              </div>
              <div className={styles.blockActions}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateBlock(block);
                  }}
                  className={styles.iconBtn}
                  title="Дублировать блок"
                >
                  📋
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBlock(block.id);
                  }}
                  className={styles.iconBtn}
                  title="Удалить блок"
                >
                  🗑️
                </button>
              </div>
            </div>

            {expandedBlocks.includes(block.id) && (
              <div className={styles.blockContent}>
                {block.competencies.map(comp => (
                  <div
                    key={comp.id}
                    className={styles.competencyContainer}
                    onDragOver={handleDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(block.id, comp.id);
                    }}
                  >
                    <div className={styles.competencyHeader}>
                      <div 
                        className={styles.competencyTitle}
                        onClick={() => toggleCompetencyExpand(comp.id)}
                      >
                        <span className={styles.expandIcon}>
                          {expandedCompetencies.includes(comp.id) ? '▼' : '▶'}
                        </span>
                        <span className={styles.competencyName}>{comp.name}</span>
                        <span className={`${styles.levelBadge} ${styles[`level${comp.level}`]}`}>
                          {getLevelLabel(comp.level)}
                        </span>
                      </div>
                      <div className={styles.competencyActions}>
                        <button 
                          onClick={() => handleDuplicateCompetency(comp, block.id)}
                          className={styles.smallIconBtn}
                          title="Дублировать компетенцию"
                        >
                          📄
                        </button>
                        <span className={styles.materialCount}>
                          {comp.materials.length} материалов
                        </span>
                      </div>
                    </div>

                    {expandedCompetencies.includes(comp.id) && (
                      <div className={styles.materialsList}>
                        {comp.materials.map(material => (
                          <div
                            key={material.id}
                            className={styles.materialCard}
                            draggable
                            onDragStart={() => handleDragStart(material, 'material', block.id, comp.id)}
                          >
                            <div className={styles.materialHeader}>
                              <span className={styles.materialName}>
                                {getTypeIcon(material.type)} {material.name}
                              </span>
                              <button 
                                onClick={() => handleDuplicateMaterial(material, comp.id, block.id)}
                                className={styles.smallIconBtn}
                                title="Дублировать материал"
                              >
                                📄
                              </button>
                            </div>
                            <div className={styles.materialMeta}>
                              <span className={styles.materialUrl}>
                                <a href={material.url} target="_blank" rel="noopener noreferrer">
                                  {material.url}
                                </a>
                              </span>
                              <span className={`${styles.levelBadge} ${styles[`level${material.targetLevel}`]}`}>
                                Ур. {material.targetLevel}
                              </span>
                            </div>
                          </div>
                        ))}
                        {comp.materials.length === 0 && (
                          <div className={styles.emptyMaterials}>
                            <p>Нет учебных материалов</p>
                            <small>Перетащите материалы из других компетенций</small>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.hint}>
          💡 Компетенции можно перетаскивать между блоками. Материалы перетаскиваются между компетенциями.
          Используйте кнопки 📋 для дублирования блоков и 📄 для дублирования элементов.
        </p>
      </div>
    </div>
  );
};

export default CategoryManager;