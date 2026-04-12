import React, { useState, useEffect } from 'react';
import { CompetenciesMatrix, CompetencyForm } from '../../../component';
import styles from './competencies.module.scss';

interface CompetencyLevel {
	id?: string;
	levelId: string;
	levelName: string;
	levelValue: number;
	description: string;
	example: string;
	materialIds: string[];
}

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
	defenseTasks?: string;
	acceptanceCriteria?: string;
	article?: string;
	levels: CompetencyLevel[];
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
	hierarchy?: { id: string; name: string };
	category?: { id: string; name: string };
	group?: { id: string; name: string };
	department?: { id: string; name: string };
}

interface EducationalMaterialLink {
	id: string;
	competencyId: string;
	educationalMaterialId: string;
	targetLevelId: string;
	targetLevel?: { id: string; name: string; value: number };
	educationalMaterial: MaterialFromApi;
}

interface ProficiencyLevelCompetency {
	id: string;
	proficiencyLevelId: string;
	proficiencyLevel: { id: string; name: string; value: number };
	competencyId: string;
	description?: string;
	example?: string;
}

interface HierarchyItem {
	id: string;
	name: string;
	type: number;
	parentId: string | null;
	sortingOrder: number;
	children?: HierarchyItem[];
}

interface Level {
	id: string;
	name: string;
	value: number;
}

const CompetenciesPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [editingCompetency, setEditingCompetency] = useState<CompetencyData | null>(null);
	const [competencies, setCompetencies] = useState<CompetencyFromApi[]>([]);
	const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
	const [flatHierarchy, setFlatHierarchy] = useState<HierarchyItem[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [materialLinks, setMaterialLinks] = useState<EducationalMaterialLink[]>([]);
	const [levels, setLevels] = useState<Level[]>([]);
	const [proficiencyLevelCompetencies, setProficiencyLevelCompetencies] = useState<ProficiencyLevelCompetency[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [materialsByLevel, setMaterialsByLevel] = useState<Map<string, EducationalMaterialLink[]>>(new Map());

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

	const fetchLevels = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/levels?withDeleted=false', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: Level[] = await response.json();
				const sorted = data.sort((a, b) => a.value - b.value);
				setLevels(sorted);
				return sorted;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	const fetchCompetencyHierarchy = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/competency-hierarchy', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: HierarchyItem[] = await response.json();
				const buildTree = (items: HierarchyItem[], parentId: string | null = null): HierarchyItem[] => {
					return items.filter(item => item.parentId === parentId).map(item => ({
						...item,
						children: buildTree(items, item.id)
					})).sort((a, b) => a.sortingOrder - b.sortingOrder);
				};
				const tree = buildTree(data);
				setHierarchy(tree);
				setFlatHierarchy(flattenHierarchy(tree));
				return tree;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	const fetchProficiencyLevelCompetencies = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/proficiency-level-competencies?withDeleted=false', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: ProficiencyLevelCompetency[] = await response.json();
				setProficiencyLevelCompetencies(data);
				return data;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	const fetchCompetenciesData = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data = await response.json();
				const competenciesList: CompetencyFromApi[] = [];
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						for (const category of (block.categories || [])) {
							for (const group of (category.groups || [])) {
								for (const comp of (group.competencies || [])) {
									const hierarchyInfo = getFullHierarchy(group.id);
									competenciesList.push({
										id: comp.id, name: comp.name, type: comp.type,
										description: comp.description || '', text: comp.text,
										defenseTasks: comp.defenseTasks, admissionCriteria: comp.admissionCriteria,
										hierarchy: { id: group.id, name: group.name },
										category: hierarchyInfo.category || undefined,
										group: hierarchyInfo.group || undefined,
										department: comp.department,
									});
								}
							}
						}
					}
				}
				setCompetencies(competenciesList);
				return competenciesList;
			}
		} catch (error) { console.error(error); setError('Ошибка загрузки компетенций'); }
		return [];
	};

	const fetchMaterials = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/materials?withDeleted=false', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: MaterialFromApi[] = await response.json();
				setMaterials(data);
				return data;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	const fetchMaterialLinks = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/educational-material-competencies?withDeleted=false', {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			if (response.ok) {
				const data: EducationalMaterialLink[] = await response.json();
				setMaterialLinks(data);
				const map = new Map<string, EducationalMaterialLink[]>();
				data.forEach(link => {
					const key = `${link.competencyId}_${link.targetLevelId}`;
					if (!map.has(key)) map.set(key, []);
					map.get(key)!.push(link);
				});
				setMaterialsByLevel(map);
				return data;
			}
		} catch (error) { console.error(error); }
		return [];
	};

	const addLevelToCompetency = async (competencyId: string, levelId: string, description: string, example: string) => {
		try {
			const response = await fetch('http://localhost:5217/api/proficiency-level-competencies', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ competencyId, proficiencyLevelId: levelId, description, example }),
			});
			return response.ok || response.status === 201;
		} catch (error) { return false; }
	};

	const attachMaterialToCompetencyLevel = async (competencyId: string, materialId: string, proficiencyLevelId: string) => {
		try {
			const response = await fetch('http://localhost:5217/api/educational-material-competencies', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ competencyId, educationalMaterialId: materialId, targetLevelId: proficiencyLevelId }),
			});
			return response.ok || response.status === 201;
		} catch (error) { return false; }
	};

	const detachMaterialFromCompetency = async (linkId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/${linkId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${accessToken}` },
			});
			return response.ok;
		} catch (error) { return false; }
	};

	const deleteLevelFromCompetency = async (levelCompetencyId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/proficiency-level-competencies/${levelCompetencyId}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${accessToken}` },
			});
			return response.ok;
		} catch (error) { return false; }
	};

	const updateLevel = async (levelCompetencyId: string, description: string, example: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/proficiency-level-competencies/${levelCompetencyId}`, {
				method: 'PATCH',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({ description, example }),
			});
			return response.ok;
		} catch (error) { return false; }
	};

	const createCompetency = async (competency: CompetencyData) => {
		try {
			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: competency.name,
					type: 'hard',
					hierarchyId: competency.groupId,
					departmentId: null,
					description: competency.description || '',
					text: competency.article || '',
					defenseTasks: competency.defenseTasks || '',
					admissionCriteria: competency.acceptanceCriteria || '',
				}),
			});
			if (!response.ok) throw new Error();
			const newCompetency = await response.json();
			for (const level of competency.levels) {
				const levelAdded = await addLevelToCompetency(newCompetency.id, level.levelId, level.description, level.example);
				if (levelAdded && level.materialIds.length > 0) {
					for (const materialId of level.materialIds) {
						await attachMaterialToCompetencyLevel(newCompetency.id, materialId, level.levelId);
					}
				}
			}
			setSuccessMessage('Компетенция успешно создана');
			await refreshData();
			setTimeout(() => setSuccessMessage(null), 3000);
			return true;
		} catch (error) {
			setError('Ошибка при создании компетенции');
			setTimeout(() => setError(null), 3000);
			return false;
		}
	};

	// ИСПРАВЛЕННАЯ функция updateCompetency - отправляет ВСЕ поля
	const updateCompetency = async (id: string, competency: CompetencyData) => {
		try {
			// Формируем объект с ВСЕМИ полями, которые могут быть обновлены
			const updateData: any = {
				name: competency.name,
				hierarchyId: competency.groupId,
				description: competency.description || '',
				text: competency.article || '',
				defenseTasks: competency.defenseTasks || '',
				admissionCriteria: competency.acceptanceCriteria || '',
				type: 'hard',
				departmentId: null,
			};
			
			console.log('📤 Sending update to API:', JSON.stringify(updateData, null, 2));
			
			const response = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'PATCH',
				headers: { 
					'Authorization': `Bearer ${accessToken}`, 
					'Content-Type': 'application/json' 
				},
				body: JSON.stringify(updateData),
			});
			
			if (!response.ok) {
				const errorText = await response.text();
				console.error('Update failed:', response.status, errorText);
				throw new Error(`Failed to update competency: ${response.status}`);
			}
			
			console.log('✅ Competency basic info updated');

			// Получаем существующие уровни
			const existingLevelsResponse = await fetch(`http://localhost:5217/api/proficiency-level-competencies/by-competency/${id}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			let existingLevels: ProficiencyLevelCompetency[] = existingLevelsResponse.ok ? await existingLevelsResponse.json() : [];

			// Получаем существующие связи материалов
			const existingLinksResponse = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${id}`, {
				method: 'GET',
				headers: { 'Authorization': `Bearer ${accessToken}`, 'accept': 'text/plain' },
			});
			let existingLinks: EducationalMaterialLink[] = existingLinksResponse.ok ? await existingLinksResponse.json() : [];

			// Обрабатываем уровни
			for (const levelFromForm of competency.levels) {
				const existingLevel = existingLevels.find(l => l.proficiencyLevelId === levelFromForm.levelId);
				
				if (!existingLevel) {
					// Создаем новый уровень
					const addLevelResponse = await fetch('http://localhost:5217/api/proficiency-level-competencies', {
						method: 'POST',
						headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
						body: JSON.stringify({
							competencyId: id,
							proficiencyLevelId: levelFromForm.levelId,
							description: levelFromForm.description || '',
							example: levelFromForm.example || '',
						}),
					});
					if (addLevelResponse.ok || addLevelResponse.status === 201) {
						if (levelFromForm.materialIds.length > 0) {
							for (const materialId of levelFromForm.materialIds) {
								await attachMaterialToCompetencyLevel(id, materialId, levelFromForm.levelId);
							}
						}
					}
				} else {
					// Обновляем существующий уровень
					if (existingLevel.description !== levelFromForm.description || existingLevel.example !== levelFromForm.example) {
						await updateLevel(existingLevel.id, levelFromForm.description, levelFromForm.example);
					}
					
					const existingMaterialsForLevel = existingLinks.filter(link => link.targetLevelId === levelFromForm.levelId);
					const existingMaterialIds = existingMaterialsForLevel.map(link => link.educationalMaterialId);
					const materialsToRemove = existingMaterialsForLevel.filter(link => !levelFromForm.materialIds.includes(link.educationalMaterialId));
					const materialsToAdd = levelFromForm.materialIds.filter(mid => !existingMaterialIds.includes(mid));
					
					for (const link of materialsToRemove) await detachMaterialFromCompetency(link.id);
					for (const materialId of materialsToAdd) await attachMaterialToCompetencyLevel(id, materialId, levelFromForm.levelId);
				}
			}
			
			// Удаляем уровни, которых нет в форме
			const formLevelIds = competency.levels.map(l => l.levelId);
			const levelsToDelete = existingLevels.filter(l => !formLevelIds.includes(l.proficiencyLevelId));
			for (const level of levelsToDelete) {
				const materialsForLevel = existingLinks.filter(link => link.targetLevelId === level.proficiencyLevelId);
				for (const link of materialsForLevel) await detachMaterialFromCompetency(link.id);
				await deleteLevelFromCompetency(level.id);
			}
			
			setSuccessMessage('Компетенция обновлена');
			await refreshData();
			setTimeout(() => setSuccessMessage(null), 3000);
			return true;
		} catch (error) {
			console.error('Error updating competency:', error);
			setError('Ошибка при обновлении компетенции');
			setTimeout(() => setError(null), 3000);
			return false;
		}
	};

	const deleteCompetency = async (id: string) => {
		if (!confirm('Вы уверены, что хотите удалить эту компетенцию?')) return;
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${accessToken}` },
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
			setError('Ошибка при удалении компетенции');
			setTimeout(() => setError(null), 3000);
		}
	};

	const refreshData = async () => {
		await fetchCompetenciesData();
		await fetchProficiencyLevelCompetencies();
		await fetchMaterialLinks();
	};

	const handleAddCompetency = () => {
		setEditingCompetency(null);
		setIsFormOpen(true);
	};

	// ИСПРАВЛЕННАЯ функция handleEditCompetency - загружает актуальные данные
const handleEditCompetency = async (competency: CompetencyFromApi) => {
	console.log('✏️ Editing competency:', competency);
	
	// Загружаем свежие данные компетенции с сервера
	try {
		const response = await fetch(`http://localhost:5217/api/competencies/${competency.id}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'accept': 'text/plain',
			},
		});
		
		if (response.ok) {
			const freshCompetency = await response.json();
			console.log('📥 Fresh competency data from server:', freshCompetency);
			
			// Используем свежие данные
			const groupId = competency.hierarchy?.id || '';
			const groupName = competency.hierarchy?.name || '';
			
			let blockId = '', blockName = '', categoryId = '', categoryName = '';
			
			for (const block of hierarchy) {
				if (block.type === 0 && block.children) {
					for (const category of block.children) {
						if (category.type === 1 && category.children) {
							for (const group of category.children) {
								if (group.type === 2 && group.id === groupId) {
									categoryId = category.id;
									categoryName = category.name;
									blockId = block.id;
									blockName = block.name;
									break;
								}
							}
						}
					}
				}
			}
			
			// Получаем уровни компетенции
			const levelsResponse = await fetch(`http://localhost:5217/api/proficiency-level-competencies/by-competency/${competency.id}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});
			
			let levelsData: CompetencyLevel[] = [];
			if (levelsResponse.ok) {
				const compLevels: ProficiencyLevelCompetency[] = await levelsResponse.json();
				levelsData = compLevels.map(plc => {
					const levelMaterials = materialLinks.filter(link => 
						link.competencyId === competency.id && link.targetLevelId === plc.proficiencyLevelId
					);
					return {
						id: plc.id,
						levelId: plc.proficiencyLevelId,
						levelName: plc.proficiencyLevel.name,
						levelValue: plc.proficiencyLevel.value,
						description: plc.description || '',
						example: plc.example || '',
						materialIds: levelMaterials.map(link => link.educationalMaterialId),
					};
				}).sort((a, b) => a.levelValue - b.levelValue);
			}
			
			const editingData: CompetencyData = {
				id: freshCompetency.id,
				name: freshCompetency.name || '',
				groupId: groupId,
				groupName: groupName,
				blockId: blockId,
				blockName: blockName,
				categoryId: categoryId,
				categoryName: categoryName,
				description: freshCompetency.description || '',
				defenseTasks: freshCompetency.defenseTasks || '',
				acceptanceCriteria: freshCompetency.admissionCriteria || '',
				article: freshCompetency.text || '',
				levels: levelsData,
			};
			
			console.log('✅ Editing data prepared:', editingData);
			setEditingCompetency(editingData);
			setIsFormOpen(true);
		} else {
			console.error('Failed to fetch fresh competency data');
			setError('Ошибка загрузки данных компетенции');
		}
	} catch (error) {
		console.error('Error fetching fresh competency:', error);
		setError('Ошибка загрузки данных компетенции');
	}
};

	const handleSubmitCompetency = async (competency: CompetencyData) => {
		let success = false;
		if (competency.id) success = await updateCompetency(competency.id, competency);
		else success = await createCompetency(competency);
		if (success) handleCloseForm();
	};

	const handleDeleteCompetency = (competencyId: string) => deleteCompetency(competencyId);
	const handleCloseForm = () => { setIsFormOpen(false); setEditingCompetency(null); };

	const getFormBlocks = () => {
		const convertToFormBlocks = (items: HierarchyItem[]): any[] => {
			return items.filter(item => item.type === 0).map(block => ({
				id: block.id, name: block.name,
				categories: (block.children || []).filter(child => child.type === 1).map(category => ({
					id: category.id, name: category.name,
					groups: (category.children || []).filter(group => group.type === 2).map(group => ({ id: group.id, name: group.name })),
				})),
			}));
		};
		return convertToFormBlocks(hierarchy);
	};

	const materialsForForm = materials.map(m => ({ id: m.id, name: m.name, type: m.type?.name || 'Материал' }));

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await fetchLevels();
			await fetchCompetencyHierarchy();
			await fetchCompetenciesData();
			await fetchMaterials();
			await fetchProficiencyLevelCompetencies();
			await fetchMaterialLinks();
			setIsLoading(false);
		};
		loadData();
	}, []);

	if (isLoading) return <div className={styles.page}><div className={styles.loading}>Загрузка компетенций...</div></div>;

	return (
		<div className={styles.page}>
			<div className={styles.header}><h1 className={styles.title}>Управление компетенциями</h1></div>
			<div className={styles.content}>
				{successMessage && <div className={styles.successMessage}>{successMessage}</div>}
				{error && <div className={styles.errorMessage}>{error}</div>}
				<div className={styles.toolbar}>
					<button className={styles.addBtn} onClick={handleAddCompetency}>+ Добавить компетенцию</button>
				</div>
				<CompetenciesMatrix
					editable onEdit={handleEditCompetency} onDelete={handleDeleteCompetency}
					competencies={competencies} competencyBlocks={getFormBlocks()}
					onRemoveMaterialFromLevel={async (linkId) => {
						const success = await detachMaterialFromCompetency(linkId);
						if (success) { await refreshData(); setSuccessMessage('Материал отвязан'); setTimeout(() => setSuccessMessage(null), 3000); }
					}}
					materialsByLevel={materialsByLevel}
				/>
			</div>
			<CompetencyForm
				isOpen={isFormOpen} onClose={handleCloseForm} onSubmit={handleSubmitCompetency}
				initialData={editingCompetency} mode={editingCompetency ? 'edit' : 'create'}
				competencyBlocks={getFormBlocks()} materials={materialsForForm} availableLevels={levels}
			/>
		</div>
	);
};

export default CompetenciesPage;