import React, { useState } from 'react';
import styles from './materials-table.module.scss';

type Material = {
  id: string;
  title: string;
  type: 'video' | 'article' | 'book' | 'course';
  competencies: string[];
  author: string;
  createdAt: string;
  status: 'published' | 'draft' | 'moderation';
  url?: string;
};

interface MaterialsTableProps {
  adminMode?: boolean;
  selectable?: boolean;
  selectedMaterials?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  filterStatus?: 'all' | 'published' | 'draft' | 'moderation';
  filterCompetency?: string; // фильтр по компетенции
  onMaterialSelect?: (material: Material) => void;
  onMaterialEdit?: (material: Material) => void;
  onMaterialDelete?: (materialId: string) => void;
  onMaterialApprove?: (materialId: string) => void;
}

const MaterialsTable: React.FC<MaterialsTableProps> = ({
  adminMode = false,
  selectable = false,
  selectedMaterials = [],
  onSelectionChange,
  filterStatus = 'all',
  filterCompetency = 'all',
  onMaterialSelect,
  onMaterialEdit,
  onMaterialDelete,
  onMaterialApprove
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const materials: Material[] = [
    { 
      id: '1', 
      title: 'Основы JavaScript', 
      type: 'video', 
      competencies: ['JavaScript', 'Frontend'],
      author: 'Иван Петров',
      createdAt: '2024-01-15',
      status: 'published',
      url: 'https://example.com/js-basics',
    },
    { 
      id: '2', 
      title: 'React для начинающих', 
      type: 'course', 
      competencies: ['React', 'Frontend'],
      author: 'Мария Сидорова',
      createdAt: '2024-01-10',
      status: 'published',
      url: 'https://example.com/react-basics',
    },
    { 
      id: '3', 
      title: 'Паттерны проектирования', 
      type: 'article', 
      competencies: ['Архитектура ПО', 'Backend'],
      author: 'Алексей Иванов',
      createdAt: '2024-01-05',
      status: 'published',
      url: 'https://example.com/patterns',
    },
    { 
      id: '4', 
      title: 'Управление командами', 
      type: 'video', 
      competencies: ['Управление командами', 'Soft Skills'],
      author: 'Елена Соколова',
      createdAt: '2024-01-18',
      status: 'published',
      url: 'https://example.com/team-management',
    },
    { 
      id: '5', 
      title: 'TypeScript: Полное руководство', 
      type: 'book', 
      competencies: ['TypeScript', 'Frontend'],
      author: 'Петр Сидоров',
      createdAt: '2024-01-20',
      status: 'published',
      url: 'https://example.com/ts-guide',
    },
  ];

  const handleCheckboxChange = (materialId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelection = checked
      ? [...selectedMaterials, materialId]
      : selectedMaterials.filter(id => id !== materialId);
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    
    const allIds = filteredMaterials.map(m => m.id);
    onSelectionChange(checked ? allIds : []);
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

  const getTypeLabel = (type: string) => {
    const labels = {
      video: 'Видеокурс',
      article: 'Статья',
      book: 'Книга',
      course: 'Курс'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      published: 'Опубликовано',
      draft: 'Черновик',
      moderation: 'На модерации'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusClass = (status: string) => {
    const classes = {
      published: styles.published,
      draft: styles.draft,
      moderation: styles.moderation
    };
    return classes[status as keyof typeof classes] || '';
  };

  // Фильтрация материалов по всем критериям
  const filteredMaterials = materials.filter(material => {
    // Фильтр по статусу
    if (filterStatus !== 'all' && material.status !== filterStatus) return false;
    
    // Фильтр по компетенции
    if (filterCompetency !== 'all' && !material.competencies.includes(filterCompetency)) return false;
    
    // Фильтр по поиску (название, автор, компетенции)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesTitle = material.title.toLowerCase().includes(searchLower);
      const matchesAuthor = material.author.toLowerCase().includes(searchLower);
      const matchesCompetencies = material.competencies.some(comp => 
        comp.toLowerCase().includes(searchLower)
      );
      
      if (!matchesTitle && !matchesAuthor && !matchesCompetencies) return false;
    }
    
    return true;
  });

  const allSelected = filteredMaterials.length > 0 && 
    filteredMaterials.every(m => selectedMaterials.includes(m.id));
  const someSelected = filteredMaterials.some(m => selectedMaterials.includes(m.id));

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Поиск по названию, автору или компетенции..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        
        {selectable && (
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected && !allSelected;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            Выбрать все ({filteredMaterials.length})
          </label>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable && <th style={{ width: '40px' }}></th>}
              <th>Тип</th>
              <th>Название</th>
              <th>Компетенции</th>
              <th>Автор</th>
              <th>Дата</th>
              <th>Статус</th>
              {adminMode && <th>Действия</th>}
              </tr>
            </thead>
          <tbody>
            {filteredMaterials.map(material => (
              <tr 
                key={material.id} 
                onClick={() => onMaterialSelect?.(material)}
                className={onMaterialSelect ? styles.clickable : ''}
              >
                {selectable && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.id)}
                      onChange={(e) => handleCheckboxChange(material.id, e.target.checked)}
                    />
                   </td>
                )}
                <td className={styles.typeCell}>
                  <span className={styles.typeIcon}>{getTypeIcon(material.type)}</span>
                  <span className={styles.typeLabel}>{getTypeLabel(material.type)}</span>
                </td>
                <td className={styles.titleCell}>
                  {material.url ? (
                    <a 
                      href={material.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      {material.title}
                    </a>
                  ) : (
                    material.title
                  )}
                </td>
                <td>
                  <div className={styles.competenciesList}>
                    {material.competencies.map((comp, index) => (
                      <span key={index} className={styles.competencyBadge}>
                        {comp}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{material.author}</td>
                <td>{new Date(material.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(material.status)}`}>
                    {getStatusLabel(material.status)}
                  </span>
                </td>
                {adminMode && (
                  <td className={styles.actionsCell}>
                    {material.status === 'moderation' && (
                      <button 
                        className={`${styles.iconBtn} ${styles.approve}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMaterialApprove?.(material.id);
                        }}
                        title="Одобрить"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className={`${styles.iconBtn} ${styles.edit}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMaterialEdit?.(material);
                      }}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button 
                      className={`${styles.iconBtn} ${styles.delete}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMaterialDelete?.(material.id);
                      }}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMaterials.length === 0 && (
          <div className={styles.emptyState}>
            <p>Материалы не найдены</p>
            {searchQuery && <p className={styles.searchHint}>Попробуйте изменить поисковый запрос</p>}
          </div>
        )}
      </div>
      
      {selectable && filteredMaterials.length > 0 && (
        <div className={styles.selectionInfo}>
          Выбрано: <strong>{selectedMaterials.length}</strong> из {filteredMaterials.length}
        </div>
      )}
    </div>
  );
};

export default MaterialsTable;