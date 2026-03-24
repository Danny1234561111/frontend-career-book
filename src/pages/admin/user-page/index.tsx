import React, { useState, useEffect } from 'react';
import { UserTable, UserFilters } from '../../../component';
import styles from './users_page.module.scss';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  targetPosition?: string;
  createdAt: string;
}

interface Filters {
  search?: string;
  role?: string;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
}

const UsersPage: React.FC = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Исходные данные пользователей
  const allUsers: User[] = [
    { 
      id: '1', 
      fullName: 'Иванов Иван Иванович', 
      email: 'ivanov@enplus.digital', 
      role: 'admin', 
      department: 'IT отдел', 
      targetPosition: 'Руководитель отдела',
      createdAt: '2024-01-15' 
    },
    { 
      id: '2', 
      fullName: 'Петров Петр Петрович', 
      email: 'petrov@enplus.digital', 
      role: 'manager', 
      department: 'HR отдел', 
      targetPosition: 'Начальник управления',
      createdAt: '2024-01-10' 
    },
    { 
      id: '3', 
      fullName: 'Сидорова Мария Ивановна', 
      email: 'sidorova@enplus.digital', 
      role: 'user', 
      department: 'IT отдел', 
      targetPosition: 'Ведущий специалист',
      createdAt: '2024-01-05' 
    },
    { 
      id: '4', 
      fullName: 'Козлов Алексей Дмитриевич', 
      email: 'kozlov@enplus.digital', 
      role: 'user', 
      department: 'Бухгалтерия', 
      targetPosition: 'Главный бухгалтер',
      createdAt: '2024-01-20' 
    },
    { 
      id: '5', 
      fullName: 'Николаева Елена Сергеевна', 
      email: 'nikolaeva@enplus.digital', 
      role: 'manager', 
      department: 'HR отдел', 
      targetPosition: 'Руководитель отдела',
      createdAt: '2024-01-18' 
    },
    { 
      id: '6', 
      fullName: 'Соколов Дмитрий Петрович', 
      email: 'sokolov@enplus.digital', 
      role: 'user', 
      department: 'Sales', 
      targetPosition: 'Ведущий специалист',
      createdAt: '2024-01-22' 
    },
  ];

  // Применяем фильтры при их изменении
  useEffect(() => {
    let result = [...allUsers];

    // Фильтр по поиску (имя или email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Фильтр по роли
    if (filters.role) {
      result = result.filter(user => user.role === filters.role);
    }

    // Фильтр по отделу
    if (filters.department) {
      result = result.filter(user => user.department === filters.department);
    }

    // Фильтр по дате (с)
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom).getTime();
      result = result.filter(user => new Date(user.createdAt).getTime() >= fromDate);
    }

    // Фильтр по дате (по)
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo).getTime();
      result = result.filter(user => new Date(user.createdAt).getTime() <= toDate);
    }

    setFilteredUsers(result);
  }, [filters]);

  const handleSaveChanges = (updatedUsers: User[]) => {
    console.log('Сохраненные пользователи:', updatedUsers);
    // Здесь будет API вызов для сохранения
    alert('Изменения сохранены');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Управление пользователями</h1>
      </div>

      <div className={styles.content}>
        <UserFilters onFilterChange={setFilters} />
        
        <UserTable 
          users={filteredUsers}
          onSaveChanges={handleSaveChanges}
        />
        
        <div className={styles.stats}>
          Найдено пользователей: <strong>{filteredUsers.length}</strong>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;