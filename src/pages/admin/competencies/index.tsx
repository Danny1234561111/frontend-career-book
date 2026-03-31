// competencies.module.tsx (исправленная версия с правильной привязкой материалов)
import React, { useState, useEffect } from 'react';
import { CompetenciesMatrix, CompetencyForm } from '../../../component';
import styles from './competencies.module.scss';

interface CompetencyData {
	id?: string;
	name: string;
	groupId: string;
	groupName: string;
	blockId: string;
	blockName: string;
	categoryId?: string;
	categoryName?: string;
	description: string;
	level: number;
	defenseTasks?: string;
	acceptanceCriteria?: string;
	article?: string;
	materialIds?: string[];
}

interface MaterialFromApi {
	id: string;
	name: string;
	typeId: string;
	type: { id: string; name: string } | null;
	link: string;
	duration: number;
}

interface CompetencyFromApi {
	id: string;
	name: string;
	type: string;
	description: string;
	text?: string;
	defenseTasks?: string;
	admissionCriteria?: string;
	levels?: Array<{
		id: string;
		name: string;
		value: number | string;
		materials?: Array<{
			id: string;
			name: string;
			status: number;
		}>;
	}>;
	hierarchy?: { id: string; name: string };
	department?: { id: string; name: string };
}

interface EducationalMaterialLink {
	id: string;
	competencyId: string;
	educationalMaterialId: string;
	targetLevelId: string;
	targetLevel?: { id: string; name: string; value: number | string };
	educationalMaterial: {
		id: string;
		name: string;
		typeId: string;
		type: { id: string; name: string } | null;
		link: string;
		duration: number;
	};
}

interface HierarchyItem {
	id: string;
	name: string;
	type: number; // 0 - блок, 1 - категория, 2 - группа
	parentId: string | null;
	sortingOrder: number;
	children?: HierarchyItem[];
}

interface NormalizedLevel {
	id: string;
	name: string;
	value: number;
	originalValue: string | number;
}

const CompetenciesPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [editingCompetency, setEditingCompetency] = useState<CompetencyData | null>(null);
	const [competencies, setCompetencies] = useState<CompetencyFromApi[]>([]);
	const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [materialLinks, setMaterialLinks] = useState<EducationalMaterialLink[]>([]);
	const [levels, setLevels] = useState<NormalizedLevel[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

	// Маппинг строковых значений уровней на числа
	const levelValueMap: { [key: string]: number } = {
		'BasicKnowledge': 1,
		'Professional': 2,
		'Expert': 3,
		'1': 1,
		'2': 2,
		'3': 3,
	};

	// Получение уровней владения
	const fetchLevels = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/levels?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const normalizedLevels: NormalizedLevel[] = data.map((level: any) => {
					let numericValue = 0;
					
					if (typeof level.value === 'number') {
						numericValue = level.value;
					} else if (typeof level.value === 'string') {
						numericValue = levelValueMap[level.value] || 0;
					} else if (level.name) {
						const nameMatch = level.name.match(/\d+/);
						if (nameMatch) {
							numericValue = parseInt(nameMatch[0]);
						}
					}
					
					return {
						id: level.id,
						name: level.name,
						value: numericValue,
						originalValue: level.value,
					};
				});
				
				console.log('Normalized levels:', normalizedLevels);
				setLevels(normalizedLevels);
				return normalizedLevels;
			}
		} catch (error) {
			console.error('Error fetching levels:', error);
		}
		return [];
	};

	// Получение иерархии компетенций из API
	const fetchCompetencyHierarchy = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/competency-hierarchy', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: HierarchyItem[] = await response.json();
				console.log('Competency hierarchy from API:', data);
				
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
				return tree;
			}
		} catch (error) {
			console.error('Error fetching competency hierarchy:', error);
		}
		return [];
	};

	// Получение ID уровня по значению
	const getTargetLevelId = (level: number): string | null => {
		console.log('Looking for level with value:', level);
		console.log('Available levels:', levels);
		
		let foundLevel = levels.find(l => l.value === level);
		
		if (foundLevel) {
			console.log('Found level:', foundLevel);
			return foundLevel.id;
		}
		
		console.error(`Level with value ${level} not found`);
		
		if (levels.length > 0) {
			console.warn(`Using first available level as fallback:`, levels[0]);
			return levels[0].id;
		}
		
		return null;
	};

	// Получение числового значения уровня из строки
	const getNumericLevelValue = (levelValue: string | number): number => {
		if (typeof levelValue === 'number') return levelValue;
		return levelValueMap[levelValue] || 1;
	};

	// Получение компетенций из API
	const fetchCompetenciesData = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const competenciesList: CompetencyFromApi[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					data.blocks.forEach((block: any) => {
						block.categories?.forEach((cat: any) => {
							cat.groups?.forEach((group: any) => {
								group.competencies?.forEach((comp: any) => {
									competenciesList.push({
										id: comp.id,
										name: comp.name,
										type: comp.type,
										description: comp.description || '',
										text: comp.text,
										defenseTasks: comp.defenseTasks,
										admissionCriteria: comp.admissionCriteria,
										levels: comp.levels,
										hierarchy: group,
										department: comp.department,
									});
								});
							});
						});
					});
				}
				
				setCompetencies(competenciesList);
				return competenciesList;
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
			setError('Ошибка загрузки компетенций');
		}
		return [];
	};

	// Получение всех материалов
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
				const data: MaterialFromApi[] = await response.json();
				console.log('Materials from API:', data);
				setMaterials(data);
			}
		} catch (error) {
			console.error('Error fetching materials:', error);
		}
	};

	// Получение связей материалов с компетенциями
	const fetchMaterialLinks = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/educational-material-competencies?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: EducationalMaterialLink[] = await response.json();
				console.log('Material links from API:', data);
				setMaterialLinks(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching material links:', error);
		}
		return [];
	};

	// Привязка материала к компетенции
	const attachMaterialToCompetency = async (competencyId: string, materialId: string, targetLevel: number) => {
		try {
			const targetLevelId = getTargetLevelId(targetLevel);
			if (!targetLevelId) {
				console.error(`Cannot attach material: target level ID not found for level ${targetLevel}`);
				return false;
			}
			
			console.log(`Attaching material ${materialId} to competency ${competencyId} with target level ID ${targetLevelId}`);
			
			const response = await fetch('http://localhost:5217/api/educational-material-competencies', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					competencyId: competencyId,
					educationalMaterialId: materialId,
					targetLevelId: targetLevelId,
				}),
			});

			const success = response.ok || response.status === 201;
			if (success) {
				console.log(`Successfully attached material ${materialId}`);
			} else {
				const errorText = await response.text();
				console.error(`Failed to attach material: ${errorText}`);
			}
			return success;
		} catch (error) {
			console.error('Error attaching material:', error);
			return false;
		}
	};

	// Удаление привязки материала
	const detachMaterialFromCompetency = async (linkId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/${linkId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});
			return response.ok;
		} catch (error) {
			console.error('Error detaching material:', error);
			return false;
		}
	};

	// Создание компетенции
	const createCompetency = async (competency: CompetencyData) => {
		try {
			console.log('Creating competency with data:', competency);
			console.log('Materials to attach:', competency.materialIds);
			
			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: competency.name,
					type: 'hard',
					hierarchyId: competency.groupId,
					departmentId: null,
					description: competency.description,
					text: competency.article || '',
					defenseTasks: competency.defenseTasks || '',
					admissionCriteria: competency.acceptanceCriteria || '',
				}),
			});

			if (response.ok) {
				const newCompetency = await response.json();
				console.log('Competency created:', newCompetency);
				
				// Привязываем материалы после создания компетенции
				if (competency.materialIds && competency.materialIds.length > 0) {
					console.log(`Attaching ${competency.materialIds.length} materials to new competency`);
					for (const materialId of competency.materialIds) {
						await attachMaterialToCompetency(newCompetency.id, materialId, competency.level);
					}
				}
				
				setSuccessMessage('Компетенция успешно создана');
				await refreshData();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await response.text();
				console.error('Create failed:', errorText);
				setError(`Ошибка: ${errorText}`);
				setTimeout(() => setError(null), 3000);
				return false;
			}
		} catch (error) {
			console.error('Error creating competency:', error);
			setError('Ошибка при создании компетенции');
			setTimeout(() => setError(null), 3000);
			return false;
		}
	};

	// Обновление компетенции
	const updateCompetency = async (id: string, competency: CompetencyData) => {
		try {
			const updateData: any = {};
			
			if (competency.name) updateData.name = competency.name;
			if (competency.groupId) updateData.hierarchyId = competency.groupId;
			if (competency.description !== undefined) updateData.description = competency.description;
			if (competency.article !== undefined) updateData.text = competency.article;
			if (competency.defenseTasks !== undefined) updateData.defenseTasks = competency.defenseTasks;
			if (competency.acceptanceCriteria !== undefined) updateData.admissionCriteria = competency.acceptanceCriteria;
			
			const response = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			});

			if (response.ok) {
				// Обновляем связи материалов
				const updatedLinks = await fetchMaterialLinks();
				const currentLinks = updatedLinks.filter(link => link.competencyId === id);
				
				const targetLevelId = getTargetLevelId(competency.level);
				if (!targetLevelId) {
					await refreshData();
					return true;
				}
				
				const currentLinksForLevel = currentLinks.filter(link => link.targetLevelId === targetLevelId);
				const currentMaterialIds = currentLinksForLevel.map(link => link.educationalMaterialId);
				const newMaterialIds = competency.materialIds || [];
				
				const materialsToRemove = currentLinksForLevel.filter(link => 
					!newMaterialIds.includes(link.educationalMaterialId)
				);
				
				const materialsToAdd = newMaterialIds.filter(mid => 
					!currentMaterialIds.includes(mid)
				);
				
				for (const link of materialsToRemove) {
					await detachMaterialFromCompetency(link.id);
				}
				
				for (const materialId of materialsToAdd) {
					await attachMaterialToCompetency(id, materialId, competency.level);
				}
				
				setSuccessMessage('Компетенция обновлена');
				await refreshData();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await response.text();
				setError(`Ошибка: ${errorText || 'Не удалось обновить компетенцию'}`);
				setTimeout(() => setError(null), 3000);
				return false;
			}
		} catch (error) {
			console.error('Error updating competency:', error);
			setError('Ошибка при обновлении компетенции');
			setTimeout(() => setError(null), 3000);
			return false;
		}
	};

	// Удаление компетенции
	const deleteCompetency = async (id: string) => {
		if (!confirm('Вы уверены, что хотите удалить эту компетенцию?')) return;
		
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			if (response.ok) {
				setSuccessMessage('Компетенция удалена');
				await refreshData();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при удалении компетенции');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error deleting competency:', error);
			setError('Ошибка при удалении компетенции');
			setTimeout(() => setError(null), 3000);
		}
	};

	// Обновление всех данных
	const refreshData = async () => {
		await fetchCompetenciesData();
		await fetchMaterialLinks();
	};

	const handleAddCompetency = () => {
		setEditingCompetency(null);
		setSelectedMaterialIds([]);
		setIsFormOpen(true);
	};

	const handleEditCompetency = (competency: CompetencyFromApi) => {
		const hierarchyId = competency.hierarchy?.id || '';
		const hierarchyName = competency.hierarchy?.name || '';
		
		// Находим блок и категорию из иерархии
		let blockId = '';
		let blockName = '';
		let categoryId = '';
		let categoryName = '';
		
		const findInHierarchy = (items: HierarchyItem[]): boolean => {
			for (const item of items) {
				if (item.type === 2 && item.id === hierarchyId) {
					const findParents = (parentItems: HierarchyItem[], targetId: string, parents: HierarchyItem[] = []): HierarchyItem[] | null => {
						for (const parent of parentItems) {
							if (parent.id === targetId) {
								return [parent, ...parents];
							}
							if (parent.children) {
								const found = findParents(parent.children, targetId, [parent, ...parents]);
								if (found) return found;
							}
						}
						return null;
					};
					
					const parents = findParents(hierarchy, item.id);
					if (parents) {
						for (const parent of parents) {
							if (parent.type === 0) {
								blockId = parent.id;
								blockName = parent.name;
							}
							if (parent.type === 1) {
								categoryId = parent.id;
								categoryName = parent.name;
							}
						}
					}
					return true;
				}
				if (item.children && findInHierarchy(item.children)) return true;
			}
			return false;
		};
		
		findInHierarchy(hierarchy);
		
		// Определяем уровень компетенции
		let competencyLevel = 1;
		if (competency.levels && competency.levels.length > 0) {
			const maxLevel = Math.max(...competency.levels.map(l => 
				typeof l.value === 'number' ? l.value : getNumericLevelValue(l.value)
			));
			competencyLevel = maxLevel;
		}
		
		// Получаем ID уровня для фильтрации материалов
		const targetLevelId = getTargetLevelId(competencyLevel);
		
		// Находим связанные материалы для этой компетенции
		const competencyLinks = materialLinks.filter(link => link.competencyId === competency.id);
		
		// Фильтруем по уровню, если есть targetLevelId
		const filteredLinks = targetLevelId 
			? competencyLinks.filter(link => link.targetLevelId === targetLevelId)
			: competencyLinks;
		
		const materialIds = filteredLinks.map(link => link.educationalMaterialId);
		
		console.log('Found materials for competency:', {
			competencyId: competency.id,
			competencyName: competency.name,
			level: competencyLevel,
			targetLevelId,
			materialIds,
			allLinksCount: competencyLinks.length,
			filteredLinksCount: filteredLinks.length
		});
		
		setSelectedMaterialIds(materialIds);
		
		const editingData: CompetencyData = {
			id: competency.id,
			name: competency.name,
			groupId: hierarchyId,
			groupName: hierarchyName,
			blockId: blockId,
			blockName: blockName,
			categoryId: categoryId,
			categoryName: categoryName,
			description: competency.description || '',
			level: competencyLevel,
			defenseTasks: competency.defenseTasks || '',
			acceptanceCriteria: competency.admissionCriteria || '',
			article: competency.text || '',
			materialIds: materialIds,
		};
		
		console.log('Editing data prepared:', editingData);
		setEditingCompetency(editingData);
		setIsFormOpen(true);
	};

	const handleSubmitCompetency = async (competency: CompetencyData) => {
		console.log('Submitting competency with materials:', competency.materialIds);
		let success = false;
		
		if (competency.id) {
			success = await updateCompetency(competency.id, competency);
		} else {
			success = await createCompetency(competency);
		}
		
		if (success) {
			handleCloseForm();
		}
	};

	const handleDeleteCompetency = (competencyId: string) => {
		deleteCompetency(competencyId);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingCompetency(null);
		setSelectedMaterialIds([]);
	};

	const getFormBlocks = () => {
		const convertToFormBlocks = (items: HierarchyItem[]): any[] => {
			return items
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
								.map(group => ({
									id: group.id,
									name: group.name,
								})),
						})),
				}));
		};
		
		return convertToFormBlocks(hierarchy);
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			const loadedLevels = await fetchLevels();
			await fetchCompetencyHierarchy();
			await fetchCompetenciesData();
			await fetchMaterials();
			await fetchMaterialLinks();
			setIsLoading(false);
		};
		loadData();
	}, []);

	const competenciesWithMaterials = competencies.map(comp => {
		const compLinks = materialLinks.filter(link => link.competencyId === comp.id);
		const educationalMaterials = compLinks.map(link => ({
			id: link.educationalMaterial.id,
			name: link.educationalMaterial.name,
			link: link.educationalMaterial.link,
			targetLevel: link.targetLevel?.value,
		}));
		
		return {
			...comp,
			educationalMaterials,
		};
	});

	const materialsForForm = materials.map(m => ({
		id: m.id,
		name: m.name,
		type: m.type?.name || 'Материал',
	}));

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка компетенций...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Управление компетенциями</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<div className={styles.toolbar}>
					<button className={styles.addBtn} onClick={handleAddCompetency}>
						<span className={styles.addIcon}>+</span>
						Добавить компетенцию
					</button>
				</div>

				<CompetenciesMatrix
					editable
					onEdit={handleEditCompetency}
					onDelete={handleDeleteCompetency}
					competencies={competenciesWithMaterials}
					competencyBlocks={getFormBlocks()}
					levels={levels.map(l => ({ id: l.id, name: l.name, value: l.value }))}
				/>
			</div>

			<CompetencyForm
				isOpen={isFormOpen}
				onClose={handleCloseForm}
				onSubmit={handleSubmitCompetency}
				initialData={editingCompetency}
				mode={editingCompetency ? 'edit' : 'create'}
				competencyBlocks={getFormBlocks()}
				materials={materialsForForm}
				selectedMaterialIds={selectedMaterialIds}
				levels={levels.map(l => ({ id: l.id, name: l.name, value: l.value }))}
			/>
		</div>
	);
};

export default CompetenciesPage;