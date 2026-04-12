import React, { useState, useEffect } from 'react';
import styles from './competency-form.module.scss';

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

interface CompetencyFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (competency: CompetencyData) => Promise<boolean> | void;
	initialData?: CompetencyData | null;
	mode?: 'create' | 'edit';
	competencyBlocks?: { id: string; name: string; categories?: Array<{ id: string; name: string; groups?: Array<{ id: string; name: string }> }> }[];
	materials?: { id: string; name: string; type: string }[];
	availableLevels?: Array<{ id: string; name: string; value: number }>;
}

const CompetencyForm: React.FC<CompetencyFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	mode = 'create',
	competencyBlocks = [],
	materials = [],
	availableLevels = [],
}) => {
	const [formData, setFormData] = useState<CompetencyData>({
		name: '',
		groupId: '',
		groupName: '',
		blockId: '',
		blockName: '',
		categoryId: '',
		categoryName: '',
		description: '',
		defenseTasks: '',
		acceptanceCriteria: '',
		article: '',
		levels: [],
	});

	const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());
	const [searchQuery, setSearchQuery] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	const [selectedBlockId, setSelectedBlockId] = useState<string>('');
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
	const [selectedGroupId, setSelectedGroupId] = useState<string>('');
	
	const [showAddLevelModal, setShowAddLevelModal] = useState(false);
	const [editingLevelIndex, setEditingLevelIndex] = useState<number | null>(null);
	const [newLevelData, setNewLevelData] = useState<CompetencyLevel>({
		levelId: '',
		levelName: '',
		levelValue: 1,
		description: '',
		example: '',
		materialIds: [],
	});
	
	const selectedBlock = competencyBlocks.find(b => b.id === selectedBlockId);
	const selectedCategory = selectedBlock?.categories?.find(c => c.id === selectedCategoryId);
	const availableGroups = selectedCategory?.groups || [];

	const getLevelById = (levelId: string) => {
		return availableLevels.find(l => l.id === levelId);
	};

	const getLevelColor = (value: number): string => {
		const colors = ['', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];
		return colors[value] || '#9e9e9e';
	};

	const getLevelIcon = (value: number): string => {
		const icons = ['', '🌱', '⭐', '🏆', '🚀', '👑'];
		return icons[value] || '📚';
	};

	// Получаем все ID материалов, уже привязанных к ЛЮБЫМ уровням (кроме редактируемого)
	const getAllUsedMaterialIds = (exceptLevelId?: string): Set<string> => {
		const usedMaterialIds = new Set<string>();
		
		formData.levels.forEach(level => {
			if (exceptLevelId && level.levelId === exceptLevelId) {
				return;
			}
			level.materialIds.forEach(mid => usedMaterialIds.add(mid));
		});
		
		return usedMaterialIds;
	};

	// Получаем доступные материалы для текущего редактируемого уровня
	const getAvailableMaterialsForCurrentLevel = (): typeof materials => {
		const currentLevelId = editingLevelIndex !== null 
			? formData.levels[editingLevelIndex]?.levelId 
			: newLevelData.levelId;
		
		const usedByOtherLevels = getAllUsedMaterialIds(currentLevelId);
		
		return materials.filter(material => !usedByOtherLevels.has(material.id));
	};

	// Фильтруем материалы для модального окна
	const getFilteredMaterialsForModal = () => {
		const availableMaterials = getAvailableMaterialsForCurrentLevel();
		
		return availableMaterials.filter(material => {
			const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesSearch;
		});
	};

	const handleMaterialToggleInModal = (materialId: string) => {
		setNewLevelData(prev => {
			const newIds = prev.materialIds.includes(materialId)
				? prev.materialIds.filter(id => id !== materialId)
				: [...prev.materialIds, materialId];
			return { ...prev, materialIds: newIds };
		});
	};

	const handleLevelChangeInModal = (levelId: string) => {
		const level = getLevelById(levelId);
		setNewLevelData({
			levelId: levelId,
			levelName: level?.name || '',
			levelValue: level?.value || 1,
			description: '',
			example: '',
			materialIds: [],
		});
	};

	useEffect(() => {
		if (isOpen && mode === 'edit' && initialData) {
			setFormData({
				id: initialData.id,
				name: initialData.name || '',
				groupId: initialData.groupId || '',
				groupName: initialData.groupName || '',
				blockId: initialData.blockId || '',
				blockName: initialData.blockName || '',
				categoryId: initialData.categoryId || '',
				categoryName: initialData.categoryName || '',
				description: initialData.description || '',
				defenseTasks: initialData.defenseTasks || '',
				acceptanceCriteria: initialData.acceptanceCriteria || '',
				article: initialData.article || '',
				levels: initialData.levels || [],
			});
			
			setSelectedBlockId(initialData.blockId || '');
			setSelectedCategoryId(initialData.categoryId || '');
			setSelectedGroupId(initialData.groupId || '');
		}
	}, [isOpen, mode, initialData]);

	useEffect(() => {
		if (!isOpen) {
			const timeout = setTimeout(() => {
				setFormData({
					name: '',
					groupId: '',
					groupName: '',
					blockId: '',
					blockName: '',
					categoryId: '',
					categoryName: '',
					description: '',
					defenseTasks: '',
					acceptanceCriteria: '',
					article: '',
					levels: [],
				});
				setSelectedBlockId('');
				setSelectedCategoryId('');
				setSelectedGroupId('');
				setSearchQuery('');
				setExpandedLevels(new Set());
			}, 300);
			return () => clearTimeout(timeout);
		}
	}, [isOpen]);

	const handleBlockChange = (blockId: string) => {
		const block = competencyBlocks.find(b => b.id === blockId);
		setSelectedBlockId(blockId);
		setSelectedCategoryId('');
		setSelectedGroupId('');
		
		setFormData(prev => ({
			...prev,
			blockId: blockId,
			blockName: block?.name || '',
			categoryId: '',
			categoryName: '',
			groupId: '',
			groupName: '',
		}));
	};

	const handleCategoryChange = (categoryId: string) => {
		const category = selectedBlock?.categories?.find(c => c.id === categoryId);
		setSelectedCategoryId(categoryId);
		setSelectedGroupId('');
		
		setFormData(prev => ({
			...prev,
			categoryId: categoryId,
			categoryName: category?.name || '',
			groupId: '',
			groupName: '',
		}));
	};

	const handleGroupChange = (groupId: string) => {
		const group = availableGroups.find(g => g.id === groupId);
		setSelectedGroupId(groupId);
		
		setFormData(prev => ({
			...prev,
			groupId: groupId,
			groupName: group?.name || '',
		}));
	};

	const handleMaterialToggleForLevel = (levelIndex: number, materialId: string) => {
		setFormData(prev => {
			const updatedLevels = [...prev.levels];
			const level = updatedLevels[levelIndex];
			const materialIds = level.materialIds.includes(materialId)
				? level.materialIds.filter(id => id !== materialId)
				: [...level.materialIds, materialId];
			updatedLevels[levelIndex] = { ...level, materialIds };
			return { ...prev, levels: updatedLevels };
		});
	};

	const handleDescriptionChangeForLevel = (levelIndex: number, field: 'description' | 'example', value: string) => {
		setFormData(prev => {
			const updatedLevels = [...prev.levels];
			const level = updatedLevels[levelIndex];
			updatedLevels[levelIndex] = { ...level, [field]: value };
			return { ...prev, levels: updatedLevels };
		});
	};

	const handleAddLevel = () => {
		if (!newLevelData.levelId) {
			alert('Выберите уровень владения');
			return;
		}
		
		const selectedLevel = getLevelById(newLevelData.levelId);
		if (!selectedLevel) return;
		
		const levelExists = formData.levels.some(l => l.levelId === newLevelData.levelId);
		if (levelExists) {
			alert('Этот уровень уже добавлен');
			return;
		}
		
		const newLevel: CompetencyLevel = {
			levelId: newLevelData.levelId,
			levelName: selectedLevel.name,
			levelValue: selectedLevel.value,
			description: newLevelData.description || '',
			example: newLevelData.example || '',
			materialIds: newLevelData.materialIds || [],
		};
		
		const updatedLevels = [...formData.levels, newLevel].sort((a, b) => a.levelValue - b.levelValue);
		
		setFormData(prev => ({
			...prev,
			levels: updatedLevels,
		}));
		
		setShowAddLevelModal(false);
		setNewLevelData({
			levelId: '',
			levelName: '',
			levelValue: 1,
			description: '',
			example: '',
			materialIds: [],
		});
	};

	const handleEditLevel = () => {
		if (editingLevelIndex === null) return;
		
		const updatedLevels = [...formData.levels];
		updatedLevels[editingLevelIndex] = {
			...updatedLevels[editingLevelIndex],
			description: newLevelData.description,
			example: newLevelData.example,
			materialIds: newLevelData.materialIds,
		};
		
		setFormData(prev => ({
			...prev,
			levels: updatedLevels,
		}));
		
		setShowAddLevelModal(false);
		setEditingLevelIndex(null);
		setNewLevelData({
			levelId: '',
			levelName: '',
			levelValue: 1,
			description: '',
			example: '',
			materialIds: [],
		});
	};

	const handleRemoveLevel = (index: number) => {
		const updatedLevels = formData.levels.filter((_, i) => i !== index);
		setFormData(prev => ({ ...prev, levels: updatedLevels }));
	};

	const openAddLevelModal = () => {
		setEditingLevelIndex(null);
		setNewLevelData({
			levelId: '',
			levelName: '',
			levelValue: 1,
			description: '',
			example: '',
			materialIds: [],
		});
		setSearchQuery('');
		setShowAddLevelModal(true);
	};

	const openEditLevelModal = (index: number) => {
		const level = formData.levels[index];
		setEditingLevelIndex(index);
		setNewLevelData({
			levelId: level.levelId,
			levelName: level.levelName,
			levelValue: level.levelValue,
			description: level.description || '',
			example: level.example || '',
			materialIds: level.materialIds || [],
		});
		setSearchQuery('');
		setShowAddLevelModal(true);
	};

	const toggleLevelExpand = (index: number) => {
		const newExpanded = new Set(expandedLevels);
		if (newExpanded.has(index)) {
			newExpanded.delete(index);
		} else {
			newExpanded.add(index);
		}
		setExpandedLevels(newExpanded);
	};

	const filteredMaterialsForModal = getFilteredMaterialsForModal();
	const availableMaterialsForModal = getAvailableMaterialsForCurrentLevel();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!formData.name.trim()) {
			alert('Введите название компетенции');
			return;
		}
		
		if (!formData.groupId) {
			alert('Выберите группу компетенций');
			return;
		}
		
		if (formData.levels.length === 0) {
			alert('Добавьте хотя бы один уровень владения компетенцией');
			return;
		}
		
		setIsSubmitting(true);
		
		try {
			if (onSubmit) {
				await onSubmit(formData);
				onClose();
			}
		} catch (error) {
			console.error('Error submitting form:', error);
			alert('Ошибка при сохранении компетенции');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<>
			<div className={styles.overlay} onClick={onClose} />
			<div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
				<div className={styles.drawerHeader}>
					<h3>
						{mode === 'create'
							? 'Добавить компетенцию'
							: 'Редактировать компетенцию'}
					</h3>
					<button className={styles.closeBtn} onClick={onClose}>
						×
					</button>
				</div>

				<div className={styles.drawerContent}>
					<form onSubmit={handleSubmit}>
						<div className={styles.section}>
							<h4 className={styles.sectionTitle}>Основная информация</h4>
							
							<div className={styles.formGroup}>
								<label>Название компетенции *</label>
								<input
									type='text'
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
									placeholder='Введите название компетенции'
									disabled={isSubmitting}
								/>
							</div>

							<div className={styles.formGroup}>
								<label>Блок компетенций *</label>
								<select
									value={selectedBlockId}
									onChange={(e) => handleBlockChange(e.target.value)}
									required
									disabled={isSubmitting}>
									<option value=''>Выберите блок</option>
									{competencyBlocks.map((block) => (
										<option key={block.id} value={block.id}>
											{block.name}
										</option>
									))}
								</select>
							</div>

							{selectedBlock && selectedBlock.categories && selectedBlock.categories.length > 0 && (
								<div className={styles.formGroup}>
									<label>Категория</label>
									<select
										value={selectedCategoryId}
										onChange={(e) => handleCategoryChange(e.target.value)}
										disabled={isSubmitting}>
										<option value=''>Выберите категорию</option>
										{selectedBlock.categories.map((category) => (
											<option key={category.id} value={category.id}>
												{category.name}
											</option>
										))}
									</select>
								</div>
							)}

							{availableGroups.length > 0 && (
								<div className={styles.formGroup}>
									<label>Группа *</label>
									<select
										value={selectedGroupId}
										onChange={(e) => handleGroupChange(e.target.value)}
										required
										disabled={isSubmitting}>
										<option value=''>Выберите группу</option>
										{availableGroups.map((group) => (
											<option key={group.id} value={group.id}>
												{group.name}
											</option>
										))}
									</select>
								</div>
							)}

							<div className={styles.formGroup}>
								<label>Описание компетенции</label>
								<textarea
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									rows={4}
									placeholder='Общее описание компетенции...'
									disabled={isSubmitting}
								/>
							</div>

							<div className={styles.formGroup}>
								<label>Полученные знания</label>
								<textarea
									value={formData.article}
									onChange={(e) =>
										setFormData({ ...formData, article: e.target.value })
									}
									rows={4}
									placeholder='Ссылка на статью или текст статьи...'
									disabled={isSubmitting}
								/>
							</div>

							<div className={styles.formGroup}>
								<label>Задания для защиты</label>
								<textarea
									value={formData.defenseTasks}
									onChange={(e) =>
										setFormData({ ...formData, defenseTasks: e.target.value })
									}
									rows={4}
									placeholder='Практические задания для подтверждения владения компетенцией...'
									disabled={isSubmitting}
								/>
							</div>

							<div className={styles.formGroup}>
								<label>Критерии приема</label>
								<textarea
									value={formData.acceptanceCriteria}
									onChange={(e) =>
										setFormData({
											...formData,
											acceptanceCriteria: e.target.value,
										})
									}
									rows={4}
									placeholder='Критерии оценки выполнения заданий...'
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<div className={styles.section}>
							<div className={styles.sectionHeader}>
								<h4 className={styles.sectionTitle}>Уровни владения компетенцией *</h4>
								<button
									type="button"
									className={styles.addLevelBtn}
									onClick={openAddLevelModal}
									disabled={isSubmitting}>
									+ Добавить уровень
								</button>
							</div>

							<div className={styles.levelsList}>
								{formData.levels.length === 0 && (
									<div className={styles.emptyLevels}>
										<p>Нет добавленных уровней</p>
										<small>Нажмите "Добавить уровень", чтобы описать уровни владения этой компетенцией</small>
									</div>
								)}
								
								{formData.levels.map((level, index) => {
									const isExpanded = expandedLevels.has(index);
									const levelColor = getLevelColor(level.levelValue);
									
									return (
										<div key={index} className={styles.levelCard}>
											<div 
												className={styles.levelHeader}
												style={{ borderLeftColor: levelColor }}
												onClick={() => toggleLevelExpand(index)}>
												<div className={styles.levelTitle}>
													<span className={styles.levelIcon}>{getLevelIcon(level.levelValue)}</span>
													<span className={styles.levelName}>{level.levelName}</span>
													<span className={styles.levelValue}>Уровень {level.levelValue}</span>
													{level.materialIds.length > 0 && (
														<span className={styles.materialsBadge}>
															📚 {level.materialIds.length} материалов
														</span>
													)}
												</div>
												<div className={styles.levelActions} onClick={(e) => e.stopPropagation()}>
													<button
														type="button"
														className={styles.editLevelBtn}
														onClick={() => openEditLevelModal(index)}
														title="Редактировать уровень">
														✏️
													</button>
													<button
														type="button"
														className={styles.removeLevelBtn}
														onClick={() => handleRemoveLevel(index)}
														title="Удалить уровень">
														🗑️
													</button>
													<span className={styles.expandIcon}>
														{isExpanded ? '▲' : '▼'}
													</span>
												</div>
											</div>
											
											{isExpanded && (
												<div className={styles.levelContent}>
													<div className={styles.formGroup}>
														<label>Описание уровня</label>
														<textarea
															value={level.description}
															onChange={(e) => handleDescriptionChangeForLevel(index, 'description', e.target.value)}
															rows={3}
															placeholder="Опишите, что должен уметь сотрудник на этом уровне..."
															disabled={isSubmitting}
														/>
													</div>
													
													<div className={styles.formGroup}>
														<label>Пример</label>
														<textarea
															value={level.example}
															onChange={(e) => handleDescriptionChangeForLevel(index, 'example', e.target.value)}
															rows={3}
															placeholder="Приведите пример задач или ситуаций..."
															disabled={isSubmitting}
														/>
													</div>
													
													{materials.length > 0 && (
														<div className={styles.levelMaterialsSection}>
															<strong>Учебные материалы для этого уровня:</strong>
															<div className={styles.materialsList}>
																{materials.map(material => {
																	const usedByOtherLevels = getAllUsedMaterialIds(level.levelId);
																	const isSelected = level.materialIds.includes(material.id);
																	const isDisabled = !isSelected && usedByOtherLevels.has(material.id);
																	
																	return (
																		<label 
																			key={material.id} 
																			className={`${styles.materialItem} ${isDisabled ? styles.disabledMaterial : ''}`}
																			title={isDisabled ? 'Этот материал уже используется на другом уровне' : ''}>
																			<input
																				type="checkbox"
																				checked={isSelected}
																				onChange={() => handleMaterialToggleForLevel(index, material.id)}
																				disabled={isDisabled || isSubmitting}
																			/>
																			<span className={styles.materialName}>{material.name}</span>
																			<span className={styles.materialType}>{material.type}</span>
																		</label>
																	);
																})}
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>
						
						<div className={styles.hint}>
							💡 <strong>Примечание:</strong> Для каждой компетенции необходимо добавить хотя бы один уровень владения. 
							Каждому уровню можно привязать учебные материалы. Один материал может быть привязан только к одному уровню в рамках компетенции.
						</div>
					</form>
				</div>

				<div className={styles.drawerFooter}>
					<button
						type='button'
						onClick={onClose}
						className={styles.cancelBtn}
						disabled={isSubmitting}>
						Отмена
					</button>
					<button
						type='submit'
						onClick={handleSubmit}
						className={styles.submitBtn}
						disabled={isSubmitting}>
						{isSubmitting 
							? 'Сохранение...' 
							: (mode === 'create' ? 'Создать компетенцию' : 'Сохранить изменения')}
					</button>
				</div>
			</div>

			{showAddLevelModal && (
				<div className={styles.modal} onClick={() => setShowAddLevelModal(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<h3>{editingLevelIndex !== null ? 'Редактировать уровень' : 'Добавить уровень владения'}</h3>
						
						<div className={styles.formGroup}>
							<label>Уровень владения *</label>
							<select
								value={newLevelData.levelId}
								onChange={(e) => handleLevelChangeInModal(e.target.value)}
								disabled={editingLevelIndex !== null}>
								<option value=''>Выберите уровень</option>
								{availableLevels
									.filter(level => 
										editingLevelIndex !== null || 
										!formData.levels.some(l => l.levelId === level.id)
									)
									.map(level => (
										<option key={level.id} value={level.id}>
											{level.name} (Уровень {level.value})
										</option>
									))}
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
						
						{materials.length > 0 && (
							<div className={styles.formGroup}>
								<label>Учебные материалы для этого уровня</label>
								<div className={styles.modalMaterialsList}>
									<div className={styles.searchWrapper}>
										<input
											type='text'
											placeholder='Поиск материалов...'
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className={styles.searchInput}
										/>
									</div>
									<div className={styles.materialsCheckList}>
										{availableMaterialsForModal.length === 0 && (
											<div className={styles.noMaterials}>
												{searchQuery ? 'Материалы не найдены' : 'Нет доступных материалов (все уже привязаны к другим уровням)'}
											</div>
										)}
										{filteredMaterialsForModal.map(material => {
											const isSelected = newLevelData.materialIds.includes(material.id);
											return (
												<label key={material.id} className={styles.materialItem}>
													<input
														type='checkbox'
														checked={isSelected}
														onChange={() => handleMaterialToggleInModal(material.id)}
													/>
													<span className={styles.materialName}>{material.name}</span>
													<span className={styles.materialType}>{material.type}</span>
												</label>
											);
										})}
									</div>
								</div>
							</div>
						)}
						
						<div className={styles.modalActions}>
							<button type="button" onClick={() => setShowAddLevelModal(false)}>Отмена</button>
							<button type="button" onClick={editingLevelIndex !== null ? handleEditLevel : handleAddLevel}>
								{editingLevelIndex !== null ? 'Сохранить' : 'Добавить'}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default CompetencyForm;