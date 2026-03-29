import React, { useState, useEffect } from 'react';
import styles from './category_manager.module.scss';

interface CompetencyBlock {
	id: string;
	name: string;
	competencies: CompetencyItem[];
}

interface CompetencyItem {
	id: string;
	name: string;
	description?: string;
	level: number;
	materials: MaterialItem[];
}

interface MaterialItem {
	id: string;
	name: string;
	type: 'video' | 'article' | 'book' | 'course';
	url: string;
	targetLevel: number;
	competencyId?: string;
}

interface CompetencyFromApi {
	id: string;
	name: string;
	description?: string;
	proficiencyLevels?: Array<{ value: number; name: string }>;
}

interface MaterialFromApi {
	id: string;
	name: string;
	typeId: string;
	type: { id: string; name: string };
	link: string;
	duration: number;
	competencies?: Array<{
		id: string;
		name: string;
		targetLevelId: string;
		targetLevel?: { id: string; name: string; value: number };
	}>;
}

const CategoryManager: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [blocks, setBlocks] = useState<CompetencyBlock[]>([]);
	const [newBlockName, setNewBlockName] = useState('');
	const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
	const [expandedCompetencies, setExpandedCompetencies] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	
	const [draggedItem, setDraggedItem] = useState<{
		type: 'competency' | 'material';
		item: CompetencyItem | MaterialItem;
		sourceBlockId: string;
		sourceCompetencyId?: string;
	} | null>(null);

	// Получение компетенций из API (порт 5217)
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
						const blockCompetencies: CompetencyItem[] = [];
						
						block.categories?.forEach((category: any) => {
							category.groups?.forEach((group: any) => {
								group.competencies?.forEach((comp: CompetencyFromApi) => {
									let level = 1;
									if (comp.proficiencyLevels && comp.proficiencyLevels.length > 0) {
										level = comp.proficiencyLevels[0].value || 1;
									}
									
									blockCompetencies.push({
										id: comp.id,
										name: comp.name,
										description: comp.description || 'Описание компетенции',
										level: level,
										materials: [],
									});
								});
							});
						});
						
						if (blockCompetencies.length > 0) {
							blocksData.push({
								id: block.id,
								name: block.name,
								competencies: blockCompetencies,
							});
						}
					});
				}
				
				setBlocks(blocksData);
				return blocksData;
			} else {
				console.error('Failed to fetch competencies:', response.status);
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
			setError('Ошибка загрузки компетенций');
		}
		return [];
	};

	// Получение материалов из API (порт 5217)
	const fetchMaterials = async (blocksData: CompetencyBlock[]) => {
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
				
				const competencyMap = new Map<string, CompetencyItem>();
				blocksData.forEach(block => {
					block.competencies.forEach(comp => {
						competencyMap.set(comp.id, comp);
					});
				});
				
				data.forEach(material => {
					if (material.competencies && material.competencies.length > 0) {
						material.competencies.forEach(comp => {
							const targetComp = competencyMap.get(comp.id);
							if (targetComp) {
								const targetLevel = comp.targetLevel?.value || 1;
								targetComp.materials.push({
									id: material.id,
									name: material.name,
									type: getTypeFromId(material.typeId),
									url: material.link,
									targetLevel: targetLevel,
								});
							}
						});
					}
				});
				
				setBlocks([...blocksData]);
			}
		} catch (error) {
			console.error('Error fetching materials:', error);
		}
	};

	const getTypeFromId = (typeId: string): 'video' | 'article' | 'book' | 'course' => {
		const typeMap: Record<string, 'video' | 'article' | 'book' | 'course'> = {
			'video-type-id': 'video',
			'article-type-id': 'article',
			'book-type-id': 'book',
			'course-type-id': 'course',
		};
		return typeMap[typeId] || 'article';
	};

	const handleAddBlock = async () => {
		if (!newBlockName.trim()) return;
		
		try {
			const newBlock: CompetencyBlock = {
				id: Date.now().toString(),
				name: newBlockName.trim(),
				competencies: [],
			};
			setBlocks([...blocks, newBlock]);
			setNewBlockName('');
			setExpandedBlocks([...expandedBlocks, newBlock.id]);
			setSuccessMessage('Блок создан');
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (error) {
			setError('Ошибка при создании блока');
			setTimeout(() => setError(null), 3000);
		}
	};

	const handleDeleteBlock = async (blockId: string) => {
		if (!window.confirm('Вы уверены, что хотите удалить этот блок компетенций?')) return;
		
		try {
			setBlocks(blocks.filter((block) => block.id !== blockId));
			setSuccessMessage('Блок удален');
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (error) {
			setError('Ошибка при удалении блока');
			setTimeout(() => setError(null), 3000);
		}
	};

	const handleDuplicateBlock = (block: CompetencyBlock) => {
		const duplicatedBlock: CompetencyBlock = {
			id: Date.now().toString(),
			name: `${block.name} (копия)`,
			competencies: block.competencies.map((comp) => ({
				...comp,
				id: `${comp.id}-copy-${Date.now()}`,
				materials: comp.materials.map((mat) => ({
					...mat,
					id: `${mat.id}-copy-${Date.now()}`,
				})),
			})),
		};
		setBlocks([...blocks, duplicatedBlock]);
		setExpandedBlocks([...expandedBlocks, duplicatedBlock.id]);
		setSuccessMessage('Блок дублирован');
		setTimeout(() => setSuccessMessage(null), 3000);
	};

	const handleDuplicateCompetency = (competency: CompetencyItem, blockId: string) => {
		const block = blocks.find((b) => b.id === blockId);
		if (!block) return;

		const competencyCopy: CompetencyItem = {
			...competency,
			id: `${competency.id}-copy-${Date.now()}`,
			materials: competency.materials.map((mat) => ({
				...mat,
				id: `${mat.id}-copy-${Date.now()}`,
			})),
		};

		const updatedBlocks = blocks.map((b) => {
			if (b.id === blockId) {
				return {
					...b,
					competencies: [...b.competencies, competencyCopy],
				};
			}
			return b;
		});

		setBlocks(updatedBlocks);
		setExpandedCompetencies([...expandedCompetencies, competencyCopy.id]);
		setSuccessMessage('Компетенция дублирована');
		setTimeout(() => setSuccessMessage(null), 3000);
	};

	const handleDuplicateMaterial = (material: MaterialItem, competencyId: string, blockId: string) => {
		const block = blocks.find((b) => b.id === blockId);
		if (!block) return;

		const materialCopy: MaterialItem = {
			...material,
			id: `${material.id}-copy-${Date.now()}`,
		};

		const updatedBlocks = blocks.map((b) => {
			if (b.id === blockId) {
				return {
					...b,
					competencies: b.competencies.map((comp) => {
						if (comp.id === competencyId) {
							return {
								...comp,
								materials: [...comp.materials, materialCopy],
							};
						}
						return comp;
					}),
				};
			}
			return b;
		});

		setBlocks(updatedBlocks);
		setSuccessMessage('Материал скопирован в эту компетенцию');
		setTimeout(() => setSuccessMessage(null), 3000);
	};

	const handleDragStart = (
		item: CompetencyItem | MaterialItem,
		type: 'competency' | 'material',
		sourceBlockId: string,
		sourceCompetencyId?: string
	) => {
		setDraggedItem({ type, item, sourceBlockId, sourceCompetencyId });
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (targetBlockId: string, targetCompetencyId?: string) => {
		if (!draggedItem) return;

		if (
			draggedItem.sourceBlockId === targetBlockId &&
			draggedItem.sourceCompetencyId === targetCompetencyId
		) {
			setDraggedItem(null);
			return;
		}

		setBlocks((prevBlocks) => {
			const sourceBlock = prevBlocks.find(b => b.id === draggedItem.sourceBlockId);
			const targetBlock = prevBlocks.find(b => b.id === targetBlockId);

			if (!sourceBlock || !targetBlock) return prevBlocks;

			if (draggedItem.type === 'competency') {
				const competency = draggedItem.item as CompetencyItem;

				return prevBlocks.map((block) => {
					if (block.id === draggedItem.sourceBlockId) {
						return {
							...block,
							competencies: block.competencies.filter(c => c.id !== competency.id),
						};
					}
					if (block.id === targetBlockId) {
						const competencyCopy = {
							...competency,
							id: `${competency.id}-moved-${Date.now()}`,
							materials: [...competency.materials],
						};
						return {
							...block,
							competencies: [...block.competencies, competencyCopy],
						};
					}
					return block;
				});
			} else {
				const material = draggedItem.item as MaterialItem;
				if (!targetCompetencyId) return prevBlocks;

				return prevBlocks.map((block) => {
					if (block.id === targetBlockId) {
						return {
							...block,
							competencies: block.competencies.map((comp) => {
								if (comp.id === targetCompetencyId) {
									const materialCopy = {
										...material,
										id: `${material.id}-moved-${Date.now()}`,
									};
									return {
										...comp,
										materials: [...comp.materials, materialCopy],
									};
								}
								if (
									draggedItem.sourceCompetencyId &&
									comp.id === draggedItem.sourceCompetencyId
								) {
									return {
										...comp,
										materials: comp.materials.filter(m => m.id !== material.id),
									};
								}
								return comp;
							}),
						};
					}
					return block;
				});
			}
		});

		setDraggedItem(null);
		setSuccessMessage('Элемент перемещен');
		setTimeout(() => setSuccessMessage(null), 2000);
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

	const getLevelLabel = (level: number) => {
		const labels: Record<number, string> = {
			1: 'Базовые знания',
			2: 'Профессионал',
			3: 'Эксперт',
		};
		return labels[level] || `Уровень ${level}`;
	};

	const getTypeIcon = (type: string) => {
		const icons = {
			video: '🎥',
			article: '📄',
			book: '📚',
			course: '🎓',
		};
		return icons[type as keyof typeof icons] || '📁';
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			const blocksData = await fetchCompetencies();
			await fetchMaterials(blocksData);
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
				<h3>Управление блоками компетенций</h3>
				<div className={styles.addBlock}>
					<input
						type='text'
						value={newBlockName}
						onChange={(e) => setNewBlockName(e.target.value)}
						placeholder='Название нового блока'
						onKeyPress={(e) => e.key === 'Enter' && handleAddBlock()}
					/>
					<button onClick={handleAddBlock} className={styles.addBtn}>
						+ Добавить блок
					</button>
				</div>
			</div>

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
								<span className={styles.itemCount}>
									{block.competencies.length} компетенций
								</span>
							</div>
							<div className={styles.blockActions}>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDuplicateBlock(block);
									}}
									className={styles.iconBtn}
									title='Дублировать блок'>
									📋
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteBlock(block.id);
									}}
									className={styles.iconBtn}
									title='Удалить блок'>
									🗑️
								</button>
							</div>
						</div>

						{expandedBlocks.includes(block.id) && (
							<div
								className={styles.blockContent}
								onDragOver={handleDragOver}
								onDrop={(e) => {
									e.preventDefault();
									handleDrop(block.id);
								}}>
								{block.competencies.map((comp) => (
									<div
										key={comp.id}
										className={styles.competencyContainer}
										onDragOver={handleDragOver}
										onDrop={(e) => {
											e.preventDefault();
											handleDrop(block.id, comp.id);
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
												<span
													className={`${styles.levelBadge} ${
														styles[`level${comp.level}`]
													}`}>
													{getLevelLabel(comp.level)}
												</span>
											</div>
											<div className={styles.competencyActions}>
												<button
													onClick={() => handleDuplicateCompetency(comp, block.id)}
													className={styles.smallIconBtn}
													title='Дублировать компетенцию'>
													📄
												</button>
												<span className={styles.materialCount}>
													{comp.materials.length} материалов
												</span>
											</div>
										</div>

										{expandedCompetencies.includes(comp.id) && (
											<div className={styles.materialsList}>
												{comp.materials.map((material) => (
													<div
														key={material.id}
														className={styles.materialCard}
														draggable
														onDragStart={() =>
															handleDragStart(material, 'material', block.id, comp.id)
														}>
														<div className={styles.materialHeader}>
															<span className={styles.materialName}>
																{getTypeIcon(material.type)} {material.name}
															</span>
															<button
																onClick={() =>
																	handleDuplicateMaterial(material, comp.id, block.id)
																}
																className={styles.smallIconBtn}
																title='Скопировать в эту компетенцию'>
																📋
															</button>
														</div>
														<div className={styles.materialMeta}>
															<span className={styles.materialUrl}>
																<a
																	href={material.url}
																	target='_blank'
																	rel='noopener noreferrer'>
																	{material.url}
																</a>
															</span>
															<span
																className={`${styles.levelBadge} ${
																	styles[`level${material.targetLevel}`]
																}`}>
																Ур. {material.targetLevel}
															</span>
														</div>
													</div>
												))}
												{comp.materials.length === 0 && (
													<div className={styles.emptyMaterials}>
														<p>Нет учебных материалов</p>
														<small>Перетащите материалы из других компетенций</small>
													</div>
												)}
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			<div className={styles.footer}>
				<p className={styles.hint}>
					💡 Компетенции можно перетаскивать между блоками. Материалы
					перетаскиваются между компетенциями. Используйте кнопки 📋 для
					дублирования блоков и 📄 для дублирования компетенций. Кнопка 📋 на
					материале копирует его в текущую компетенцию.
				</p>
			</div>
		</div>
	);
};

export default CategoryManager;