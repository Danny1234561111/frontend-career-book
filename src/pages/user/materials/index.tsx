import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './materials.module.scss';

interface MaterialTask {
	id: string;
	material: {
		id: string;
		name: string;
		typeId: string;
		type: { id: string; name: string } | null;
		link: string;
		duration: number;
	};
	status: number;
	createdAt: string;
	lastModified: string;
}

interface EducationalMaterialCompetency {
	id: string;
	educationalMaterialId: string;
	educationalMaterial: {
		id: string;
		name: string;
		typeId: string;
		type: { id: string; name: string } | null;
		link: string;
		duration: number;
	};
	competencyId: string;
	targetLevel: {
		id: string;
		name: string;
		value: string;
	} | null;
}

interface MaterialType {
	id: string;
	name: string;
}

interface MaterialForDisplay {
	id: string;
	name: string;
	type: string;
	duration: number;
	link: string;
	competencies: { id: string; name: string; targetLevel: string }[];
	targetLevel?: string;
	status?: number;
	materialTaskId?: string;
	isAdded?: boolean;
}

const MaterialsPage = () => {
	const location = useLocation();
	const accessToken = localStorage.getItem('accessToken');
	
	// Получаем фильтр из location.state при переходе
	const initialCompetencyFilter = (location.state as any)?.filterByCompetency || 'all';
	
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [competencyFilter, setCompetencyFilter] = useState<string>(initialCompetencyFilter);
	
	const [myMaterials, setMyMaterials] = useState<MaterialForDisplay[]>([]);
	const [availableMaterials, setAvailableMaterials] = useState<MaterialForDisplay[]>([]);
	const [types, setTypes] = useState<string[]>(['all']);
	const [competencies, setCompetencies] = useState<string[]>(['all']);
	
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showAvailable, setShowAvailable] = useState(false);

	// Получение типов материалов
	const fetchMaterialTypes = async (): Promise<Map<string, string>> => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return new Map();

			const response = await fetch('http://localhost:5217/api/materialtypes?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: MaterialType[] = await response.json();
				const typeMap = new Map<string, string>();
				data.forEach(type => {
					if (type && type.id && type.name) {
						typeMap.set(type.id, type.name);
					}
				});
				return typeMap;
			}
			return new Map();
		} catch (error) {
			console.error('Error fetching material types:', error);
			return new Map();
		}
	};

	// Получение материалов пользователя (из /api/material-task)
	const fetchMyMaterials = async (typeMap: Map<string, string>) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return [];

			const response = await fetch('http://localhost:5217/api/material-task?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: MaterialTask[] = await response.json();
				console.log('📦 My materials from /api/material-task:', data);
				
				const materials: MaterialForDisplay[] = [];
				
				for (const item of data) {
					if (item.material) {
						let materialType = 'Без типа';
						if (item.material.typeId && typeMap.has(item.material.typeId)) {
							materialType = typeMap.get(item.material.typeId) || 'Без типа';
						} else if (item.material.type?.name) {
							materialType = item.material.type.name;
						}
						
						materials.push({
							id: item.material.id,
							name: item.material.name || 'Без названия',
							type: materialType,
							duration: item.material.duration || 0,
							link: item.material.link || '',
							competencies: [], // будет заполнено позже
							status: item.status,
							materialTaskId: item.id,
							isAdded: true,
						});
					}
				}
				return materials;
			}
			return [];
		} catch (error) {
			console.error('Error fetching my materials:', error);
			return [];
		}
	};

	// Получение всех материалов из компетенций пользователя
	const fetchAvailableMaterialsFromCompetencies = async (typeMap: Map<string, string>) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return { materials: [], competencyMap: new Map(), materialCompetencies: new Map() };

			// Сначала получаем компетенции пользователя
			const competenciesResponse = await fetch('http://localhost:5217/api/competencies/own', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (!competenciesResponse.ok) return { materials: [], competencyMap: new Map(), materialCompetencies: new Map() };

			const competenciesData = await competenciesResponse.json();
			const userCompetencyIds: string[] = [];
			const userCompetencyNames: Map<string, string> = new Map();
			
			if (competenciesData.blocks && Array.isArray(competenciesData.blocks)) {
				competenciesData.blocks.forEach((block: any) => {
					block.categories?.forEach((category: any) => {
						category.groups?.forEach((group: any) => {
							group.competencies?.forEach((comp: any) => {
								if (comp && comp.id) {
									userCompetencyIds.push(comp.id);
									userCompetencyNames.set(comp.id, comp.name);
								}
							});
						});
					});
				});
			}

			console.log('📦 User competencies:', userCompetencyIds);

			// Получаем материалы по каждой компетенции
			const materialsMap = new Map<string, MaterialForDisplay>();
			
			for (const competencyId of userCompetencyIds) {
				const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`,
						'accept': 'text/plain',
					},
				});

				if (response.ok) {
					const data: EducationalMaterialCompetency[] = await response.json();
					const competencyName = userCompetencyNames.get(competencyId) || 'Неизвестная компетенция';
					
					data.forEach(item => {
						if (item && item.educationalMaterial) {
							const materialId = item.educationalMaterial.id;
							
							// Если материала еще нет в мапе, создаем его
							if (!materialsMap.has(materialId)) {
								let materialType = 'Без типа';
								if (item.educationalMaterial.typeId && typeMap.has(item.educationalMaterial.typeId)) {
									materialType = typeMap.get(item.educationalMaterial.typeId) || 'Без типа';
								} else if (item.educationalMaterial.type?.name) {
									materialType = item.educationalMaterial.type.name;
								}
								
								materialsMap.set(materialId, {
									id: materialId,
									name: item.educationalMaterial.name || 'Без названия',
									type: materialType,
									duration: item.educationalMaterial.duration || 0,
									link: item.educationalMaterial.link || '',
									competencies: [],
								});
							}
							
							// Добавляем компетенцию к материалу
							const material = materialsMap.get(materialId)!;
							const targetLevelName = item.targetLevel?.name || 'Не указан';
							
							// Проверяем, нет ли уже такой компетенции
							const hasCompetency = material.competencies.some(c => c.id === competencyId);
							if (!hasCompetency) {
								material.competencies.push({
									id: competencyId,
									name: competencyName,
									targetLevel: targetLevelName,
								});
							}
						}
					});
				}
			}
			
			const allMaterials = Array.from(materialsMap.values());
			console.log('📦 All materials with competencies:', allMaterials);
			
			return { 
				materials: allMaterials, 
				competencyMap: userCompetencyNames,
			};
		} catch (error) {
			console.error('Error fetching available materials:', error);
			return { materials: [], competencyMap: new Map() };
		}
	};

	// Добавление материала
	const addMaterial = async (materialId: string, materialName: string) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				return;
			}

			const response = await fetch('http://localhost:5217/api/material-task', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					materialId: materialId,
				}),
			});

			if (response.ok || response.status === 201) {
				setSuccessMessage(`Материал "${materialName}" добавлен к вашим материалам`);
				setTimeout(() => setSuccessMessage(null), 3000);
				await loadData();
			} else {
				const errorText = await response.text();
				setError(`Ошибка добавления: ${errorText}`);
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding material:', error);
			setError('Ошибка сети при добавлении материала');
			setTimeout(() => setError(null), 3000);
		}
	};

	// Загрузка всех данных
	const loadData = async () => {
		setIsLoading(true);
		
		const typeMap = await fetchMaterialTypes();
		
		// Получаем мои материалы
		const myMaterialsData = await fetchMyMaterials(typeMap);
		
		// Получаем все материалы из компетенций
		const { materials: allAvailableMaterials } = await fetchAvailableMaterialsFromCompetencies(typeMap);
		
		// Находим ID материалов, которые уже есть у пользователя
		const myMaterialIds = new Set(myMaterialsData.map(m => m.id));
		
		// Разделяем на доступные и уже добавленные
		const availableFiltered = allAvailableMaterials.filter(m => !myMaterialIds.has(m.id));
		
		// Добавляем информацию о статусе в мои материалы
		const myMaterialsWithComp = myMaterialsData.map(m => {
			const fullMaterial = allAvailableMaterials.find(am => am.id === m.id);
			return {
				...m,
				competencies: fullMaterial?.competencies || [],
			};
		});
		
		setMyMaterials(myMaterialsWithComp);
		setAvailableMaterials(availableFiltered);
		
		// Формируем списки для фильтров
		const typeSet = new Set<string>();
		const competencySet = new Set<string>();
		
		[...myMaterialsWithComp, ...availableFiltered].forEach(m => {
			typeSet.add(m.type);
			m.competencies.forEach(comp => {
				competencySet.add(comp.name);
			});
		});
		
		setTypes(['all', ...Array.from(typeSet)]);
		setCompetencies(['all', ...Array.from(competencySet)]);
		
		setIsLoading(false);
	};

	useEffect(() => {
		if (accessToken) {
			loadData();
		}
	}, [accessToken]);

	// Фильтрация материалов (учитываем, что материал может относиться к нескольким компетенциям)
	const filterMaterials = (materials: MaterialForDisplay[]) => {
		return materials.filter((material) => {
			if (typeFilter !== 'all' && material.type !== typeFilter) return false;
			if (competencyFilter !== 'all') {
				// Проверяем, есть ли у материала выбранная компетенция
				const hasCompetency = material.competencies.some(comp => comp.name === competencyFilter);
				if (!hasCompetency) return false;
			}
			return true;
		});
	};

	const filteredMyMaterials = filterMaterials(myMaterials);
	const filteredAvailableMaterials = filterMaterials(availableMaterials);

	const getStatusLabel = (status: number) => {
		const labels: Record<number, string> = {
			0: 'Запланировано',
			1: 'В работе',
			2: 'Готово к проверке',
		};
		return labels[status] || 'Неизвестно';
	};

	const getStatusClass = (status: number) => {
		const classes: Record<number, string> = {
			0: styles.statusToStudy,
			1: styles.statusInProgress,
			2: styles.statusCompleted,
		};
		return classes[status] || '';
	};

	const getLevelLabel = (level: string) => {
		const labels: Record<string, string> = {
			'1': 'Базовые знания',
			'2': 'Профессионал',
			'3': 'Эксперт',
		};
		return labels[level] || level;
	};

	const formatDuration = (minutes: number) => {
		if (!minutes || minutes === 0) return 'Не указано';
		if (minutes < 60) return `${minutes} мин`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (mins === 0) return `${hours} ч`;
		return `${hours} ч ${mins} мин`;
	};

	const handleOpenMaterial = (link: string) => {
		if (link && link.startsWith('http')) {
			window.open(link, '_blank', 'noopener,noreferrer');
		} else if (link) {
			window.open(`https://${link}`, '_blank', 'noopener,noreferrer');
		} else {
			console.warn('No link provided');
		}
	};

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка материалов...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Учебные материалы</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${!showAvailable ? styles.activeTab : ''}`}
						onClick={() => setShowAvailable(false)}>
						Мои материалы ({myMaterials.length})
					</button>
					<button
						className={`${styles.tab} ${showAvailable ? styles.activeTab : ''}`}
						onClick={() => setShowAvailable(true)}>
						Доступные материалы ({availableMaterials.length})
					</button>
				</div>

				<div className={styles.filters}>
					<select
						className={styles.filterSelect}
						value={competencyFilter}
						onChange={(e) => setCompetencyFilter(e.target.value)}>
						{competencies.map((comp) => (
							<option key={comp} value={comp}>
								{comp === 'all' ? 'Все компетенции' : comp}
							</option>
						))}
					</select>

					<select
						className={styles.filterSelect}
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value)}>
						{types.map((type) => (
							<option key={type} value={type}>
								{type === 'all' ? 'Все типы' : type}
							</option>
						))}
					</select>
				</div>

				{!showAvailable && (
					<>
						{filteredMyMaterials.length > 0 ? (
							<div className={styles.grid}>
								{filteredMyMaterials.map((material) => (
									<div key={material.id} className={styles.card}>
										<div className={styles.cardHeader}>
											<h3>{material.name}</h3>
											<span className={`${styles.statusBadge} ${getStatusClass(material.status || 0)}`}>
												{getStatusLabel(material.status || 0)}
											</span>
										</div>
										<p>Тип: {material.type}</p>
										<p>Длительность: {formatDuration(material.duration)}</p>
										<p>Компетенции: {material.competencies.map(c => c.name).join(', ')}</p>
										<p>Целевые уровни: {material.competencies.map(c => getLevelLabel(c.targetLevel)).join(', ')}</p>
										{material.link && (
											<button
												onClick={() => handleOpenMaterial(material.link)}
												className={styles.link}>
												Перейти к материалу
											</button>
										)}
									</div>
								))}
							</div>
						) : (
							<div className={styles.emptyState}>
								<p>У вас нет добавленных материалов</p>
								<p className={styles.emptyHint}>Перейдите на вкладку "Доступные материалы" чтобы добавить</p>
							</div>
						)}
					</>
				)}

				{showAvailable && (
					<>
						{filteredAvailableMaterials.length > 0 ? (
							<div className={styles.grid}>
								{filteredAvailableMaterials.map((material) => (
									<div key={material.id} className={styles.card}>
										<div className={styles.cardHeader}>
											<h3>{material.name}</h3>
											<button
												onClick={() => addMaterial(material.id, material.name)}
												className={styles.addBtn}>
												+ Добавить
											</button>
										</div>
										<p>Тип: {material.type}</p>
										<p>Длительность: {formatDuration(material.duration)}</p>
										<p>Компетенции: {material.competencies.map(c => c.name).join(', ')}</p>
										<p>Целевые уровни: {material.competencies.map(c => getLevelLabel(c.targetLevel)).join(', ')}</p>
										{material.link && (
											<button
												onClick={() => handleOpenMaterial(material.link)}
												className={styles.link}>
												Перейти к материалу
											</button>
										)}
									</div>
								))}
							</div>
						) : (
							<div className={styles.emptyState}>
								<p>Нет доступных материалов для добавления</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default MaterialsPage;