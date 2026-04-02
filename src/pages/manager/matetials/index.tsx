// department-materials.tsx
import React, { useState, useEffect } from 'react';
import styles from './materials.module.scss';

interface Competency {
	id: string;
	name: string;
	description?: string;
}

interface Employee {
	id: string;
	fullName: string;
	email: string;
	jobTitle?: { id: string; name: string };
}

interface Material {
	id: string;
	name: string;
	typeId: string;
	type?: { id: string; name: string } | string;
	link: string;
	duration: number;
	competencyId?: string;
	competency?: Competency;
}

interface MaterialTask {
	id: string;
	materialId: string;
	material: Material;
	status: number;
	employeeId: string;
	employee?: Employee;
}

interface EmployeeCompetency {
	id: string;
	employeeId: string;
	competencyId: string;
	competency: Competency;
}

const DepartmentMaterialsPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
	const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
	
	const [competencies, setCompetencies] = useState<Competency[]>([]);
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [materialsTasks, setMaterialsTasks] = useState<MaterialTask[]>([]);
	const [employeeCompetencies, setEmployeeCompetencies] = useState<Map<string, Set<string>>>(new Map());
	const [departmentId, setDepartmentId] = useState<string>('');
	const [departmentName, setDepartmentName] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [filteredTasks, setFilteredTasks] = useState<MaterialTask[]>([]);

	// Получение профиля пользователя и ID департамента
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
					setDepartmentId(data.department.id);
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
	const fetchDepartmentEmployees = async (deptId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/departments/${deptId}/employees`, {
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

	// Получение компетенций департамента
	const fetchDepartmentCompetencies = async (deptId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/department/${deptId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: Competency[] = await response.json();
				setCompetencies(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
		}
		return [];
	};

	// Получение материалов департамента
	const fetchDepartmentMaterials = async (deptId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/material-task/department/${deptId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: any[] = await response.json();
				const normalizedData: MaterialTask[] = data.map(task => ({
					id: task.id,
					materialId: task.material?.id,
					material: {
						id: task.material?.id,
						name: task.material?.name,
						typeId: task.material?.typeId,
						type: task.material?.type?.name || task.material?.type,
						link: task.material?.link,
						duration: task.material?.duration,
						competencyId: task.material?.competencyId,
						competency: task.material?.competency
					},
					status: task.status,
					employeeId: task.employee?.id,
					employee: {
						id: task.employee?.id,
						fullName: `${task.employee?.lastName || ''} ${task.employee?.firstName || ''} ${task.employee?.middleName || ''}`.trim(),
						email: task.employee?.email,
					}
				}));
				setMaterialsTasks(normalizedData);
				return normalizedData;
			}
		} catch (error) {
			console.error('Error fetching department materials:', error);
		}
		return [];
	};

	// Получение компетенций для каждого сотрудника
	const fetchAllEmployeesCompetencies = async (employeesList: Employee[]) => {
		const competenciesMap = new Map<string, Set<string>>();
		
		for (const employee of employeesList) {
			try {
				const response = await fetch(`http://localhost:5217/api/competency-task/employee/${employee.id}`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'accept': 'text/plain',
					},
				});

				if (response.ok) {
					const data: any[] = await response.json();
					const competencyIds = new Set(data.map(item => item.competencyId));
					competenciesMap.set(employee.id, competencyIds);
				}
			} catch (error) {
				console.error(`Error fetching competencies for employee ${employee.id}:`, error);
				competenciesMap.set(employee.id, new Set());
			}
		}
		
		setEmployeeCompetencies(competenciesMap);
		return competenciesMap;
	};

	// Получение доступных компетенций для выбранного сотрудника
	const getAvailableCompetenciesForEmployee = (employeeId: string): Competency[] => {
		if (employeeId === 'all') {
			return competencies;
		}
		
		const employeeCompIds = employeeCompetencies.get(employeeId) || new Set();
		return competencies.filter(comp => employeeCompIds.has(comp.id));
	};

	// Фильтрация материалов
	const filterMaterials = () => {
		let filtered = [...materialsTasks];

		if (selectedEmployee !== 'all') {
			filtered = filtered.filter(task => task.employeeId === selectedEmployee);
			
			if (selectedCompetency !== 'all') {
				const employeeCompIds = employeeCompetencies.get(selectedEmployee) || new Set();
				
				if (!employeeCompIds.has(selectedCompetency)) {
					setFilteredTasks([]);
					return;
				}
				
				filtered = filtered.filter(task => 
					task.material?.competencyId === selectedCompetency
				);
			}
		} else {
			if (selectedCompetency !== 'all') {
				filtered = filtered.filter(task => 
					task.material?.competencyId === selectedCompetency
				);
			}
		}

		setFilteredTasks(filtered);
	};

	// Получение списка компетенций для фильтра
	const getCompetencyFilterOptions = (): Competency[] => {
		if (selectedEmployee === 'all') {
			return competencies;
		}
		
		const employeeCompIds = employeeCompetencies.get(selectedEmployee) || new Set();
		return competencies.filter(comp => employeeCompIds.has(comp.id));
	};

	// Подсчет прогресса сотрудника
	const getEmployeeProgress = (employeeId: string) => {
		const employeeTasks = materialsTasks.filter(t => t.employeeId === employeeId);
		const total = employeeTasks.length;
		const completed = employeeTasks.filter(t => t.status === 2).length;
		const inProgress = employeeTasks.filter(t => t.status === 1).length;
		const toStudy = employeeTasks.filter(t => t.status === 0).length;
		const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
		
		return { total, completed, inProgress, toStudy, percent };
	};

	// Загрузка всех данных
	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const deptId = await fetchUserProfile();
				if (deptId) {
					const employeesList = await fetchDepartmentEmployees(deptId);
					await fetchDepartmentCompetencies(deptId);
					await fetchDepartmentMaterials(deptId);
					
					if (employeesList.length > 0) {
						await fetchAllEmployeesCompetencies(employeesList);
					}
					setSuccessMessage('Данные успешно загружены');
					setTimeout(() => setSuccessMessage(null), 3000);
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

	// Применяем фильтры
	useEffect(() => {
		if (materialsTasks.length > 0 && employeeCompetencies.size > 0) {
			filterMaterials();
		}
	}, [selectedEmployee, selectedCompetency, materialsTasks, employeeCompetencies]);

	// Сбрасываем выбранную компетенцию при смене сотрудника
	useEffect(() => {
		if (selectedCompetency !== 'all') {
			const availableCompetencies = getCompetencyFilterOptions();
			const isCompetencyAvailable = availableCompetencies.some(c => c.id === selectedCompetency);
			
			if (!isCompetencyAvailable) {
				setSelectedCompetency('all');
			}
		}
	}, [selectedEmployee, employeeCompetencies, competencies]);

	const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);
	const employeeProgress = selectedEmployee !== 'all' && selectedEmployeeData 
		? getEmployeeProgress(selectedEmployee)
		: null;

	const competencyFilterOptions = getCompetencyFilterOptions();

	if (isLoading) {
		return <div className={styles.loading}>Загрузка учебных материалов...</div>;
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Учебные материалы</h1>
				{departmentName && <div className={styles.departmentName}>{departmentName}</div>}
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.error}>{error}</div>
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

					<div className={styles.filterGroup}>
						<label>Компетенция:</label>
						<select
							value={selectedCompetency}
							onChange={(e) => setSelectedCompetency(e.target.value)}
							className={styles.filterSelect}
							disabled={competencyFilterOptions.length === 0}>
							<option value='all'>Все компетенции</option>
							{competencyFilterOptions.map((comp) => (
								<option key={comp.id} value={comp.id}>
									{comp.name}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className={styles.materialsInfo}>
					<span>Найдено материалов: {filteredTasks.length}</span>
					{selectedEmployee !== 'all' && competencyFilterOptions.length === 0 && (
						<span className={styles.warning}>⚠ У сотрудника нет назначенных компетенций</span>
					)}
				</div>

				{/* Прогресс выбранного сотрудника */}
				{selectedEmployee !== 'all' && employeeProgress && (
					<div className={styles.employeeProgressCard}>
						<h3>Прогресс сотрудника: {selectedEmployeeData?.fullName}</h3>
						<div className={styles.progressStats}>
							<div className={styles.progressStat}>
								<span className={styles.statValue}>{employeeProgress.percent}%</span>
								<span className={styles.statLabel}>Общий прогресс</span>
							</div>
							<div className={styles.progressStat}>
								<span className={styles.statValue}>{employeeProgress.completed}</span>
								<span className={styles.statLabel}>Изучено</span>
							</div>
							<div className={styles.progressStat}>
								<span className={styles.statValue}>{employeeProgress.inProgress}</span>
								<span className={styles.statLabel}>В процессе</span>
							</div>
							<div className={styles.progressStat}>
								<span className={styles.statValue}>{employeeProgress.toStudy}</span>
								<span className={styles.statLabel}>К изучению</span>
							</div>
						</div>
						<div className={styles.progressBarWrapper}>
							<div 
								className={styles.progressBarFill}
								style={{ width: `${employeeProgress.percent}%` }}
							/>
						</div>
					</div>
				)}

				<div className={styles.tableWrapper}>
					<table className={styles.materialsTable}>
						<thead>
							<tr>
								<th>Название материала</th>
								<th>Тип</th>
								<th>Сотрудник</th>
								<th>Компетенция</th>
								<th>Статус</th>
								<th>Прогресс</th>
							</tr>
						</thead>
						<tbody>
							{filteredTasks.length === 0 ? (
								<tr>
									<td colSpan={6} className={styles.emptyState}>
										{selectedEmployee !== 'all' && selectedCompetency !== 'all' 
											? 'У сотрудника нет материалов по выбранной компетенции'
											: selectedEmployee !== 'all' && competencyFilterOptions.length === 0
											? 'У сотрудника нет назначенных компетенций'
											: 'Нет материалов для отображения'}
									</td>
								</tr>
							) : (
								filteredTasks.map((task) => {
									const employee = task.employee || employees.find(e => e.id === task.employeeId);
									const material = task.material;
									const materialCompetency = competencies.find(c => c.id === material?.competencyId);
									
									return (
										<tr key={task.id}>
											<td className={styles.materialName}>
												<a href={material.link} target="_blank" rel="noopener noreferrer">
													{material.name}
												</a>
											</td>
											<td>
												<span className={styles.materialType}>
													{typeof material.type === 'string' ? material.type : material.type?.name || 'Не указан'}
												</span>
											</td>
											<td>{employee?.fullName || 'Не указан'}</td>
											<td>
												{materialCompetency ? (
													<span className={styles.competencyBadge}>
														{materialCompetency.name}
													</span>
												) : '—'}
											</td>
											<td>
												<span className={`${styles.statusBadge} ${
													task.status === 2 ? styles.statusCompleted :
													task.status === 1 ? styles.statusInProgress :
													styles.statusToStudy
												}`}>
													{task.status === 2 ? 'Изучено' : 
													 task.status === 1 ? 'В процессе' : 
													 'К изучению'}
												</span>
											</td>
											<td>
												<div className={styles.progressCell}>
													<div className={styles.progressBarSmall}>
														<div 
															className={styles.progressBarSmallFill}
															style={{ width: task.status === 2 ? '100%' : task.status === 1 ? '50%' : '0%' }}
														/>
													</div>
													<span className={styles.progressPercent}>
														{task.status === 2 ? '100%' : task.status === 1 ? '50%' : '0%'}
													</span>
												</div>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default DepartmentMaterialsPage;