import React, { useState } from 'react';
import { CompetenciesMatrix, CompetencyForm } from '../../../component';
import styles from './competencies.module.scss';

interface CompetencyData {
  id?: string;
  name: string;
  category: string;
  description: string;
  level: 1 | 2 | 3 | 4 | 5;
  requirements: string[];
}

const CompetenciesPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCompetency, setEditingCompetency] = useState<CompetencyData | null>(null);

  const handleAddCompetency = () => {
    setEditingCompetency(null);
    setIsFormOpen(true);
  };

  const handleEditCompetency = (competency: CompetencyData) => {
    setEditingCompetency(competency);
    setIsFormOpen(true);
  };

  const handleSubmitCompetency = (competency: CompetencyData) => {
    console.log('Competency saved:', competency);
    // Здесь будет отправка на сервер
  };

  const handleDeleteCompetency = (competencyId: string) => {
    console.log('Delete competency:', competencyId);
    // Здесь будет удаление
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCompetency(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление компетенциями</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <button className={styles.addBtn} onClick={handleAddCompetency}>
            <span className={styles.addIcon}>+</span>
            Добавить компетенцию
          </button>
        </div>

        <CompetenciesMatrix 
          editable 
          onEdit={handleEditCompetency}
          onDelete={handleDeleteCompetency}
        />
      </div>

      <CompetencyForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitCompetency}
        initialData={editingCompetency}
        mode={editingCompetency ? 'edit' : 'create'}
      />
    </div>
  );
};

export default CompetenciesPage;