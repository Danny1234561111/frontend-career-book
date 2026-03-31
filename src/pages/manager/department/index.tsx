// department.module.tsx (исправленная версия с правильным API)
import React, { useState, useEffect } from 'react';
import { ManagerUserTable } from '../../../component';
import styles from './department.module.scss';

interface Employee {
	id: string;
	fullName: string;
	email: string;
	department: string;
	currentPosition: string;
	targetPosition: string;
	progress: number;
	createdAt: string;
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
	jobTitle?: {
		id: string;
		name: string;
	};
	targetJobTitle?: {
		id: string;
		name: string;
	};
}

interface DepartmentInfo {
	id: string;
	name: string;
	shortName: string;
	progress?: {
		toStudy: number;
		inProgress: number;
		studied: number;
		count: number;
	};
}

interface UserProfile {
	department: {
		id: string;
		name: string;
	};
}

const DepartmentPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [departmentStats, setDepartmentStats] = useState({
		totalEmployees: 0,
		avgCompetencyLevel: 0,
		inProgressIpr: 0,
		completedIpr: 0,
	});
	
	const [employees, setEmployees] = useState<Employee[]>([]);
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
				return data;
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
		return null;
	};

	// Получение информации о департаменте (для статистики)
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
				return data;
			}
		} catch (error) {
			console.error('Error fetching department info:', error);
		}
		return null;
	};

	// Получение списка сотрудников департамента с прогрессом каждого
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
				console.log('Raw employees data from API:', data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching department employees:', error);
		}
		return [];
	};

	// Получение должностей сотрудников (если нужно)
	const fetchEmployeeJobTitles = async (employees: DepartmentEmployee[]) => {
		const employeesWithJobs = await Promise.all(
			employees.map(async (emp) => {
				try {
					const response = await fetch(`http://localhost:5217/api/users/${emp.id}`, {
						method: 'GET',
						headers: {
							'Authorization': `Bearer ${accessToken}`,
							'accept': 'text/plain',
						},
					});
					
					if (response.ok) {
						const userData = await response.json();
						return {
							...emp,
							jobTitle: userData.jobTitle || userData.currentPosition,
							targetJobTitle: userData.targetJobTitle || userData.targetPosition,
						};
					}
				} catch (error) {
					console.error(`Error fetching user ${emp.id}:`, error);
				}
				return emp;
			})
		);
		
		return employeesWithJobs;
	};

	// Форматирование ФИО
	const formatFullName = (firstName: string, lastName: string, middleName: string) => {
		const parts = [];
		if (lastName) parts.push(lastName);
		if (firstName) parts.push(firstName);
		if (middleName) parts.push(middleName);
		return parts.join(' ') || 'Не указано';
	};

	// Расчет прогресса сотрудника из API данных
	const calculateEmployeeProgress = (empProgress?: { studied: number; count: number }) => {
		if (!empProgress || empProgress.count === 0) return 0;
		return Math.round((empProgress.studied / empProgress.count) * 100);
	};

	// Расчет среднего прогресса по департаменту
	const calculateAvgProgress = (employees: Employee[]) => {
		if (employees.length === 0) return 0;
		const totalProgress = employees.reduce((sum, emp) => sum + emp.progress, 0);
		return Math.round(totalProgress / employees.length);
	};

	// Расчет среднего уровня компетенций
	const calculateAvgCompetencyLevel = (employees: Employee[]) => {
		if (employees.length === 0) return 0;
		const avgProgress = calculateAvgProgress(employees);
		// Переводим процент в уровень (0-100% -> 0-5)
		const avgLevel = avgProgress / 20;
		return Math.round(avgLevel * 10) / 10;
	};

	useEffect(() => {
		const loadDepartmentData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const profile = await fetchUserProfile();
				
				if (profile && profile.department?.id) {
					// Получаем статистику отдела
					const department = await fetchDepartmentInfo(profile.department.id);
					
					// Получаем список сотрудников с прогрессом (основной источник данных)
					const employeesData = await fetchDepartmentEmployees(profile.department.id);
					
					if (employeesData.length > 0) {
						// Получаем должности сотрудников
						const employeesWithJobs = await fetchEmployeeJobTitles(employeesData);
						
						// Формируем список сотрудников
						const formattedEmployees: Employee[] = employeesWithJobs.map(emp => {
							// Прогресс берем из API напрямую
							const progressPercent = calculateEmployeeProgress(emp.progress);
							
							return {
								id: emp.id,
								fullName: formatFullName(emp.firstName, emp.lastName, emp.middleName),
								email: emp.email,
								department: emp.department?.name || profile.department.name,
								currentPosition: (emp as any).jobTitle?.name || 'Не указана',
								targetPosition: (emp as any).targetJobTitle?.name || 'Не указана',
								progress: progressPercent,
								createdAt: new Date().toISOString().split('T')[0],
							};
						});
						
						setEmployees(formattedEmployees);
						
						// Статистика отдела из department.progress
						const totalEmployees = department?.progress?.count || formattedEmployees.length;
						const inProgressIpr = department?.progress?.inProgress || 0;
						const completedIpr = department?.progress?.studied || 0;
						
						// Средний прогресс считаем из данных сотрудников
						const avgProgress = calculateAvgProgress(formattedEmployees);
						const avgLevel = calculateAvgCompetencyLevel(formattedEmployees);
						
						// Выводим данные каждого сотрудника в виде словаря
						console.log('📊 Данные сотрудников отдела (из /api/departments/{id}/employees):');
						console.log('=' .repeat(80));
						
						formattedEmployees.forEach((employee, index) => {
							console.log(`\n👤 Сотрудник ${index + 1}:`);
							console.log(`  ID: ${employee.id}`);
							console.log(`  ФИО: ${employee.fullName}`);
							console.log(`  Email: ${employee.email}`);
							console.log(`  Отдел: ${employee.department}`);
							console.log(`  Текущая должность: ${employee.currentPosition}`);
							console.log(`  Целевая должность: ${employee.targetPosition}`);
							console.log(`  Прогресс: ${employee.progress}%`);
							console.log(`  ${'-'.repeat(60)}`);
						});
						
						// Выводим сырые данные из API для отладки
						console.log('\n🔍 Сырые данные сотрудников из API:');
						employeesData.forEach((emp, index) => {
							console.log(`\nСотрудник ${index + 1}:`, {
								id: emp.id,
								fullName: formatFullName(emp.firstName, emp.lastName, emp.middleName),
								email: emp.email,
								progressRaw: emp.progress,
								progressPercent: calculateEmployeeProgress(emp.progress)
							});
						});
						
						// Выводим сводную статистику
						console.log('\n📈 Сводная статистика отдела:');
						console.log(`  Всего сотрудников: ${totalEmployees}`);
						console.log(`  ИПР в работе: ${inProgressIpr}`);
						console.log(`  ИПР выполнено: ${completedIpr}`);
						console.log(`  Средний прогресс: ${avgProgress}%`);
						console.log(`  Средний уровень: ${avgLevel}`);
						console.log(`  ${'='.repeat(80)}`);
						
						// Выводим прогресс каждого сотрудника в виде таблицы
						console.log('\n🎯 Прогресс сотрудников:');
						const progressMap: { [key: string]: number } = {};
						formattedEmployees.forEach(emp => {
							progressMap[emp.fullName] = emp.progress;
						});
						console.table(progressMap);
						
						setDepartmentStats({
							totalEmployees: totalEmployees,
							avgCompetencyLevel: avgLevel,
							inProgressIpr: inProgressIpr,
							completedIpr: completedIpr,
						});
					} else if (department) {
						// Если нет сотрудников, но есть статистика отдела
						const totalEmployees = department.progress?.count || 0;
						const inProgressIpr = department.progress?.inProgress || 0;
						const completedIpr = department.progress?.studied || 0;
						
						setDepartmentStats({
							totalEmployees: totalEmployees,
							avgCompetencyLevel: 0,
							inProgressIpr: inProgressIpr,
							completedIpr: completedIpr,
						});
						
						console.log('Нет сотрудников в отделе');
					}
				} else {
					setError('Не удалось определить ваш департамент');
				}
			} catch (err) {
				console.error('Error loading department data:', err);
				setError('Ошибка загрузки данных');
			} finally {
				setIsLoading(false);
			}
		};

		if (accessToken) {
			loadDepartmentData();
		}
	}, [accessToken]);

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка данных отдела...</div>
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
				<h1 className={styles.title}>Мой отдел</h1>
			</div>

			<div className={styles.content}>
				<div className={styles.statsGrid}>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.totalEmployees}
						</span>
						<span className={styles.statLabel}>Сотрудников</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.avgCompetencyLevel}
						</span>
						<span className={styles.statLabel}>Средний уровень</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.inProgressIpr}
						</span>
						<span className={styles.statLabel}>ИПР в работе</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.completedIpr}
						</span>
						<span className={styles.statLabel}>ИПР выполнено</span>
					</div>
				</div>

				<div className={styles.tableSection}>
					<h2>Сотрудники отдела</h2>
					<ManagerUserTable users={employees} />
				</div>
			</div>
		</div>
	);
};

export default DepartmentPage;