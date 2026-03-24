import React, { useState } from 'react';
import { MaterialsTable, MaterialForm, CategoryManager } from '../../../component';
import styles from './materials.module.scss';

// Добавляем интерфейс для MaterialData
interface MaterialData {
  id?: string;
  name: string;
  type: 'video' | 'article' | 'book' | 'course';
  competencyIds: string[];
  url: string;
  description?: string;
}

const MaterialsAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'moderation' | 'categories'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialData | undefined>();

  const handleAddMaterial = () => {
    setEditingMaterial(undefined);
    setIsFormOpen(true);
  };

  const handleEditMaterial = (material: MaterialData) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleSubmitMaterial = (material: MaterialData) => {
    console.log('Material saved:', material);
    // Здесь будет отправка на сервер
    handleCloseForm();
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMaterial(undefined);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление учебными материалами</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все материалы
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'moderation' ? styles.active : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            На модерации
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Категории
          </button>
        </div>

        <div className={styles.toolbar}>
          <button className={styles.addBtn} onClick={handleAddMaterial}>
            <span className={styles.addIcon}>+</span>
            Добавить материал
          </button>
        </div>

        {activeTab === 'categories' ? (
          <CategoryManager />
        ) : (
          <MaterialsTable 
            adminMode 
            filterStatus={activeTab === 'moderation' ? 'moderation' : 'all'}
            onMaterialEdit={handleEditMaterial}
          />
        )}
      </div>

      <MaterialForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitMaterial}
        initialData={editingMaterial}
        mode={editingMaterial ? 'edit' : 'create'}
      />
    </div>
  );
};

export default MaterialsAdminPage;