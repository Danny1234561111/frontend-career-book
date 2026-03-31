import React, { useState, useEffect } from 'react';
import { CompetenciesMatrix } from '../../../component';
import styles from './competencies.module.scss';

interface Employee {
	id: string;
	fullName: string;
	email: string;
	jobTitle?: { id: string; name: string };
}

interface Competency {
	id: string;
	name: string;
	type: string;
	description: string;
	hierarchy?: { id: string; name: string };
	level?: number;
}

interface CompetencyTask {
	id: string;
	employeeId: string;
	competencyId: string;
	competency: Competency;
}

const DepartmentCompetenciesPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departmentName, setDepartmentName] = useState<string>('');
	const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
	const [assignedCompetencies, setAssignedCompetencies] = useState<CompetencyTask[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [showCompetencyList, setShowCompetencyList] = useState(false);

	// Получение профиля пользователя
	const fetchUserProfile = async () => {
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
				if (data.department) {
					setDepartmentName(data.department.name);
					return data.department.id;
				}
			}
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
		return null;
	};

	// Получение сотрудников департамента
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
				const data: any[] = await response.json();
				const formattedEmployees: Employee[] = data.map(emp => ({
					id: emp.id,
					fullName: `${emp.lastName || ''} ${emp.firstName || ''} ${emp.middleName || ''}`.trim(),
					email: emp.email,
					jobTitle: emp.jobTitle,
				}));
				setEmployees(formattedEmployees);
				return formattedEmployees;
			}
		} catch (error) {
			console.error('Error fetching department employees:', error);
		}
		return [];
	};

	// Получение всех компетенций департамента
	const fetchAllCompetencies = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/department/${departmentId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: Competency[] = await response.json();
				setAllCompetencies(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
		}
		return [];
	};

	// Получение назначенных компетенций для департамента
	const fetchAssignedCompetencies = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competency-task/department/${departmentId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: CompetencyTask[] = await response.json();
				setAssignedCompetencies(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching assigned competencies:', error);
		}
		return [];
	};

	// Назначение компетенции сотруднику
	const assignCompetencyToEmployee = async (competencyId: string, employeeId: string) => {
		try {
			const response = await fetch('http://localhost:5217/api/competency-task/as-boss', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					competencyId: competencyId,
					employeeId: employeeId,
				}),
			});

			return response.ok || response.status === 201;
		} catch (error) {
			console.error('Error assigning competency:', error);
			return false;
		}
	};

	// Добавление компетенции
	const handleAddCompetency = async (competencyId: string) => {
		const competency = allCompetencies.find(c => c.id === competencyId);
		if (!competency) return;

		let success = false;
		
		if (selectedEmployee === 'all') {
			// Назначаем всем сотрудникам, у которых еще нет этой компетенции
			let assignedCount = 0;
			for (const employee of employees) {
				const hasCompetency = assignedCompetencies.some(
					task => task.employeeId === employee.id && task.competencyId === competencyId
				);
				if (!hasCompetency) {
					const result = await assignCompetencyToEmployee(competencyId, employee.id);
					if (result) assignedCount++;
				}
			}
			success = assignedCount > 0;
			if (success) {
				setSuccessMessage(`Компетенция "${competency.name}" назначена ${assignedCount} сотрудникам`);
			}
		} else {
			// Назначаем конкретному сотруднику
			const hasCompetency = assignedCompetencies.some(
				task => task.employeeId === selectedEmployee && task.competencyId === competencyId
			);
			if (!hasCompetency) {
				success = await assignCompetencyToEmployee(competencyId, selectedEmployee);
				const employee = employees.find(e => e.id === selectedEmployee);
				if (success) {
					setSuccessMessage(`Компетенция "${competency.name}" назначена сотруднику ${employee?.fullName}`);
				}
			} else {
				setError(`Компетенция "${competency.name}" уже назначена этому сотруднику`);
				setTimeout(() => setError(null), 3000);
				setShowCompetencyList(false);
				setSearchQuery('');
				return;
			}
		}

		if (success) {
			setTimeout(() => setSuccessMessage(null), 3000);
			const departmentId = await fetchUserProfile();
			if (departmentId) {
				await fetchAssignedCompetencies(departmentId);
			}
		} else {
			setError('Ошибка при назначении компетенции');
			setTimeout(() => setError(null), 3000);
		}
		
		setShowCompetencyList(false);
		setSearchQuery('');
	};

	// Получение компетенций, которые есть у выбранного сотрудника/всех сотрудников
	const getCurrentCompetencies = (): Competency[] => {
		if (selectedEmployee === 'all') {
			// Компетенции, которые есть у ВСЕХ сотрудников
			const employeeIds = employees.map(e => e.id);
			const competencyMap = new Map<string, { competency: Competency; count: number }>();
			
			assignedCompetencies.forEach(task => {
				if (!competencyMap.has(task.competencyId)) {
					competencyMap.set(task.competencyId, {
						competency: task.competency,
						count: 0
					});
				}
				competencyMap.get(task.competencyId)!.count++;
			});
			
			// Оставляем только те, что есть у всех
			return Array.from(competencyMap.values())
				.filter(item => item.count === employees.length)
				.map(item => item.competency);
		} else {
			// Компетенции конкретного сотрудника
			return assignedCompetencies
				.filter(task => task.employeeId === selectedEmployee)
				.map(task => task.competency);
		}
	};

	// Получение доступных компетенций для добавления
	const getAvailableCompetencies = (): Competency[] => {
		const currentCompetencyIds = new Set(getCurrentCompetencies().map(c => c.id));
		return allCompetencies.filter(c => !currentCompetencyIds.has(c.id));
	};

	// Обогащение компетенций уровнями для матрицы
	const getCompetenciesWithLevels = (): Competency[] => {
		const currentComps = getCurrentCompetencies();
		return currentComps.map(comp => ({
			...comp,
			level: comp.proficiencyLevels?.[0]?.value || 1
		}));
	};

	const filteredAvailableCompetencies = getAvailableCompetencies().filter(c =>
		c.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const departmentId = await fetchUserProfile();
				if (departmentId) {
					await fetchDepartmentEmployees(departmentId);
					await fetchAllCompetencies(departmentId);
					await fetchAssignedCompetencies(departmentId);
				} else {
					setError('Не удалось определить ваш департамент');
				}
			} catch (err) {
				console.error('Error loading data:', err);
				setError('Ошибка загрузки данных');
			} finally {
				setIsLoading(false);
			}
		};

		if (accessToken) {
			loadData();
		}
	}, [accessToken]);

	const currentCompetencies = getCompetenciesWithLevels();
	const availableCompetencies = getAvailableCompetencies();

	if (isLoading) {
		return <div className={styles.loading}>Загрузка компетенций отдела...</div>;
	}

	if (error) {
		return <div className={styles.error}>{error}</div>;
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Компетенции отдела</h1>
				{departmentName && <div className={styles.departmentName}>{departmentName}</div>}
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}

				<div className={styles.filters}>
					<div className={styles.filterGroup}>
						<label>Сотрудник:</label>
						<select
							value={selectedEmployee}
							onChange={(e) => setSelectedEmployee(e.target.value)}
							className={styles.filterSelect}>
							<option value='all'>Все сотрудники</option>
							{employees.map((emp) => (
								<option key={emp.id} value={emp.id}>
									{emp.fullName}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className={styles.matrixWrapper}>
					<h2>Текущие компетенции</h2>
					<CompetenciesMatrix
						editable={false}
						competencies={currentCompetencies}
						competencyBlocks={[]}
					/>
				</div>

				<div className={styles.addCompetencySection}>
					<h2>Добавить компетенцию</h2>
					{availableCompetencies.length === 0 ? (
						<div className={styles.emptyState}>
							<p>Все компетенции уже назначены</p>
						</div>
					) : (
						<>
							{!showCompetencyList ? (
								<button
									className={styles.addBtn}
									onClick={() => setShowCompetencyList(true)}>
									+ Добавить компетенцию
								</button>
							) : (
								<div className={styles.competencySelector}>
									<div className={styles.searchWrapper}>
										<input
											type="text"
											placeholder="Поиск компетенций..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className={styles.searchInput}
											autoFocus
										/>
										<button
											className={styles.closeSearchBtn}
											onClick={() => {
												setShowCompetencyList(false);
												setSearchQuery('');
											}}>
											×
										</button>
									</div>
									<div className={styles.competencyList}>
										{filteredAvailableCompetencies.length === 0 ? (
											<div className={styles.emptySearch}>Компетенции не найдены</div>
										) : (
											filteredAvailableCompetencies.map(comp => (
												<div
													key={comp.id}
													className={styles.competencyItem}
													onClick={() => handleAddCompetency(comp.id)}>
													<div className={styles.competencyItemName}>{comp.name}</div>
													<div className={styles.competencyItemDesc}>
														{comp.description?.slice(0, 60) || 'Нет описания'}
													</div>
													<button className={styles.assignBtn}>Назначить</button>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default DepartmentCompetenciesPage;