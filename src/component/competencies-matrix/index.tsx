import React, { useState, useEffect, useCallback } from 'react';
import styles from './competencies-matrix.module.scss';

interface ProficiencyLevel {
	id: string;
	name: string;
	value: number;
}

interface ProficiencyLevelCompetency {
	id: string;
	proficiencyLevelId: string;
	proficiencyLevel: ProficiencyLevel;
	competencyId: string;
	description?: string;
	example?: string;
}

interface EducationalMaterial {
	id: string;
	name: string;
	typeId: string;
	type?: { id: string; name: string };
	link: string;
	duration: number;
}

interface EducationalMaterialCompetency {
	id: string;
	competencyId: string;
	educationalMaterialId: string;
	targetLevelId: string;
	targetLevel?: ProficiencyLevel;
	educationalMaterial: EducationalMaterial;
}

interface Competency {
	id: string;
	name: string;
	type: string;
	hierarchyId?: string;
	hierarchy?: { id: string; name: string };
	category?: { id: string; name: string };
	group?: { id: string; name: string };
	description: string;
	text?: string;
	defenseTasks?: string;
	admissionCriteria?: string;
}

interface CompetencyBlock {
	id: string;
	name: string;
	categories?: CompetencyCategory[];
}

interface CompetencyCategory {
	id: string;
	name: string;
	groups?: CompetencyGroup[];
}

interface CompetencyGroup {
	id: string;
	name: string;
}

interface CompetenciesMatrixProps {
	editable?: boolean;
	onCompetencyUpdate?: (competencyId: string, levelId: string, levelValue: number) => void;
	onEdit?: (competency: Competency) => void;
	onDelete?: (competencyId: string) => void;
	onViewDetails?: (competency: Competency, level?: ProficiencyLevelCompetency) => void;
	userId?: string;
	competencies?: Competency[];
	competencyBlocks?: CompetencyBlock[];
	onAddMaterialToLevel?: (competencyId: string, levelId: string) => void;
	onRemoveMaterialFromLevel?: (linkId: string) => void;
	materialsByLevel?: Map<string, EducationalMaterialCompetency[]>;
}

const CompetenciesMatrix: React.FC<CompetenciesMatrixProps> = ({
	editable = false,
	onEdit,
	onDelete,
	onViewDetails,
	competencies = [],
	competencyBlocks = [],
	onAddMaterialToLevel,
	onRemoveMaterialFromLevel,
	materialsByLevel = new Map(),
}) => {
	const accessToken = localStorage.getItem('accessToken');
	
	// Фильтры
	const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
	const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
	const [selectedSearchQuery, setSelectedSearchQuery] = useState<string>('');
	
	const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
	const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
	const [proficiencyLevels, setProficiencyLevels] = useState<ProficiencyLevel[]>([]);
	const [competencyLevels, setCompetencyLevels] = useState<Map<string, ProficiencyLevelCompetency[]>>(new Map());
	const [isLoadingLevels, setIsLoadingLevels] = useState(false);
	
	// Состояния для модальных окон
	const [showAddLevelModal, setShowAddLevelModal] = useState(false);
	const [showEditLevelModal, setShowEditLevelModal] = useState(false);
	const [selectedCompetencyId, setSelectedCompetencyId] = useState<string | null>(null);
	const [selectedLevelCompetency, setSelectedLevelCompetency] = useState<ProficiencyLevelCompetency | null>(null);
	const [newLevelData, setNewLevelData] = useState({
		proficiencyLevelId: '',
		description: '',
		example: '',
	});
	const [editLevelData, setEditLevelData] = useState({
		description: '',
		example: '',
	});

	// Функция для получения ID блока по категории
	const getBlockIdByCategoryId = useCallback((categoryId: string): string | null => {
		for (const block of competencyBlocks) {
			if (block.categories?.some(cat => cat.id === categoryId)) {
				return block.id;
			}
		}
		return null;
	}, [competencyBlocks]);

	// Функция для получения ID категории по группе
	const getCategoryIdByGroupId = useCallback((groupId: string): string | null => {
		for (const block of competencyBlocks) {
			for (const category of (block.categories || [])) {
				if (category.groups?.some(group => group.id === groupId)) {
					return category.id;
				}
			}
		}
		return null;
	}, [competencyBlocks]);

	// Получение доступных категорий и групп на основе выбранного блока
	const availableCategories = selectedBlockId === 'all' 
		? competencyBlocks.flatMap(block => block.categories || [])
		: competencyBlocks.find(b => b.id === selectedBlockId)?.categories || [];
	
	const availableGroups = selectedCategoryId === 'all'
		? availableCategories.flatMap(cat => cat.groups || [])
		: availableCategories.find(c => c.id === selectedCategoryId)?.groups || [];

	// Получение всех уровней владения
	const fetchProficiencyLevels = useCallback(async () => {
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
				const sorted = data.sort((a: ProficiencyLevel, b: ProficiencyLevel) => a.value - b.value);
				setProficiencyLevels(sorted);
				return sorted;
			}
		} catch (error) {
			console.error('Error fetching proficiency levels:', error);
		}
		return [];
	}, [accessToken]);

	// Получение уровней для конкретной компетенции
	const fetchCompetencyProficiencyLevels = useCallback(async (competencyId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/proficiency-level-competencies/by-competency/${competencyId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data: ProficiencyLevelCompetency[] = await response.json();
				return data;
			}
		} catch (error) {
			console.error(`Error fetching levels for competency ${competencyId}:`, error);
		}
		return [];
	}, [accessToken]);

	// Загрузка всех уровней для всех компетенций
	const loadAllCompetencyLevels = useCallback(async (comps: Competency[]) => {
		setIsLoadingLevels(true);
		const levelsMap = new Map<string, ProficiencyLevelCompetency[]>();
		
		for (const competency of comps) {
			const levels = await fetchCompetencyProficiencyLevels(competency.id);
			levelsMap.set(competency.id, levels);
		}
		
		setCompetencyLevels(levelsMap);
		setIsLoadingLevels(false);
	}, [fetchCompetencyProficiencyLevels]);

	// Получение цвета для уровня
	const getLevelColor = (value: number): string => {
		const colors = ['', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];
		return colors[value] || '#9e9e9e';
	};

	// Получение иконки для уровня
	const getLevelIcon = (value: number): string => {
		const icons = ['', '🌱', '⭐', '🏆', '🚀', '👑'];
		return icons[value] || '📚';
	};

	// Добавление нового уровня к компетенции
	const handleAddLevel = async () => {
		if (!selectedCompetencyId || !newLevelData.proficiencyLevelId) return;
		
		try {
			const response = await fetch('http://localhost:5217/api/proficiency-level-competencies', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					competencyId: selectedCompetencyId,
					proficiencyLevelId: newLevelData.proficiencyLevelId,
					description: newLevelData.description,
					example: newLevelData.example,
				}),
			});

			if (response.ok || response.status === 201) {
				const newLevel = await response.json();
				const currentLevels = competencyLevels.get(selectedCompetencyId) || [];
				competencyLevels.set(selectedCompetencyId, [...currentLevels, newLevel]);
				setCompetencyLevels(new Map(competencyLevels));
				setShowAddLevelModal(false);
				setNewLevelData({ proficiencyLevelId: '', description: '', example: '' });
				
				// Обновляем данные в родительском компоненте
				if (onViewDetails) {
					const competency = competencies.find(c => c.id === selectedCompetencyId);
					if (competency) onViewDetails(competency);
				}
			}
		} catch (error) {
			console.error('Error adding level to competency:', error);
		}
	};

	// Обновление уровня
	const handleUpdateLevel = async () => {
		if (!selectedLevelCompetency) return;
		
		try {
			const response = await fetch(`http://localhost:5217/api/proficiency-level-competencies/${selectedLevelCompetency.id}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					description: editLevelData.description,
					example: editLevelData.example,
				}),
			});

			if (response.ok) {
				for (const [compId, levels] of competencyLevels.entries()) {
					const updatedLevels = levels.map(l => 
						l.id === selectedLevelCompetency.id 
							? { ...l, description: editLevelData.description, example: editLevelData.example }
							: l
					);
					competencyLevels.set(compId, updatedLevels);
				}
				setCompetencyLevels(new Map(competencyLevels));
				setShowEditLevelModal(false);
				setSelectedLevelCompetency(null);
				setEditLevelData({ description: '', example: '' });
			}
		} catch (error) {
			console.error('Error updating level:', error);
		}
	};

	// Удаление уровня
	const handleDeleteLevel = async (levelCompetencyId: string) => {
		if (!window.confirm('Вы уверены, что хотите удалить этот уровень? Все привязанные материалы будут отвязаны.')) return;
		
		try {
			const response = await fetch(`http://localhost:5217/api/proficiency-level-competencies/${levelCompetencyId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			if (response.ok || response.status === 204) {
				for (const [compId, levels] of competencyLevels.entries()) {
					const filteredLevels = levels.filter(l => l.id !== levelCompetencyId);
					competencyLevels.set(compId, filteredLevels);
				}
				setCompetencyLevels(new Map(competencyLevels));
			}
		} catch (error) {
			console.error('Error deleting level:', error);
		}
	};

	const openAddLevelModal = (competencyId: string) => {
		setSelectedCompetencyId(competencyId);
		setNewLevelData({ proficiencyLevelId: '', description: '', example: '' });
		setShowAddLevelModal(true);
	};

	const openEditLevelModal = (levelCompetency: ProficiencyLevelCompetency) => {
		setSelectedLevelCompetency(levelCompetency);
		setEditLevelData({
			description: levelCompetency.description || '',
			example: levelCompetency.example || '',
		});
		setShowEditLevelModal(true);
	};

	// ИСПРАВЛЕННАЯ ФИЛЬТРАЦИЯ КОМПЕТЕНЦИЙ
	const filteredCompetencies = competencies.filter((comp) => {
		// Фильтр по блоку
		if (selectedBlockId !== 'all') {
			const block = competencyBlocks.find(b => b.id === selectedBlockId);
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
		if (selectedSearchQuery && !comp.name.toLowerCase().includes(selectedSearchQuery.toLowerCase())) {
			return false;
		}
		
		return true;
	});

	const handleRowClick = (competency: Competency) => {
		if (expandedCompetency === competency.id) {
			setExpandedCompetency(null);
			setExpandedLevel(null);
		} else {
			setExpandedCompetency(competency.id);
		}
		onViewDetails?.(competency);
	};

	const handleLevelClick = (levelId: string) => {
		if (expandedLevel === levelId) {
			setExpandedLevel(null);
		} else {
			setExpandedLevel(levelId);
		}
	};

	// ИСПРАВЛЕННАЯ функция получения материалов для уровня
	// Ключ формируется как `${competencyId}_${proficiencyLevelId}`
	const getMaterialsForLevel = (competencyId: string, proficiencyLevelId: string): EducationalMaterialCompetency[] => {
		const key = `${competencyId}_${proficiencyLevelId}`;
		return materialsByLevel.get(key) || [];
	};

	// Сброс фильтров
	const resetFilters = () => {
		setSelectedBlockId('all');
		setSelectedCategoryId('all');
		setSelectedGroupId('all');
		setSelectedSearchQuery('');
	};

	// Получение отображаемого пути иерархии
	const getFullHierarchyDisplay = (competency: Competency): string => {
		const parts: string[] = [];
		
		if (competency.category?.id) {
			const blockId = getBlockIdByCategoryId(competency.category.id);
			const block = competencyBlocks.find(b => b.id === blockId);
			if (block) parts.push(block.name);
		}
		
		if (competency.category?.name) parts.push(competency.category.name);
		if (competency.group?.name || competency.hierarchy?.name) {
			parts.push(competency.group?.name || competency.hierarchy?.name || '');
		}
		
		return parts.join(' → ') || '—';
	};

	useEffect(() => {
		fetchProficiencyLevels();
	}, [fetchProficiencyLevels]);

	useEffect(() => {
		if (competencies.length > 0) {
			loadAllCompetencyLevels(competencies);
		}
	}, [competencies, loadAllCompetencyLevels]);

	return (
		<div className={styles.matrix}>
			<div className={styles.header}>
				<h3>Матрица компетенций</h3>
				<button className={styles.resetBtn} onClick={resetFilters} title="Сбросить фильтры">
					⟳ Сбросить
				</button>
			</div>

			<div className={styles.filtersBar}>
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
						{competencyBlocks.map(block => (
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
						value={selectedSearchQuery}
						onChange={(e) => setSelectedSearchQuery(e.target.value)}
						placeholder="Название компетенции..."
						className={styles.searchInput}
					/>
				</div>
			</div>

			<div className={styles.table}>
				<div className={`${styles.row} ${styles.headerRow}`}>
					<div className={styles.cell}>Компетенция</div>
					<div className={styles.cell}>Иерархия</div>
					<div className={styles.cell}>Уровни владения</div>
					{editable && <div className={styles.cell}>Действия</div>}
				</div>

				{filteredCompetencies.length === 0 && (
					<div className={styles.emptyState}>
						<p>Компетенции не найдены</p>
						<small>Попробуйте изменить параметры фильтрации</small>
					</div>
				)}

				{filteredCompetencies.map((comp) => {
					const isExpanded = expandedCompetency === comp.id;
					const levels = competencyLevels.get(comp.id) || [];
					const sortedLevels = [...levels].sort((a, b) => a.proficiencyLevel.value - b.proficiencyLevel.value);
					const hasAllLevels = sortedLevels.length === proficiencyLevels.length && proficiencyLevels.length > 0;

					return (
						<React.Fragment key={comp.id}>
							<div
								className={`${styles.row} ${styles.dataRow} ${
									isExpanded ? styles.expanded : ''
								}`}
								onClick={() => handleRowClick(comp)}>
								<div className={styles.cell}>
									<span className={styles.competencyName}>{comp.name}</span>
								</div>
								<div className={styles.cell}>
									<div className={styles.hierarchyPath}>
										{getFullHierarchyDisplay(comp)}
									</div>
								</div>
								<div className={styles.cell}>
									<div className={styles.levelsContainer}>
										{proficiencyLevels.map(level => {
											const hasLevel = levels.some(l => l.proficiencyLevelId === level.id);
											return (
												<span 
													key={level.id}
													className={`${styles.levelIndicator} ${hasLevel ? styles.hasLevel : styles.noLevel}`}
													style={{ backgroundColor: hasLevel ? getLevelColor(level.value) : '#e0e0e0' }}>
													{getLevelIcon(level.value)} {level.name}
												</span>
											);
										})}
									</div>
								</div>
								{editable && (
									<div className={styles.cell}>
										<div className={styles.actions}>
											<button
												className={styles.editBtn}
												onClick={(e) => {
													e.stopPropagation();
													onEdit?.(comp);
												}}
												title='Редактировать компетенцию'>
												✏️
											</button>
											<button
												className={styles.deleteBtn}
												onClick={(e) => {
													e.stopPropagation();
													onDelete?.(comp.id);
												}}
												title='Удалить компетенцию'>
												🗑️
											</button>
										</div>
									</div>
								)}
							</div>

							{isExpanded && (
								<div className={styles.expandedDetails}>
									<div className={styles.detailsGrid}>
										<div className={styles.detailSection}>
											<h5>Описание компетенции</h5>
											<p>{comp.description || 'Нет описания'}</p>
										</div>

										{comp.text && (
											<div className={styles.detailSection}>
												<h5>Теоретический материал</h5>
												<p>{comp.text}</p>
											</div>
										)}

										{comp.defenseTasks && (
											<div className={styles.detailSection}>
												<h5>Задания для защиты</h5>
												<p>{comp.defenseTasks}</p>
											</div>
										)}

										{comp.admissionCriteria && (
											<div className={styles.detailSection}>
												<h5>Критерии приема</h5>
												<p>{comp.admissionCriteria}</p>
											</div>
										)}
									</div>

									<div className={styles.levelsSection}>
										<div className={styles.levelsHeader}>
											<h4>Уровни владения компетенцией</h4>
											{editable && !hasAllLevels && (
												<button 
													className={styles.addLevelBtn}
													onClick={() => openAddLevelModal(comp.id)}>
													+ Добавить уровень
												</button>
											)}
										</div>
										
										<div className={styles.levelsList}>
											{proficiencyLevels.map(level => {
												const levelCompetency = sortedLevels.find(l => l.proficiencyLevelId === level.id);
												const isLevelExpanded = expandedLevel === levelCompetency?.id;
												// ИСПРАВЛЕНО: передаем proficiencyLevelId, а не id связи
												const materialsForLevel = levelCompetency 
													? getMaterialsForLevel(comp.id, level.proficiencyLevelId)
													: [];
												
												if (!levelCompetency && !editable) return null;
												
												return (
													<div key={level.id} className={styles.levelCard}>
														<div 
															className={styles.levelHeader}
															style={{ borderLeftColor: getLevelColor(level.value) }}
															onClick={() => levelCompetency && handleLevelClick(levelCompetency.id)}>
															<div className={styles.levelTitle}>
																<span className={styles.levelIcon}>{getLevelIcon(level.value)}</span>
																<span className={styles.levelName}>{level.name}</span>
																<span className={styles.levelValue}>Уровень {level.value}</span>
																{materialsForLevel.length > 0 && (
																	<span className={styles.materialsBadge}>
																		📚 {materialsForLevel.length}
																	</span>
																)}
															</div>
															{levelCompetency && (
																<span className={styles.expandIcon}>
																	{isLevelExpanded ? '▲' : '▼'}
																</span>
															)}
															{editable && levelCompetency && (
																<div className={styles.levelActions} onClick={(e) => e.stopPropagation()}>
																	<button
																		className={styles.editLevelBtn}
																		onClick={() => openEditLevelModal(levelCompetency)}
																		title='Редактировать уровень'>
																		✏️
																	</button>
																	<button
																		className={styles.deleteLevelBtn}
																		onClick={() => handleDeleteLevel(levelCompetency.id)}
																		title='Удалить уровень'>
																		🗑️
																	</button>
																</div>
															)}
														</div>
														
														{isLevelExpanded && levelCompetency && (
															<div className={styles.levelContent}>
																{levelCompetency.description && (
																	<div className={styles.levelDescription}>
																		<strong>Описание уровня:</strong>
																		<p>{levelCompetency.description}</p>
																	</div>
																)}
																{levelCompetency.example && (
																	<div className={styles.levelExample}>
																		<strong>Пример:</strong>
																		<p>{levelCompetency.example}</p>
																	</div>
																)}
																
																{materialsForLevel.length > 0 && (
																	<div className={styles.levelMaterials}>
																		<strong>Учебные материалы:</strong>
																		<ul>
																			{materialsForLevel.map(m => (
																				<li key={m.id}>
																					<a href={m.educationalMaterial.link} target="_blank" rel="noopener noreferrer">
																						{m.educationalMaterial.name}
																					</a>
																					<span className={styles.materialType}>
																						{m.educationalMaterial.type?.name || 'Материал'}
																					</span>
																					{editable && onRemoveMaterialFromLevel && (
																						<button
																							className={styles.removeMaterialBtn}
																							onClick={() => onRemoveMaterialFromLevel(m.id)}
																							title="Отвязать материал">
																							❌
																						</button>
																					)}
																				</li>
																			))}
																		</ul>
																	</div>
																)}
																
																{!levelCompetency.description && !levelCompetency.example && materialsForLevel.length === 0 && (
																	<p className={styles.noLevelData}>Нет описания и материалов для этого уровня</p>
																)}
															</div>
														)}
														
														{!levelCompetency && editable && (
															<div className={styles.addLevelPlaceholder}>
																<button
																	className={styles.addSpecificLevelBtn}
																	onClick={() => {
																		setSelectedCompetencyId(comp.id);
																		setNewLevelData({ ...newLevelData, proficiencyLevelId: level.id });
																		setShowAddLevelModal(true);
																	}}>
																	+ Добавить уровень "{level.name}"
																</button>
															</div>
														)}
													</div>
												);
											})}
										</div>
										
										{sortedLevels.length === 0 && (
											<div className={styles.emptyLevels}>
												<p>Нет добавленных уровней владения</p>
												{editable && (
													<small>Нажмите "Добавить уровень", чтобы описать уровни владения этой компетенцией</small>
												)}
											</div>
										)}
									</div>
								</div>
							)}
						</React.Fragment>
					);
				})}
			</div>

			<div className={styles.legend}>
				<span className={styles.legendTitle}>Уровни владения:</span>
				{proficiencyLevels.map(level => (
					<div key={level.id} className={styles.legendItem}>
						<span 
							className={styles.legendColor} 
							style={{ backgroundColor: getLevelColor(level.value) }}>
						</span>
						<span>{level.value} - {level.name}</span>
					</div>
				))}
			</div>

			{/* Модальное окно добавления уровня */}
			{showAddLevelModal && (
				<div className={styles.modalOverlay} onClick={() => setShowAddLevelModal(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Добавить уровень владения</h3>
						<div className={styles.formGroup}>
							<label>Уровень</label>
							<select
								value={newLevelData.proficiencyLevelId}
								onChange={(e) => setNewLevelData({ ...newLevelData, proficiencyLevelId: e.target.value })}>
								<option value=''>Выберите уровень</option>
								{proficiencyLevels.map(level => {
									const alreadyExists = competencyLevels.get(selectedCompetencyId || '')?.some(l => l.proficiencyLevelId === level.id);
									return (
										<option key={level.id} value={level.id} disabled={alreadyExists}>
											{level.name} (Уровень {level.value}) {alreadyExists ? ' - уже добавлен' : ''}
										</option>
									);
								})}
							</select>
						</div>
						<div className={styles.formGroup}>
							<label>Описание уровня</label>
							<textarea
								value={newLevelData.description}
								onChange={(e) => setNewLevelData({ ...newLevelData, description: e.target.value })}
								rows={3}
								placeholder="Опишите, что должен уметь сотрудник на этом уровне..."
							/>
						</div>
						<div className={styles.formGroup}>
							<label>Пример</label>
							<textarea
								value={newLevelData.example}
								onChange={(e) => setNewLevelData({ ...newLevelData, example: e.target.value })}
								rows={3}
								placeholder="Приведите пример задач или ситуаций..."
							/>
						</div>
						<div className={styles.modalActions}>
							<button className={styles.cancelBtn} onClick={() => setShowAddLevelModal(false)}>Отмена</button>
							<button className={styles.submitBtn} onClick={handleAddLevel} disabled={!newLevelData.proficiencyLevelId}>
								Добавить
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Модальное окно редактирования уровня */}
			{showEditLevelModal && selectedLevelCompetency && (
				<div className={styles.modalOverlay} onClick={() => setShowEditLevelModal(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>Редактировать уровень владения</h3>
						<div className={styles.formGroup}>
							<label>Уровень</label>
							<input
								type="text"
								value={selectedLevelCompetency.proficiencyLevel.name}
								disabled
								className={styles.disabledInput}
							/>
						</div>
						<div className={styles.formGroup}>
							<label>Описание уровня</label>
							<textarea
								value={editLevelData.description}
								onChange={(e) => setEditLevelData({ ...editLevelData, description: e.target.value })}
								rows={3}
								placeholder="Опишите, что должен уметь сотрудник на этом уровне..."
							/>
						</div>
						<div className={styles.formGroup}>
							<label>Пример</label>
							<textarea
								value={editLevelData.example}
								onChange={(e) => setEditLevelData({ ...editLevelData, example: e.target.value })}
								rows={3}
								placeholder="Приведите пример задач или ситуаций..."
							/>
						</div>
						<div className={styles.modalActions}>
							<button className={styles.cancelBtn} onClick={() => setShowEditLevelModal(false)}>Отмена</button>
							<button className={styles.submitBtn} onClick={handleUpdateLevel}>Сохранить</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CompetenciesMatrix;