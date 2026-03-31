// manager-dashboard.module.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './manager-dashboard.module.scss';

interface DepartmentInfo {
	id: string;
	name: string;
	progress?: {
		toStudy: number;
		inProgress: number;
		studied: number;
		count: number;
	};
}

interface DepartmentEmployee {
	id: string;
	firstName: string;
	lastName: string;
	middleName: string;
	email: string;
	mobilePhone: string;
	department: {
		id: string;
		name: string;
	};
	progress?: {
		toStudy: number;
		inProgress: number;
		studied: number;
		count: number;
	};
}

interface AppLog {
	id: string;
	text: string;
	createdAt: string;
}

interface UserProfile {
	department: {
		id: string;
		name: string;
	};
}

const ManagerDashboard: React.FC = () => {
	const navigate = useNavigate();
	const accessToken = localStorage.getItem('accessToken');
	
	const [departmentData, setDepartmentData] = useState({
		name: '',
		employeeCount: 0,
		avgProgress: 0,
		recentEvents: [] as AppLog[],
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Получение профиля текущего пользователя
	const fetchUserProfile = async (): Promise<UserProfile | null> => {
		try {
			const response = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('User profile:', data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
		return null;
	};

	// Получение информации о департаменте (статистика)
	const fetchDepartmentInfo = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/departments/${departmentId}/info`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: DepartmentInfo = await response.json();
				console.log('Department info:', data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching department info:', error);
		}
		return null;
	};

	// Получение списка сотрудников департамента с прогрессом
	const fetchDepartmentEmployees = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/departments/${departmentId}/employees`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: DepartmentEmployee[] = await response.json();
				console.log('Department employees with progress:', data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching department employees:', error);
		}
		return [];
	};

	// Получение списка последних событий для департамента
	const fetchDepartmentLogs = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/applogs/department/${departmentId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: AppLog[] = await response.json();
				console.log('Department logs:', data);
				return data.slice(0, 10); // Последние 10 событий
			}
		} catch (error) {
			console.error('Error fetching department logs:', error);
		}
		return [];
	};

	// Расчет среднего прогресса по сотрудникам
	const calculateAvgProgressFromEmployees = (employees: DepartmentEmployee[]) => {
		if (employees.length === 0) return 0;
		
		let totalProgress = 0;
		let validCount = 0;
		
		employees.forEach(emp => {
			if (emp.progress && emp.progress.count > 0) {
				const progressPercent = (emp.progress.studied / emp.progress.count) * 100;
				totalProgress += progressPercent;
				validCount++;
			}
		});
		
		if (validCount === 0) return 0;
		return Math.round(totalProgress / validCount);
	};

	useEffect(() => {
		const loadDashboardData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				// Получаем профиль пользователя
				const profile = await fetchUserProfile();
				
				if (profile && profile.department?.id) {
					console.log(`Loading data for department: ${profile.department.id}`);
					
					// Получаем данные департамента (статистика)
					const department = await fetchDepartmentInfo(profile.department.id);
					
					// Получаем сотрудников с прогрессом
					const employees = await fetchDepartmentEmployees(profile.department.id);
					
					// Получаем события департамента
					const logs = await fetchDepartmentLogs(profile.department.id);
					
					// Рассчитываем средний прогресс двумя способами
					let avgProgressFromDept = 0;
					let avgProgressFromEmployees = 0;
					
					// Способ 1: из общей статистики департамента
					if (department?.progress && department.progress.count > 0) {
						avgProgressFromDept = Math.round((department.progress.studied / department.progress.count) * 100);
					}
					
					// Способ 2: из данных каждого сотрудника
					avgProgressFromEmployees = calculateAvgProgressFromEmployees(employees);
					
					console.log('📊 Расчет среднего прогресса:');
					console.log(`  Из статистики отдела: ${avgProgressFromDept}%`);
					console.log(`  Из данных сотрудников: ${avgProgressFromEmployees}%`);
					console.log(`  Количество сотрудников: ${employees.length}`);
					
					// Выводим прогресс каждого сотрудника
					console.log('\n🎯 Прогресс сотрудников:');
					const progressMap: { [key: string]: number } = {};
					employees.forEach(emp => {
						const fullName = `${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`.trim();
						let progress = 0;
						if (emp.progress && emp.progress.count > 0) {
							progress = Math.round((emp.progress.studied / emp.progress.count) * 100);
						}
						progressMap[fullName] = progress;
						console.log(`  ${fullName}: ${progress}% (studied: ${emp.progress?.studied || 0}/${emp.progress?.count || 0})`);
					});
					console.table(progressMap);
					
					// Используем прогресс из статистики отдела (более точный)
					const finalAvgProgress = avgProgressFromDept > 0 ? avgProgressFromDept : avgProgressFromEmployees;
					
					setDepartmentData({
						name: department?.name || profile.department.name,
						employeeCount: department?.progress?.count || employees.length,
						avgProgress: finalAvgProgress,
						recentEvents: logs,
					});
					
					console.log('\n✅ Итоговые данные дашборда:');
					console.log(`  Отдел: ${department?.name || profile.department.name}`);
					console.log(`  Сотрудников: ${department?.progress?.count || employees.length}`);
					console.log(`  Средний прогресс: ${finalAvgProgress}%`);
					console.log(`  Событий: ${logs.length}`);
					console.log('=' .repeat(80));
					
				} else {
					setError('Не удалось определить ваш департамент');
				}
			} catch (err) {
				console.error('Error loading dashboard:', err);
				setError('Ошибка загрузки данных');
			} finally {
				setIsLoading(false);
			}
		};

		if (accessToken) {
			loadDashboardData();
		}
	}, [accessToken]);

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка данных...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.page}>
				<div className={styles.error}>{error}</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Главная</h1>
			</div>

			<div className={styles.content}>
				{/* Сводная панель с метриками */}
				<div className={styles.statsGrid}>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentData.employeeCount}
						</span>
						<span className={styles.statLabel}>Сотрудников</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentData.avgProgress}%
						</span>
						<span className={styles.statLabel}>Средний прогресс</span>
					</div>
				</div>

				{/* Блок последних событий */}
				<div className={styles.eventsSection}>
					<h2>Последние события</h2>
					<div className={styles.eventsList}>
						{departmentData.recentEvents.length === 0 ? (
							<div className={styles.eventItem}>
								<span className={styles.eventText}>Нет недавних событий</span>
							</div>
						) : (
							departmentData.recentEvents.map((event) => (
								<div key={event.id} className={styles.eventItem}>
									<span className={styles.eventDate}>
										{new Date(event.createdAt).toLocaleDateString('ru-RU')}
									</span>
									<span className={styles.eventText}>{event.text}</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ManagerDashboard;