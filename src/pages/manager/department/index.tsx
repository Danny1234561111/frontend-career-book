import React, { useState, useEffect } from 'react';
import { ManagerUserTable } from '../../../component';
import styles from './department.module.scss';

interface Employee {
	id: string;
	fullName: string;
	department: string;
	currentPosition: string;
	nextPosition: string;
	currentProgress: number;
	nextProgress: number;
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
	currentJobLevelProgress?: {
		toStudy: number;
		studied: number;
		count: number;
	};
	nextJobLevelProgress?: {
		toStudy: number;
		studied: number;
		count: number;
	};
	jobTitle?: {
		id: string;
		name: string;
	};
	currentJobLevel?: {
		id: string;
		name: string;
	};
	nextJobLevel?: {
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
		avgCurrentLevel: 0,
		avgNextLevel: 0,
		totalEmployeesReadyForNext: 0,
	});
	
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departmentName, setDepartmentName] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUserProfile = async (): Promise<UserProfile | null> => {
		try {
			const response = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('📱 User profile:', data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
		return null;
	};

	const fetchDepartmentEmployees = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/departments/${departmentId}/employees`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: DepartmentEmployee[] = await response.json();
				console.log('📋 Raw employees data from API:', data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching department employees:', error);
		}
		return [];
	};

	const formatFullName = (firstName: string, lastName: string, middleName: string) => {
		const parts = [];
		if (lastName) parts.push(lastName);
		if (firstName) parts.push(firstName);
		if (middleName) parts.push(middleName);
		return parts.join(' ') || 'Не указано';
	};

	// Расчет прогресса по компетенциям для текущей должности
	const calculateCurrentProgress = (progress?: { studied: number; count: number }): number => {
		if (!progress || progress.count === 0) return 0;
		return Math.round((progress.studied / progress.count) * 100);
	};

	// Расчет прогресса по компетенциям для следующей должности
	const calculateNextProgress = (progress?: { studied: number; count: number }): number => {
		if (!progress || progress.count === 0) return 0;
		return Math.round((progress.studied / progress.count) * 100);
	};

	// Получение уровня из прогресса (1-5)
	const getLevelFromProgress = (progressPercent: number): number => {
		if (progressPercent >= 80) return 5;
		if (progressPercent >= 60) return 4;
		if (progressPercent >= 40) return 3;
		if (progressPercent >= 20) return 2;
		return 1;
	};

	useEffect(() => {
		const loadDepartmentData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const profile = await fetchUserProfile();
				
				if (profile && profile.department?.id) {
					setDepartmentName(profile.department.name);
					const employeesData = await fetchDepartmentEmployees(profile.department.id);
					
					const totalEmployees = employeesData.length;
					
					console.log('\n' + '='.repeat(80));
					console.log('📊 Обработка данных сотрудников:');
					console.log('='.repeat(80));
					
					if (employeesData.length > 0) {
						const formattedEmployees: Employee[] = employeesData.map((emp, index) => {
							const currentProgress = calculateCurrentProgress(emp.currentJobLevelProgress);
							const nextProgress = calculateNextProgress(emp.nextJobLevelProgress);
							
							console.log(`\n👤 Сотрудник ${index + 1}:`);
							console.log(`  ФИО: ${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`);
							console.log(`  Текущая должность: ${emp.jobTitle?.name || 'Не указана'}`);
							console.log(`  Следующая должность: ${emp.nextJobLevel?.name || 'Не указана'}`);
							console.log(`  Прогресс по текущей должности: ${currentProgress}% (${emp.currentJobLevelProgress?.studied || 0}/${emp.currentJobLevelProgress?.count || 0} компетенций)`);
							console.log(`  Прогресс по следующей должности: ${nextProgress}% (${emp.nextJobLevelProgress?.studied || 0}/${emp.nextJobLevelProgress?.count || 0} компетенций)`);
							
							return {
								id: emp.id,
								fullName: formatFullName(emp.firstName, emp.lastName, emp.middleName),
								department: emp.department?.name || profile.department.name,
								currentPosition: emp.jobTitle?.name || 'Не указана',
								nextPosition: emp.nextJobLevel?.name || 'Не указана',
								currentProgress: currentProgress,
								nextProgress: nextProgress,
								createdAt: new Date().toISOString().split('T')[0],
							};
						});
						
						setEmployees(formattedEmployees);
						
						// Расчет статистики
						let totalCurrentProgress = 0;
						let totalNextProgress = 0;
						let readyForNextCount = 0;
						
						formattedEmployees.forEach(emp => {
							totalCurrentProgress += emp.currentProgress;
							totalNextProgress += emp.nextProgress;
							if (emp.currentProgress >= 100) {
								readyForNextCount++;
							}
						});
						
						const avgCurrentLevel = formattedEmployees.length > 0 
							? Math.round((totalCurrentProgress / formattedEmployees.length) * 10) / 10
							: 0;
						const avgNextLevel = formattedEmployees.length > 0 
							? Math.round((totalNextProgress / formattedEmployees.length) * 10) / 10
							: 0;
						
						console.log('\n' + '='.repeat(80));
						console.log('📊 Детальная статистика отдела:');
						console.log('='.repeat(80));
						console.log(`  Всего сотрудников: ${totalEmployees}`);
						console.log(`  Средний прогресс по текущей должности: ${avgCurrentLevel}%`);
						console.log(`  Средний прогресс по следующей должности: ${avgNextLevel}%`);
						console.log(`  Готовы к повышению: ${readyForNextCount}`);
						console.log('='.repeat(80));
						
						setDepartmentStats({
							totalEmployees: totalEmployees,
							avgCurrentLevel: avgCurrentLevel,
							avgNextLevel: avgNextLevel,
							totalEmployeesReadyForNext: readyForNextCount,
						});
					} else {
						setDepartmentStats({
							totalEmployees: 0,
							avgCurrentLevel: 0,
							avgNextLevel: 0,
							totalEmployeesReadyForNext: 0,
						});
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
				{departmentName && <div className={styles.departmentName}>{departmentName}</div>}
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
							{departmentStats.avgCurrentLevel}%
						</span>
						<span className={styles.statLabel}>Прогресс по текущей должности</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.avgNextLevel}%
						</span>
						<span className={styles.statLabel}>Прогресс по следующей должности</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.totalEmployeesReadyForNext}
						</span>
						<span className={styles.statLabel}>Готовы к повышению</span>
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