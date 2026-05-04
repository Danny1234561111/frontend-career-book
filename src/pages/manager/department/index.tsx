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

// Интерфейс для объекта уровня должности
interface JobLevelObject {
	id: string;
	name: string;
	createdAt?: string;
	lastModified?: string;
	deletedAt?: string | null;
}

// Интерфейс для объекта должности
interface JobTitleObject {
	id: string;
	name: string;
	createdAt?: string;
	lastModified?: string;
	deletedAt?: string | null;
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
	// Может быть строкой или объектом
	jobTitle?: string | JobTitleObject;
	currentJobLevel?: string | JobLevelObject;
	nextJobLevel?: string | JobLevelObject;
}

interface UserProfile {
	department: {
		id: string;
		name: string;
	};
}

// Функция для получения строкового значения из поля, которое может быть строкой или объектом
const getStringValue = (value: string | { name: string } | undefined): string => {
	if (!value) return 'Не указана';
	if (typeof value === 'string') return value;
	if (typeof value === 'object' && value.name) return value.name;
	return 'Не указана';
};

// Функция для детального вывода информации о полях в консоль
const logFieldDetails = (employee: DepartmentEmployee, index: number) => {
	console.log(`\n🔍 ДЕТАЛЬНЫЙ АНАЛИЗ СОТРУДНИКА ${index + 1}:`);
	console.log('═'.repeat(60));
	
	// Анализ jobTitle
	console.log('\n📌 JOBTITLE (Должность):');
	console.log('  └─ Тип:', typeof employee.jobTitle);
	console.log('  └─ Значение:', employee.jobTitle);
	if (typeof employee.jobTitle === 'object' && employee.jobTitle !== null) {
		console.log('  └─ Свойства объекта:');
		console.log('      • id:', employee.jobTitle.id);
		console.log('      • name:', employee.jobTitle.name);
		console.log('      • createdAt:', employee.jobTitle.createdAt);
		console.log('      • lastModified:', employee.jobTitle.lastModified);
		console.log('      • deletedAt:', employee.jobTitle.deletedAt);
	}
	
	// Анализ currentJobLevel
	console.log('\n📊 CURRENTJOBLEVEL (Текущий уровень):');
	console.log('  └─ Тип:', typeof employee.currentJobLevel);
	console.log('  └─ Значение:', employee.currentJobLevel);
	if (typeof employee.currentJobLevel === 'object' && employee.currentJobLevel !== null) {
		console.log('  └─ Свойства объекта:');
		console.log('      • id:', employee.currentJobLevel.id);
		console.log('      • name:', employee.currentJobLevel.name);
		console.log('      • createdAt:', employee.currentJobLevel.createdAt);
		console.log('      • lastModified:', employee.currentJobLevel.lastModified);
		console.log('      • deletedAt:', employee.currentJobLevel.deletedAt);
	}
	
	// Анализ nextJobLevel
	console.log('\n🎯 NEXTJOBLEVEL (Следующий уровень):');
	console.log('  └─ Тип:', typeof employee.nextJobLevel);
	console.log('  └─ Значение:', employee.nextJobLevel);
	if (typeof employee.nextJobLevel === 'object' && employee.nextJobLevel !== null) {
		console.log('  └─ Свойства объекта:');
		console.log('      • id:', employee.nextJobLevel.id);
		console.log('      • name:', employee.nextJobLevel.name);
		console.log('      • createdAt:', employee.nextJobLevel.createdAt);
		console.log('      • lastModified:', employee.nextJobLevel.lastModified);
		console.log('      • deletedAt:', employee.nextJobLevel.deletedAt);
	}
	
	// Анализ прогресса
	console.log('\n📈 ПРОГРЕСС:');
	console.log('  └─ currentJobLevelProgress:', employee.currentJobLevelProgress);
	console.log('  └─ nextJobLevelProgress:', employee.nextJobLevelProgress);
	
	console.log('\n' + '═'.repeat(60));
};

const DepartmentPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [departmentStats, setDepartmentStats] = useState({
		totalEmployees: 0,
		avgCurrentProgress: 0,
		avgNextProgress: 0,
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
				console.log('📋 RAW DATA FROM API - Первые 3 сотрудника:');
				console.log('═'.repeat(80));
				data.slice(0, 3).forEach((emp, idx) => {
					console.log(`\n👤 СОТРУДНИК ${idx + 1}:`);
					console.log(`  jobTitle:`, emp.jobTitle);
					console.log(`  currentJobLevel:`, emp.currentJobLevel);
					console.log(`  nextJobLevel:`, emp.nextJobLevel);
					console.log(`  currentJobLevelProgress:`, emp.currentJobLevelProgress);
					console.log(`  nextJobLevelProgress:`, emp.nextJobLevelProgress);
				});
				console.log('\n' + '═'.repeat(80));
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
					console.log('📊 ОБРАБОТКА ДАННЫХ СОТРУДНИКОВ:');
					console.log('='.repeat(80));
					
					if (employeesData.length > 0) {
						// Выводим детальную информацию по каждому сотруднику
						employeesData.forEach((emp, index) => {
							logFieldDetails(emp, index);
						});
						
						const formattedEmployees: Employee[] = employeesData.map((emp, index) => {
							const currentProgress = calculateCurrentProgress(emp.currentJobLevelProgress);
							const nextProgress = calculateNextProgress(emp.nextJobLevelProgress);
							
							// Получаем строковые значения
							const jobTitle = getStringValue(emp.jobTitle);
							const currentJobLevel = getStringValue(emp.currentJobLevel);
							const nextJobLevel = getStringValue(emp.nextJobLevel);
							
							console.log(`\n📝 ФОРМАТИРОВАНИЕ СОТРУДНИКА ${index + 1}:`);
							console.log(`  jobTitle (строка): "${jobTitle}"`);
							console.log(`  currentJobLevel (строка): "${currentJobLevel}"`);
							console.log(`  nextJobLevel (строка): "${nextJobLevel}"`);
							console.log(`  currentProgress: ${currentProgress}%`);
							console.log(`  nextProgress: ${nextProgress}%`);
							
							return {
								id: emp.id,
								fullName: formatFullName(emp.firstName, emp.lastName, emp.middleName),
								department: emp.department?.name || profile.department.name,
								currentPosition: `${jobTitle}${currentJobLevel !== 'Не указана' ? ` (${currentJobLevel})` : ''}`,
								nextPosition: nextJobLevel,
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
						
						const avgCurrentProgress = formattedEmployees.length > 0 
							? Math.round((totalCurrentProgress / formattedEmployees.length) * 10) / 10
							: 0;
						const avgNextProgress = formattedEmployees.length > 0 
							? Math.round((totalNextProgress / formattedEmployees.length) * 10) / 10
							: 0;
						
						console.log('\n' + '='.repeat(80));
						console.log('📊 ДЕТАЛЬНАЯ СТАТИСТИКА ОТДЕЛА:');
						console.log('='.repeat(80));
						console.log(`  Всего сотрудников: ${totalEmployees}`);
						console.log(`  Средний прогресс по текущей должности: ${avgCurrentProgress}%`);
						console.log(`  Средний прогресс по следующей должности: ${avgNextProgress}%`);
						console.log(`  Готовы к повышению: ${readyForNextCount}`);
						console.log('='.repeat(80));
						
						// Выводим итоговый массив сотрудников для проверки
						console.log('\n📋 ИТОГОВЫЙ МАССИВ СОТРУДНИКОВ:');
						console.log(formattedEmployees);
						
						setDepartmentStats({
							totalEmployees: totalEmployees,
							avgCurrentProgress: avgCurrentProgress,
							avgNextProgress: avgNextProgress,
							totalEmployeesReadyForNext: readyForNextCount,
						});
					} else {
						console.log('❌ Нет данных о сотрудниках');
						setDepartmentStats({
							totalEmployees: 0,
							avgCurrentProgress: 0,
							avgNextProgress: 0,
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
							{departmentStats.avgCurrentProgress}%
						</span>
						<span className={styles.statLabel}>Прогресс по текущей должности</span>
					</div>
					<div className={styles.statCard}>
						<span className={styles.statValue}>
							{departmentStats.avgNextProgress}%
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