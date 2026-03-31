// competency-form.module.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './competency-form.module.scss';

interface CompetencyData {
	id?: string;
	name: string;
	blockId: string;
	blockName: string;
	description: string;
	level: 1 | 2 | 3;
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

const levelLabels = {
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
		blockId: '',
		blockName: '',
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
	
	// Используем ref для отслеживания предыдущего initialData
	const prevInitialDataRef = useRef<CompetencyData | null | undefined>(null);
	const isFirstOpenRef = useRef(true);

	// Обновляем форму только при изменении initialData (когда открывается новая компетенция)
	useEffect(() => {
		// Проверяем, действительно ли изменился initialData
		const hasChanged = initialData?.id !== prevInitialDataRef.current?.id;
		
		if (initialData && hasChanged) {
			console.log('Form received new initialData:', initialData);
			setFormData(initialData);
			
			if (initialData.materialIds && initialData.materialIds.length > 0) {
				setExpandedMaterials(true);
			}
			prevInitialDataRef.current = initialData;
		} else if (!initialData && mode === 'create' && isFirstOpenRef.current) {
			// При создании новой компетенции, если переданы выбранные материалы
			if (selectedMaterialIds.length > 0) {
				setFormData(prev => ({
					...prev,
					materialIds: selectedMaterialIds,
				}));
				setExpandedMaterials(true);
			}
			isFirstOpenRef.current = false;
		}
	}, [initialData, selectedMaterialIds, mode]);

	// Сбрасываем форму при закрытии
	useEffect(() => {
		if (!isOpen) {
			// Не сбрасываем сразу, чтобы избежать моргания
			const timeout = setTimeout(() => {
				if (mode === 'create') {
					setFormData({
						name: '',
						blockId: '',
						blockName: '',
						description: '',
						level: 1,
						defenseTasks: '',
						acceptanceCriteria: '',
						article: '',
						materialIds: [],
					});
					setSearchQuery('');
					setExpandedMaterials(false);
				}
				isFirstOpenRef.current = true;
				prevInitialDataRef.current = null;
			}, 300);
			return () => clearTimeout(timeout);
		}
	}, [isOpen, mode]);

	const handleBlockChange = (blockId: string) => {
		const selectedBlock = competencyBlocks.find((b) => b.id === blockId);
		setFormData((prev) => ({
			...prev,
			blockId,
			blockName: selectedBlock?.name || '',
		}));
	};

	const handleMaterialToggle = (materialId: string) => {
		setFormData((prev) => ({
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
		
		if (!formData.blockId) {
			alert('Выберите блок компетенций');
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
								placeholder='Например: Работа со средой разработки 1С 8.2 и 8.3'
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.formRow}>
							<div className={styles.formGroup}>
								<label>Блок компетенций *</label>
								<select
									value={formData.blockId}
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

							<div className={styles.formGroup}>
								<label>Уровень компетенции *</label>
								<select
									value={formData.level}
									onChange={(e) =>
										setFormData({
											...formData,
											level: parseInt(e.target.value) as 1 | 2 | 3,
										})
									}
									required
									className={styles.levelSelect}
									disabled={isSubmitting}>
									<option value='1'>{levelLabels[1]}</option>
									<option value='2'>{levelLabels[2]}</option>
									<option value='3'>{levelLabels[3]}</option>
								</select>
							</div>
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
						
						{/* Подсказка о необязательности материалов */}
						<div className={styles.hint}>
							💡 <strong>Примечание:</strong> Привязка материалов к компетенции необязательна. Вы можете создать компетенцию без материалов и добавить их позже через управление материалами.
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