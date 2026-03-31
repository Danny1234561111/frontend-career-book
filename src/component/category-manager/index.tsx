// category_manager.module.tsx
import React, { useState, useEffect } from 'react';
import styles from './category_manager.module.scss';

interface CompetencyBlock {
	id: string;
	name: string;
	categories?: Array<{
		id: string;
		name: string;
		groups?: Array<{
			id: string;
			name: string;
			competencies: CompetencyItem[];
		}>;
	}>;
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
	_linkId?: string; // ID связи для удаления
	_isNew?: boolean; // Флаг для новых связей
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
	
	const [blocks, setBlocks] = useState<CompetencyBlock[]>([]);
	const [originalBlocks, setOriginalBlocks] = useState<CompetencyBlock[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
	const [expandedCompetencies, setExpandedCompetencies] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [showMaterialSelector, setShowMaterialSelector] = useState<{competencyId: string} | null>(null);
	const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
	const [selectedTargetLevel, setSelectedTargetLevel] = useState<string>('');
	const [levels, setLevels] = useState<Array<{id: string; name: string; value: number}>>([]);
	
	const [draggedItem, setDraggedItem] = useState<{
		type: 'material';
		item: MaterialItem;
		sourceBlockId: string;
		sourceCategoryId?: string;
		sourceGroupId?: string;
		sourceCompetencyId?: string;
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
				setLevels(data);
			}
		} catch (error) {
			console.error('Error fetching levels:', error);
		}
	};

	// Получение компетенций из API
	const fetchCompetencies = async () => {
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
				const blocksData: CompetencyBlock[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					data.blocks.forEach((block: any) => {
						blocksData.push({
							id: block.id,
							name: block.name,
							categories: block.categories?.map((cat: any) => ({
								id: cat.id,
								name: cat.name,
								groups: cat.groups?.map((group: any) => ({
									id: group.id,
									name: group.name,
									competencies: group.competencies?.map((comp: any) => ({
										id: comp.id,
										name: comp.name,
										description: comp.description,
										requiredLevel: comp.requiredLevel,
										materials: [],
									})) || []
								})) || []
							})) || []
						});
					});
				}
				
				setBlocks(blocksData);
				return blocksData;
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
				return data;
			}
		} catch (error) {
			console.error('Error fetching material links:', error);
		}
		return [];
	};

	// Загрузка всех материалов для компетенций
	const loadAllCompetencyMaterials = async (blocksData: CompetencyBlock[], links: EducationalMaterialLink[]) => {
		const materialMap = new Map<string, MaterialFromApi>();
		materials.forEach(m => materialMap.set(m.id, m));

		for (const block of blocksData) {
			if (block.categories) {
				for (const category of block.categories) {
					if (category.groups) {
						for (const group of category.groups) {
							for (const competency of group.competencies) {
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
					}
				}
			}
		}
		setBlocks([...blocksData]);
		setOriginalBlocks(JSON.parse(JSON.stringify(blocksData)));
	};

	// Сохранение всех изменений
	const handleSaveChanges = async () => {
		setIsSaving(true);
		setError(null);
		
		try {
			// Находим удаленные связи
			const removedLinks: string[] = [];
			// Находим добавленные связи
			const addedLinks: Array<{competencyId: string, materialId: string, targetLevelId: string}> = [];
			
			// Сравниваем текущие блоки с оригинальными
			for (const currentBlock of blocks) {
				if (currentBlock.categories) {
					for (const currentCategory of currentBlock.categories) {
						if (currentCategory.groups) {
							for (const currentGroup of currentCategory.groups) {
								for (const currentComp of currentGroup.competencies) {
									// Находим оригинальную компетенцию
									let originalComp: CompetencyItem | undefined;
									
									for (const origBlock of originalBlocks) {
										if (origBlock.categories) {
											for (const origCategory of origBlock.categories) {
												if (origCategory.groups) {
													for (const origGroup of origCategory.groups) {
														originalComp = origGroup.competencies.find(c => c.id === currentComp.id);
														if (originalComp) break;
													}
												}
												if (originalComp) break;
											}
										}
										if (originalComp) break;
									}
									
									// Проверяем удаленные связи
									if (originalComp) {
										for (const originalMaterial of originalComp.materials) {
											const stillExists = currentComp.materials.some(m => 
												m.id === originalMaterial.id && m._linkId === originalMaterial._linkId
											);
											if (!stillExists && originalMaterial._linkId) {
												removedLinks.push(originalMaterial._linkId);
											}
										}
									}
									
									// Проверяем добавленные связи
									for (const currentMaterial of currentComp.materials) {
										if (currentMaterial._isNew) {
											const levelId = levels.find(l => l.value === currentMaterial.targetLevel)?.id;
											if (levelId) {
												addedLinks.push({
													competencyId: currentComp.id,
													materialId: currentMaterial.id,
													targetLevelId: levelId
												});
											}
										}
									}
								}
							}
						}
					}
				}
			}
			
			// Удаляем связи
			for (const linkId of removedLinks) {
				await fetch(`http://localhost:5217/api/educational-material-competencies/${linkId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${accessToken}`,
					},
				});
			}
			
			// Добавляем связи (материалы могут существовать в нескольких компетенциях)
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
			
			// Обновляем оригинальные данные
			setOriginalBlocks(JSON.parse(JSON.stringify(blocks)));
			
			// Убираем временные флаги
			for (const block of blocks) {
				if (block.categories) {
					for (const category of block.categories) {
						if (category.groups) {
							for (const group of category.groups) {
								for (const comp of group.competencies) {
									for (const material of comp.materials) {
										delete material._isNew;
									}
								}
							}
						}
					}
				}
			}
			
			setSuccessMessage('Изменения успешно сохранены');
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (error) {
			console.error('Error saving changes:', error);
			setError('Ошибка при сохранении изменений');
		} finally {
			setIsSaving(false);
		}
	};

	// Drag handlers - только для копирования материалов
	const handleDragStart = (
		item: MaterialItem,
		sourceBlockId: string,
		sourceCategoryId?: string,
		sourceGroupId?: string,
		sourceCompetencyId?: string
	) => {
		setDraggedItem({ type: 'material', item, sourceBlockId, sourceCategoryId, sourceGroupId, sourceCompetencyId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (
		targetBlockId: string,
		targetCategoryId?: string,
		targetGroupId?: string,
		targetCompetencyId?: string
	) => {
		if (!draggedItem || !targetCompetencyId) return;
		
		// Копируем материал в целевую компетенцию (не перемещаем!)
		setBlocks(prevBlocks => {
			const newBlocks = JSON.parse(JSON.stringify(prevBlocks));
			
			// Находим целевую компетенцию
			for (const block of newBlocks) {
				if (block.id === targetBlockId && block.categories) {
					for (const category of block.categories) {
						if (category.id === targetCategoryId && category.groups) {
							for (const group of category.groups) {
								if (group.id === targetGroupId) {
									const targetComp = group.competencies.find((c: CompetencyItem) => c.id === targetCompetencyId);
									if (targetComp) {
										// Проверяем, существует ли уже такой материал в компетенции
										const exists = targetComp.materials.some((m: MaterialItem) => m.id === draggedItem.item.id);
										if (!exists) {
											// Копируем материал
											targetComp.materials.push({
												...draggedItem.item,
												_isNew: true,
												_linkId: undefined,
											});
										}
									}
									break;
								}
							}
							break;
						}
					}
					break;
				}
			}
			
			return newBlocks;
		});
		
		setDraggedItem(null);
		setSuccessMessage('Материал скопирован в компетенцию');
		setTimeout(() => setSuccessMessage(null), 2000);
	};

	const handleDuplicateMaterial = (material: MaterialItem, competencyId: string, blockId: string, categoryId: string, groupId: string) => {
		setBlocks(prevBlocks => {
			const newBlocks = [...prevBlocks];
			const block = newBlocks.find(b => b.id === blockId);
			if (block?.categories) {
				const category = block.categories.find(c => c.id === categoryId);
				if (category?.groups) {
					const group = category.groups.find(g => g.id === groupId);
					if (group) {
						const targetComp = group.competencies.find(c => c.id === competencyId);
						if (targetComp) {
							// Проверяем, существует ли уже такой материал
							const exists = targetComp.materials.some(m => m.id === material.id);
							if (!exists) {
								targetComp.materials.push({
									...material,
									_isNew: true,
									_linkId: undefined,
								});
							}
						}
					}
				}
			}
			return newBlocks;
		});
		
		setSuccessMessage('Материал скопирован');
		setTimeout(() => setSuccessMessage(null), 3000);
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
				setBlocks(prevBlocks => {
					const newBlocks = [...prevBlocks];
					for (const block of newBlocks) {
						if (block.categories) {
							for (const category of block.categories) {
								if (category.groups) {
									for (const group of category.groups) {
										const compIndex = group.competencies.findIndex(c => c.id === showMaterialSelector.competencyId);
										if (compIndex !== -1) {
											// Проверяем, существует ли уже такой материал
											const exists = group.competencies[compIndex].materials.some(
												m => m.id === selectedMaterial.id
											);
											if (!exists) {
												group.competencies[compIndex].materials.push({
													id: selectedMaterial.id,
													name: selectedMaterial.name,
													typeName: selectedMaterial.type?.name || 'unknown',
													url: selectedMaterial.link,
													targetLevel: targetLevel.value,
													duration: selectedMaterial.duration,
													_isNew: true,
												});
											}
											break;
										}
									}
								}
							}
						}
					}
					return newBlocks;
				});
				
				setSuccessMessage('Материал добавлен');
				setTimeout(() => setSuccessMessage(null), 3000);
			}
			
			setShowMaterialSelector(null);
		}
	};

	const handleRemoveMaterial = (competencyId: string, materialId: string) => {
		setBlocks(prevBlocks => {
			const newBlocks = [...prevBlocks];
			for (const block of newBlocks) {
				if (block.categories) {
					for (const category of block.categories) {
						if (category.groups) {
							for (const group of category.groups) {
								const compIndex = group.competencies.findIndex(c => c.id === competencyId);
								if (compIndex !== -1) {
									// Удаляем материал только из этой компетенции
									group.competencies[compIndex].materials = group.competencies[compIndex].materials.filter(
										m => m.id !== materialId
									);
									break;
								}
							}
						}
					}
				}
			}
			return newBlocks;
		});
	};

	const toggleBlockExpand = (blockId: string) => {
		setExpandedBlocks((prev) =>
			prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]
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

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await fetchLevels();
			await fetchMaterials();
			const blocksData = await fetchCompetencies();
			const links = await fetchAllMaterialLinks();
			await loadAllCompetencyMaterials(blocksData, links);
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
				<button 
					className={styles.saveBtn} 
					onClick={handleSaveChanges}
					disabled={isSaving}>
					{isSaving ? 'Сохранение...' : '💾 Сохранить изменения'}
				</button>
			</div>

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
				{blocks.map((block) => (
					<div key={block.id} className={styles.block}>
						<div
							className={styles.blockHeader}
							onClick={() => toggleBlockExpand(block.id)}>
							<div className={styles.blockTitle}>
								<span className={styles.expandIcon}>
									{expandedBlocks.includes(block.id) ? '▼' : '▶'}
								</span>
								<h4>{block.name}</h4>
							</div>
						</div>

						{expandedBlocks.includes(block.id) && block.categories && (
							<div className={styles.blockContent}>
								{block.categories.map((category) => (
									<div key={category.id} className={styles.category}>
										<h5>{category.name}</h5>
										{category.groups?.map((group) => (
											<div key={group.id} className={styles.group}>
												<h6>{group.name}</h6>
												{group.competencies.map((comp) => (
													<div
														key={comp.id}
														className={styles.competencyContainer}
														onDragOver={handleDragOver}
														onDrop={(e) => {
															e.preventDefault();
															handleDrop(block.id, category.id, group.id, comp.id);
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
																		onDragStart={() => handleDragStart(material, block.id, category.id, group.id, comp.id)}>
																		<div className={styles.materialHeader}>
																			<span className={styles.materialName}>
																				{getTypeIcon(material.typeName)} {material.name}
																			</span>
																			<div className={styles.materialActions}>
																				<button
																					className={styles.smallIconBtn}
																					onClick={() => handleDuplicateMaterial(material, comp.id, block.id, category.id, group.id)}
																					title='Скопировать в эту компетенцию'>
																					📋
																				</button>
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
												))}
											</div>
										))}
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			<div className={styles.footer}>
				<p className={styles.hint}>
					💡 <strong>Drag & Drop (копирование):</strong> Перетаскивайте материалы между компетенциями — они копируются, а не перемещаются. Один материал может быть привязан к нескольким компетенциям.<br/>
					📋 <strong>Дублирование:</strong> Используйте кнопку 📋 для копирования материала в текущую компетенцию.<br/>
					💾 <strong>Сохранение:</strong> Все изменения сохраняются только после нажатия кнопки "Сохранить изменения".<br/>
					🗑️ <strong>Удаление:</strong> Удаление материала из компетенции не удаляет сам материал, только связь с этой компетенцией.
				</p>
			</div>
		</div>
	);
};

export default CategoryManager;