// materials.module.tsx
import React, { useState, useEffect } from 'react';
import {
	MaterialsTable,
	MaterialForm,
	CategoryManager,
} from '../../../component';
import styles from './materials.module.scss';

interface MaterialData {
	id?: string;
	name: string;
	typeId: string;
	url: string;
	description?: string;
	duration?: number;
}

interface MaterialFromApi {
	id: string;
	name: string;
	typeId: string;
	type: { id: string; name: string };
	link: string;
	duration: number;
	description?: string;
	createdAt?: string;
}

interface MaterialType {
	id: string;
	name: string;
}

const MaterialsAdminPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [activeTab, setActiveTab] = useState<'all' | 'moderation' | 'categories'>('all');
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingMaterial, setEditingMaterial] = useState<MaterialData | undefined>();
	const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Получение типов материалов
	const fetchMaterialTypes = async () => {
		try {
			const response = await fetch('http://localhost:5217/api/materialtypes', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setMaterialTypes(data);
			}
		} catch (error) {
			console.error('Error fetching material types:', error);
		}
	};

	// Получение материалов
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
			setError('Ошибка загрузки материалов');
		}
	};

	// Создание материала
	const createMaterial = async (material: MaterialData) => {
		try {
			const response = await fetch('http://localhost:5217/api/materials', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: material.name,
					typeId: material.typeId,
					link: material.url,
					duration: material.duration || 0,
					description: material.description || '',
				}),
			});

			if (response.ok) {
				setSuccessMessage('Материал успешно создан');
				await fetchMaterials();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await response.text();
				setError(`Ошибка: ${errorText}`);
				setTimeout(() => setError(null), 3000);
				return false;
			}
		} catch (error) {
			console.error('Error creating material:', error);
			setError('Ошибка при создании материала');
			return false;
		}
	};

	// Обновление материала
	const updateMaterial = async (id: string, material: MaterialData) => {
		try {
			const response = await fetch(`http://localhost:5217/api/materials/${id}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: material.name,
					typeId: material.typeId,
					link: material.url,
					duration: material.duration || 0,
					description: material.description || '',
				}),
			});

			if (response.ok) {
				setSuccessMessage('Материал обновлен');
				await fetchMaterials();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await response.text();
				setError(`Ошибка: ${errorText}`);
				setTimeout(() => setError(null), 3000);
				return false;
			}
		} catch (error) {
			console.error('Error updating material:', error);
			setError('Ошибка при обновлении материала');
			return false;
		}
	};

	// Удаление материала
	const deleteMaterial = async (id: string) => {
		if (!confirm('Вы уверены, что хотите удалить этот материал?')) return;
		
		try {
			const response = await fetch(`http://localhost:5217/api/materials/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			if (response.ok) {
				setSuccessMessage('Материал удален');
				await fetchMaterials();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при удалении материала');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error deleting material:', error);
			setError('Ошибка при удалении материала');
		}
	};

	const convertMaterialForForm = (material: MaterialFromApi): MaterialData => {
		return {
			id: material.id,
			name: material.name,
			typeId: material.typeId,
			url: material.link,
			description: material.description || '',
			duration: material.duration,
		};
	};

	const handleAddMaterial = () => {
		setEditingMaterial(undefined);
		setIsFormOpen(true);
	};

	const handleEditMaterial = (materialFromTable: any) => {
		const fullMaterial = materials.find(m => m.id === materialFromTable.id);
		if (fullMaterial) {
			const converted = convertMaterialForForm(fullMaterial);
			setEditingMaterial(converted);
			setIsFormOpen(true);
		}
	};

	const handleSubmitMaterial = async (material: MaterialData) => {
		let success = false;
		
		if (material.id) {
			success = await updateMaterial(material.id, material);
		} else {
			success = await createMaterial(material);
		}
		
		if (success) {
			handleCloseForm();
		}
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingMaterial(undefined);
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await Promise.all([fetchMaterials(), fetchMaterialTypes()]);
			setIsLoading(false);
		};
		loadData();
	}, []);

	// Преобразуем материалы для таблицы
	const materialsForTable = materials.map(m => ({
		id: m.id,
		name: m.name,
		type: m.type?.name || 'unknown',
		link: m.link,
		duration: m.duration,
		createdAt: m.createdAt,
	}));

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Управление учебными материалами</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
						onClick={() => setActiveTab('all')}>
						Все материалы
					</button>
					<button
						className={`${styles.tab} ${activeTab === 'moderation' ? styles.active : ''}`}
						onClick={() => setActiveTab('moderation')}>
						На модерации
					</button>
					<button
						className={`${styles.tab} ${activeTab === 'categories' ? styles.active : ''}`}
						onClick={() => setActiveTab('categories')}>
						Категории
					</button>
				</div>

				<div className={styles.toolbar}>
					<button className={styles.addBtn} onClick={handleAddMaterial}>
						<span className={styles.addIcon}>+</span>
						Добавить материал
					</button>
				</div>

				{activeTab === 'categories' ? (
					<CategoryManager />
				) : (
					<MaterialsTable
						adminMode
						materials={materialsForTable}
						filterStatus={activeTab === 'moderation' ? 'moderation' : 'all'}
						onMaterialEdit={handleEditMaterial}
						onMaterialDelete={deleteMaterial}
					/>
				)}
			</div>

			<MaterialForm
				isOpen={isFormOpen}
				onClose={handleCloseForm}
				onSubmit={handleSubmitMaterial}
				initialData={editingMaterial}
				mode={editingMaterial ? 'edit' : 'create'}
				materialTypes={materialTypes}
			/>
		</div>
	);
};

export default MaterialsAdminPage;