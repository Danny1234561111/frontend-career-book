import React, { useState } from 'react';
import { MaterialsTable } from '../../../component';
import styles from './materials.module.scss';

interface Competency {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

const DepartmentMaterialsPage: React.FC = () => {
  const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [assignmentResult, setAssignmentResult] = useState<{ show: boolean; message: string; success: boolean }>({
    show: false,
    message: '',
    success: false
  });

  // Компетенции отдела
  const competencies: Competency[] = [
    { id: '1', name: 'JavaScript' },
    { id: '2', name: 'React' },
    { id: '3', name: 'Node.js' },
    { id: '4', name: 'Архитектура ПО' },
    { id: '5', name: 'Управление командами' },
  ];

  // Сотрудники отдела
  const employees: Employee[] = [
    { id: '1', name: 'Иван Петров' },
    { id: '2', name: 'Мария Сидорова' },
    { id: '3', name: 'Алексей Иванов' },
  ];

  const handleAssignToEmployee = () => {
    if (!selectedEmployee) {
      setAssignmentResult({
        show: true,
        message: 'Пожалуйста, выберите сотрудника',
        success: false
      });
      setTimeout(() => setAssignmentResult({ show: false, message: '', success: false }), 3000);
      return;
    }
    
    if (selectedMaterials.length === 0) {
      setAssignmentResult({
        show: true,
        message: 'Пожалуйста, выберите хотя бы один учебный материал',
        success: false
      });
      setTimeout(() => setAssignmentResult({ show: false, message: '', success: false }), 3000);
      return;
    }
    
    const employeeName = employees.find(e => e.id === selectedEmployee)?.name;
    const materialsCount = selectedMaterials.length;
    
    setAssignmentResult({
      show: true,
      message: `✅ Материалы (${materialsCount} шт.) успешно назначены сотруднику ${employeeName}`,
      success: true
    });
    
    // Очищаем выбор после назначения
    setSelectedMaterials([]);
    setSelectedEmployee('');
    
    setTimeout(() => setAssignmentResult({ show: false, message: '', success: false }), 3000);
  };

  // Получаем название выбранной компетенции для фильтра
  const getCompetencyName = (id: string) => {
    if (id === 'all') return 'all';
    const comp = competencies.find(c => c.id === id);
    return comp?.name || 'all';
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Учебные материалы</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Компетенция:</label>
            <select 
              value={selectedCompetency} 
              onChange={(e) => setSelectedCompetency(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Все компетенции</option>
              {competencies.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <MaterialsTable 
            adminMode={false}
            selectable={true}
            selectedMaterials={selectedMaterials}
            onSelectionChange={setSelectedMaterials}
            filterCompetency={getCompetencyName(selectedCompetency)} // Передаем фильтр по компетенции
            onMaterialSelect={(material) => console.log('Selected:', material)}
          />
        </div>

        {assignmentResult.show && (
          <div className={`${styles.assignmentResult} ${assignmentResult.success ? styles.success : styles.error}`}>
            {assignmentResult.message}
          </div>
        )}

        <div className={styles.quickAssign}>
          <h3>Быстрое назначение</h3>
          <div className={styles.assignForm}>
            <div className={styles.assignFields}>
              <div className={styles.formGroup}>
                <label>Выберите сотрудника:</label>
                <select 
                  className={styles.employeeSelect}
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Выберите сотрудника</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              
              <div className={styles.selectedCount}>
                Выбрано материалов: <strong>{selectedMaterials.length}</strong>
              </div>
            </div>
            
            <button 
              className={styles.assignBtn}
              onClick={handleAssignToEmployee}
              disabled={!selectedEmployee || selectedMaterials.length === 0}
            >
              Назначить выбранные материалы ({selectedMaterials.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentMaterialsPage;