import React, { useState, useEffect } from 'react';
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
	createdAt?: string;
	lastModified?: string;
}

interface User {
	id: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	email?: string;
	employee?: {
		department?: { name: string };
	};
	role?: {
		id: string;
		name: string;
		value: string;
	};
}

const AdminDashboard: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [stats, setStats] = useState<DashboardStats>({
		totalEmployees: 0,
		totalPositions: 0,
		totalCompetencies: 0,
		totalDepartments: 0,
	});

	const [positions, setPositions] = useState<Position[]>([]);
	const [newPositionName, setNewPositionName] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Получение статистики
	const fetchStats = async () => {
		try {
			// Получаем пользователей через /api/users
			const usersRes = await fetch('http://localhost:5217/api/users', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});
			if (usersRes.ok) {
				const users: User[] = await usersRes.json();
				setStats(prev => ({ ...prev, totalEmployees: users.length }));
				console.log('Users count:', users.length);
			} else {
				console.error('Failed to fetch users:', usersRes.status);
			}

			// Получаем должности
			const positionsRes = await fetch('http://localhost:5217/api/jobtitles?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});
			if (positionsRes.ok) {
				const positionsData = await positionsRes.json();
				setStats(prev => ({ ...prev, totalPositions: positionsData.length }));
			} else {
				console.error('Failed to fetch positions:', positionsRes.status);
			}

			// Временно отключаем компетенции и отделы, так как эндпоинтов нет
			setStats(prev => ({ ...prev, totalCompetencies: 0, totalDepartments: 0 }));
			
		} catch (error) {
			console.error('Error fetching stats:', error);
			setError('Ошибка загрузки статистики');
		}
	};

	// Получение списка должностей
	const fetchPositions = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/jobtitles?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setPositions(data);
			} else {
				console.error('Failed to fetch positions:', response.status);
				setError('Ошибка загрузки должностей');
			}
		} catch (error) {
			console.error('Error fetching positions:', error);
			setError('Ошибка загрузки должностей');
		}
	};

	// Добавление должности
	const addPosition = async () => {
		if (!newPositionName.trim()) return;

		try {
			const response = await fetch('http://localhost:5217/api/jobtitles', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: newPositionName }),
			});

			if (response.ok) {
				setSuccessMessage('Должность успешно добавлена');
				setNewPositionName('');
				await Promise.all([fetchPositions(), fetchStats()]);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				const errorData = await response.text();
				setError(`Ошибка: ${errorData || 'Не удалось добавить должность'}`);
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding position:', error);
			setError('Ошибка при добавлении должности');
			setTimeout(() => setError(null), 3000);
		}
	};

	// Удаление должности
	const deletePosition = async (id: string) => {
		if (!confirm('Вы уверены, что хотите удалить эту должность?')) return;

		try {
			const response = await fetch(`http://localhost:5217/api/jobtitles/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			if (response.ok) {
				setSuccessMessage('Должность удалена');
				await Promise.all([fetchPositions(), fetchStats()]);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				const errorText = await response.text();
				setError(`Ошибка: ${errorText || 'Не удалось удалить должность'}`);
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error deleting position:', error);
			setError('Ошибка при удалении должности');
			setTimeout(() => setError(null), 3000);
		}
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await Promise.all([fetchStats(), fetchPositions()]);
			setIsLoading(false);
		};
		loadData();
	}, []);

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Главный экран</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<div className={styles.dashboardGrid}>
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

					<div className={styles.positionsColumn}>
						<div className={styles.addForm}>
							<h3 className={styles.formTitle}>Добавить новую должность</h3>
							<div className={styles.formRow}>
								<div className={styles.formGroup}>
									<label>Название должности</label>
									<input
										type='text'
										value={newPositionName}
										onChange={(e) => setNewPositionName(e.target.value)}
										placeholder='Например: Специалист'
									/>
								</div>
							</div>
							<button
								className={styles.submitBtn}
								onClick={addPosition}
								disabled={!newPositionName.trim()}>
								Добавить должность
							</button>
						</div>

						<div className={styles.tableSection}>
							<h2>Должности организации</h2>
							{positions.length > 0 ? (
								<table className={styles.table}>
									<thead>
										<tr>
											<th>Наименование</th>
											<th>ID</th>
											<th></th>
										</tr>
									</thead>
									<tbody>
										{positions.map((pos) => (
											<tr key={pos.id}>
												<td>{pos.name}</td>
												<td className={styles.idCell}>{pos.id.slice(0, 8)}...</td>
												<td>
													<button
														className={styles.deleteBtn}
														onClick={() => deletePosition(pos.id)}
														title='Удалить'>
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