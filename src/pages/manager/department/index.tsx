
import React, { useState, useEffect } from 'react';
import { ManagerUserTable } from '../../../component';
import styles from './department.module.scss';

interface Employee {
	id: string;
	fullName: string;
	department: string;
	currentPosition: string;
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

	const fetchDepartmentInfo = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/departments/${departmentId}/info`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				return data;
			}
		} catch (error) {
			console.error('Error fetching department info:', error);
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
				console.log('📋 Raw employees data from API (first employee):', data[0]);
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

	const calculateEmployeeProgress = (empProgress?: { studied: number; count: number }) => {
		if (!empProgress || empProgress.count === 0) return 0;
		return Math.round((empProgress.studied / empProgress.count) * 100);
	};

	const calculateAvgCompetencyLevel = (employees: Employee[]) => {
		if (employees.length === 0) return 0;
		const totalProgress = employees.reduce((sum, emp) => sum + emp.progress, 0);
		const avgProgress = totalProgress / employees.length;
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
					const department = await fetchDepartmentInfo(profile.department.id);
					const employeesData = await fetchDepartmentEmployees(profile.department.id);
					
					const totalEmployees = employeesData.length;
					
					console.log('\n' + '='.repeat(80));
					console.log('📊 Обработка данных сотрудников:');
					console.log('='.repeat(80));
					
					if (employeesData.length > 0) {
						const formattedEmployees: Employee[] = employeesData.map((emp, index) => {
							console.log(`\n👤 Сотрудник ${index + 1}:`);
							console.log(`  ID: ${emp.id}`);
							console.log(`  ФИО: ${emp.lastName} ${emp.firstName} ${emp.middleName || ''}`);
							console.log(`  Отдел: ${emp.department?.name}`);
							
							const currentPosition = emp.jobTitle?.name || 'Не указана';
							const progressPercent = calculateEmployeeProgress(emp.progress);
							
							console.log(`  Текущая должность: ${currentPosition}`);
							console.log(`  Прогресс: ${progressPercent}%`);
							
							return {
								id: emp.id,
								fullName: formatFullName(emp.firstName, emp.lastName, emp.middleName),
								department: emp.department?.name || profile.department.name,
								currentPosition: currentPosition,
								progress: progressPercent,
								createdAt: new Date().toISOString().split('T')[0],
							};
						});
						
						setEmployees(formattedEmployees);
						
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
						
						const avgLevel = calculateAvgCompetencyLevel(formattedEmployees);
						const totalProgressPercent = totalMaterials > 0 
							? Math.round((totalStudied / totalMaterials) * 100) 
							: 0;
						
						console.log('\n' + '='.repeat(80));
						console.log('📊 Детальная статистика отдела:');
						console.log('='.repeat(80));
						console.log(`  Всего сотрудников: ${totalEmployees}`);
						console.log(`  Сумма материалов в процессе: ${totalInProgress}`);
						console.log(`  Сумма изученных материалов: ${totalStudied}`);
						console.log(`  Сумма выданных материалов: ${totalMaterials}`);
						console.log(`  Общий прогресс отдела: ${totalProgressPercent}%`);
						console.log(`  Средний уровень компетенций: ${avgLevel}`);
						console.log('='.repeat(80));
						
						setDepartmentStats({
							totalEmployees: totalEmployees,
							avgCompetencyLevel: avgLevel,
							inProgressIpr: totalInProgress,
							completedIpr: totalStudied,
						});
					} else {
						setDepartmentStats({
							totalEmployees: 0,
							avgCompetencyLevel: 0,
							inProgressIpr: 0,
							completedIpr: 0,
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