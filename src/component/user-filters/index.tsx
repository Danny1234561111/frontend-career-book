import React, { useState } from 'react';
import styles from './user-filters.module.scss';

interface UserFiltersProps {
  onFilterChange: (filters: UserFilters) => void;
  initialFilters?: UserFilters;
}

interface UserFilters {
  search?: string;
  role?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
}

const UserFilters: React.FC<UserFiltersProps> = ({ onFilterChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const departments = ['IT', 'HR', 'Sales', 'Marketing', 'Finance'];

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className={styles.filters}>
      <div className={styles.header}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
        
        <button 
          className={styles.expandBtn} 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▲ Свернуть' : '▼ Расширенный поиск'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Роль:</label>
              <select 
                value={filters.role || ''} 
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="">Все роли</option>
                <option value="admin">Администратор</option>
                <option value="manager">Руководитель</option>
                <option value="user">Сотрудник</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Отдел:</label>
              <select 
                value={filters.department || ''} 
                onChange={(e) => handleFilterChange('department', e.target.value)}
              >
                <option value="">Все отделы</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>Дата с:</label>
              <input 
                type="date" 
                value={filters.dateFrom || ''} 
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Дата по:</label>
              <input 
                type="date" 
                value={filters.dateTo || ''} 
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.clearBtn} onClick={clearFilters}>
              Сбросить фильтры
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilters;