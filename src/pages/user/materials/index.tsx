import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './materials.module.scss';

interface EducationalMaterialCompetency {
	id: string;
	createdAt: string;
	lastModified: string;
	deletedAt: string | null;
	competencyId: string;
	competency: {
		id: string;
		name: string;
		type: string;
		hierarchy: { id: string; name: string };
		description: string;
	} | null;
	educationalMaterialId: string;
	educationalMaterial: {
		id: string;
		name: string;
		typeId: string;
		type: { id: string; name: string } | null;
		link: string;
		duration: number;
	} | null;
	targetLevelId: string;
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
	competencyId: string;
	competencyName: string;
	targetLevel: string;
}

const MaterialsPage = () => {
	const location = useLocation();
	
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [competencyFilter, setCompetencyFilter] = useState<string>('all');
	
	const [materials, setMaterials] = useState<MaterialForDisplay[]>([]);
	const [types, setTypes] = useState<string[]>(['all']);
	const [competencies, setCompetencies] = useState<string[]>(['all']);
	
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Получение типов материалов из API и возврат мапы
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
				console.log('📦 Raw material types from API:', data);
				data.forEach(type => {
					if (type && type.id && type.name) {
						typeMap.set(type.id, type.name);
						console.log(`  ✅ Type mapping: ${type.id} -> ${type.name}`);
					}
				});
				console.log('📦 Material types map:', Array.from(typeMap.entries()));
				return typeMap;
			}
			return new Map();
		} catch (error) {
			console.error('Error fetching material types:', error);
			return new Map();
		}
	};

	// Получение всех компетенций для фильтра
	const fetchAllCompetencies = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return;

			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const compNames: string[] = [];
				const compMap: Map<string, string> = new Map();
				
				if (data.blocks && Array.isArray(data.blocks)) {
					data.blocks.forEach((block: any) => {
						block.categories?.forEach((category: any) => {
							category.groups?.forEach((group: any) => {
								group.competencies?.forEach((comp: any) => {
									if (comp && comp.name) {
										compNames.push(comp.name);
										compMap.set(comp.name, comp.id);
									}
								});
							});
						});
					});
				}
				setCompetencies(['all', ...compNames]);
				localStorage.setItem('competencyNameToId', JSON.stringify(Object.fromEntries(compMap)));
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
		}
	};

	// Получение материалов по компетенции
	const fetchMaterialsByCompetency = async (competencyId: string, typeMap: Map<string, string>) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return [];

			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: EducationalMaterialCompetency[] = await response.json();
				console.log(`📦 Materials for competency ${competencyId}:`, data);
				
				// Сразу преобразуем материалы с использованием переданной мапы типов
				const transformed: MaterialForDisplay[] = [];
				
				data.forEach(item => {
					if (item && item.educationalMaterial) {
						const material = item.educationalMaterial;
						
						let materialType = 'Без типа';
						
						if (material.typeId && typeMap.has(material.typeId)) {
							materialType = typeMap.get(material.typeId) || 'Без типа';
							console.log(`  ✅ Found type by ID: ${material.typeId} -> ${materialType}`);
						} else if (material.type && material.type.name) {
							materialType = material.type.name;
							console.log(`  ✅ Found type by name: ${materialType}`);
						} else {
							console.log(`  ❌ Type ID not found: ${material.typeId}`);
						}
						
						transformed.push({
							id: item.id,
							name: material.name || 'Без названия',
							type: materialType,
							duration: material.duration || 0,
							link: material.link || '',
							competencyId: competencyId,
							competencyName: '',
							targetLevel: item.targetLevel?.name || 'Не указан',
						});
					}
				});
				
				return transformed;
			}
			return [];
		} catch (error) {
			console.error('Error fetching materials by competency:', error);
			return [];
		}
	};

	// Получение всех материалов по всем компетенциям
	const fetchAllMaterials = async (typeMap: Map<string, string>) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				setIsLoading(false);
				return;
			}

			const competenciesResponse = await fetch('http://localhost:5217/api/competencies/own', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (competenciesResponse.ok) {
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

				console.log('📦 User competency IDs:', userCompetencyIds);
				console.log('📦 Material types map for lookup:', Array.from(typeMap.entries()));

				const allMaterials: MaterialForDisplay[] = [];
				const typeSet = new Set<string>();
				const competencySet = new Set<string>();

				for (const competencyId of userCompetencyIds) {
					const materialsData = await fetchMaterialsByCompetency(competencyId, typeMap);
					const competencyName = userCompetencyNames.get(competencyId) || 'Неизвестная компетенция';
					competencySet.add(competencyName);
					
					materialsData.forEach(material => {
						material.competencyName = competencyName;
						typeSet.add(material.type);
						allMaterials.push(material);
					});
				}

				setMaterials(allMaterials);
				setTypes(['all', ...Array.from(typeSet)]);
				setCompetencies(['all', ...Array.from(competencySet)]);
				console.log('📦 All materials with types:', allMaterials);
			}
		} catch (error) {
			console.error('Error fetching materials:', error);
			setError('Не удалось загрузить материалы');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			
			// Сначала загружаем типы материалов и получаем мапу
			const typeMap = await fetchMaterialTypes();
			
			// Загружаем компетенции для фильтра
			await fetchAllCompetencies();
			
			// Загружаем материалы, передавая мапу типов
			await fetchAllMaterials(typeMap);
			
			setIsLoading(false);
		};
		loadData();
	}, []);

	useEffect(() => {
		if (location.state?.filterByCompetency) {
			console.log('Filter by competency:', location.state.filterByCompetency);
			setCompetencyFilter(location.state.filterByCompetency);
		}
	}, [location.state]);

	const filteredMaterials = materials.filter((material) => {
		if (typeFilter !== 'all' && material.type !== typeFilter) return false;
		if (competencyFilter !== 'all' && material.competencyName !== competencyFilter) return false;
		return true;
	});

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

	if (error) {
		return (
			<div className={styles.page}>
				<div className={styles.error}>
					<p>{error}</p>
					<button onClick={() => { setIsLoading(true); window.location.reload(); }} className={styles.retryBtn}>
						Повторить
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Учебные материалы</h1>
			</div>

			<div className={styles.content}>
				<div className={styles.filters}>
					<select className={styles.filterSelect} value={competencyFilter} onChange={(e) => setCompetencyFilter(e.target.value)}>
						{competencies.map((comp) => (
							<option key={comp} value={comp}>
								{comp === 'all' ? 'Все компетенции' : comp}
							</option>
						))}
					</select>

					<select className={styles.filterSelect} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
						{types.map((type) => (
							<option key={type} value={type}>
								{type === 'all' ? 'Все типы' : type}
							</option>
						))}
					</select>
				</div>

				{filteredMaterials.length > 0 ? (
					<div className={styles.grid}>
						{filteredMaterials.map((material) => (
							<div key={material.id} className={styles.card}>
								<div className={styles.cardHeader}>
									<h3>{material.name}</h3>
								</div>
								<p>Тип: {material.type}</p>
								<p>Длительность: {formatDuration(material.duration)}</p>
								<p>Компетенция: {material.competencyName}</p>
								<p>Целевой уровень: {getLevelLabel(material.targetLevel)}</p>
								{material.link && (
									<button onClick={() => handleOpenMaterial(material.link)} className={styles.link}>
										Перейти к материалу
									</button>
								)}
							</div>
						))}
					</div>
				) : (
					<div className={styles.emptyState}>
						<p>Материалы не найдены</p>
						{filteredMaterials.length === 0 && !isLoading && (
							<p className={styles.emptyHint}>
								Для выбранных компетенций нет учебных материалов
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default MaterialsPage;