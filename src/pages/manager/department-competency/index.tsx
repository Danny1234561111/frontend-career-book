import React, { useState } from 'react';
import { CompetenciesMatrix } from '../../../component';
import styles from './competencies.module.scss';

const DepartmentCompetenciesPage: React.FC = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Сотрудники отдела
  const employees = [
    { id: '1', name: 'Иван Петров' },
    { id: '2', name: 'Мария Сидорова' },
    { id: '3', name: 'Алексей Иванов' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Компетенции отдела</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Сотрудник:</label>
            <select 
              value={selectedEmployee} 
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Все сотрудники</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.matrixWrapper}>
          <CompetenciesMatrix 
            editable={false}
            userId={selectedEmployee === 'all' ? undefined : selectedEmployee}
          />
        </div>
      </div>
    </div>
  );
};

export default DepartmentCompetenciesPage;