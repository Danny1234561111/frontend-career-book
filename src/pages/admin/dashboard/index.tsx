import React, { useState } from 'react';
import styles from './admin_dashboard.module.scss';

interface DashboardStats {
  totalEmployees: number;
  totalPositions: number;
  totalCompetencies: number;
  totalDepartments: number;
}

interface Position {
  id: string;
  name: string;
  category: string;
}

const AdminDashboard: React.FC = () => {
  const [stats] = useState<DashboardStats>({
    totalEmployees: 124,
    totalPositions: 4,
    totalCompetencies: 42,
    totalDepartments: 8
  });

  const [positions, setPositions] = useState<Position[]>([
    { id: '1', name: 'Специалист', category: 'Начальный' },
    { id: '2', name: 'Ведущий специалист', category: 'Средний' },
    { id: '3', name: 'Главный специалист', category: 'Высокий' },
  ]);

  const [newPosition, setNewPosition] = useState({
    name: '',
    category: ''
  });

  const handleAddPosition = () => {
    if (newPosition.name && newPosition.category) {
      const position: Position = {
        id: Date.now().toString(),
        ...newPosition
      };
      setPositions([...positions, position]);
      setNewPosition({ name: '', category: '' });
    }
  };

  const handleDeletePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Главный экран</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.dashboardGrid}>
          {/* Колонка со статистикой */}
          <div className={styles.statsColumn}>
            <div className={styles.statsBlock}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.totalEmployees}</span>
                <span className={styles.statLabel}>Сотрудников</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.totalPositions}</span>
                <span className={styles.statLabel}>Должностей</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.totalCompetencies}</span>
                <span className={styles.statLabel}>Компетенций</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.totalDepartments}</span>
                <span className={styles.statLabel}>Отделов</span>
              </div>
            </div>
          </div>

          {/* Колонка с должностями */}
          <div className={styles.positionsColumn}>
            {/* Форма добавления */}
            <div className={styles.addForm}>
              <h3 className={styles.formTitle}>Добавить новую должность</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Название должности</label>
                  <input
                    type="text"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({...newPosition, name: e.target.value})}
                    placeholder="Например: Специалист"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Категория</label>
                  <select
                    value={newPosition.category}
                    onChange={(e) => setNewPosition({...newPosition, category: e.target.value})}
                  >
                    <option value="">Выберите категорию</option>
                    <option value="Начальный">Начальный</option>
                    <option value="Средний">Средний</option>
                    <option value="Высокий">Высокий</option>
                    <option value="Руководящий">Руководящий</option>
                  </select>
                </div>
              </div>
              <button 
                className={styles.submitBtn}
                onClick={handleAddPosition}
                disabled={!newPosition.name || !newPosition.category}
              >
                Добавить должность
              </button>
            </div>

            {/* Таблица должностей */}
            <div className={styles.tableSection}>
              <h2>Должности организации</h2>
              {positions.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Наименование</th>
                      <th>Категория</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(pos => (
                      <tr key={pos.id}>
                        <td>{pos.name}</td>
                        <td>{pos.category}</td>
                        <td>
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDeletePosition(pos.id)}
                            title="Удалить"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <p>Нет добавленных должностей</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;