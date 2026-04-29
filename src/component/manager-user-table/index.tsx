// manager_user_table.tsx (исправленный - без email)

import React from 'react';
import styles from './manager_user_table.module.scss';

type User = {
	id: string;
	fullName: string;
	department?: string;
	targetPosition?: string;
	currentPosition?: string;
	progress?: number;
	createdAt: string;
};

interface ManagerUserTableProps {
	users: User[];
	onUserSelect?: (user: User) => void;
}

const ManagerUserTable: React.FC<ManagerUserTableProps> = ({
	users,
	onUserSelect,
}) => {
	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('ru-RU', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		} catch (error) {
			return dateString;
		}
	};

	const getProgressColor = (progress: number) => {
		if (progress >= 80) return styles.highProgress;
		if (progress >= 50) return styles.mediumProgress;
		return styles.lowProgress;
	};

	return (
		<div className={styles.container}>
			<table className={styles.table}>
				<thead>
					<tr>
						<th style={{ width: '25%' }}>Сотрудник</th>
						<th style={{ width: '20%' }}>Текущая должность</th>
						<th style={{ width: '15%' }}>Прогресс</th>
						<th style={{ width: '15%' }}>Дата рег.</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr
							key={user.id}
							onClick={() => onUserSelect?.(user)}
							className={onUserSelect ? styles.clickableRow : ''}
						>
							<td>{user.fullName}</td>
							<td>{user.currentPosition || '-'}</td>
							<td>
								<div className={styles.progressContainer}>
									<div className={styles.progressBar}>
										<div
											className={`${styles.progressFill} ${getProgressColor(user.progress || 0)}`}
											style={{ width: `${user.progress || 0}%` }}
										/>
									</div>
									<span className={styles.progressText}>
										{user.progress || 0}%
									</span>
								</div>
								</td>
								<td className={styles.dateCell}>{formatDate(user.createdAt)}</td>
							</tr>
					))}
				</tbody>
			</table>

			{users.length === 0 && (
				<div className={styles.emptyState}>Сотрудники не найдены</div>
			)}
		</div>
	);
};

export default ManagerUserTable;