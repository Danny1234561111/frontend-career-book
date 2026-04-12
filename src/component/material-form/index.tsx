import React, { useState, useEffect } from 'react';
import styles from './material-form.module.scss';

interface MaterialFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (material: MaterialData) => void;
	initialData?: MaterialData;
	mode?: 'create' | 'edit';
	materialTypes?: MaterialType[];
}

export interface MaterialData {
	id?: string;
	name: string;
	typeId: string;
	url: string;
	description?: string;
	duration?: number;
}

interface MaterialType {
	id: string;
	name: string;
}

const MaterialForm: React.FC<MaterialFormProps> = ({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	mode = 'create',
	materialTypes = [],
}) => {
	const [formData, setFormData] = useState<MaterialData>(
		initialData || {
			name: '',
			typeId: '',
			url: '',
			description: '',
			duration: 0,
		}
	);

	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (initialData) {
			setFormData(initialData);
		}
	}, [initialData]);

	const validateForm = (): boolean => {
		if (!formData.name.trim()) {
			alert('Введите название материала');
			return false;
		}

		if (!formData.typeId) {
			alert('Выберите тип материала');
			return false;
		}

		if (!formData.url.trim()) {
			alert('Введите ссылку на материал');
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
				typeId: '',
				url: '',
				description: '',
				duration: 0,
			});
		}
		onClose();
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
									value={formData.typeId}
									onChange={(e) =>
										setFormData({ ...formData, typeId: e.target.value })
									}
									required
									disabled={isSubmitting}>
									<option value=''>Выберите тип</option>
									{materialTypes.map(type => (
										<option key={type.id} value={type.id}>
											{type.name}
										</option>
									))}
								</select>
							</div>

							<div className={styles.formGroup}>
								<label>Длительность (минут)</label>
								<input
									type='number'
									value={formData.duration || 0}
									onChange={(e) =>
										setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
									}
									min={0}
									disabled={isSubmitting}
								/>
							</div>
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

						<div className={styles.formGroup}>
							<label>Описание</label>
							<textarea
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								rows={4}
								placeholder='Краткое описание материала'
								disabled={isSubmitting}
							/>
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