import React, { useState, useEffect } from 'react';
import { CompetenciesMatrix, CompetencyForm } from '../../../component';
import styles from './competencies.module.scss';

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

interface MaterialFromApi {
	id: string;
	name: string;
	typeId: string;
	type: { id: string; name: string } | null;
	link: string;
	duration: number;
}

interface CompetencyFromApi {
	id: string;
	name: string;
	type: string;
	hierarchyId: string;
	hierarchy?: { id: string; name: string };
	description: string;
	text?: string;
	defenseTasks?: string;
	admissionCriteria?: string;
	proficiencyLevels?: Array<{ value: number; name: string; description?: string }>;
	educationalMaterials?: Array<{ id: string; name: string; link: string }>;
}

interface EducationalMaterialCompetency {
	id: string;
	competencyId: string;
	educationalMaterialId: string;
	targetLevelId: string;
	educationalMaterial: {
		id: string;
		name: string;
		typeId: string;
		type: { id: string; name: string } | null;
		link: string;
		duration: number;
	};
}

const CompetenciesPage: React.FC = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
	const [editingCompetency, setEditingCompetency] = useState<CompetencyData | null>(null);
	const [competencies, setCompetencies] = useState<CompetencyFromApi[]>([]);
	const [competencyBlocks, setCompetencyBlocks] = useState<{ id: string; name: string }[]>([]);
	const [materials, setMaterials] = useState<MaterialFromApi[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Получение блоков компетенций
	const fetchCompetencyBlocks = async () => {
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
				const blocks: { id: string; name: string }[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					data.blocks.forEach((block: any) => {
						blocks.push({
							id: block.id,
							name: block.name,
						});
					});
				}
				setCompetencyBlocks(blocks);
			}
		} catch (error) {
			console.error('Error fetching competency blocks:', error);
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
				setMaterials(data);
			}
		} catch (error) {
			console.error('Error fetching materials:', error);
		}
	};

	// Получение компетенций
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
				const competenciesList: CompetencyFromApi[] = [];
				
				if (data.blocks && Array.isArray(data.blocks)) {
					for (const block of data.blocks) {
						block.categories?.forEach((category: any) => {
							category.groups?.forEach((group: any) => {
								group.competencies?.forEach((comp: CompetencyFromApi) => {
									competenciesList.push({
										...comp,
										hierarchyId: block.id,
										hierarchy: { id: block.id, name: block.name },
									});
								});
							});
						});
					}
				}
				setCompetencies(competenciesList);
			}
		} catch (error) {
			console.error('Error fetching competencies:', error);
			setError('Ошибка загрузки компетенций');
		}
	};

	// Получение ID уровня по значению
	const getTargetLevelId = async (level: number): Promise<string> => {
		try {
			const response = await fetch('http://localhost:5217/api/levels?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'accept': 'text/plain',
				},
			});
			
			if (response.ok) {
				const levels: { id: string; value: number; name: string }[] = await response.json();
				const foundLevel = levels.find(l => l.value === level);
				return foundLevel?.id || '';
			}
			return '';
		} catch (error) {
			console.error('Error fetching levels:', error);
			return '';
		}
	};

	// Привязка материала к компетенции
	const attachMaterialToCompetency = async (competencyId: string, materialId: string, targetLevel: number) => {
		try {
			const targetLevelId = await getTargetLevelId(targetLevel);
			if (!targetLevelId) {
				console.error('Target level ID not found');
				return false;
			}

			const response = await fetch('http://localhost:5217/api/educational-material-competencies', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					competencyId: competencyId,
					educationalMaterialId: materialId,
					targetLevelId: targetLevelId,
				}),
			});

			if (response.ok || response.status === 201) {
				console.log(`Material ${materialId} attached to competency ${competencyId}`);
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error attaching material:', error);
			return false;
		}
	};

	// Удаление привязки материала
	const detachMaterialFromCompetency = async (competencyId: string, materialId: string) => {
		try {
			const response = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${competencyId}`, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});
			
			if (response.ok) {
				const data: EducationalMaterialCompetency[] = await response.json();
				const relation = data.find(item => item.educationalMaterialId === materialId);
				
				if (relation) {
					const deleteResponse = await fetch(`http://localhost:5217/api/educational-material-competencies/${relation.id}`, {
						method: 'DELETE',
						headers: {
							'Authorization': `Bearer ${accessToken}`,
						},
					});
					
					if (deleteResponse.ok) {
						console.log(`Material ${materialId} detached from competency ${competencyId}`);
						return true;
					}
				}
			}
			return false;
		} catch (error) {
			console.error('Error detaching material:', error);
			return false;
		}
	};

	// Создание компетенции
	const createCompetency = async (competency: CompetencyData) => {
		try {
			const response = await fetch('http://localhost:5217/api/competencies', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: competency.name,
					type: 'hard',
					hierarchyId: competency.Id,
					description: competency.description,
					text: competency.article || '',
					defenseTasks: competency.defenseTasks || '',
					admissionCriteria: competency.acceptanceCriteria || '',
				}),
			});

			if (response.ok) {
				const newCompetency = await response.json();
				
				if (competency.materialIds && competency.materialIds.length > 0) {
					for (const materialId of competency.materialIds) {
						await attachMaterialToCompetency(newCompetency.id, materialId, competency.level);
					}
				}
				
				setSuccessMessage('Компетенция успешно создана');
				await fetchCompetencies();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await response.text();
				setError(`Ошибка: ${errorText}`);
				setTimeout(() => setError(null), 3000);
				return false;
			}
		} catch (error) {
			console.error('Error creating competency:', error);
			setError('Ошибка при создании компетенции');
			setTimeout(() => setError(null), 3000);
			return false;
		}
	};

	// Обновление компетенции
	const updateCompetency = async (id: string, competency: CompetencyData) => {
		try {
			const updateResponse = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: competency.name,
					type: 'hard',
					hierarchyId: competency.blockId,
					description: competency.description,
					text: competency.article || '',
					defenseTasks: competency.defenseTasks || '',
					admissionCriteria: competency.acceptanceCriteria || '',
				}),
			});

			if (updateResponse.ok) {
				console.log('Competency updated successfully');
				
				const currentComp = competencies.find(c => c.id === id);
				const currentMaterialIds = currentComp?.educationalMaterials?.map(m => m.id) || [];
				const newMaterialIds = competency.materialIds || [];
				
				const materialsToRemove = currentMaterialIds.filter(mid => !newMaterialIds.includes(mid));
				const materialsToAdd = newMaterialIds.filter(mid => !currentMaterialIds.includes(mid));
				
				for (const materialId of materialsToRemove) {
					await detachMaterialFromCompetency(id, materialId);
				}
				
				for (const materialId of materialsToAdd) {
					await attachMaterialToCompetency(id, materialId, competency.level);
				}
				
				setSuccessMessage('Компетенция обновлена');
				await fetchCompetencies();
				setTimeout(() => setSuccessMessage(null), 3000);
				return true;
			} else {
				const errorText = await updateResponse.text();
				setError(`Ошибка: ${errorText || 'Не удалось обновить компетенцию'}`);
				setTimeout(() => setError(null), 3000);
				return false;
			}
		} catch (error) {
			console.error('Error updating competency:', error);
			setError('Ошибка при обновлении компетенции');
			setTimeout(() => setError(null), 3000);
			return false;
		}
	};

	// Удаление компетенции
	const deleteCompetency = async (id: string) => {
		if (!confirm('Вы уверены, что хотите удалить эту компетенцию?')) return;
		
		try {
			const response = await fetch(`http://localhost:5217/api/competencies/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			if (response.ok) {
				setSuccessMessage('Компетенция удалена');
				await fetchCompetencies();
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setError('Ошибка при удалении компетенции');
				setTimeout(() => setError(null), 3000);
			}
		} catch (error) {
			console.error('Error deleting competency:', error);
			setError('Ошибка при удалении компетенции');
			setTimeout(() => setError(null), 3000);
		}
	};

	const handleAddCompetency = () => {
		setEditingCompetency(null);
		setIsFormOpen(true);
	};

	const handleEditCompetency = (competency: any) => {
		const editingData: CompetencyData = {
			id: competency.id,
			name: competency.name,
			blockId: competency.hierarchyId || '',
			blockName: competency.hierarchy?.name || '',
			description: competency.description || '',
			level: competency.proficiencyLevels?.[0]?.value || 1,
			defenseTasks: competency.defenseTasks || '',
			acceptanceCriteria: competency.admissionCriteria || '',
			article: competency.text || '',
			materialIds: competency.educationalMaterials?.map((m: any) => m.id) || [],
		};
		setEditingCompetency(editingData);
		setIsFormOpen(true);
	};

	const handleSubmitCompetency = async (competency: CompetencyData) => {
		let success = false;
		
		if (competency.id) {
			success = await updateCompetency(competency.id, competency);
		} else {
			success = await createCompetency(competency);
		}
		
		if (success) {
			handleCloseForm();
		}
	};

	const handleDeleteCompetency = (competencyId: string) => {
		deleteCompetency(competencyId);
	};

	const handleCloseForm = () => {
		setIsFormOpen(false);
		setEditingCompetency(null);
	};

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true);
			await Promise.all([fetchCompetencyBlocks(), fetchCompetencies(), fetchMaterials()]);
			setIsLoading(false);
		};
		loadData();
	}, []);

	const materialsForForm = materials.map(m => ({
		id: m.id,
		name: m.name,
		type: m.type?.name || 'Материал',
	}));

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка компетенций...</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Управление компетенциями</h1>
			</div>

			<div className={styles.content}>
				{successMessage && (
					<div className={styles.successMessage}>{successMessage}</div>
				)}
				{error && (
					<div className={styles.errorMessage}>{error}</div>
				)}

				<div className={styles.toolbar}>
					<button className={styles.addBtn} onClick={handleAddCompetency}>
						<span className={styles.addIcon}>+</span>
						Добавить компетенцию
					</button>
				</div>

				<CompetenciesMatrix
					editable
					onEdit={handleEditCompetency}
					onDelete={handleDeleteCompetency}
					competencies={competencies}
					competencyBlocks={competencyBlocks}
				/>
			</div>

			<CompetencyForm
				isOpen={isFormOpen}
				onClose={handleCloseForm}
				onSubmit={handleSubmitCompetency}
				initialData={editingCompetency}
				mode={editingCompetency ? 'edit' : 'create'}
				competencyBlocks={competencyBlocks}
				materials={materialsForForm}
			/>
		</div>
	);
};

export default CompetenciesPage;