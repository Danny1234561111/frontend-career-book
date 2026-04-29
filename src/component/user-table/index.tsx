import React, { useState } from 'react';
import styles from './user-table.module.scss';

type User = {
	id: string;
	fullName: string;
	email: string;
	role: 'admin' | 'manager' | 'user';
	department?: string;
	createdAt: string;
};

interface UserTableProps {
	users: User[];
	onUserSelect?: (user: User) => void;
	onSaveChanges?: (updatedUsers: User[]) => void;
}

const UserTable: React.FC<UserTableProps> = ({
	users,
	onUserSelect,
	onSaveChanges,
}) => {
	const [editedUsers, setEditedUsers] = useState<Record<string, Partial<User>>>(
		{}
	);

	const handleRoleChange = (
		userId: string,
		newRole: 'admin' | 'manager' | 'user'
	) => {
		setEditedUsers((prev) => ({
			...prev,
			[userId]: { ...prev[userId], role: newRole },
		}));
	};

	const handleSaveAll = () => {
		if (Object.keys(editedUsers).length === 0) {
			alert('Нет изменений для сохранения');
			return;
		}

		const updatedUsers = users.map((user) =>
			editedUsers[user.id] ? { ...user, ...editedUsers[user.id] } : user
		);

		onSaveChanges?.(updatedUsers);
		setEditedUsers({});
	};

	const hasChanges = Object.keys(editedUsers).length > 0;

	const getRoleClass = (role: string) => {
		switch (role) {
			case 'admin':
				return styles.admin;
			case 'manager':
				return styles.manager;
			default:
				return styles.user;
		}
	};

	const getRoleLabel = (role: string) => {
		switch (role) {
			case 'admin':
				return 'Администратор';
			case 'manager':
				return 'Руководитель';
			default:
				return 'Сотрудник';
		}
	};

	return (
		<div className={styles.container}>
			<table className={styles.table}>
				<thead>
					<tr>
						<th style={{ width: '25%' }}>ФИО</th>
						<th style={{ width: '25%' }}>Email</th>
						<th style={{ width: '15%' }}>Отдел</th>
						<th style={{ width: '20%' }}>Роль</th>
						<th style={{ width: '15%' }}>Дата рег.</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => {
						const currentRole = editedUsers[user.id]?.role ?? user.role;
						const isEdited = !!editedUsers[user.id];

						return (
							<tr
								key={user.id}
								onClick={() => onUserSelect?.(user)}
								className={`${onUserSelect ? styles.clickableRow : ''} ${
									isEdited ? styles.editedRow : ''
								}`}>
								<td style={{ fontWeight: 500 }}>{user.fullName}</td>
								<td style={{ color: '#666' }}>{user.email}</td>
								<td>{user.department || '-'}</td>
								<td>
									<select
										className={`${styles.roleSelect} ${getRoleClass(currentRole)}`}
										value={currentRole}
										onChange={(e) =>
											handleRoleChange(user.id, e.target.value as any)
										}
										onClick={(e) => e.stopPropagation()}>
										<option value='user'>Сотрудник</option>
										<option value='manager'>Руководитель</option>
										<option value='admin'>Администратор</option>
									</select>
								</td>
								<td>{new Date(user.createdAt).toLocaleDateString()}</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{users.length === 0 && (
				<div className={styles.emptyState}>Пользователи не найдены</div>
			)}

			<div className={styles.tableFooter}>
				<button
					className={`${styles.saveButton} ${hasChanges ? styles.active : ''}`}
					onClick={handleSaveAll}
					disabled={!hasChanges}>
					Сохранить изменения{' '}
					{hasChanges && `(${Object.keys(editedUsers).length})`}
				</button>
			</div>
		</div>
	);
};

export default UserTable;