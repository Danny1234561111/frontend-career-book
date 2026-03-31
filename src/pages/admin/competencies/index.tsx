// competencies.module.tsx (исправленная версия с правильной обработкой уровней)
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
	level: number; // уровень владения (1-3)
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

interface CompetencyBlock {
	id: string;
	name: string;
	categories: Array<{
		id: string;
		name: string;
		groups: Array<{
			id: string;
			name: string;
			competencies: CompetencyFromApi[];
		}>;
	}>;
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
	const [competencyBlocks, setCompetencyBlocks] = useState<CompetencyBlock[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [materialLinks, setMaterialLinks] = useState<EducationalMaterialLink[]>([]);
	const [levels, setLevels] = useState<NormalizedLevel[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
				console.log('Raw levels data from API:', data);
				
				// Нормализуем уровни, сопоставляя строковые значения с числами
				const normalizedLevels: NormalizedLevel[] = data.map((level: any) => {
					let numericValue = 0;
					
					// Пробуем получить числовое значение из различных полей
					if (typeof level.value === 'number') {
						numericValue = level.value;
					} else if (typeof level.value === 'string') {
						// Если value - строка, ищем в маппинге
						numericValue = levelValueMap[level.value] || 0;
					} else if (level.name) {
						// Пробуем из имени
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

	// Получение ID уровня по значению
	const getTargetLevelId = (level: number): string | null => {
		console.log('Looking for level with numeric value:', level);
		console.log('Available normalized levels:', levels);
		
		// Ищем уровень по числовому значению
		let foundLevel = levels.find(l => l.value === level);
		
		if (foundLevel) {
			console.log('Found level:', foundLevel);
			return foundLevel.id;
		}
		
		console.error(`Level with value ${level} not found in levels list`);
		
		// Если не нашли, пробуем использовать первый доступный уровень как fallback
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
				console.log('Competencies data structure:', data);
				const blocksData: CompetencyBlock[] = [];
				const competenciesList: CompetencyFromApi[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					data.blocks.forEach((block: any) => {
						const categories = block.categories?.map((cat: any) => ({
							id: cat.id,
							name: cat.name,
							groups: cat.groups?.map((group: any) => ({
								id: group.id,
								name: group.name,
								competencies: group.competencies?.map((comp: any) => {
									const competency: CompetencyFromApi = {
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
									};
									competenciesList.push(competency);
									return competency;
								}) || []
							})) || []
						})) || [];
						
						blocksData.push({
							id: block.id,
							name: block.name,
							categories,
						});
					});
				}
				
				setCompetencyBlocks(blocksData);
				setCompetencies(competenciesList);
				return competenciesList;
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
			setError('Ошибка загрузки компетенций');
		}
		return [];
	};

	// Получение материалов
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
				console.log('Materials loaded:', data.length);
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
				console.log('Material links loaded:', data.length);
				setMaterialLinks(data);
				return data;
			}
		} catch (error) {
			console.error('Error fetching material links:', error);
		}
		return [];
	};

	// Привязка материала к компетенции для конкретного уровня
	const attachMaterialToCompetency = async (competencyId: string, materialId: string, targetLevel: number) => {
		try {
			const targetLevelId = getTargetLevelId(targetLevel);
			if (!targetLevelId) {
				console.error(`Cannot attach material: target level ID not found for level ${targetLevel}`);
				return false;
			}

			console.log(`Attaching material ${materialId} to competency ${competencyId} with level ID ${targetLevelId}`);
			
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

			if (response.ok || response.status === 201) {
				console.log(`Material ${materialId} attached to competency ${competencyId}`);
				return true;
			} else {
				const errorText = await response.text();
				console.error(`Failed to attach material: ${errorText}`);
				return false;
			}
		} catch (error) {
			console.error('Error attaching material:', error);
			return false;
		}
	};

	// Удаление привязки материала
	const detachMaterialFromCompetency = async (linkId: string) => {
		try {
			console.log(`Detaching material link ${linkId}`);
			
			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/${linkId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});
			
			if (response.ok) {
				console.log(`Material link ${linkId} detached`);
				return true;
			} else {
				console.error(`Failed to detach material link: ${response.status}`);
				return false;
			}
		} catch (error) {
			console.error('Error detaching material:', error);
			return false;
		}
	};

	// Создание компетенции
	const createCompetency = async (competency: CompetencyData) => {
		try {
			console.log('Creating competency with data:', competency);
			
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
				
				// Привязываем выбранные материалы
				if (competency.materialIds && competency.materialIds.length > 0) {
					console.log('Attaching materials to new competency:', competency.materialIds);
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
			console.log('Updating competency:', id, competency);
			
			// Формируем данные для PATCH запроса
			const updateData: any = {};
			
			if (competency.name) updateData.name = competency.name;
			if (competency.groupId) updateData.hierarchyId = competency.groupId;
			if (competency.description !== undefined) updateData.description = competency.description;
			if (competency.article !== undefined) updateData.text = competency.article;
			if (competency.defenseTasks !== undefined) updateData.defenseTasks = competency.defenseTasks;
			if (competency.acceptanceCriteria !== undefined) updateData.admissionCriteria = competency.acceptanceCriteria;
			
			console.log('Update data:', updateData);
			
			const response = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			});

			if (response.ok) {
				console.log('Competency updated successfully');
				
				// Получаем актуальные связи после обновления
				const updatedLinks = await fetchMaterialLinks();
				const currentLinks = updatedLinks.filter(link => link.competencyId === id);
				
				// Фильтруем связи по целевому уровню (нужны только для текущего уровня компетенции)
				const targetLevelId = getTargetLevelId(competency.level);
				if (!targetLevelId) {
					console.error(`Cannot update materials: target level ID not found for level ${competency.level}`);
					setSuccessMessage('Компетенция обновлена, но материалы не привязаны (уровень не найден)');
					await refreshData();
					setTimeout(() => setSuccessMessage(null), 3000);
					return true;
				}
				
				const currentLinksForLevel = currentLinks.filter(link => link.targetLevelId === targetLevelId);
				const currentMaterialIds = currentLinksForLevel.map(link => link.educationalMaterialId);
				const newMaterialIds = competency.materialIds || [];
				
				console.log('Current materials for level:', currentMaterialIds);
				console.log('New materials:', newMaterialIds);
				
				// Находим материалы для удаления (только для текущего уровня)
				const materialsToRemove = currentLinksForLevel.filter(link => 
					!newMaterialIds.includes(link.educationalMaterialId)
				);
				
				// Находим материалы для добавления
				const materialsToAdd = newMaterialIds.filter(mid => 
					!currentMaterialIds.includes(mid)
				);
				
				console.log('Materials to remove:', materialsToRemove.map(l => l.id));
				console.log('Materials to add:', materialsToAdd);
				
				// Удаляем старые связи
				for (const link of materialsToRemove) {
					await detachMaterialFromCompetency(link.id);
				}
				
				// Добавляем новые связи
				for (const materialId of materialsToAdd) {
					await attachMaterialToCompetency(id, materialId, competency.level);
				}
				
				setSuccessMessage('Компетенция обновлена');
				await refreshData();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await response.text();
				console.error('Update failed:', errorText);
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
		setIsFormOpen(true);
	};

	const handleEditCompetency = (competency: CompetencyFromApi) => {
		console.log('Editing competency:', competency);
		
		// Находим группу (иерархию) компетенции
		const hierarchyId = competency.hierarchy?.id || '';
		const hierarchyName = competency.hierarchy?.name || '';
		
		// Находим блок и категорию из структуры blocks
		let blockId = '';
		let blockName = '';
		let categoryId = '';
		let categoryName = '';
		
		// Ищем в структуре blocks
		for (const block of competencyBlocks) {
			for (const category of block.categories) {
				const foundGroup = category.groups.find(g => g.id === hierarchyId);
				if (foundGroup) {
					blockId = block.id;
					blockName = block.name;
					categoryId = category.id;
					categoryName = category.name;
					break;
				}
			}
			if (blockId) break;
		}
		
		// Определяем уровень компетенции из levels
		let competencyLevel = 1;
		if (competency.levels && competency.levels.length > 0) {
			// Берем максимальный уровень и конвертируем в число
			const maxLevel = Math.max(...competency.levels.map(l => 
				typeof l.value === 'number' ? l.value : getNumericLevelValue(l.value)
			));
			competencyLevel = maxLevel;
		}
		
		console.log('Competency level determined:', competencyLevel);
		
		// Находим связанные материалы для этой компетенции и конкретного уровня
		const targetLevelId = getTargetLevelId(competencyLevel);
		const competencyLinks = materialLinks.filter(link => 
			link.competencyId === competency.id && 
			(targetLevelId ? link.targetLevelId === targetLevelId : true)
		);
		const materialIds = competencyLinks.map(link => link.educationalMaterialId);
		
		console.log('Found material links for competency:', competencyLinks.length);
		console.log('Material IDs:', materialIds);
		
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
		console.log('Submitting competency:', competency);
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
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await fetchLevels();
			await fetchCompetenciesData();
			await fetchMaterials();
			await fetchMaterialLinks();
			setIsLoading(false);
		};
		loadData();
	}, []);

	// Обогащаем компетенции информацией о привязанных материалах
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

	// Подготовка данных для формы - группировка блоков, категорий и групп
	const getFormBlocks = () => {
		return competencyBlocks.map(block => ({
			id: block.id,
			name: block.name,
			categories: block.categories.map(cat => ({
				id: cat.id,
				name: cat.name,
				groups: cat.groups.map(group => ({
					id: group.id,
					name: group.name,
				})),
			})),
		}));
	};

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
					competencyBlocks={competencyBlocks}
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
				levels={levels.map(l => ({ id: l.id, name: l.name, value: l.value }))}
			/>
		</div>
	);
};

export default CompetenciesPage;