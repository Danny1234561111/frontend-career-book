// competency-form.module.tsx (исправленная версия)
import React, { useState, useEffect, useRef } from 'react';
import styles from './competency-form.module.scss';

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

interface CompetencyFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (competency: CompetencyData) => void;
	initialData?: CompetencyData | null;
	mode?: 'create' | 'edit';
	competencyBlocks?: { id: string; name: string; categories?: Array<{ id: string; name: string; groups?: Array<{ id: string; name: string }> }> }[];
	materials?: { id: string; name: string; type: string }[];
	selectedMaterialIds?: string[];
	levels?: Array<{ id: string; name: string; value: number }>;
}

const levelLabels: { [key: number]: string } = {
	1: '1 - Базовые знания',
	2: '2 - Профессионал',
	3: '3 - Эксперт',
};

const CompetencyForm: React.FC<CompetencyFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	mode = 'create',
	competencyBlocks = [],
	materials = [],
	selectedMaterialIds = [],
	levels = [],
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
		level: 1,
		defenseTasks: '',
		acceptanceCriteria: '',
		article: '',
		materialIds: [],
	});

	const [expandedMaterials, setExpandedMaterials] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	
	// Состояния для каскадных селектов
	const [selectedBlockId, setSelectedBlockId] = useState<string>('');
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
	const [selectedGroupId, setSelectedGroupId] = useState<string>('');
	
	// Получаем выбранный блок
	const selectedBlock = competencyBlocks.find(b => b.id === selectedBlockId);
	// Получаем выбранную категорию
	const selectedCategory = selectedBlock?.categories?.find(c => c.id === selectedCategoryId);
	// Получаем доступные группы
	const availableGroups = selectedCategory?.groups || [];

	const prevInitialDataRef = useRef<CompetencyData | null | undefined>(null);
	const prevSelectedMaterialIdsRef = useRef<string[]>([]);

	// Обновляем форму при изменении initialData или selectedMaterialIds
	useEffect(() => {
		const hasChanged = initialData?.id !== prevInitialDataRef.current?.id;
		const materialsChanged = JSON.stringify(selectedMaterialIds) !== JSON.stringify(prevSelectedMaterialIdsRef.current);
		
		// Если открыт режим редактирования и есть initialData
		if (mode === 'edit' && initialData) {
			if (hasChanged) {
				console.log('Edit mode - new initialData:', initialData);
				// Используем materialIds из initialData (они должны быть правильными)
				const materialIds = initialData.materialIds || [];
				
				setFormData({
					...initialData,
					materialIds: materialIds,
				});
				setSelectedBlockId(initialData.blockId);
				setSelectedCategoryId(initialData.categoryId || '');
				setSelectedGroupId(initialData.groupId);
				
				if (materialIds.length > 0) {
					setExpandedMaterials(true);
				}
				prevInitialDataRef.current = initialData;
				prevSelectedMaterialIdsRef.current = materialIds;
			} else if (materialsChanged) {
				// Если изменились только материалы при том же initialData
				console.log('Edit mode - materials changed:', selectedMaterialIds);
				setFormData(prev => ({
					...prev,
					materialIds: selectedMaterialIds,
				}));
				if (selectedMaterialIds.length > 0) {
					setExpandedMaterials(true);
				}
				prevSelectedMaterialIdsRef.current = selectedMaterialIds;
			}
		}
		// Если режим создания
		else if (mode === 'create') {
			if (selectedMaterialIds.length > 0 && JSON.stringify(selectedMaterialIds) !== JSON.stringify(prevSelectedMaterialIdsRef.current)) {
				console.log('Create mode - selected materials:', selectedMaterialIds);
				setFormData(prev => ({
					...prev,
					materialIds: selectedMaterialIds,
				}));
				if (selectedMaterialIds.length > 0) {
					setExpandedMaterials(true);
				}
				prevSelectedMaterialIdsRef.current = selectedMaterialIds;
			}
		}
	}, [initialData, selectedMaterialIds, mode]);

	// Сбрасываем форму при закрытии
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
					level: 1,
					defenseTasks: '',
					acceptanceCriteria: '',
					article: '',
					materialIds: [],
				});
				setSelectedBlockId('');
				setSelectedCategoryId('');
				setSelectedGroupId('');
				setSearchQuery('');
				setExpandedMaterials(false);
				prevInitialDataRef.current = null;
				prevSelectedMaterialIdsRef.current = [];
			}, 300);
			return () => clearTimeout(timeout);
		}
	}, [isOpen]);

	// Обработчик выбора блока
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

	// Обработчик выбора категории
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

	// Обработчик выбора группы
	const handleGroupChange = (groupId: string) => {
		const group = availableGroups.find(g => g.id === groupId);
		setSelectedGroupId(groupId);
		
		setFormData(prev => ({
			...prev,
			groupId: groupId,
			groupName: group?.name || '',
		}));
	};

	const handleMaterialToggle = (materialId: string) => {
		setFormData(prev => ({
			...prev,
			materialIds: prev.materialIds?.includes(materialId)
				? prev.materialIds.filter((id) => id !== materialId)
				: [...(prev.materialIds || []), materialId],
		}));
	};

	const filteredMaterials = materials.filter(material =>
		material.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

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
		
		setIsSubmitting(true);
		
		try {
			await onSubmit?.(formData);
			handleClose();
		} catch (error) {
			console.error('Error submitting form:', error);
			alert('Ошибка при сохранении компетенции');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			<div className={styles.overlay} onClick={handleClose} />
			<div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
				<div className={styles.drawerHeader}>
					<h3>
						{mode === 'create'
							? 'Добавить компетенцию'
							: 'Редактировать компетенцию'}
					</h3>
					<button className={styles.closeBtn} onClick={handleClose}>
						×
					</button>
				</div>

				<div className={styles.drawerContent}>
					<form onSubmit={handleSubmit}>
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

						{/* Каскадные селекты для выбора иерархии */}
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
								<label>Категория *</label>
								<select
									value={selectedCategoryId}
									onChange={(e) => handleCategoryChange(e.target.value)}
									required
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
							<label>Уровень компетенции *</label>
							<select
								value={formData.level}
								onChange={(e) =>
									setFormData({
										...formData,
										level: parseInt(e.target.value),
									})
								}
								required
								className={styles.levelSelect}
								disabled={isSubmitting}>
								{Object.entries(levelLabels).map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</div>

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
							<label>Теоретическая статья</label>
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

						{materials.length > 0 && (
							<div className={styles.formGroup}>
								<div 
									className={styles.materialsHeader}
									onClick={() => setExpandedMaterials(!expandedMaterials)}>
									<span className={styles.expandIcon}>
										{expandedMaterials ? '▼' : '▶'}
									</span>
									<label>Привязанные материалы (опционально)</label>
									<span className={styles.materialsCount}>
										({formData.materialIds?.length || 0} выбрано)
									</span>
								</div>

								{expandedMaterials && (
									<div className={styles.materialsSection}>
										<div className={styles.searchWrapper}>
											<input
												type='text'
												placeholder='Поиск материалов...'
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className={styles.searchInput}
												disabled={isSubmitting}
											/>
											<span className={styles.searchIcon}>🔍</span>
										</div>

										<div className={styles.materialsList}>
											{filteredMaterials.map((material) => (
												<label key={material.id} className={styles.materialItem}>
													<input
														type='checkbox'
														checked={formData.materialIds?.includes(material.id) || false}
														onChange={() => handleMaterialToggle(material.id)}
														disabled={isSubmitting}
													/>
													<span className={styles.materialName}>
														{material.name}
													</span>
													<span className={styles.materialType}>
														{material.type}
													</span>
												</label>
											))}
										</div>
										{filteredMaterials.length === 0 && (
											<div className={styles.emptyMaterials}>
												<p>Материалы не найдены</p>
											</div>
										)}
									</div>
								)}
							</div>
						)}
						
						<div className={styles.hint}>
							💡 <strong>Примечание:</strong> Привязка материалов к компетенции необязательна.
						</div>
					</form>
				</div>

				<div className={styles.drawerFooter}>
					<button
						type='button'
						onClick={handleClose}
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
		</>
	);
};

export default CompetencyForm;