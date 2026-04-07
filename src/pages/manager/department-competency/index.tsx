// department-competencies.page.tsx (ИСПРАВЛЕННАЯ - правильный расчет прогресса)

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
	status: number;
	competencyId?: string;
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
	materials?: Material[];
	progressPercent?: number;
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
	material?: {
		id: string;
		competencyId?: string;
	};
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
	const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
	const [flatHierarchy, setFlatHierarchy] = useState<HierarchyItem[]>([]);
	const [materialTasks, setMaterialTasks] = useState<MaterialTask[]>([]);
	const [assessments, setAssessments] = useState<Map<string, { score: number; comment: string }>>(new Map());
	
	// UI состояния
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showCompetencyList, setShowCompetencyList] = useState(false);
	const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
	const [assessmentModal, setAssessmentModal] = useState<any>(null);
	const [assessmentScore, setAssessmentScore] = useState<number>(3);
	const [assessmentComment, setAssessmentComment] = useState<string>('');

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
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
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
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
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
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
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

	// Получение деталей компетенции (с материалами)
	const fetchCompetencyDetails = async (competencyId: string): Promise<Competency | null> => {
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/${competencyId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: Competency = await response.json();
				return data;
			}
		} catch (error) { console.error(error); }
		return null;
	};

	// Получение всех компетенций департамента
	const fetchAllCompetencies = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/department/${departmentId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: Competency[] = await response.json();
				// Обогащаем компетенции иерархией и материалами
				const enrichedData = await Promise.all(data.map(async (comp) => {
					const hierarchyInfo = getFullHierarchy(comp.hierarchy?.id || '');
					const details = await fetchCompetencyDetails(comp.id);
					return {
						...comp,
						category: hierarchyInfo.category || undefined,
						group: hierarchyInfo.group || undefined,
						materials: details?.materials || [],
					};
				}));
				setAllCompetencies(enrichedData);
				return enrichedData;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение назначенных компетенций для департамента
	const fetchAssignedCompetencies = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competency-task/department/${departmentId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: CompetencyTask[] = await response.json();
				// Обогащаем назначенные компетенции материалами и иерархией
				const enrichedData = await Promise.all(data.map(async (task) => {
					const details = await fetchCompetencyDetails(task.competencyId);
					const hierarchyInfo = getFullHierarchy(task.competency.hierarchy?.id || '');
					return {
						...task,
						competency: {
							...task.competency,
							materials: details?.materials || [],
							category: hierarchyInfo.category,
							group: hierarchyInfo.group,
						}
					};
				}));
				setAssignedCompetencies(enrichedData);
				return enrichedData;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Получение материалов сотрудника с их статусами
	const fetchMaterialTasks = async (departmentId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/material-task/department/${departmentId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: any[] = await response.json();
				const normalizedTasks: MaterialTask[] = data.map(task => ({
					id: task.id,
					materialId: task.material?.id,
					status: task.status,
					employeeId: task.employee?.id,
					material: {
						id: task.material?.id,
						competencyId: task.material?.competencyId,
					}
				}));
				setMaterialTasks(normalizedTasks);
				return normalizedTasks;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	// Расчет прогресса по компетенции для конкретного сотрудника
	// Прогресс = (количество изученных материалов компетенции / общее количество материалов компетенции) * 100
	const calculateCompetencyProgress = (competency: Competency, employeeId: string): number => {
		// Получаем все материалы, привязанные к этой компетенции
		const competencyMaterials = competency.materials || [];
		
		if (competencyMaterials.length === 0) {
			return 0;
		}
		
		// Получаем задачи сотрудника по этим материалам
		const employeeTasks = materialTasks.filter(task => 
			task.employeeId === employeeId && 
			competencyMaterials.some(m => m.id === task.materialId)
		);
		
		// Считаем только полностью изученные материалы (status === 2)
		const completedCount = employeeTasks.filter(task => task.status === 2).length;
		
		// Прогресс = (изучено / всего материалов компетенции) * 100
		return Math.round((completedCount / competencyMaterials.length) * 100);
	};

	// Получение оценок
	const fetchAssessmentsForEmployee = async (employeeId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competency-assessment/employee/${employeeId}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: any[] = await response.json();
				const assessmentMap = new Map<string, { score: number; comment: string }>();
				data.forEach(item => {
					const key = `${item.competencyId}`;
					assessmentMap.set(key, { score: item.score, comment: item.comment || '' });
				});
				setAssessments(prev => {
					const newMap = new Map(prev);
					assessmentMap.forEach((value, key) => newMap.set(key, value));
					return newMap;
				});
			}
		} catch (error) { console.error(error); }
	};

	// Отправка оценки
	const submitAssessment = async () => {
		if (!assessmentModal) return;
		
		try {
			const response = await fetch('http://localhost:5217/api/competency-assessment', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					employeeId: assessmentModal.employeeId,
					competencyId: assessmentModal.competencyId,
					levelId: assessmentModal.levelId,
					score: assessmentScore,
					comment: assessmentComment || undefined,
				}),
			});

			if (response.ok || response.status === 201) {
				const key = `${assessmentModal.competencyId}`;
				setAssessments(prev => {
					const newMap = new Map(prev);
					newMap.set(key, { score: assessmentScore, comment: assessmentComment });
					return newMap;
				});
				
				setSuccessMessage(`Оценка "${assessmentScore}" сохранена`);
				setTimeout(() => setSuccessMessage(null), 3000);
				setAssessmentModal(null);
				setAssessmentScore(3);
				setAssessmentComment('');
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

	// Добавление компетенции
	const handleAddCompetency = async (competencyId: string) => {
		const competency = allCompetencies.find(c => c.id === competencyId);
		if (!competency) return;

		let success = false;
		let assignedCount = 0;
		
		if (selectedEmployee === 'all') {
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

	// Получение компетенций с прогрессом для отображения
	const getCurrentCompetencies = (): (Competency & { progressPercent: number; materialsCount: number; completedCount: number })[] => {
		let tasks: CompetencyTask[] = [];
		
		if (selectedEmployee === 'all') {
			const competencyMap = new Map<string, Competency>();
			assignedCompetencies.forEach(task => {
				if (!competencyMap.has(task.competencyId)) {
					competencyMap.set(task.competencyId, task.competency);
				}
			});
			tasks = Array.from(competencyMap.values()).map(comp => ({ 
				id: comp.id, employeeId: '', competencyId: comp.id, competency: comp 
			} as CompetencyTask));
		} else {
			tasks = assignedCompetencies.filter(task => task.employeeId === selectedEmployee);
		}
		
		const employeeId = selectedEmployee === 'all' ? employees[0]?.id : selectedEmployee;
		
		return tasks.map(task => {
			const competency = task.competency;
			const competencyMaterials = competency.materials || [];
			const progressPercent = calculateCompetencyProgress(competency, employeeId);
			
			// Для отладки
			console.log(`Компетенция: ${competency.name}`);
			console.log(`  Материалов всего: ${competencyMaterials.length}`);
			console.log(`  Прогресс: ${progressPercent}%`);
			
			return {
				...competency,
				progressPercent,
				materialsCount: competencyMaterials.length,
				completedCount: Math.round((progressPercent / 100) * competencyMaterials.length),
			};
		});
	};

	// Фильтрация компетенций по иерархии и поиску
	const getFilteredCompetencies = () => {
		const competencies = getCurrentCompetencies();
		
		return competencies.filter(comp => {
			// Фильтр по блоку
			if (selectedBlockId !== 'all') {
				const block = blocks.find(b => b.id === selectedBlockId);
				if (block && comp.category) {
					const categoryInBlock = block.categories?.some(cat => cat.id === comp.category?.id);
					if (!categoryInBlock) return false;
				} else if (!comp.category) {
					return false;
				}
			}
			
			// Фильтр по категории
			if (selectedCategoryId !== 'all' && comp.category?.id !== selectedCategoryId) {
				return false;
			}
			
			// Фильтр по группе
			if (selectedGroupId !== 'all') {
				const compGroupId = comp.group?.id || comp.hierarchy?.id;
				if (compGroupId !== selectedGroupId) return false;
			}
			
			// Фильтр по поиску
			if (searchQuery && !comp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			
			return true;
		});
	};

	// Получение доступных компетенций для добавления
	const getAvailableCompetencies = (): Competency[] => {
		const assignedIds = new Set(assignedCompetencies.map(c => c.competencyId));
		return allCompetencies.filter(c => !assignedIds.has(c.id));
	};

	// Фильтрация доступных компетенций
	const getFilteredAvailableCompetencies = (): Competency[] => {
		const available = getAvailableCompetencies();
		
		return available.filter(comp => {
			// Фильтр по блоку
			if (selectedBlockId !== 'all') {
				const block = blocks.find(b => b.id === selectedBlockId);
				if (block && comp.category) {
					const categoryInBlock = block.categories?.some(cat => cat.id === comp.category?.id);
					if (!categoryInBlock) return false;
				} else if (!comp.category) {
					return false;
				}
			}
			
			// Фильтр по категории
			if (selectedCategoryId !== 'all' && comp.category?.id !== selectedCategoryId) {
				return false;
			}
			
			// Фильтр по группе
			if (selectedGroupId !== 'all') {
				const compGroupId = comp.group?.id || comp.hierarchy?.id;
				if (compGroupId !== selectedGroupId) return false;
			}
			
			// Фильтр по поиску
			if (searchQuery && !comp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			
			return true;
		});
	};

	const currentCompetencies = getFilteredCompetencies();
	const filteredAvailableCompetencies = getFilteredAvailableCompetencies();

	// Сброс фильтров
	const resetFilters = () => {
		setSelectedBlockId('all');
		setSelectedCategoryId('all');
		setSelectedGroupId('all');
		setSearchQuery('');
	};

	// Получение цвета для прогресса
	const getProgressColor = (percent: number): string => {
		if (percent >= 80) return '#4caf50';
		if (percent >= 50) return '#ff9800';
		return '#f44336';
	};

	// Получение цвета для оценки
	const getAssessmentColor = (score: number): string => {
		if (score >= 4) return '#4caf50';
		if (score >= 3) return '#8bc34a';
		if (score >= 2) return '#ffc107';
		return '#f44336';
	};

	// Получение отображаемого пути иерархии
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
		const loadData = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				await fetchCompetencyHierarchy();
				const departmentId = await fetchUserProfile();
				if (departmentId) {
					const employeesList = await fetchDepartmentEmployees(departmentId);
					await fetchAllCompetencies(departmentId);
					await fetchAssignedCompetencies(departmentId);
					await fetchMaterialTasks(departmentId);
					
					for (const employee of employeesList) {
						await fetchAssessmentsForEmployee(employee.id);
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

				{/* Фильтры */}
				<div className={styles.filtersBar}>
					<div className={styles.filterGroup}>
						<label>Сотрудник:</label>
						<select
							value={selectedEmployee}
							onChange={(e) => setSelectedEmployee(e.target.value)}
							className={styles.filterSelect}>
							<option value='all'>Все сотрудники</option>
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

				{/* Список компетенций */}
				<div className={styles.matrixWrapper}>
					<h2>Текущие компетенции</h2>
					{currentCompetencies.length === 0 ? (
						<div className={styles.emptyState}><p>Нет назначенных компетенций</p></div>
					) : (
						<div className={styles.competenciesGrid}>
							{currentCompetencies.map(comp => {
								const isExpanded = expandedCompetency === comp.id;
								const assessment = assessments.get(comp.id);
								const progressPercent = comp.progressPercent || 0;
								
								return (
									<div key={comp.id} className={styles.competencyCard}>
										<div 
											className={styles.competencyHeader}
											onClick={() => setExpandedCompetency(isExpanded ? null : comp.id)}>
											<div className={styles.competencyTitle}>
												<h3>{comp.name}</h3>
												<span className={styles.competencyType}>{comp.type}</span>
											</div>
											<div className={styles.headerRight}>
												<div className={styles.hierarchyPath}>
													{getFullHierarchyDisplay(comp)}
												</div>
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
												<span className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
											</div>
										</div>
										
										<p className={styles.competencyDescription}>{comp.description}</p>
										
										{isExpanded && (
											<div className={styles.materialsSection}>
												<strong>Учебные материалы ({comp.materialsCount || 0}):</strong>
												<div className={styles.materialsList}>
													{comp.materials && comp.materials.length > 0 ? (
														comp.materials.map(material => {
															// Находим статус материала для выбранного сотрудника
															const employeeId = selectedEmployee === 'all' ? employees[0]?.id : selectedEmployee;
															const materialTask = materialTasks.find(
																task => task.materialId === material.id && task.employeeId === employeeId
															);
															const isCompleted = materialTask?.status === 2;
															
															return (
																<div key={material.id} className={`${styles.materialItem} ${isCompleted ? styles.completed : ''}`}>
																	<span className={styles.materialName}>{material.name}</span>
																	<span className={styles.materialStatus}>
																		{isCompleted ? '✅ Изучено' : '⏳ Не изучено'}
																	</span>
																</div>
															);
														})
													) : (
														<div className={styles.noMaterials}>Нет привязанных материалов</div>
													)}
												</div>
												
												{/* Отображение оценки */}
												{assessment && (
													<div className={styles.assessmentDisplay}>
														<span 
															className={styles.assessmentBadge}
															style={{ backgroundColor: getAssessmentColor(assessment.score) }}
														>
															Оценка: {assessment.score}
														</span>
														{assessment.comment && (
															<span className={styles.assessmentComment}>{assessment.comment}</span>
														)}
													</div>
												)}
												
												{/* Кнопка оценки */}
												{selectedEmployee !== 'all' && (
													<button
														className={styles.assessBtn}
														onClick={() => {
															const employee = employees.find(e => e.id === selectedEmployee);
															setAssessmentModal({
																competencyId: comp.id,
																competencyName: comp.name,
																levelId: 'level',
																levelName: `Компетенция "${comp.name}"`,
																employeeId: selectedEmployee,
																employeeName: employee?.fullName || '',
															});
															setAssessmentScore(assessment?.score || 3);
															setAssessmentComment(assessment?.comment || '');
														}}
													>
														{assessment ? 'Изменить оценку' : 'Оценить'}
													</button>
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>

				{/* Добавление компетенции */}
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

			{/* Модальное окно оценки */}
			{assessmentModal && (
				<div className={styles.modalOverlay} onClick={() => setAssessmentModal(null)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h3>Оценка компетенции</h3>
							<button className={styles.closeBtn} onClick={() => setAssessmentModal(null)}>×</button>
						</div>
						
						<div className={styles.modalBody}>
							<p><strong>Сотрудник:</strong> {assessmentModal.employeeName}</p>
							<p><strong>Компетенция:</strong> {assessmentModal.competencyName}</p>
							
							<div className={styles.formGroup}>
								<label>Оценка (1-5):</label>
								<div className={styles.scoreInputGroup}>
									{[1, 2, 3, 4, 5].map(score => (
										<label key={score} className={styles.scoreOption}>
											<input
												type="radio"
												name="score"
												value={score}
												checked={assessmentScore === score}
												onChange={() => setAssessmentScore(score)}
											/>
											<span 
												className={styles.scoreValue}
												style={{ backgroundColor: getAssessmentColor(score) }}
											>
												{score}
											</span>
										</label>
									))}
								</div>
							</div>
							
							<div className={styles.formGroup}>
								<label>Комментарий (необязательно):</label>
								<textarea
									value={assessmentComment}
									onChange={(e) => setAssessmentComment(e.target.value)}
									rows={3}
									placeholder="Опишите почему поставлена такая оценка..."
									className={styles.commentInput}
								/>
							</div>
						</div>
						
						<div className={styles.modalActions}>
							<button onClick={() => setAssessmentModal(null)}>Отмена</button>
							<button className={styles.submitBtn} onClick={submitAssessment}>
								Сохранить оценку
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DepartmentCompetenciesPage;