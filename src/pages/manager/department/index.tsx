// department.module.tsx (исправленная версия с правильной логикой подсчета)
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

	// Расчет общего прогресса отдела (сумма изученных / сумма выданных)
	const calculateTotalProgress = (employees: Employee[]) => {
		if (employees.length === 0) return 0;
		
		// Считаем сумму изученных материалов и сумму выданных материалов
		// ВНИМАНИЕ: progress - это уже процент, но нам нужны исходные данные!
		// Для правильного расчета нужно использовать исходные данные из API
		return 0; // Временное значение, будет пересчитано из исходных данных
	};

	// Расчет среднего уровня компетенций (на основе прогресса сотрудников)
	const calculateAvgCompetencyLevel = (employees: Employee[]) => {
		if (employees.length === 0) return 0;
		const totalProgress = employees.reduce((sum, emp) => sum + emp.progress, 0);
		const avgProgress = totalProgress / employees.length;
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
					
					// Количество сотрудников - из реального списка
					const totalEmployees = employeesData.length;
					
					if (employeesData.length > 0) {
						// Формируем список сотрудников
						const formattedEmployees: Employee[] = employeesData.map(emp => {
							// Прогресс сотрудника в процентах
							const progressPercent = calculateEmployeeProgress(emp.progress);
							
							return {
								id: emp.id,
								fullName: formatFullName(emp.firstName, emp.lastName, emp.middleName),
								email: emp.email,
								department: emp.department?.name || profile.department.name,
								currentPosition: emp.jobTitle?.name || 'Не указана',
								targetPosition: emp.targetJobTitle?.name || 'Не указана',
								progress: progressPercent,
								createdAt: new Date().toISOString().split('T')[0],
							};
						});
						
						setEmployees(formattedEmployees);
						
						// Расчет ИПР в работе и выполнено из данных сотрудников
						// inProgress - количество материалов в процессе у всех сотрудников
						// completedIpr - количество изученных материалов у всех сотрудников
						let totalInProgress = 0;
						let totalStudied = 0;
						let totalMaterials = 0;
						
						employeesData.forEach(emp => {
							if (emp.progress) {
								totalInProgress += emp.progress.inProgress || 0;
								totalStudied += emp.progress.studied || 0;
								totalMaterials += emp.progress.count || 0;
							}
						});
						
						// Средний уровень компетенций на основе прогресса
						const avgLevel = calculateAvgCompetencyLevel(formattedEmployees);
						
						// Общий прогресс отдела (сумма изученных / сумма выданных * 100)
						const totalProgressPercent = totalMaterials > 0 
							? Math.round((totalStudied / totalMaterials) * 100) 
							: 0;
						
						console.log('📊 Детальная статистика отдела:');
						console.log(`  Всего сотрудников: ${totalEmployees}`);
						console.log(`  Сумма материалов в процессе: ${totalInProgress}`);
						console.log(`  Сумма изученных материалов: ${totalStudied}`);
						console.log(`  Сумма выданных материалов: ${totalMaterials}`);
						console.log(`  Общий прогресс отдела: ${totalProgressPercent}%`);
						console.log(`  Средний уровень компетенций: ${avgLevel}`);
						
						// Выводим данные каждого сотрудника
						console.log('\n📊 Данные сотрудников отдела:');
						console.log('=' .repeat(80));
						
						formattedEmployees.forEach((employee, index) => {
							console.log(`\n👤 Сотрудник ${index + 1}:`);
							console.log(`  ФИО: ${employee.fullName}`);
							console.log(`  Прогресс: ${employee.progress}%`);
							const empData = employeesData[index];
							if (empData?.progress) {
								console.log(`    Изучено: ${empData.progress.studied}/${empData.progress.count}`);
								console.log(`    В процессе: ${empData.progress.inProgress}`);
								console.log(`    К изучению: ${empData.progress.toStudy}`);
							}
						});
						
						setDepartmentStats({
							totalEmployees: totalEmployees,
							avgCompetencyLevel: avgLevel,
							inProgressIpr: totalInProgress,
							completedIpr: totalStudied,
						});
						
					} else {
						// Если нет сотрудников
						setDepartmentStats({
							totalEmployees: 0,
							avgCompetencyLevel: 0,
							inProgressIpr: 0,
							completedIpr: 0,
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