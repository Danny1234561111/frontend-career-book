import React, { useState, useEffect } from 'react';
import styles from './competencies.module.scss';

interface Employee {
	id: string;
	fullName: string;
	email: string;
	jobTitle?: { id: string; name: string };
}

interface Material {
	id: string;
	name: string;
	link?: string;
	duration?: number;
}

interface EducationalMaterialLink {
	id: string;
	competencyId: string;
	educationalMaterialId: string;
	educationalMaterial: Material;
	targetLevelId?: string;
}

interface Competency {
	id: string;
	name: string;
	type: string;
	description: string;
	text?: string;
	defenseTasks?: string;
	admissionCriteria?: string;
	hierarchy?: { id: string; name: string };
	category?: { id: string; name: string };
	group?: { id: string; name: string };
}

interface CompetencyTask {
	id: string;
	employeeId: string;
	competencyId: string;
	competency: Competency;
}

interface MaterialTask {
	id: string;
	materialId: string;
	status: number;
	employeeId: string;
}

interface Assessment {
	id: string;
	employeeId: string;
	competencyId: string;
	currentLevelId: string;
	currentLevel?: { id: string; name: string; value: number };
	comment?: string;
	examiner?: Employee;
}

interface HierarchyItem {
	id: string;
	name: string;
	type: number;
	parentId: string | null;
	children?: HierarchyItem[];
}

interface Block {
	id: string;
	name: string;
	categories: Category[];
}

interface Category {
	id: string;
	name: string;
	groups: Group[];
}

interface Group {
	id: string;
	name: string;
}

interface Level {
	id: string;
	name: string;
	value: number;
}

const DepartmentCompetenciesPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	// Фильтры
	const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
	const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
	const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
	const [searchQuery, setSearchQuery] = useState<string>('');
	
	// Данные
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [departmentName, setDepartmentName] = useState<string>('');
	const [allCompetencies, setAllCompetencies] = useState<Competency[]>([]);
	const [assignedCompetencies, setAssignedCompetencies] = useState<CompetencyTask[]>([]);
	const [commonCompetencies, setCommonCompetencies] = useState<Competency[]>([]);
	const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
	const [flatHierarchy, setFlatHierarchy] = useState<HierarchyItem[]>([]);
	const [materialTasks, setMaterialTasks] = useState<MaterialTask[]>([]);
	const [assessments, setAssessments] = useState<Map<string, Assessment>>(new Map());
	const [levels, setLevels] = useState<Level[]>([]);
	
	// UI состояния
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showCompetencyList, setShowCompetencyList] = useState(false);
	const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
	const [nextLevelMaterials, setNextLevelMaterials] = useState<Map<string, Material[]>>(new Map());
	const [assessmentModal, setAssessmentModal] = useState<{
		competencyId: string;
		competencyName: string;
		employeeId: string;
		employeeName: string;
		existingAssessment?: Assessment;
	} | null>(null);
	const [selectedLevelId, setSelectedLevelId] = useState<string>('');
	const [assessmentComment, setAssessmentComment] = useState<string>('');

	// Получение уровней
	const fetchLevels = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/levels?withDeleted=false', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data = await response.json();
				setLevels(data.sort((a: Level, b: Level) => a.value - b.value));
			}
		} catch (error) { console.error(error); }
	};

	// Вспомогательные функции для иерархии
	const flattenHierarchy = (items: HierarchyItem[], result: HierarchyItem[] = []): HierarchyItem[] => {
		for (const item of items) {
			result.push(item);
			if (item.children) {
				flattenHierarchy(item.children, result);
			}
		}
		return result;
	};

	const findParentByType = (itemId: string, targetType: number): { id: string; name: string } | null => {
		const item = flatHierarchy.find(i => i.id === itemId);
		if (!item || !item.parentId) return null;
		
		const parent = flatHierarchy.find(i => i.id === item.parentId);
		if (parent && parent.type === targetType) {
			return { id: parent.id, name: parent.name };
		}
		
		return findParentByType(item.parentId, targetType);
	};

	const getFullHierarchy = (groupId: string) => {
		const group = flatHierarchy.find(i => i.id === groupId && i.type === 2);
		if (!group) {
			return { group: null, category: null, block: null };
		}
		
		const category = findParentByType(group.id, 1);
		const block = category ? findParentByType(category.id, 0) : null;
		
		return {
			group: { id: group.id, name: group.name },
			category: category,
			block: block,
		};
	};

	// Получение иерархии компетенций
	const fetchCompetencyHierarchy = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/competency-hierarchy', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data: HierarchyItem[] = await response.json();
				
				const buildTree = (items: HierarchyItem[], parentId: string | null = null): HierarchyItem[] => {
					return items
						.filter(item => item.parentId === parentId)
						.map(item => ({
							...item,
							children: buildTree(items, item.id)
						}))
						.sort((a, b) => a.sortingOrder - b.sortingOrder);
				};
				
				const tree = buildTree(data);
				setHierarchy(tree);
				setFlatHierarchy(flattenHierarchy(tree));
				return tree;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение блоков для фильтров
	const getBlocks = (): Block[] => {
		return hierarchy
			.filter(item => item.type === 0)
			.map(block => ({
				id: block.id,
				name: block.name,
				categories: (block.children || [])
					.filter(child => child.type === 1)
					.map(category => ({
						id: category.id,
						name: category.name,
						groups: (category.children || [])
							.filter(group => group.type === 2)
							.map(group => ({ id: group.id, name: group.name })),
					})),
			}));
	};

	const blocks = getBlocks();
	const selectedBlock = blocks.find(b => b.id === selectedBlockId);
	const availableCategories = selectedBlockId === 'all' 
		? blocks.flatMap(b => b.categories)
		: selectedBlock?.categories || [];
	
	const availableGroups = selectedCategoryId === 'all'
		? availableCategories.flatMap(c => c.groups)
		: availableCategories.find(c => c.id === selectedCategoryId)?.groups || [];

	// Получение профиля пользователя
	const fetchUserProfile = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/users/profile', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data = await response.json();
				if (data.department) {
					setDepartmentName(data.department.name);
					return data.department.id;
				}
			}
		} catch (error) { console.error(error); }
		return null;
	};

	// Получение сотрудников департамента
	const fetchDepartmentEmployees = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/departments/${departmentId}/employees`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
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
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение всех компетенций департамента
	const fetchAllCompetencies = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/department/${departmentId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data: Competency[] = await response.json();
				
				const enrichedData = await Promise.all(data.map(async (comp) => {
					const hierarchyInfo = getFullHierarchy(comp.hierarchy?.id || '');
					return {
						...comp,
						category: hierarchyInfo.category || undefined,
						group: hierarchyInfo.group || undefined,
					};
				}));
				
				setAllCompetencies(enrichedData);
				return enrichedData;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение общих компетенций (которые есть у всех сотрудников)
	const calculateCommonCompetencies = (assigned: CompetencyTask[]) => {
		if (employees.length === 0 || assigned.length === 0) {
			setCommonCompetencies([]);
			return [];
		}
		
		const competencyCount = new Map<string, number>();
		
		assigned.forEach(task => {
			competencyCount.set(task.competencyId, (competencyCount.get(task.competencyId) || 0) + 1);
		});
		
		const allEmployeeIds = employees.map(e => e.id);
		const commonIds = new Set<string>();
		competencyCount.forEach((count, compId) => {
			if (count === allEmployeeIds.length) {
				commonIds.add(compId);
			}
		});
		
		const common = allCompetencies.filter(comp => commonIds.has(comp.id));
		setCommonCompetencies(common);
		return common;
	};

	// Получение назначенных компетенций
	const fetchAssignedCompetencies = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competency-task/department/${departmentId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data: CompetencyTask[] = await response.json();
				
				const enrichedData = data.map(task => {
					const hierarchyInfo = getFullHierarchy(task.competency.hierarchy?.id || '');
					return {
						...task,
						competency: {
							...task.competency,
							category: hierarchyInfo.category,
							group: hierarchyInfo.group,
						}
					};
				});
				
				setAssignedCompetencies(enrichedData);
				return enrichedData;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение материалов сотрудника
	const fetchMaterialTasks = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/material-task/department/${departmentId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data: any[] = await response.json();
				const normalizedTasks: MaterialTask[] = data.map(task => ({
					id: task.id,
					materialId: task.material?.id,
					status: task.status,
					employeeId: task.employee?.id,
				}));
				setMaterialTasks(normalizedTasks);
				return normalizedTasks;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение материалов для следующего уровня через эндпоинт /next-level
	const fetchNextLevelMaterialsForEmployee = async (competencyId: string, employeeId: string): Promise<Material[]> => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return [];

			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}/next-level`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: EducationalMaterialLink[] = await response.json();
				return data.map(link => ({
					id: link.educationalMaterial.id,
					name: link.educationalMaterial.name,
					link: link.educationalMaterial.link,
					duration: link.educationalMaterial.duration,
				}));
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Загрузка материалов для всех компетенций выбранного сотрудника
	const loadAllNextLevelMaterials = async (employeeId: string, competenciesList: CompetencyTask[]) => {
		const newMaterialsMap = new Map<string, Material[]>();
		
		for (const task of competenciesList) {
			const materials = await fetchNextLevelMaterialsForEmployee(task.competencyId, employeeId);
			newMaterialsMap.set(`${task.competencyId}_${employeeId}`, materials);
		}
		
		setNextLevelMaterials(newMaterialsMap);
	};

	// Получение оценок
	const fetchAssessments = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/assessments?withDeleted=false', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'application/json' },
			});
			if (response.ok) {
				const data: Assessment[] = await response.json();
				const assessmentMap = new Map<string, Assessment>();
				data.forEach(item => {
					const key = `${item.employeeId}_${item.competencyId}`;
					assessmentMap.set(key, item);
				});
				setAssessments(assessmentMap);
				return assessmentMap;
			}
		} catch (error) { console.error('Error fetching assessments:', error); }
		return new Map();
	};

	// Расчет прогресса по компетенции
	const calculateCompetencyProgress = (competencyId: string, employeeId: string): number => {
		const materials = nextLevelMaterials.get(`${competencyId}_${employeeId}`) || [];
		
		if (materials.length === 0) return 0;
		
		const materialIds = new Set(materials.map(m => m.id));
		
		const employeeTasks = materialTasks.filter(task => 
			task.employeeId === employeeId && 
			materialIds.has(task.materialId)
		);
		
		const completedCount = employeeTasks.filter(task => task.status === 2).length;
		return Math.round((completedCount / materials.length) * 100);
	};

	// Получение уровня по проценту прогресса
	const getLevelFromProgress = (progressPercent: number): { value: number; name: string; id: string } => {
		if (progressPercent === 100) {
			const level = levels.find(l => l.value === 3) || levels[levels.length - 1];
			return { value: level?.value || 3, name: level?.name || 'Эксперт', id: level?.id || '' };
		}
		if (progressPercent >= 66) {
			const level = levels.find(l => l.value === 2) || levels[1];
			return { value: level?.value || 2, name: level?.name || 'Профессионал', id: level?.id || '' };
		}
		if (progressPercent >= 33) {
			const level = levels.find(l => l.value === 1) || levels[0];
			return { value: level?.value || 1, name: level?.name || 'Базовые знания', id: level?.id || '' };
		}
		return { value: 0, name: 'Не определен', id: '' };
	};

	// Сохранение оценки
	const saveAssessment = async () => {
		if (!assessmentModal) return;
		
		if (!selectedLevelId) {
			setError('Выберите уровень для оценки');
			setTimeout(() => setError(null), 3000);
			return;
		}
		
		const existingAssessment = assessmentModal.existingAssessment;
		const url = existingAssessment 
			? `http://localhost:5217/api/assessments/${existingAssessment.id}`
			: 'http://localhost:5217/api/assessments';
		const method = existingAssessment ? 'PATCH' : 'POST';
		
		let body;
		if (existingAssessment) {
			body = { 
				currentLevelId: selectedLevelId,
				comment: assessmentComment 
			};
		} else {
			body = {
				employeeId: assessmentModal.employeeId,
				competencyId: assessmentModal.competencyId,
				currentLevelId: selectedLevelId,
				comment: assessmentComment,
			};
		}
		
		try {
			const response = await fetch(url, {
				method: method,
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (response.ok || response.status === 201 || response.status === 204) {
				const selectedLevel = levels.find(l => l.id === selectedLevelId);
				const actionText = existingAssessment ? 'изменена' : 'сохранена';
				setSuccessMessage(`Оценка "${selectedLevel?.name}" ${actionText}`);
				setTimeout(() => setSuccessMessage(null), 3000);
				setAssessmentModal(null);
				setSelectedLevelId('');
				setAssessmentComment('');
				
				const newAssessments = await fetchAssessments();
				setAssessments(newAssessments);
				
				if (selectedEmployee !== 'all') {
					const employeeCompetencies = assignedCompetencies.filter(t => t.employeeId === selectedEmployee);
					await loadAllNextLevelMaterials(selectedEmployee, employeeCompetencies);
				}
			} else {
				const errorText = await response.text();
				console.error('Save assessment error:', response.status, errorText);
				setError(`Ошибка при сохранении оценки: ${response.status}`);
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error(error);
			setError('Ошибка при сохранении оценки');
			setTimeout(() => setError(null), 3000);
		}
	};

	// Назначение компетенции
	const assignCompetencyToEmployee = async (competencyId: string, employeeId: string) => {
		try {
			const response = await fetch('http://localhost:5217/api/competency-task/as-boss', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ competencyId, employeeId }),
			});
			return response.ok || response.status === 201;
		} catch (error) { return false; }
	};

	// Удаление компетенции у сотрудника
	const removeCompetencyFromEmployee = async (competencyId: string, employeeId: string) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return false;

			const task = assignedCompetencies.find(
				t => t.employeeId === employeeId && t.competencyId === competencyId
			);
			
			if (!task) return false;

			const response = await fetch(`http://localhost:5217/api/competency-task/${task.id}/as-boss`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ employeeId: employeeId }),
			});

			return response.ok || response.status === 204;
		} catch (error) {
			console.error('Error removing competency:', error);
			return false;
		}
	};

	// Добавление компетенции
	const handleAddCompetency = async (competencyId: string) => {
		const competency = allCompetencies.find(c => c.id === competencyId);
		if (!competency) return;

		let success = false;
		let assignedCount = 0;
		
		if (selectedEmployee === 'all') {
			// Режим "Все сотрудники" - добавляем компетенцию ВСЕМ сотрудникам
			for (const employee of employees) {
				const result = await assignCompetencyToEmployee(competencyId, employee.id);
				if (result) assignedCount++;
			}
			
			if (assignedCount > 0) {
				success = true;
				setSuccessMessage(`Компетенция "${competency.name}" назначена всем ${assignedCount} сотрудникам`);
			} else {
				setError('Ошибка при назначении компетенции');
				setTimeout(() => setError(null), 3000);
				setShowCompetencyList(false);
				setSearchQuery('');
				return;
			}
		} else {
			// Режим конкретного сотрудника - добавляем только ему
			success = await assignCompetencyToEmployee(competencyId, selectedEmployee);
			const employee = employees.find(e => e.id === selectedEmployee);
			if (success) {
				setSuccessMessage(`Компетенция "${competency.name}" назначена сотруднику ${employee?.fullName}`);
			} else {
				setError('Ошибка при назначении компетенции');
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
				const newAssigned = await fetchAssignedCompetencies(departmentId);
				setAssignedCompetencies(newAssigned);
				calculateCommonCompetencies(newAssigned);
				
				if (selectedEmployee !== 'all') {
					const employeeCompetencies = newAssigned.filter(t => t.employeeId === selectedEmployee);
					await loadAllNextLevelMaterials(selectedEmployee, employeeCompetencies);
				}
			}
			setShowCompetencyList(false);
			setSearchQuery('');
		}
	};

	// Обработчик удаления компетенции
	const handleRemoveCompetency = async (competencyId: string, competencyName: string) => {
		let removedCount = 0;
		
		if (selectedEmployee === 'all') {
			for (const employee of employees) {
				const hasCompetency = assignedCompetencies.some(
					task => task.employeeId === employee.id && task.competencyId === competencyId
				);
				if (hasCompetency) {
					const result = await removeCompetencyFromEmployee(competencyId, employee.id);
					if (result) removedCount++;
				}
			}
			if (removedCount > 0) {
				setSuccessMessage(`Компетенция "${competencyName}" удалена у ${removedCount} сотрудников`);
			} else {
				setError(`Компетенция "${competencyName}" не назначена ни одному сотруднику`);
				setTimeout(() => setError(null), 3000);
				return;
			}
		} else {
			const hasCompetency = assignedCompetencies.some(
				task => task.employeeId === selectedEmployee && task.competencyId === competencyId
			);
			if (hasCompetency) {
				const success = await removeCompetencyFromEmployee(competencyId, selectedEmployee);
				if (success) {
					const employee = employees.find(e => e.id === selectedEmployee);
					setSuccessMessage(`Компетенция "${competencyName}" удалена у сотрудника ${employee?.fullName}`);
					removedCount = 1;
				}
			} else {
				setError(`Компетенция "${competencyName}" не назначена этому сотруднику`);
				setTimeout(() => setError(null), 3000);
				return;
			}
		}

		if (removedCount > 0) {
			setTimeout(() => setSuccessMessage(null), 3000);
			const departmentId = await fetchUserProfile();
			if (departmentId) {
				const newAssigned = await fetchAssignedCompetencies(departmentId);
				setAssignedCompetencies(newAssigned);
				calculateCommonCompetencies(newAssigned);
				
				if (selectedEmployee !== 'all') {
					const employeeCompetencies = newAssigned.filter(t => t.employeeId === selectedEmployee);
					await loadAllNextLevelMaterials(selectedEmployee, employeeCompetencies);
				}
			}
		} else {
			setError('Ошибка при удалении компетенции');
			setTimeout(() => setError(null), 3000);
		}
	};

	// Обработчик раскрытия компетенции
	const handleExpandCompetency = async (competencyId: string) => {
		if (selectedEmployee === 'all') return;
		
		if (expandedCompetency === competencyId) {
			setExpandedCompetency(null);
		} else {
			setExpandedCompetency(competencyId);
			const key = `${competencyId}_${selectedEmployee}`;
			if (!nextLevelMaterials.has(key)) {
				const materials = await fetchNextLevelMaterialsForEmployee(competencyId, selectedEmployee);
				setNextLevelMaterials(prev => new Map(prev).set(key, materials));
			}
		}
	};

	// Получение компетенций для отображения
	const getCurrentCompetencies = (): (Competency & { 
		progressPercent: number; 
		materialsCount: number; 
		completedCount: number;
		currentLevelValue: number;
		currentLevelName: string;
		currentLevelId: string;
		isCommon?: boolean;
	})[] => {
		let competenciesToShow: Competency[] = [];
		
		if (selectedEmployee === 'all') {
			competenciesToShow = commonCompetencies;
		} else {
			const tasks = assignedCompetencies.filter(task => task.employeeId === selectedEmployee);
			competenciesToShow = tasks.map(task => task.competency);
		}
		
		return competenciesToShow.map(comp => {
			let progressPercent = 0;
			let currentLevelValue = 0;
			let currentLevelName = 'Не определен';
			let currentLevelId = '';
			
			if (selectedEmployee !== 'all') {
				progressPercent = calculateCompetencyProgress(comp.id, selectedEmployee);
				const levelInfo = getLevelFromProgress(progressPercent);
				currentLevelValue = levelInfo.value;
				currentLevelName = levelInfo.name;
				currentLevelId = levelInfo.id;
			}
			
			return {
				...comp,
				progressPercent,
				materialsCount: 0,
				completedCount: 0,
				currentLevelValue,
				currentLevelName,
				currentLevelId,
				isCommon: selectedEmployee === 'all',
			};
		});
	};

	// Фильтрация компетенций
	const getFilteredCompetencies = () => {
		const competencies = getCurrentCompetencies();
		
		return competencies.filter(comp => {
			if (selectedBlockId !== 'all') {
				const block = blocks.find(b => b.id === selectedBlockId);
				if (block && comp.category) {
					const categoryInBlock = block.categories?.some(cat => cat.id === comp.category?.id);
					if (!categoryInBlock) return false;
				} else if (!comp.category) {
					return false;
				}
			}
			
			if (selectedCategoryId !== 'all' && comp.category?.id !== selectedCategoryId) {
				return false;
			}
			
			if (selectedGroupId !== 'all') {
				const compGroupId = comp.group?.id || comp.hierarchy?.id;
				if (compGroupId !== selectedGroupId) return false;
			}
			
			if (searchQuery && !comp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			
			return true;
		});
	};

	// Получение доступных компетенций
	const getAvailableCompetencies = (): Competency[] => {
		if (selectedEmployee === 'all') {
			// Для режима "все сотрудники" - показываем компетенции, которых нет в commonCompetencies
			const commonIds = new Set(commonCompetencies.map(c => c.id));
			return allCompetencies.filter(c => !commonIds.has(c.id));
		} else {
			// Для конкретного сотрудника - показываем компетенции, которых нет у этого сотрудника
			const assignedIds = new Set(
				assignedCompetencies
					.filter(t => t.employeeId === selectedEmployee)
					.map(t => t.competencyId)
			);
			return allCompetencies.filter(c => !assignedIds.has(c.id));
		}
	};

	// Фильтрация доступных компетенций
	const getFilteredAvailableCompetencies = (): Competency[] => {
		const available = getAvailableCompetencies();
		
		return available.filter(comp => {
			if (selectedBlockId !== 'all') {
				const block = blocks.find(b => b.id === selectedBlockId);
				if (block && comp.category) {
					const categoryInBlock = block.categories?.some(cat => cat.id === comp.category?.id);
					if (!categoryInBlock) return false;
				} else if (!comp.category) {
					return false;
				}
			}
			
			if (selectedCategoryId !== 'all' && comp.category?.id !== selectedCategoryId) {
				return false;
			}
			
			if (selectedGroupId !== 'all') {
				const compGroupId = comp.group?.id || comp.hierarchy?.id;
				if (compGroupId !== selectedGroupId) return false;
			}
			
			if (searchQuery && !comp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			
			return true;
		});
	};

	const currentCompetencies = getFilteredCompetencies();
	const filteredAvailableCompetencies = getFilteredAvailableCompetencies();

	const resetFilters = () => {
		setSelectedBlockId('all');
		setSelectedCategoryId('all');
		setSelectedGroupId('all');
		setSearchQuery('');
	};

	const getProgressColor = (percent: number): string => {
		if (percent >= 80) return '#4caf50';
		if (percent >= 50) return '#ff9800';
		return '#f44336';
	};

	const getFullHierarchyDisplay = (competency: Competency): string => {
		const parts: string[] = [];
		
		if (competency.category?.id) {
			const block = blocks.find(b => b.categories?.some(c => c.id === competency.category?.id));
			if (block) parts.push(block.name);
		}
		
		if (competency.category?.name) parts.push(competency.category.name);
		if (competency.group?.name || competency.hierarchy?.name) {
			parts.push(competency.group?.name || competency.hierarchy?.name || '');
		}
		
		return parts.join(' → ') || '—';
	};

	useEffect(() => {
		const loadMaterialsForSelectedEmployee = async () => {
			if (selectedEmployee !== 'all' && assignedCompetencies.length > 0) {
				const employeeCompetencies = assignedCompetencies.filter(t => t.employeeId === selectedEmployee);
				await loadAllNextLevelMaterials(selectedEmployee, employeeCompetencies);
			}
			setExpandedCompetency(null);
		};
		
		loadMaterialsForSelectedEmployee();
	}, [selectedEmployee, assignedCompetencies]);

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				await fetchLevels();
				await fetchCompetencyHierarchy();
				const departmentId = await fetchUserProfile();
				if (departmentId) {
					const employeesList = await fetchDepartmentEmployees(departmentId);
					await fetchAllCompetencies(departmentId);
					const assigned = await fetchAssignedCompetencies(departmentId);
					await fetchMaterialTasks(departmentId);
					await fetchAssessments();
					
					setAssignedCompetencies(assigned);
					calculateCommonCompetencies(assigned);
					
					if (employeesList.length > 0 && assigned.length > 0) {
						const firstEmployeeId = employeesList[0].id;
						const employeeCompetencies = assigned.filter(t => t.employeeId === firstEmployeeId);
						await loadAllNextLevelMaterials(firstEmployeeId, employeeCompetencies);
					}
				} else {
					setError('Не удалось определить ваш департамент');
				}
			} catch (err) {
				console.error(err);
				setError('Ошибка загрузки данных');
			} finally {
				setIsLoading(false);
			}
		};
		if (accessToken) loadData();
	}, [accessToken]);

	if (isLoading) return <div className={styles.loading}>Загрузка компетенций отдела...</div>;
	if (error) return <div className={styles.error}>{error}</div>;

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Компетенции отдела</h1>
				{departmentName && <div className={styles.departmentName}>{departmentName}</div>}
			</div>

			<div className={styles.content}>
				{successMessage && <div className={styles.successMessage}>{successMessage}</div>}

				<div className={styles.filtersBar}>
					<div className={styles.filterGroup}>
						<label>Сотрудник:</label>
						<select
							value={selectedEmployee}
							onChange={(e) => setSelectedEmployee(e.target.value)}
							className={styles.filterSelect}>
							<option value='all'>Все сотрудники (общие компетенции)</option>
							{employees.map((emp) => (
								<option key={emp.id} value={emp.id}>{emp.fullName}</option>
							))}
						</select>
					</div>

					<div className={styles.filterGroup}>
						<label>Блок:</label>
						<select
							value={selectedBlockId}
							onChange={(e) => {
								setSelectedBlockId(e.target.value);
								setSelectedCategoryId('all');
								setSelectedGroupId('all');
							}}
							className={styles.filterSelect}>
							<option value="all">Все блоки</option>
							{blocks.map(block => (
								<option key={block.id} value={block.id}>{block.name}</option>
							))}
						</select>
					</div>

					<div className={styles.filterGroup}>
						<label>Категория:</label>
						<select
							value={selectedCategoryId}
							onChange={(e) => {
								setSelectedCategoryId(e.target.value);
								setSelectedGroupId('all');
							}}
							className={styles.filterSelect}
							disabled={availableCategories.length === 0}>
							<option value="all">Все категории</option>
							{availableCategories.map(cat => (
								<option key={cat.id} value={cat.id}>{cat.name}</option>
							))}
						</select>
					</div>

					<div className={styles.filterGroup}>
						<label>Группа:</label>
						<select
							value={selectedGroupId}
							onChange={(e) => setSelectedGroupId(e.target.value)}
							className={styles.filterSelect}
							disabled={availableGroups.length === 0}>
							<option value="all">Все группы</option>
							{availableGroups.map(group => (
								<option key={group.id} value={group.id}>{group.name}</option>
							))}
						</select>
					</div>

					<div className={styles.filterGroup}>
						<label>Поиск:</label>
						<input
							type="text"
							placeholder="Название компетенции..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={styles.searchInput}
						/>
					</div>

					<button className={styles.resetBtn} onClick={resetFilters}>
						⟳ Сбросить
					</button>
				</div>

				<div className={styles.matrixWrapper}>
					<h2>
						{selectedEmployee === 'all' ? 'Общие компетенции отдела' : 'Компетенции сотрудника'}
					</h2>
					{currentCompetencies.length === 0 ? (
						<div className={styles.emptyState}>
							<p>
								{selectedEmployee === 'all' 
									? 'Нет общих компетенций для отдела' 
									: 'Нет назначенных компетенций у сотрудника'}
							</p>
						</div>
					) : (
						<div className={styles.competenciesGrid}>
							{currentCompetencies.map(comp => {
								const isExpanded = expandedCompetency === comp.id;
								const assessmentKey = `${selectedEmployee}_${comp.id}`;
								const assessment = assessments.get(assessmentKey);
								const progressPercent = comp.progressPercent || 0;
								const materials = selectedEmployee !== 'all' ? nextLevelMaterials.get(`${comp.id}_${selectedEmployee}`) || [] : [];
								
								return (
									<div key={comp.id} className={styles.competencyCard}>
										<div 
											className={`${styles.competencyHeader} ${selectedEmployee === 'all' ? styles.noHover : ''}`}
											onClick={() => handleExpandCompetency(comp.id)}
											style={selectedEmployee === 'all' ? { cursor: 'default' } : {}}>
											<div className={styles.competencyTitle}>
												<h3>{comp.name}</h3>
												<span className={styles.competencyType}>{comp.type}</span>
												{comp.isCommon && (
													<span className={styles.commonBadge}>Общая</span>
												)}
											</div>
											<div className={styles.headerRight}>
												<div className={styles.hierarchyPath}>
													{getFullHierarchyDisplay(comp)}
												</div>
												{selectedEmployee !== 'all' && (
													<div className={styles.progressSection}>
														<div className={styles.progressBar}>
															<div 
																className={styles.progressFill} 
																style={{ 
																	width: `${progressPercent}%`,
																	backgroundColor: getProgressColor(progressPercent)
																}} 
															/>
														</div>
														<span className={styles.progressPercent}>{progressPercent}%</span>
													</div>
												)}
												{selectedEmployee !== 'all' && (
													<span className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
												)}
												<button
													className={styles.removeCompetencyBtn}
													onClick={(e) => {
														e.stopPropagation();
														if (confirm(`Вы уверены, что хотите удалить компетенцию "${comp.name}" у ${selectedEmployee === 'all' ? 'всех сотрудников' : 'этого сотрудника'}?`)) {
															handleRemoveCompetency(comp.id, comp.name);
														}
													}}>
													🗑️
												</button>
											</div>
										</div>
										
										<p className={styles.competencyDescription}>{comp.description}</p>
										
										{isExpanded && selectedEmployee !== 'all' && (
											<div className={styles.materialsSection}>
												<strong>Материалы для изучения ({materials.length}):</strong>
												<div className={styles.materialsList}>
													{materials.length > 0 ? (
														materials.map(material => {
															const materialTask = materialTasks.find(
																task => task.materialId === material.id && task.employeeId === selectedEmployee
															);
															const isCompleted = materialTask?.status === 2;
															
															return (
																<div key={material.id} className={`${styles.materialItem} ${isCompleted ? styles.completed : ''}`}>
																	{material.link ? (
																		<a href={material.link} target="_blank" rel="noopener noreferrer" className={styles.materialLink}>
																			{material.name}
																		</a>
																	) : (
																		<span className={styles.materialName}>{material.name}</span>
																	)}
																	<span className={styles.materialStatus}>
																		{isCompleted ? '✅ Изучено' : '⏳ Не изучено'}
																	</span>
																</div>
															);
														})
													) : (
														<div className={styles.noMaterials}>
															Нет материалов для изучения на следующем уровне
														</div>
													)}
												</div>
												
												{assessment && (
													<div className={styles.assessmentDisplay}>
														<span className={styles.assessmentBadge}>
															✅ Текущая оценка: {assessment.currentLevel?.name || comp.currentLevelName}
														</span>
														{assessment.comment && (
															<span className={styles.assessmentComment}>{assessment.comment}</span>
														)}
													</div>
												)}
												
												<button
													className={styles.confirmLevelBtn}
													onClick={() => {
														const employee = employees.find(e => e.id === selectedEmployee);
														setAssessmentModal({
															competencyId: comp.id,
															competencyName: comp.name,
															employeeId: selectedEmployee,
															employeeName: employee?.fullName || '',
															existingAssessment: assessment,
														});
														setSelectedLevelId(assessment?.currentLevelId || '');
														setAssessmentComment(assessment?.comment || '');
													}}
												>
													{assessment ? '✏️ Изменить оценку' : '📝 Выставить оценку'}
												</button>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>

				<div className={styles.addCompetencySection}>
					<h2>Добавить компетенцию</h2>
					{getAvailableCompetencies().length === 0 ? (
						<div className={styles.emptyState}><p>Все компетенции уже назначены</p></div>
					) : (
						<>
							{!showCompetencyList ? (
								<button className={styles.addBtn} onClick={() => setShowCompetencyList(true)}>
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
										<button className={styles.closeSearchBtn} onClick={() => {
											setShowCompetencyList(false);
											setSearchQuery('');
										}}>×</button>
									</div>
									<div className={styles.competencyList}>
										{filteredAvailableCompetencies.length === 0 ? (
											<div className={styles.emptySearch}>Компетенции не найдены</div>
										) : (
											filteredAvailableCompetencies.map(comp => (
												<div key={comp.id} className={styles.competencyItem} onClick={() => handleAddCompetency(comp.id)}>
													<div className={styles.competencyItemName}>{comp.name}</div>
													<div className={styles.competencyItemPath}>
														{getFullHierarchyDisplay(comp)}
													</div>
													<div className={styles.competencyItemDesc}>
														{comp.description?.slice(0, 60) || 'Нет описания'}
													</div>
													<button className={styles.assignBtn}>
														{selectedEmployee === 'all' ? '📋 Назначить всем' : '➕ Назначить'}
													</button>
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

			{/* Модальное окно оценки */}
			{assessmentModal && (
				<div className={styles.modalOverlay} onClick={() => setAssessmentModal(null)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h3>{assessmentModal.existingAssessment ? 'Изменить оценку' : 'Оценка компетенции'}</h3>
							<button className={styles.closeBtn} onClick={() => setAssessmentModal(null)}>×</button>
						</div>
						
						<div className={styles.modalBody}>
							<p><strong>Сотрудник:</strong> {assessmentModal.employeeName}</p>
							<p><strong>Компетенция:</strong> {assessmentModal.competencyName}</p>
							
							<div className={styles.formGroup}>
								<label>Уровень владения *</label>
								<select
									value={selectedLevelId}
									onChange={(e) => setSelectedLevelId(e.target.value)}
									className={styles.modalSelect}>
									<option value="">Выберите уровень</option>
									{levels.map(level => (
										<option key={level.id} value={level.id}>
											{level.name} (Уровень {level.value})
										</option>
									))}
								</select>
							</div>
							
							<div className={styles.formGroup}>
								<label>Комментарий (необязательно):</label>
								<textarea
									value={assessmentComment}
									onChange={(e) => setAssessmentComment(e.target.value)}
									rows={3}
									placeholder="Добавьте комментарий к оценке..."
									className={styles.commentInput}
								/>
							</div>
						</div>
						
						<div className={styles.modalActions}>
							<button onClick={() => setAssessmentModal(null)}>Отмена</button>
							<button 
								className={styles.submitBtn} 
								onClick={saveAssessment}
								disabled={!selectedLevelId}>
								{assessmentModal.existingAssessment ? 'Сохранить изменения' : 'Сохранить оценку'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DepartmentCompetenciesPage;