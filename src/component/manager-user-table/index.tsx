// manager_user_table.tsx (исправленный - с прогрессом по текущей и следующей должности)

import React from 'react';
import styles from './manager_user_table.module.scss';

type User = {
	id: string;
	fullName: string;
	email?: string;
	department?: string;
	currentPosition?: string;
	nextPosition?: string;
	currentProgress?: number;
	nextProgress?: number;
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
						<th style={{ width: '20%' }}>Сотрудник</th>
						<th style={{ width: '18%' }}>Текущая должность</th>
						<th style={{ width: '18%' }}>Следующая должность</th>
						<th style={{ width: '22%' }}>Прогресс по текущей</th>
						<th style={{ width: '22%' }}>Прогресс по следующей</th>
						<th style={{ width: '10%' }}>Дата рег.</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr
							key={user.id}
							onClick={() => onUserSelect?.(user)}
							className={onUserSelect ? styles.clickableRow : ''}
						>
							<td className={styles.userName}>{user.fullName}</td>
							<td className={styles.currentPosition}>{user.currentPosition || '-'}</td>
							<td className={styles.nextPosition}>{user.nextPosition || '-'}</td>
							<td className={styles.progressCell}>
								<div className={styles.progressContainer}>
									<div className={styles.progressBar}>
										<div
											className={`${styles.progressFill} ${getProgressColor(user.currentProgress || 0)}`}
											style={{ width: `${user.currentProgress || 0}%` }}
										/>
									</div>
									<span className={styles.progressText}>
										{user.currentProgress || 0}%
									</span>
								</div>
								{user.currentProgress === 100 && (
									<span className={styles.completedBadge}>✓ Готов</span>
								)}
							</td>
							<td className={styles.progressCell}>
								<div className={styles.progressContainer}>
									<div className={styles.progressBar}>
										<div
											className={`${styles.progressFill} ${getProgressColor(user.nextProgress || 0)}`}
											style={{ width: `${user.nextProgress || 0}%` }}
										/>
									</div>
									<span className={styles.progressText}>
										{user.nextProgress || 0}%
									</span>
								</div>
								{user.nextProgress === 100 && (
									<span className={styles.readyBadge}>🎯 Готов к повышению</span>
								)}
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