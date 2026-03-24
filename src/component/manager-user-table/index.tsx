import React, { useState } from 'react';
import styles from './manager_user_table.module.scss';

type User = {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  targetPosition?: string;
  currentPosition?: string;
  progress?: number;
  createdAt: string;
};

interface ManagerUserTableProps {
  users: User[];
  onUserSelect?: (user: User) => void;
  onTargetPositionChange?: (userId: string, newPosition: string) => void;
  onSaveChanges?: (updatedUsers: User[]) => void;
}

const ManagerUserTable: React.FC<ManagerUserTableProps> = ({ 
  users,
  onUserSelect,
  onTargetPositionChange,
  onSaveChanges,
}) => {
  const [editedUsers, setEditedUsers] = useState<Record<string, Partial<User>>>({});

  const targetPositions = [
    'Специалист',
    'Ведущий специалист',
    'Главный специалист',
    'Руководитель отдела',
    'Начальник управления'
  ];

  const handleTargetPositionChange = (userId: string, newPosition: string) => {
    setEditedUsers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], targetPosition: newPosition }
    }));
    // Сразу вызываем callback, если нужно
    onTargetPositionChange?.(userId, newPosition);
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
            <th style={{ width: '15%' }}>Текущая должность</th>
            <th style={{ width: '20%' }}>Целевая должность</th>
            <th style={{ width: '15%' }}>Прогресс</th>
            <th style={{ width: '10%' }}>Дата рег.</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => {
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
                <td>{user.currentPosition || '-'}</td>
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
                <td>
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${user.progress || 0}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>{user.progress || 0}%</span>
                  </div>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {users.length === 0 && (
        <div className={styles.emptyState}>
          Сотрудники не найдены
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

export default ManagerUserTable;