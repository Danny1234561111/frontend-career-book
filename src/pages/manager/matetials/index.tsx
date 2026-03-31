// department-materials.module.tsx
import React, { useState, useEffect } from 'react';
import { MaterialsTable } from '../../../component';
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
	type?: { id: string; name: string };
	link: string;
	duration: number;
}

interface MaterialTask {
	id: string;
	materialId: string;
	material: Material;
	status: number;
	employeeId: string;
}

const DepartmentMaterialsPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
	const [selectedEmployee, setSelectedEmployee] = useState<string>('');
	const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
	const [assignmentResult, setAssignmentResult] = useState<{
		show: boolean;
		message: string;
		success: boolean;
	}>({
		show: false,
		message: '',
		success: false,
	});

	const [competencies, setCompetencies] = useState<Competency[]>([]);
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [assignedMaterials, setAssignedMaterials] = useState<MaterialTask[]>([]);
	const [departmentId, setDepartmentId] = useState<string>('');
	const [departmentName, setDepartmentName] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

	// Получение всех учебных материалов
	const fetchMaterials = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/materials?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: Material[] = await response.json();
				setMaterials(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching materials:', error);
		}
		return [];
	};

	// Получение назначенных материалов для департамента
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
				const data: MaterialTask[] = await response.json();
				setAssignedMaterials(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching department materials:', error);
		}
		return [];
	};

	// Назначение материала сотруднику
	const assignMaterialToEmployee = async (materialId: string, employeeId: string) => {
		try {
			const response = await fetch('http://localhost:5217/api/material-task', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					materialId: materialId,
				}),
			});

			if (response.ok || response.status === 201) {
				console.log(`Material ${materialId} assigned to employee ${employeeId}`);
				return true;
			} else {
				const errorText = await response.text();
				console.error(`Failed to assign material: ${errorText}`);
				return false;
			}
		} catch (error) {
			console.error('Error assigning material:', error);
			return false;
		}
	};

	// Назначение выбранных материалов сотруднику
	const handleAssignToEmployee = async () => {
		if (!selectedEmployee) {
			setAssignmentResult({
				show: true,
				message: 'Пожалуйста, выберите сотрудника',
				success: false,
			});
			setTimeout(() => setAssignmentResult({ show: false, message: '', success: false }), 3000);
			return;
		}

		if (selectedMaterials.length === 0) {
			setAssignmentResult({
				show: true,
				message: 'Пожалуйста, выберите хотя бы один учебный материал',
				success: false,
			});
			setTimeout(() => setAssignmentResult({ show: false, message: '', success: false }), 3000);
			return;
		}

		const employeeName = employees.find(e => e.id === selectedEmployee)?.fullName;
		let successCount = 0;
		let failCount = 0;

		// Назначаем каждый выбранный материал
		for (const materialId of selectedMaterials) {
			const success = await assignMaterialToEmployee(materialId, selectedEmployee);
			if (success) {
				successCount++;
			} else {
				failCount++;
			}
		}

		if (successCount > 0) {
			setAssignmentResult({
				show: true,
				message: `✅ Материалы успешно назначены сотруднику ${employeeName}: ${successCount} шт.${failCount > 0 ? `, ошибок: ${failCount}` : ''}`,
				success: true,
			});
			
			// Обновляем список назначенных материалов
			if (departmentId) {
				await fetchDepartmentMaterials(departmentId);
			}
		} else {
			setAssignmentResult({
				show: true,
				message: '❌ Ошибка при назначении материалов',
				success: false,
			});
		}

		// Очищаем выбор после назначения
		setSelectedMaterials([]);
		setSelectedEmployee('');

		setTimeout(() => setAssignmentResult({ show: false, message: '', success: false }), 3000);
	};

	// Фильтрация материалов по компетенции
	const getMaterialsFilteredByCompetency = () => {
		if (selectedCompetency === 'all') return 'all';
		const competency = competencies.find(c => c.id === selectedCompetency);
		return competency?.name || 'all';
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const deptId = await fetchUserProfile();
				if (deptId) {
					await fetchDepartmentEmployees(deptId);
					await fetchDepartmentCompetencies(deptId);
					await fetchMaterials();
					await fetchDepartmentMaterials(deptId);
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

	// Вывод отладочной информации
	useEffect(() => {
		if (!isLoading && materials.length > 0) {
			console.log('📚 Учебные материалы:');
			console.log(`  Всего материалов: ${materials.length}`);
			console.log(`  Выбрано для назначения: ${selectedMaterials.length}`);
			console.log(`  Фильтр по компетенции: ${getMaterialsFilteredByCompetency()}`);
		}
	}, [isLoading, materials, selectedMaterials, selectedCompetency]);

	if (isLoading) {
		return <div className={styles.loading}>Загрузка учебных материалов...</div>;
	}

	if (error) {
		return <div className={styles.error}>{error}</div>;
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Учебные материалы</h1>
				{departmentName && <div className={styles.departmentName}>{departmentName}</div>}
			</div>

			<div className={styles.content}>
				<div className={styles.filters}>
					<div className={styles.filterGroup}>
						<label>Компетенция:</label>
						<select
							value={selectedCompetency}
							onChange={(e) => setSelectedCompetency(e.target.value)}
							className={styles.filterSelect}>
							<option value='all'>Все компетенции</option>
							{competencies.map((comp) => (
								<option key={comp.id} value={comp.id}>
									{comp.name}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className={styles.tableWrapper}>
					<MaterialsTable
						adminMode={false}
						selectable={true}
						selectedMaterials={selectedMaterials}
						onSelectionChange={setSelectedMaterials}
						filterCompetency={getMaterialsFilteredByCompetency()}
						materials={materials}
						assignedMaterials={assignedMaterials}
						onMaterialSelect={(material) => console.log('Selected:', material)}
					/>
				</div>

				{assignmentResult.show && (
					<div
						className={`${styles.assignmentResult} ${
							assignmentResult.success ? styles.success : styles.error
						}`}>
						{assignmentResult.message}
					</div>
				)}

				<div className={styles.quickAssign}>
					<h3>Быстрое назначение</h3>
					<div className={styles.assignForm}>
						<div className={styles.assignFields}>
							<div className={styles.formGroup}>
								<label>Выберите сотрудника:</label>
								<select
									className={styles.employeeSelect}
									value={selectedEmployee}
									onChange={(e) => setSelectedEmployee(e.target.value)}>
									<option value=''>Выберите сотрудника</option>
									{employees.map((emp) => (
										<option key={emp.id} value={emp.id}>
											{emp.fullName}
										</option>
									))}
								</select>
							</div>

							<div className={styles.selectedCount}>
								Выбрано материалов: <strong>{selectedMaterials.length}</strong>
							</div>
						</div>

						<button
							className={styles.assignBtn}
							onClick={handleAssignToEmployee}
							disabled={!selectedEmployee || selectedMaterials.length === 0}>
							Назначить выбранные материалы ({selectedMaterials.length})
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DepartmentMaterialsPage;