// category_manager.tsx - исправленный drag & drop (перемещение, а не копирование)

import React, { useState, useEffect } from 'react';
import styles from './category_manager.module.scss';

interface CompetencyHierarchy {
	id: string;
	name: string;
	type: number;
	parentId: string | null;
	sortingOrder: number;
}

interface CompetencyBlock {
	id: string;
	name: string;
	type: number;
	parentId: string | null;
	categories?: CompetencyBlock[];
	groups?: CompetencyBlock[];
	competencies?: CompetencyItem[];
}

interface CompetencyItem {
	id: string;
	name: string;
	description?: string;
	requiredLevel?: number;
	materials: MaterialItem[];
}

interface MaterialItem {
	id: string;
	name: string;
	typeName: string;
	url: string;
	targetLevelId?: string;
	targetLevelValue?: number;
	duration?: number;
	_linkId?: string;
	_isNew?: boolean;
}

interface MaterialFromApi {
	id: string;
	name: string;
	typeId: string;
	type: { id: string; name: string };
	link: string;
	duration: number;
	description?: string;
}

interface EducationalMaterialLink {
	id: string;
	competencyId: string;
	educationalMaterialId: string;
	targetLevelId?: string;
	targetLevel?: { id: string; name: string; value: number };
	educationalMaterial: MaterialFromApi;
}

interface Level {
	id: string;
	name: string;
	value: number;
}

const CategoryManager: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [hierarchy, setHierarchy] = useState<CompetencyBlock[]>([]);
	const [originalHierarchy, setOriginalHierarchy] = useState<CompetencyBlock[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [levels, setLevels] = useState<Level[]>([]);
	
	const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
	const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
	const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
	const [expandedCompetencies, setExpandedCompetencies] = useState<string[]>([]);
	const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showMaterialSelector, setShowMaterialSelector] = useState<{competencyId: string, targetLevelId: string, levelValue: number} | null>(null);
	const [showLevelSelector, setShowLevelSelector] = useState<{competencyId: string} | null>(null);
	const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
	const [selectedLevelId, setSelectedLevelId] = useState<string>('');
	const [showAddBlockModal, setShowAddBlockModal] = useState(false);
	const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
	const [showAddGroupModal, setShowAddGroupModal] = useState(false);
	const [newItemName, setNewItemName] = useState('');
	const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
	const [itemTypeToAdd, setItemTypeToAdd] = useState<'block' | 'category' | 'group'>('block');
	
	const [draggedItem, setDraggedItem] = useState<{
		type: 'material';
		item: MaterialItem;
		sourceCompetencyId?: string;
		sourceLevelId?: string;
	} | null>(null);

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
				console.log('Levels from API:', data);
				setLevels(data);
			}
		} catch (error) {
			console.error('Error fetching levels:', error);
		}
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
				const data: CompetencyHierarchy[] = await response.json();
				
				const buildTree = (items: CompetencyHierarchy[], parentId: string | null = null): CompetencyBlock[] => {
					return items
						.filter(item => item.parentId === parentId)
						.map(item => {
							const block: CompetencyBlock = {
								id: item.id,
								name: item.name,
								type: item.type,
								parentId: item.parentId,
							};
							
							if (item.type === 0) {
								block.categories = buildTree(items, item.id);
							} else if (item.type === 1) {
								block.groups = buildTree(items, item.id);
							} else if (item.type === 2) {
								block.competencies = [];
							}
							
							return block;
						})
						.sort((a, b) => (a.sortingOrder || 0) - (b.sortingOrder || 0));
				};
				
				const tree = buildTree(data);
				return tree;
			}
		} catch (error) {
			console.error('Error fetching competency hierarchy:', error);
			setError('Ошибка загрузки иерархии компетенций');
		}
		return [];
	};

	// Получение компетенций для конкретной группы
	const fetchCompetenciesForGroup = async (groupId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/competencies?hierarchyId=${groupId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				const comps: CompetencyItem[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					data.blocks.forEach((block: any) => {
						block.categories?.forEach((cat: any) => {
							cat.groups?.forEach((group: any) => {
								if (group.id === groupId) {
									group.competencies?.forEach((comp: any) => {
										comps.push({
											id: comp.id,
											name: comp.name,
											description: comp.description,
											requiredLevel: comp.requiredLevel,
											materials: [],
										});
									});
								}
							});
						});
					});
				}
				return comps;
			}
		} catch (error) {
			console.error(`Error fetching competencies for group ${groupId}:`, error);
		}
		return [];
	};

	// Рекурсивная загрузка компетенций для всех групп
	const loadCompetenciesForHierarchy = async (items: CompetencyBlock[]): Promise<CompetencyBlock[]> => {
		for (const item of items) {
			if (item.type === 2) {
				const comps = await fetchCompetenciesForGroup(item.id);
				item.competencies = comps;
			}
			if (item.categories) {
				await loadCompetenciesForHierarchy(item.categories);
			}
			if (item.groups) {
				await loadCompetenciesForHierarchy(item.groups);
			}
		}
		return items;
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

	// Загрузка материалов для компетенций из API
	const loadCompetencyMaterials = async (items: CompetencyBlock[]) => {
		for (const item of items) {
			if (item.type === 2 && item.competencies) {
				for (const competency of item.competencies) {
					try {
						const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competency.id}`, {
							method: 'GET',
							headers: {
								'Authorization': `Bearer ${accessToken}`,
								'accept': 'text/plain',
							},
						});

						if (response.ok) {
							const links: EducationalMaterialLink[] = await response.json();
							
							competency.materials = links.map(link => ({
								id: link.educationalMaterial.id,
								name: link.educationalMaterial.name,
								typeName: link.educationalMaterial.type?.name || 'unknown',
								url: link.educationalMaterial.link,
								targetLevelId: link.targetLevelId,
								targetLevelValue: link.targetLevel?.value,
								duration: link.educationalMaterial.duration,
								_linkId: link.id,
							}));
						}
					} catch (error) {
						console.error(`Error loading materials for competency ${competency.id}:`, error);
					}
				}
			}
			if (item.categories) {
				await loadCompetencyMaterials(item.categories);
			}
			if (item.groups) {
				await loadCompetencyMaterials(item.groups);
			}
		}
	};

	// Получение названия уровня по ID
	const getLevelNameById = (levelId?: string): string => {
		if (!levelId) return 'Без уровня';
		const level = levels.find(l => l.id === levelId);
		return level?.name || 'Неизвестный уровень';
	};

	// Получение уровня по ID
	const getLevelById = (levelId?: string): Level | undefined => {
		if (!levelId) return undefined;
		return levels.find(l => l.id === levelId);
	};

	// Группировка материалов по targetLevelId
	const groupMaterialsByLevel = (materials: MaterialItem[]) => {
		const grouped = new Map<string, MaterialItem[]>();
		
		materials.forEach(material => {
			const levelId = material.targetLevelId || 'no-level';
			if (!grouped.has(levelId)) {
				grouped.set(levelId, []);
			}
			grouped.get(levelId)!.push(material);
		});
		
		return grouped;
	};

	// Добавление нового уровня к компетенции
	const handleAddLevelToCompetency = (competencyId: string, levelId: string) => {
		const selectedLevel = getLevelById(levelId);
		if (!selectedLevel) return;

		const addLevelToCompetency = (items: CompetencyBlock[]): boolean => {
			for (const item of items) {
				if (item.type === 2 && item.competencies) {
					const compIndex = item.competencies.findIndex(c => c.id === competencyId);
					if (compIndex !== -1) {
						// Проверяем, есть ли уже такой уровень
						const hasLevel = item.competencies[compIndex].materials.some(
							m => m.targetLevelId === levelId
						);
						
						if (!hasLevel) {
							// Добавляем пустую секцию для уровня
							item.competencies[compIndex].materials.push({
								id: 'temp',
								name: `Новый уровень: ${selectedLevel.name}`,
								typeName: 'placeholder',
								url: '',
								targetLevelId: levelId,
								targetLevelValue: selectedLevel.value,
								_isNew: true,
							} as MaterialItem);
						}
						return true;
					}
				}
				if (item.categories && addLevelToCompetency(item.categories)) return true;
				if (item.groups && addLevelToCompetency(item.groups)) return true;
			}
			return false;
		};
		
		const newHierarchy = JSON.parse(JSON.stringify(hierarchy));
		addLevelToCompetency(newHierarchy);
		setHierarchy(newHierarchy);
		
		setSuccessMessage(`Добавлен уровень "${selectedLevel.name}" для компетенции`);
		setTimeout(() => setSuccessMessage(null), 3000);
	};

	// Сохранение всех изменений
	const handleSaveChanges = async () => {
		setIsSaving(true);
		setError(null);
		
		try {
			const removedLinks: string[] = [];
			const addedLinks: Array<{competencyId: string, materialId: string, targetLevelId: string}> = [];
			
			const compareHierarchy = (current: CompetencyBlock[], original: CompetencyBlock[]) => {
				for (let i = 0; i < current.length; i++) {
					const currentItem = current[i];
					const originalItem = original[i];
					
					if (currentItem.type === 2 && currentItem.competencies) {
						let originalComps: CompetencyItem[] = [];
						if (originalItem && originalItem.competencies) {
							originalComps = originalItem.competencies;
						}
						
						for (const currentComp of currentItem.competencies) {
							const originalComp = originalComps.find(c => c.id === currentComp.id);
							
							if (originalComp) {
								for (const originalMaterial of originalComp.materials) {
									const stillExists = currentComp.materials.some((m: MaterialItem) => 
										m.id === originalMaterial.id && m.targetLevelId === originalMaterial.targetLevelId
									);
									if (!stillExists && originalMaterial._linkId) {
										removedLinks.push(originalMaterial._linkId);
									}
								}
							}
							
							for (const currentMaterial of currentComp.materials) {
								if (currentMaterial._isNew && currentMaterial.targetLevelId && currentMaterial.id !== 'temp') {
									addedLinks.push({
										competencyId: currentComp.id,
										materialId: currentMaterial.id,
										targetLevelId: currentMaterial.targetLevelId
									});
								}
							}
						}
					}
					
					if (currentItem.categories) {
						compareHierarchy(currentItem.categories, originalItem?.categories || []);
					}
					if (currentItem.groups) {
						compareHierarchy(currentItem.groups, originalItem?.groups || []);
					}
				}
			};
			
			compareHierarchy(hierarchy, originalHierarchy);
			
			for (const linkId of removedLinks) {
				await fetch(`http://localhost:5217/api/educational-material-competencies/${linkId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
					},
				});
			}
			
			for (const addition of addedLinks) {
				await fetch('http://localhost:5217/api/educational-material-competencies', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						competencyId: addition.competencyId,
						educationalMaterialId: addition.materialId,
						targetLevelId: addition.targetLevelId,
					}),
				});
			}
			
			// Удаляем временные материалы
			const removeTempMaterials = (items: CompetencyBlock[]) => {
				for (const item of items) {
					if (item.type === 2 && item.competencies) {
						for (const comp of item.competencies) {
							comp.materials = comp.materials.filter(m => m.id !== 'temp');
						}
					}
					if (item.categories) removeTempMaterials(item.categories);
					if (item.groups) removeTempMaterials(item.groups);
				}
			};
			removeTempMaterials(hierarchy);
			
			setOriginalHierarchy(JSON.parse(JSON.stringify(hierarchy)));
			
			// Обновляем материалы
			await loadCompetencyMaterials(hierarchy);
			
			setSuccessMessage('Изменения успешно сохранены');
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (error) {
			console.error('Error saving changes:', error);
			setError('Ошибка при сохранении изменений');
		} finally {
			setIsSaving(false);
		}
	};

	// Drag handlers
	const handleDragStart = (item: MaterialItem, sourceCompetencyId?: string, sourceLevelId?: string) => {
		if (item.id === 'temp') return; // Нельзя перетаскивать временные материалы
		setDraggedItem({ type: 'material', item, sourceCompetencyId, sourceLevelId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	// ИСПРАВЛЕННЫЙ handleDrop - материал ПЕРЕМЕЩАЕТСЯ, а не копируется
	const handleDrop = (targetCompetencyId: string, targetLevelId: string) => {
		if (!draggedItem || draggedItem.item.id === 'temp') return;
		
		const moveMaterialToCompetency = (items: CompetencyBlock[]): boolean => {
			for (const item of items) {
				if (item.type === 2 && item.competencies) {
					const targetComp = item.competencies.find(c => c.id === targetCompetencyId);
					if (targetComp) {
						// Проверяем, есть ли уже такой материал на целевом уровне
						const exists = targetComp.materials.some(m => 
							m.id === draggedItem.item.id && m.targetLevelId === targetLevelId
						);
						
						if (!exists) {
							// Добавляем материал в целевую компетенцию
							targetComp.materials.push({
								...draggedItem.item,
								targetLevelId: targetLevelId,
								targetLevelValue: getLevelById(targetLevelId)?.value,
								_isNew: true, // Помечаем как новый для сохранения
								_linkId: undefined,
							});
						}
						
						// УДАЛЯЕМ материал из исходной компетенции (ПЕРЕМЕЩЕНИЕ, а не копирование)
						if (draggedItem.sourceCompetencyId && draggedItem.sourceCompetencyId !== targetCompetencyId) {
							const sourceComp = item.competencies.find(c => c.id === draggedItem.sourceCompetencyId);
							if (sourceComp) {
								// Удаляем только если это тот же самый материал и тот же уровень
								sourceComp.materials = sourceComp.materials.filter(m => 
									!(m.id === draggedItem.item.id && m.targetLevelId === draggedItem.sourceLevelId)
								);
							}
						}
						return true;
					}
				}
				if (item.categories && moveMaterialToCompetency(item.categories)) return true;
				if (item.groups && moveMaterialToCompetency(item.groups)) return true;
			}
			return false;
		};
		
		const newHierarchy = JSON.parse(JSON.stringify(hierarchy));
		moveMaterialToCompetency(newHierarchy);
		setHierarchy(newHierarchy);
		
		setDraggedItem(null);
		setSuccessMessage(`Материал перемещен на уровень ${getLevelNameById(targetLevelId)}`);
		setTimeout(() => setSuccessMessage(null), 2000);
	};

	const handleAddMaterialClick = (competencyId: string, targetLevelId: string, levelValue: number) => {
		setShowMaterialSelector({ competencyId, targetLevelId, levelValue });
		setSelectedMaterialId('');
	};

	const handleConfirmAddMaterial = async () => {
		if (showMaterialSelector && selectedMaterialId) {
			const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
			
			if (selectedMaterial) {
				const addMaterial = (items: CompetencyBlock[]): boolean => {
					for (const item of items) {
						if (item.type === 2 && item.competencies) {
							const compIndex = item.competencies.findIndex(c => c.id === showMaterialSelector.competencyId);
							if (compIndex !== -1) {
								const exists = item.competencies[compIndex].materials.some(
									m => m.id === selectedMaterial.id && m.targetLevelId === showMaterialSelector.targetLevelId
								);
								if (!exists) {
									item.competencies[compIndex].materials.push({
										id: selectedMaterial.id,
										name: selectedMaterial.name,
										typeName: selectedMaterial.type?.name || 'unknown',
										url: selectedMaterial.link,
										targetLevelId: showMaterialSelector.targetLevelId,
										targetLevelValue: showMaterialSelector.levelValue,
										duration: selectedMaterial.duration,
										_isNew: true,
									});
								}
								return true;
							}
						}
						if (item.categories && addMaterial(item.categories)) return true;
						if (item.groups && addMaterial(item.groups)) return true;
					}
					return false;
				};
				
				const newHierarchy = JSON.parse(JSON.stringify(hierarchy));
				addMaterial(newHierarchy);
				setHierarchy(newHierarchy);
				
				setSuccessMessage(`Материал добавлен для уровня ${getLevelNameById(showMaterialSelector.targetLevelId)}`);
				setTimeout(() => setSuccessMessage(null), 3000);
			}
			
			setShowMaterialSelector(null);
		}
	};

	const handleRemoveMaterial = (competencyId: string, materialId: string, targetLevelId?: string) => {
		if (materialId === 'temp') return;
		
		const removeMaterial = (items: CompetencyBlock[]): boolean => {
			for (const item of items) {
				if (item.type === 2 && item.competencies) {
					const compIndex = item.competencies.findIndex(c => c.id === competencyId);
					if (compIndex !== -1) {
						item.competencies[compIndex].materials = item.competencies[compIndex].materials.filter(
							m => !(m.id === materialId && m.targetLevelId === targetLevelId)
						);
						return true;
					}
				}
				if (item.categories && removeMaterial(item.categories)) return true;
				if (item.groups && removeMaterial(item.groups)) return true;
			}
			return false;
		};
		
		const newHierarchy = JSON.parse(JSON.stringify(hierarchy));
		removeMaterial(newHierarchy);
		setHierarchy(newHierarchy);
	};

	const toggleBlockExpand = (blockId: string) => {
		setExpandedBlocks((prev) =>
			prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]
		);
	};

	const toggleCategoryExpand = (categoryId: string) => {
		setExpandedCategories((prev) =>
			prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
		);
	};

	const toggleGroupExpand = (groupId: string) => {
		setExpandedGroups((prev) =>
			prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
		);
	};

	const toggleCompetencyExpand = (competencyId: string) => {
		setExpandedCompetencies((prev) =>
			prev.includes(competencyId) ? prev.filter((id) => id !== competencyId) : [...prev, competencyId]
		);
	};

	const toggleLevelExpand = (levelKey: string) => {
		setExpandedLevels((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(levelKey)) {
				newSet.delete(levelKey);
			} else {
				newSet.add(levelKey);
			}
			return newSet;
		});
	};

	const getLevelColor = (levelId?: string): string => {
		const level = getLevelById(levelId);
		const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];
		return colors[(level?.value || 1) - 1] || '#9e9e9e';
	};

	const getLevelIcon = (levelId?: string): string => {
		const level = getLevelById(levelId);
		const icons = ['🌱', '⭐', '🏆', '🚀', '👑'];
		return icons[(level?.value || 1) - 1] || '📚';
	};

	const getTypeIcon = (typeName: string) => {
		const icons: Record<string, string> = {
			video: '🎥',
			article: '📄',
			book: '📚',
			course: '🎓',
		};
		return icons[typeName.toLowerCase()] || '📁';
	};

	const openAddCategoryModal = (parentId: string) => {
		setSelectedParentId(parentId);
		setItemTypeToAdd('category');
		setNewItemName('');
		setShowAddCategoryModal(true);
	};

	const openAddGroupModal = (parentId: string) => {
		setSelectedParentId(parentId);
		setItemTypeToAdd('group');
		setNewItemName('');
		setShowAddGroupModal(true);
	};

	const handleAddItem = async () => {
		if (!newItemName.trim()) {
			setError('Введите название');
			return;
		}

		const type = itemTypeToAdd === 'block' ? 0 : (itemTypeToAdd === 'category' ? 1 : 2);
		
		try {
			const response = await fetch('http://localhost:5217/api/competency-hierarchy', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: newItemName,
					type: type,
					parentId: selectedParentId,
					sortingOrder: 0,
				}),
			});

			if (response.ok) {
				const newItem = await response.json();
				
				const updateHierarchy = (items: CompetencyBlock[]): CompetencyBlock[] => {
					if (selectedParentId === null && type === 0) {
						return [...items, {
							id: newItem.id,
							name: newItem.name,
							type: type,
							parentId: null,
							categories: type === 0 ? [] : undefined,
							groups: type === 1 ? [] : undefined,
							competencies: type === 2 ? [] : undefined,
						}];
					}
					
					return items.map(item => {
						if (item.id === selectedParentId) {
							if (item.type === 0 && type === 1) {
								return {
									...item,
									categories: [...(item.categories || []), {
										id: newItem.id,
										name: newItem.name,
										type: 1,
										parentId: selectedParentId,
										groups: [],
									}]
								};
							}
							if (item.type === 1 && type === 2) {
								return {
									...item,
									groups: [...(item.groups || []), {
										id: newItem.id,
										name: newItem.name,
										type: 2,
										parentId: selectedParentId,
										competencies: [],
									}]
								};
							}
						}
						if (item.categories) {
							item.categories = updateHierarchy(item.categories);
						}
						if (item.groups) {
							item.groups = updateHierarchy(item.groups);
						}
						return item;
					});
				};
				
				setHierarchy(updateHierarchy(hierarchy));
				setSuccessMessage(`${itemTypeToAdd === 'block' ? 'Блок' : itemTypeToAdd === 'category' ? 'Категория' : 'Группа'} успешно добавлен${itemTypeToAdd === 'category' || itemTypeToAdd === 'group' ? 'а' : ''}`);
				setShowAddBlockModal(false);
				setShowAddCategoryModal(false);
				setShowAddGroupModal(false);
				setNewItemName('');
				setSelectedParentId(null);
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				const errorText = await response.text();
				setError(`Ошибка: ${errorText}`);
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error adding item:', error);
			setError('Ошибка при добавлении');
			setTimeout(() => setError(null), 3000);
		}
	};

	const renderHierarchy = (items: CompetencyBlock[]) => {
		return items.map(item => {
			if (item.type === 0) {
				const isExpanded = expandedBlocks.includes(item.id);
				return (
					<div key={item.id} className={styles.block}>
						<div className={styles.blockHeader} onClick={() => toggleBlockExpand(item.id)}>
							<div className={styles.blockTitle}>
								<span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
								<h4>{item.name}</h4>
							</div>
							<div className={styles.blockActions}>
								<button
									className={styles.iconBtn}
									onClick={(e) => {
										e.stopPropagation();
										openAddCategoryModal(item.id);
									}}
									title="Добавить категорию">
									+
								</button>
							</div>
						</div>
						{isExpanded && item.categories && (
							<div className={styles.blockContent}>
								{renderHierarchy(item.categories)}
							</div>
						)}
					</div>
				);
			} else if (item.type === 1) {
				const isExpanded = expandedCategories.includes(item.id);
				return (
					<div key={item.id} className={styles.category}>
						<div 
							className={styles.categoryHeader} 
							onClick={() => toggleCategoryExpand(item.id)}
						>
							<div className={styles.categoryTitle}>
								<span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
								<h5>{item.name}</h5>
							</div>
							<div className={styles.categoryActions}>
								<button
									className={styles.iconBtn}
									onClick={(e) => {
										e.stopPropagation();
										openAddGroupModal(item.id);
									}}
									title="Добавить группу">
									+
								</button>
							</div>
						</div>
						{isExpanded && item.groups && (
							<div className={styles.categoryContent}>
								{renderHierarchy(item.groups)}
							</div>
						)}
					</div>
				);
			} else if (item.type === 2) {
				const isExpanded = expandedGroups.includes(item.id);
				const competenciesList = item.competencies || [];
				
				return (
					<div key={item.id} className={styles.group}>
						<div 
							className={styles.groupHeader} 
							onClick={() => toggleGroupExpand(item.id)}
						>
							<div className={styles.groupTitle}>
								<span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
								<h6>{item.name}</h6>
								<span className={styles.competencyCount}>
									({competenciesList.length})
								</span>
							</div>
						</div>
						{isExpanded && (
							<div className={styles.groupContent}>
								{competenciesList.length === 0 ? (
									<div className={styles.emptyGroup}>
										<p>Нет компетенций в этой группе</p>
									</div>
								) : (
									competenciesList.map(comp => {
										const isCompExpanded = expandedCompetencies.includes(comp.id);
										
										const groupedMaterials = groupMaterialsByLevel(comp.materials);
										const existingLevelIds = Array.from(groupedMaterials.keys());
										const availableLevels = levels.filter(level => !existingLevelIds.includes(level.id));
										
										return (
											<div key={comp.id} className={styles.competencyContainer}>
												<div className={styles.competencyHeader}>
													<div
														className={styles.competencyTitle}
														onClick={() => toggleCompetencyExpand(comp.id)}>
														<span className={styles.expandIcon}>
															{isCompExpanded ? '▼' : '▶'}
														</span>
														<span className={styles.competencyName}>
															{comp.name}
														</span>
													</div>
													{availableLevels.length > 0 && (
														<button
															className={styles.addLevelBtn}
															onClick={(e) => {
																e.stopPropagation();
																setShowLevelSelector({ competencyId: comp.id });
																setSelectedLevelId('');
															}}
															title="Добавить уровень">
															+ Добавить уровень
														</button>
													)}
												</div>

												{isCompExpanded && (
													<div className={styles.materialsByLevel}>
														{Array.from(groupedMaterials.entries()).map(([levelId, levelMaterials]) => {
															const level = getLevelById(levelId);
															const levelKey = `${comp.id}_level_${levelId}`;
															const isLevelExpanded = expandedLevels.has(levelKey);
															
															return (
																<div key={levelId} className={styles.levelSection}>
																	<div 
																		className={styles.levelHeader}
																		style={{ borderLeftColor: getLevelColor(levelId) }}
																		onClick={() => toggleLevelExpand(levelKey)}>
																		<div className={styles.levelTitle}>
																			<span className={styles.levelIcon}>{getLevelIcon(levelId)}</span>
																			<span className={styles.levelName}>
																				{level?.name || 'Без уровня'}
																			</span>
																			<span className={styles.materialCount}>
																				({levelMaterials.filter(m => m.id !== 'temp').length} материалов)
																			</span>
																		</div>
																		<div className={styles.levelActions} onClick={(e) => e.stopPropagation()}>
																			<button
																				className={styles.addMaterialBtn}
																				onClick={() => handleAddMaterialClick(comp.id, levelId, level?.value || 0)}>
																				+ Добавить материал
																			</button>
																			<span className={styles.expandIcon}>
																				{isLevelExpanded ? '▲' : '▼'}
																			</span>
																		</div>
																	</div>
																	
																	{isLevelExpanded && (
																		<div 
																			className={styles.materialsList}
																			onDragOver={handleDragOver}
																			onDrop={(e) => {
																				e.preventDefault();
																				handleDrop(comp.id, levelId);
																			}}>
																			{levelMaterials.filter(m => m.id !== 'temp').length === 0 ? (
																				<div className={styles.emptyMaterials}>
																					<p>Нет материалов для этого уровня</p>
																					<small>Перетащите материалы из других компетенций или нажмите "+ Добавить материал"</small>
																				</div>
																			) : (
																				levelMaterials.filter(m => m.id !== 'temp').map((material) => (
																					<div
																						key={material._linkId || `${material.id}_${material.targetLevelId}`}
																						className={styles.materialCard}
																						draggable
																						onDragStart={() => handleDragStart(material, comp.id, levelId)}>
																						<div className={styles.materialHeader}>
																							<span className={styles.materialName}>
																								{getTypeIcon(material.typeName)} {material.name}
																							</span>
																							<div className={styles.materialActions}>
																								<button
																									className={styles.removeMaterialBtn}
																									onClick={() => handleRemoveMaterial(comp.id, material.id, material.targetLevelId)}
																									title='Удалить из компетенции'>
																									🗑️
																								</button>
																							</div>
																						</div>
																						<div className={styles.materialMeta}>
																							<span className={styles.materialUrl}>
																								<a href={material.url} target='_blank' rel='noopener noreferrer'>
																									{material.url.length > 50 ? material.url.substring(0, 50) + '...' : material.url}
																								</a>
																							</span>
																							{material.duration && (
																								<span className={styles.duration}>⏱️ {material.duration} мин</span>
																							)}
																						</div>
																						{material._isNew && (
																							<div className={styles.newMaterialBadge}>Новый</div>
																						)}
																					</div>
																				))
																			)}
																		</div>
																	)}
																</div>
															);
														})}
													</div>
												)}
											</div>
										);
									})
								)}
							</div>
						)}
					</div>
				);
			}
			return null;
		});
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await fetchLevels();
			await fetchMaterials();
			const hierarchyData = await fetchCompetencyHierarchy();
			const hierarchyWithComps = await loadCompetenciesForHierarchy(hierarchyData);
			await loadCompetencyMaterials(hierarchyWithComps);
			
			setHierarchy(hierarchyWithComps);
			setOriginalHierarchy(JSON.parse(JSON.stringify(hierarchyWithComps)));
			setIsLoading(false);
		};
		loadData();
	}, []);

	if (isLoading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>Загрузка компетенций...</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			{successMessage && (
				<div className={styles.successMessage}>{successMessage}</div>
			)}
			{error && (
				<div className={styles.errorMessage}>{error}</div>
			)}

			<div className={styles.header}>
				<h3>Управление компетенциями и материалами</h3>
				<div className={styles.headerButtons}>
					<button 
						className={styles.addBlockBtn}
						onClick={() => {
							setItemTypeToAdd('block');
							setSelectedParentId(null);
							setNewItemName('');
							setShowAddBlockModal(true);
						}}>
						+ Добавить блок
					</button>
					<button 
						className={styles.saveBtn} 
						onClick={handleSaveChanges}
						disabled={isSaving}>
						{isSaving ? 'Сохранение...' : '💾 Сохранить изменения'}
					</button>
				</div>
			</div>

			<div className={styles.blocksList}>
				{renderHierarchy(hierarchy)}
			</div>

			{/* Модальное окно выбора уровня */}
			{showLevelSelector && (
				<div className={styles.modal} onClick={() => setShowLevelSelector(null)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Добавить уровень к компетенции</h3>
						<div className={styles.formGroup}>
							<label>Выберите уровень</label>
							<select
								value={selectedLevelId}
								onChange={(e) => setSelectedLevelId(e.target.value)}>
								<option value=''>Выберите уровень</option>
								{levels
									.filter(level => {
										const competency = hierarchy
											.flatMap(b => b.categories || [])
											.flatMap(c => c.groups || [])
											.flatMap(g => g.competencies || [])
											.find(c => c.id === showLevelSelector.competencyId);
										const hasLevel = competency?.materials.some(m => m.targetLevelId === level.id);
										return !hasLevel;
									})
									.map(level => (
										<option key={level.id} value={level.id}>
											{level.name}
										</option>
									))}
							</select>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowLevelSelector(null)}>Отмена</button>
							<button 
								onClick={() => {
									if (selectedLevelId && showLevelSelector) {
										handleAddLevelToCompetency(showLevelSelector.competencyId, selectedLevelId);
										setShowLevelSelector(null);
									}
								}}
								disabled={!selectedLevelId}>
								Добавить
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Модальное окно добавления материала */}
			{showMaterialSelector && (
				<div className={styles.modal} onClick={() => setShowMaterialSelector(null)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Добавить материал к компетенции</h3>
						<div className={styles.formGroup}>
							<label>Уровень</label>
							<input
								type="text"
								value={getLevelNameById(showMaterialSelector.targetLevelId)}
								disabled
								className={styles.disabledInput}
							/>
						</div>
						<div className={styles.formGroup}>
							<label>Материал</label>
							<select
								value={selectedMaterialId}
								onChange={(e) => setSelectedMaterialId(e.target.value)}>
								<option value=''>Выберите материал</option>
								{materials.map(m => (
									<option key={m.id} value={m.id}>
										{m.name} ({m.type?.name})
									</option>
								))}
							</select>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowMaterialSelector(null)}>Отмена</button>
							<button onClick={handleConfirmAddMaterial} disabled={!selectedMaterialId}>
								Добавить
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Модальные окна для добавления блоков/категорий/групп */}
			{showAddBlockModal && (
				<div className={styles.modal} onClick={() => setShowAddBlockModal(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Добавить новый блок</h3>
						<div className={styles.formGroup}>
							<label>Название блока</label>
							<input
								type="text"
								value={newItemName}
								onChange={(e) => setNewItemName(e.target.value)}
								placeholder="Введите название блока"
								autoFocus
							/>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddBlockModal(false)}>Отмена</button>
							<button onClick={handleAddItem}>Добавить</button>
						</div>
					</div>
				</div>
			)}

			{showAddCategoryModal && (
				<div className={styles.modal} onClick={() => setShowAddCategoryModal(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Добавить новую категорию</h3>
						<div className={styles.formGroup}>
							<label>Название категории</label>
							<input
								type="text"
								value={newItemName}
								onChange={(e) => setNewItemName(e.target.value)}
								placeholder="Введите название категории"
								autoFocus
							/>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddCategoryModal(false)}>Отмена</button>
							<button onClick={handleAddItem}>Добавить</button>
						</div>
					</div>
				</div>
			)}

			{showAddGroupModal && (
				<div className={styles.modal} onClick={() => setShowAddGroupModal(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Добавить новую группу</h3>
						<div className={styles.formGroup}>
							<label>Название группы</label>
							<input
								type="text"
								value={newItemName}
								onChange={(e) => setNewItemName(e.target.value)}
								placeholder="Введите название группы"
								autoFocus
							/>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowAddGroupModal(false)}>Отмена</button>
							<button onClick={handleAddItem}>Добавить</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CategoryManager;