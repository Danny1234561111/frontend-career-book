// category_manager.module.tsx
import React, { useState, useEffect } from 'react';
import styles from './category_manager.module.scss';

interface CompetencyHierarchy {
	id: string;
	name: string;
	type: number; // 0 - блок, 1 - категория, 2 - группа
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
	targetLevel?: number;
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

const CategoryManager: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [hierarchy, setHierarchy] = useState<CompetencyBlock[]>([]);
	const [originalHierarchy, setOriginalHierarchy] = useState<CompetencyBlock[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
	const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
	const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
	const [expandedCompetencies, setExpandedCompetencies] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showMaterialSelector, setShowMaterialSelector] = useState<{competencyId: string} | null>(null);
	const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
	const [selectedTargetLevel, setSelectedTargetLevel] = useState<string>('');
	const [levels, setLevels] = useState<Array<{id: string; name: string; value: number}>>([]);
	const [showAddBlockModal, setShowAddBlockModal] = useState(false);
	const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
	const [showAddGroupModal, setShowAddGroupModal] = useState(false);
	const [newItemName, setNewItemName] = useState('');
	const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
	const [itemTypeToAdd, setItemTypeToAdd] = useState<'block' | 'category' | 'group'>('block');
	
	const [draggedItem, setDraggedItem] = useState<{
		type: 'material';
		item: MaterialItem;
		sourceBlockId: string;
		sourceCompetencyId?: string;
	} | null>(null);

	// Нормализация уровней
	const normalizeLevels = (levelsData: any[]): Array<{id: string; name: string; value: number}> => {
		const levelValueMap: { [key: string]: number } = {
			'BasicKnowledge': 1,
			'Professional': 2,
			'Expert': 3,
			'1': 1,
			'2': 2,
			'3': 3,
		};
		
		return levelsData.map(level => {
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
			};
		});
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
				const normalizedLevels = normalizeLevels(data);
				console.log('Normalized levels:', normalizedLevels);
				setLevels(normalizedLevels);
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
				
				// Построение дерева
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
						.sort((a, b) => a.sortingOrder - b.sortingOrder);
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

	// Получение компетенций для конкретной группы (type: 2)
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

	// Получение связей материалов с компетенциями
	const fetchAllMaterialLinks = async () => {
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
				return data;
			}
		} catch (error) {
			console.error('Error fetching material links:', error);
		}
		return [];
	};

	// Загрузка всех материалов для компетенций
	const loadAllCompetencyMaterials = async (items: CompetencyBlock[], links: EducationalMaterialLink[]) => {
		for (const item of items) {
			if (item.type === 2 && item.competencies) {
				for (const competency of item.competencies) {
					const competencyLinks = links.filter(l => l.competencyId === competency.id);
					competency.materials = competencyLinks.map(link => ({
						id: link.educationalMaterial.id,
						name: link.educationalMaterial.name,
						typeName: link.educationalMaterial.type?.name || 'unknown',
						url: link.educationalMaterial.link,
						targetLevel: link.targetLevel?.value,
						duration: link.educationalMaterial.duration,
						_linkId: link.id,
					}));
				}
			}
			if (item.categories) {
				await loadAllCompetencyMaterials(item.categories, links);
			}
			if (item.groups) {
				await loadAllCompetencyMaterials(item.groups, links);
			}
		}
	};

	// Добавление нового блока, категории или группы
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
				
				// Обновляем иерархию
				const updateHierarchy = (items: CompetencyBlock[]): CompetencyBlock[] => {
					if (selectedParentId === null && type === 0) {
						// Добавляем в корень (блок)
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
										m.id === originalMaterial.id && m._linkId === originalMaterial._linkId
									);
									if (!stillExists && originalMaterial._linkId) {
										removedLinks.push(originalMaterial._linkId);
									}
								}
							}
							
							for (const currentMaterial of currentComp.materials) {
								if (currentMaterial._isNew) {
									console.log('Processing new material:', {
										materialId: currentMaterial.id,
										targetLevel: currentMaterial.targetLevel,
										availableLevels: levels
									});
									
									const levelId = levels.find(l => l.value === currentMaterial.targetLevel)?.id;
									console.log('Found levelId:', levelId);
									
									if (levelId) {
										addedLinks.push({
											competencyId: currentComp.id,
											materialId: currentMaterial.id,
											targetLevelId: levelId
										});
									} else {
										console.error(`Level with value ${currentMaterial.targetLevel} not found`);
									}
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
			
			console.log('Removed links:', removedLinks);
			console.log('Added links:', addedLinks);
			
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
			
			setOriginalHierarchy(JSON.parse(JSON.stringify(hierarchy)));
			
			const removeFlags = (items: CompetencyBlock[]) => {
				for (const item of items) {
					if (item.type === 2 && item.competencies) {
						for (const comp of item.competencies) {
							for (const material of comp.materials) {
								delete material._isNew;
							}
						}
					}
					if (item.categories) removeFlags(item.categories);
					if (item.groups) removeFlags(item.groups);
				}
			};
			removeFlags(hierarchy);
			
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
	const handleDragStart = (item: MaterialItem, sourceCompetencyId?: string) => {
		setDraggedItem({ type: 'material', item, sourceBlockId: '', sourceCompetencyId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (targetGroupId: string, targetCompetencyId: string) => {
		if (!draggedItem) return;
		
		const addMaterialToCompetency = (items: CompetencyBlock[]): boolean => {
			for (const item of items) {
				if (item.id === targetGroupId && item.type === 2 && item.competencies) {
					const targetComp = item.competencies.find(c => c.id === targetCompetencyId);
					if (targetComp) {
						const exists = targetComp.materials.some(m => m.id === draggedItem.item.id);
						if (!exists) {
							targetComp.materials.push({
								...draggedItem.item,
								_isNew: true,
								_linkId: undefined,
							});
						}
					}
					return true;
				}
				if (item.categories && addMaterialToCompetency(item.categories)) return true;
				if (item.groups && addMaterialToCompetency(item.groups)) return true;
			}
			return false;
		};
		
		const newHierarchy = JSON.parse(JSON.stringify(hierarchy));
		addMaterialToCompetency(newHierarchy);
		setHierarchy(newHierarchy);
		
		setDraggedItem(null);
		setSuccessMessage('Материал скопирован в компетенцию');
		setTimeout(() => setSuccessMessage(null), 2000);
	};

	const handleAddMaterialClick = (competencyId: string) => {
		setShowMaterialSelector({ competencyId });
		setSelectedMaterialId('');
		setSelectedTargetLevel('');
	};

	const handleConfirmAddMaterial = async () => {
		if (showMaterialSelector && selectedMaterialId && selectedTargetLevel) {
			const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
			const targetLevel = levels.find(l => l.id === selectedTargetLevel);
			
			if (selectedMaterial && targetLevel) {
				const addMaterial = (items: CompetencyBlock[]): boolean => {
					for (const item of items) {
						if (item.type === 2 && item.competencies) {
							const compIndex = item.competencies.findIndex(c => c.id === showMaterialSelector.competencyId);
							if (compIndex !== -1) {
								const exists = item.competencies[compIndex].materials.some(m => m.id === selectedMaterial.id);
								if (!exists) {
									item.competencies[compIndex].materials.push({
										id: selectedMaterial.id,
										name: selectedMaterial.name,
										typeName: selectedMaterial.type?.name || 'unknown',
										url: selectedMaterial.link,
										targetLevel: targetLevel.value,
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
				
				setSuccessMessage('Материал добавлен');
				setTimeout(() => setSuccessMessage(null), 3000);
			}
			
			setShowMaterialSelector(null);
		}
	};

	const handleRemoveMaterial = (competencyId: string, materialId: string) => {
		const removeMaterial = (items: CompetencyBlock[]): boolean => {
			for (const item of items) {
				if (item.type === 2 && item.competencies) {
					const compIndex = item.competencies.findIndex(c => c.id === competencyId);
					if (compIndex !== -1) {
						item.competencies[compIndex].materials = item.competencies[compIndex].materials.filter(
							m => m.id !== materialId
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

	const getLevelLabel = (level?: number) => {
		if (!level) return 'Не указан';
		const foundLevel = levels.find(l => l.value === level);
		return foundLevel?.name || `Уровень ${level}`;
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
									competenciesList.map(comp => (
										<div
											key={comp.id}
											className={styles.competencyContainer}
											onDragOver={handleDragOver}
											onDrop={(e) => {
												e.preventDefault();
												handleDrop(item.id, comp.id);
											}}>
											<div className={styles.competencyHeader}>
												<div
													className={styles.competencyTitle}
													onClick={() => toggleCompetencyExpand(comp.id)}>
													<span className={styles.expandIcon}>
														{expandedCompetencies.includes(comp.id) ? '▼' : '▶'}
													</span>
													<span className={styles.competencyName}>
														{comp.name}
													</span>
													<span className={`${styles.levelBadge} ${styles[`level${comp.requiredLevel || 1}`]}`}>
														{getLevelLabel(comp.requiredLevel)}
													</span>
												</div>
												<div className={styles.competencyActions}>
													<button
														className={styles.addMaterialBtn}
														onClick={() => handleAddMaterialClick(comp.id)}>
														+ Материал
													</button>
												</div>
											</div>

											{expandedCompetencies.includes(comp.id) && (
												<div className={styles.materialsList}>
													{comp.materials.map((material) => (
														<div
															key={material._linkId || material.id}
															className={styles.materialCard}
															draggable
															onDragStart={() => handleDragStart(material, comp.id)}>
															<div className={styles.materialHeader}>
																<span className={styles.materialName}>
																	{getTypeIcon(material.typeName)} {material.name}
																</span>
																<div className={styles.materialActions}>
																	<button
																		className={styles.removeMaterialBtn}
																		onClick={() => handleRemoveMaterial(comp.id, material.id)}
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
																<span className={`${styles.levelBadge} ${styles[`level${material.targetLevel || 1}`]}`}>
																	{getLevelLabel(material.targetLevel)}
																</span>
																{material.duration && (
																	<span className={styles.duration}>⏱️ {material.duration} мин</span>
																)}
															</div>
														</div>
													))}
													{comp.materials.length === 0 && (
														<div className={styles.emptyMaterials}>
															<p>Нет учебных материалов</p>
															<small>Перетащите материалы из других компетенций или нажмите "+ Материал"</small>
														</div>
													)}
												</div>
											)}
										</div>
									))
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
			const links = await fetchAllMaterialLinks();
			await loadAllCompetencyMaterials(hierarchyWithComps, links);
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

			{showAddBlockModal && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
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
				<div className={styles.modal}>
					<div className={styles.modalContent}>
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
				<div className={styles.modal}>
					<div className={styles.modalContent}>
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

			{showMaterialSelector && (
				<div className={styles.modal}>
					<div className={styles.modalContent}>
						<h3>Добавить материал к компетенции</h3>
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
						<div className={styles.formGroup}>
							<label>Целевой уровень</label>
							<select
								value={selectedTargetLevel}
								onChange={(e) => setSelectedTargetLevel(e.target.value)}>
								<option value=''>Выберите уровень</option>
								{levels.map(l => (
									<option key={l.id} value={l.id}>
										{l.name}
									</option>
								))}
							</select>
						</div>
						<div className={styles.modalActions}>
							<button onClick={() => setShowMaterialSelector(null)}>Отмена</button>
							<button onClick={handleConfirmAddMaterial} disabled={!selectedMaterialId || !selectedTargetLevel}>
								Добавить
							</button>
						</div>
					</div>
				</div>
			)}

			<div className={styles.blocksList}>
				{renderHierarchy(hierarchy)}
			</div>
		</div>
	);
};

export default CategoryManager;