import React, { useState } from 'react';
import styles from './user-table.module.scss';

type User = {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  targetPosition?: string;
  createdAt: string;
};

interface UserTableProps {
  users: User[]; // теперь принимаем отфильтрованных пользователей
  onUserSelect?: (user: User) => void;
  onSaveChanges?: (updatedUsers: User[]) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users,
  onUserSelect,
  onSaveChanges,
}) => {
  const [editedUsers, setEditedUsers] = useState<Record<string, Partial<User>>>({});

  const targetPositions = [
    'Специалист',
    'Ведущий специалист',
    'Главный специалист',
    'Руководитель отдела',
    'Начальник управления',
    'Главный бухгалтер'
  ];

  const handleRoleChange = (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    setEditedUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], role: newRole }
    }));
  };

  const handleTargetPositionChange = (userId: string, newPosition: string) => {
    setEditedUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], targetPosition: newPosition }
    }));
  };

  const handleSaveAll = () => {
    if (Object.keys(editedUsers).length === 0) {
      alert('Нет изменений для сохранения');
      return;
    }

    const updatedUsers = users.map(user => 
      editedUsers[user.id] ? { ...user, ...editedUsers[user.id] } : user
    );
    
    onSaveChanges?.(updatedUsers);
    setEditedUsers({});
  };

  const hasChanges = Object.keys(editedUsers).length > 0;

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '20%' }}>ФИО</th>
            <th style={{ width: '20%' }}>Email</th>
            <th style={{ width: '15%' }}>Роль</th>
            <th style={{ width: '15%' }}>Отдел</th>
            <th style={{ width: '20%' }}>Целевая должность</th>
            <th style={{ width: '10%' }}>Дата рег.</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
            const currentRole = editedUsers[user.id]?.role ?? user.role;
            const currentTargetPosition = editedUsers[user.id]?.targetPosition ?? user.targetPosition;
            const isEdited = !!editedUsers[user.id];

            return (
              <tr 
                key={user.id} 
                onClick={() => onUserSelect?.(user)}
                className={`${onUserSelect ? styles.clickableRow : ''} ${isEdited ? styles.editedRow : ''}`}
              >
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    className={`${styles.roleSelect} ${styles[currentRole]}`}
                    value={currentRole}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="user">Сотрудник</option>
                    <option value="manager">Руководитель</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
                <td>{user.department || '-'}</td>
                <td>
                  <select 
                    className={`${styles.positionSelect} ${isEdited ? styles.edited : ''}`}
                    value={currentTargetPosition || ''}
                    onChange={(e) => handleTargetPositionChange(user.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Выберите должность</option>
                    {targetPositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className={styles.emptyState}>
          Пользователи не найдены
        </div>
      )}

      <div className={styles.tableFooter}>
        <button 
          className={`${styles.saveButton} ${hasChanges ? styles.active : ''}`}
          onClick={handleSaveAll}
          disabled={!hasChanges}
        >
          Сохранить изменения {hasChanges && `(${Object.keys(editedUsers).length})`}
        </button>
      </div>
    </div>
  );
};

export default UserTable;