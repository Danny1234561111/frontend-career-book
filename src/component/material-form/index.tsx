import React, { useState, useEffect } from 'react';
import styles from './material-form.module.scss';

interface MaterialFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (material: MaterialData) => void;
	initialData?: MaterialData;
	mode?: 'create' | 'edit';
	competencyBlocks?: CompetencyBlock[];
}

export interface MaterialData {
	id?: string;
	name: string;
	type: 'video' | 'article' | 'book' | 'course';
	competencyIds: string[];
	url: string;
	description?: string;
	status?: 'published' | 'draft' | 'moderation';
}

interface CompetencyBlock {
	id: string;
	name: string;
	competencies: CompetencyItem[];
}

interface CompetencyItem {
	id: string;
	name: string;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	mode = 'create',
	competencyBlocks = [],
}) => {
	const [formData, setFormData] = useState<MaterialData>(
		initialData || {
			name: '',
			type: 'article',
			competencyIds: [],
			url: '',
			description: '',
		}
	);

	const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (initialData) {
			console.log('Setting form data from initialData:', initialData);
			setFormData(initialData);
			
			// Автоматически раскрываем блоки, в которых есть выбранные компетенции
			if (initialData.competencyIds && initialData.competencyIds.length > 0) {
				const blocksToExpand = competencyBlocks
					.filter(block => 
						block.competencies.some(comp => 
							initialData.competencyIds?.includes(comp.id)
						)
					)
					.map(block => block.id);
				setExpandedBlocks(blocksToExpand);
			}
		}
	}, [initialData, competencyBlocks]);

	// Фильтрация блоков и компетенций по поиску
	const filteredBlocks = competencyBlocks
		.map(block => {
			const filteredCompetencies = block.competencies.filter(comp =>
				comp.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
			return { ...block, competencies: filteredCompetencies };
		})
		.filter(block => block.competencies.length > 0 || block.name.toLowerCase().includes(searchQuery.toLowerCase()));

	const toggleBlock = (blockId: string) => {
		setExpandedBlocks((prev) =>
			prev.includes(blockId)
				? prev.filter((id) => id !== blockId)
				: [...prev, blockId]
		);
	};

	const handleCompetencyToggle = (competencyId: string) => {
		setFormData((prev) => ({
			...prev,
			competencyIds: prev.competencyIds.includes(competencyId)
				? prev.competencyIds.filter((id) => id !== competencyId)
				: [...prev.competencyIds, competencyId],
		}));
	};

	const handleSelectAllInBlock = (blockId: string, competencyIds: string[]) => {
		const allSelected = competencyIds.every((id) =>
			formData.competencyIds.includes(id)
		);

		setFormData((prev) => ({
			...prev,
			competencyIds: allSelected
				? prev.competencyIds.filter((id) => !competencyIds.includes(id))
				: [...new Set([...prev.competencyIds, ...competencyIds])],
		}));
	};

	const validateForm = (): boolean => {
		if (!formData.name.trim()) {
			alert('Введите название материала');
			return false;
		}

		if (!formData.url.trim()) {
			alert('Введите ссылку на материал');
			return false;
		}

		if (formData.competencyIds.length === 0) {
			alert('Выберите хотя бы одну компетенцию');
			return false;
		}

		// Проверка URL
		try {
			new URL(formData.url);
		} catch {
			alert('Введите корректный URL (например: https://example.com)');
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) return;
		
		setIsSubmitting(true);
		
		try {
			console.log('Submitting material:', formData);
			await onSubmit?.(formData);
			handleClose();
		} catch (error) {
			console.error('Error submitting form:', error);
			alert('Ошибка при сохранении материала');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (mode === 'create') {
			setFormData({
				name: '',
				type: 'article',
				competencyIds: [],
				url: '',
				description: '',
			});
			setSearchQuery('');
			setExpandedBlocks([]);
		}
		onClose();
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

	const getTypeLabel = (type: string) => {
		const labels = {
			video: 'Видеокурс',
			article: 'Статья',
			book: 'Книга',
			course: 'Курс',
		};
		return labels[type as keyof typeof labels] || type;
	};

	if (!isOpen) return null;

	return (
		<>
			<div className={styles.overlay} onClick={handleClose} />
			<div className={`${styles.drawer} ${isOpen ? styles.open : ''}`}>
				<div className={styles.drawerHeader}>
					<h3>
						{mode === 'create' ? 'Добавить материал' : 'Редактировать материал'}
					</h3>
					<button className={styles.closeBtn} onClick={handleClose}>
						×
					</button>
				</div>

				<div className={styles.drawerContent}>
					<form onSubmit={handleSubmit}>
						<div className={styles.formGroup}>
							<label>Наименование *</label>
							<input
								type='text'
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
								placeholder='Введите название материала'
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.formRow}>
							<div className={styles.formGroup}>
								<label>Тип материала *</label>
								<select
									value={formData.type}
									onChange={(e) =>
										setFormData({ ...formData, type: e.target.value as any })
									}
									required
									disabled={isSubmitting}>
									<option value='video'>🎥 Видеокурс</option>
									<option value='article'>📄 Статья</option>
									<option value='book'>📚 Книга</option>
									<option value='course'>🎓 Курс</option>
								</select>
							</div>

							<div className={styles.formGroup}>
								<label>Ссылка на материал *</label>
								<input
									type='url'
									value={formData.url}
									onChange={(e) =>
										setFormData({ ...formData, url: e.target.value })
									}
									required
									placeholder='https://...'
									disabled={isSubmitting}
								/>
							</div>
						</div>

						<div className={styles.formGroup}>
							<label>Описание</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								rows={3}
								placeholder='Краткое описание материала'
								disabled={isSubmitting}
							/>
						</div>

						<div className={styles.formGroup}>
							<label>Привязка к компетенциям *</label>
							<p className={styles.hint}>
								Выберите компетенции, к которым относится этот материал
							</p>

							{/* Поиск компетенций */}
							<div className={styles.searchWrapper}>
								<input
									type='text'
									placeholder='Поиск по названию компетенции...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className={styles.searchInput}
									disabled={isSubmitting}
								/>
								<span className={styles.searchIcon}>🔍</span>
							</div>

							<div className={styles.competenciesTree}>
								{filteredBlocks.length > 0 ? (
									filteredBlocks.map((block) => (
										<div key={block.id} className={styles.blockItem}>
											<div
												className={styles.blockHeader}
												onClick={() => toggleBlock(block.id)}>
												<span className={styles.expandIcon}>
													{expandedBlocks.includes(block.id) ? '▼' : '▶'}
												</span>
												<span className={styles.blockName}>{block.name}</span>
												<span className={styles.blockCount}>
													({block.competencies.length})
												</span>
												<button
													type='button'
													className={styles.selectAllBtn}
													onClick={(e) => {
														e.stopPropagation();
														handleSelectAllInBlock(
															block.id,
															block.competencies.map((c) => c.id)
														);
													}}
													disabled={isSubmitting}>
													{block.competencies.every((c) =>
														formData.competencyIds.includes(c.id)
													)
														? 'Снять все'
														: 'Выбрать все'}
												</button>
											</div>

											{(expandedBlocks.includes(block.id) || searchQuery) && (
												<div className={styles.competenciesList}>
													{block.competencies.map((comp) => (
														<label
															key={comp.id}
															className={styles.competencyItem}>
															<input
																type='checkbox'
																checked={formData.competencyIds.includes(comp.id)}
																onChange={() => handleCompetencyToggle(comp.id)}
																disabled={isSubmitting}
															/>
															<span className={styles.competencyName}>
																{comp.name}
															</span>
														</label>
													))}
												</div>
											)}
										</div>
									))
								) : (
									<div className={styles.emptyCompetencies}>
										<p>Компетенции не найдены</p>
										{searchQuery && (
											<p className={styles.searchHint}>
												Попробуйте изменить поисковый запрос
											</p>
										)}
									</div>
								)}
							</div>

							<div className={styles.selectedCount}>
								Выбрано компетенций:{' '}
								<strong>{formData.competencyIds.length}</strong>
							</div>
						</div>

						{/* Превью выбранного типа */}
						<div className={styles.typePreview}>
							<span className={styles.previewIcon}>
								{getTypeIcon(formData.type)}
							</span>
							<span className={styles.previewText}>
								{getTypeLabel(formData.type)}
							</span>
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
							: (mode === 'create' ? 'Создать материал' : 'Сохранить изменения')}
					</button>
				</div>
			</div>
		</>
	);
};

export default MaterialForm;