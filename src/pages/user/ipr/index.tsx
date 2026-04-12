import React, { useState, useEffect } from 'react';
import styles from './ipr.module.scss';

interface MaterialTask {
	id: string;
	materialId: string;
	name: string;
	type: string;
	status: number;
	duration: number;
	link: string;
	bossShortFio: string | null;
}

interface Column {
	id: string;
	title: string;
	status: number;
	items: MaterialTask[];
}

interface MaterialType {
	id: string;
	name: string;
}

const IprPage = () => {
	const accessToken = localStorage.getItem('accessToken');
	
	const [columns, setColumns] = useState<Column[]>([
		{ id: 'planned', title: 'Запланировано', status: 0, items: [] },
		{ id: 'in-progress', title: 'В работе', status: 1, items: [] },
		{ id: 'ready', title: 'Готово к проверке', status: 2, items: [] },
	]);
	
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [draggedItem, setDraggedItem] = useState<MaterialTask | null>(null);

	// Получение типов материалов
	const fetchMaterialTypes = async (): Promise<Map<string, string>> => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return new Map();

			const response = await fetch('http://localhost:5217/api/materialtypes?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data: MaterialType[] = await response.json();
				const typeMap = new Map<string, string>();
				data.forEach(type => {
					if (type && type.id && type.name) {
						typeMap.set(type.id, type.name);
					}
				});
				return typeMap;
			}
			return new Map();
		} catch (error) {
			console.error('Error fetching material types:', error);
			return new Map();
		}
	};

	// Получение всех материалов пользователя и фильтрация только для текущего уровня
	const fetchMaterials = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				setIsLoading(false);
				return;
			}

			// Получаем маппинг типов материалов
			const typeMap = await fetchMaterialTypes();

			// 1. Получаем компетенции пользователя с их текущими уровнями
			const competenciesResponse = await fetch('http://localhost:5217/api/competencies/own', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (!competenciesResponse.ok) {
				throw new Error('Failed to fetch competencies');
			}

			const competenciesData = await competenciesResponse.json();
			
			// 2. Собираем ID материалов, которые относятся к следующему уровню каждой компетенции
			const validMaterialIds = new Set<string>();

			if (competenciesData.blocks && Array.isArray(competenciesData.blocks)) {
				for (const block of competenciesData.blocks) {
					for (const category of block.categories || []) {
						for (const group of category.groups || []) {
							for (const comp of group.competencies || []) {
								const currentLevel = comp.currentLevel || 0;
								const targetLevel = comp.requiredLevel || 0;
								
								// Если текущий уровень меньше целевого, есть материалы для изучения
								if (currentLevel < targetLevel) {
									// Получаем материалы для следующего уровня
									const nextLevelResponse = await fetch(`http://localhost:5217/api/educational-material-competencies/by-competency/${comp.id}/next-level`, {
										method: 'GET',
										headers: {
											'Authorization': `Bearer ${token}`,
											'accept': 'application/json',
										},
									});
									
									if (nextLevelResponse.ok) {
										const nextLevelMaterials = await nextLevelResponse.json();
										nextLevelMaterials.forEach((material: any) => {
											if (material.educationalMaterialId) {
												validMaterialIds.add(material.educationalMaterialId);
											}
										});
									}
								}
							}
						}
					}
				}
			}

			console.log('✅ Valid material IDs (next level only):', Array.from(validMaterialIds));

			// 3. Получаем все материалы пользователя
			const response = await fetch('http://localhost:5217/api/material-task?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('All materials from API:', data);
				
				const newColumns = [...columns];
				newColumns.forEach(col => {
					col.items = [];
				});
				
				// 4. Фильтруем материалы - оставляем только те, которые есть в validMaterialIds
				for (const item of data) {
					if (item.material && validMaterialIds.has(item.material.id)) {
						// Получаем тип материала через typeMap (как в MaterialsPage)
						let materialType = 'Без типа';
						if (item.material.typeId && typeMap.has(item.material.typeId)) {
							materialType = typeMap.get(item.material.typeId) || 'Без типа';
						} else if (item.material.type?.name) {
							materialType = item.material.type.name;
						}
						
						const materialItem: MaterialTask = {
							id: item.id,
							materialId: item.material.id,
							name: item.material.name || 'Без названия',
							type: materialType,
							status: item.status,
							duration: item.material.duration || 0,
							link: item.material.link || '',
							bossShortFio: item.bossShortFio,
						};
						
						const targetColumn = newColumns.find(col => col.status === item.status);
						if (targetColumn) {
							targetColumn.items.push(materialItem);
						}
					}
				}
				
				setColumns(newColumns);
			} else if (response.status === 404) {
				console.log('No materials found');
			} else {
				console.error('Failed to fetch materials:', response.status);
				setError('Ошибка загрузки материалов');
			}
		} catch (error) {
			console.error('Error fetching materials:', error);
			setError('Не удалось подключиться к серверу');
		} finally {
			setIsLoading(false);
		}
	};

	const updateMaterialStatus = async (materialTaskId: string, newStatus: number) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return false;

			const response = await fetch(`http://localhost:5217/api/material-task/${materialTaskId}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				console.log(`Material ${materialTaskId} status updated to ${newStatus}`);
				return true;
			} else {
				console.error('Failed to update material status:', response.status);
				return false;
			}
		} catch (error) {
			console.error('Error updating material status:', error);
			return false;
		}
	};

	const onDragStart = (e: React.DragEvent, item: MaterialTask, columnId: string) => {
		setDraggedItem(item);
		e.dataTransfer.setData('text/plain', JSON.stringify({ item, columnId }));
		e.dataTransfer.effectAllowed = 'move';
	};

	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	};

	const onDrop = async (e: React.DragEvent, targetColumn: Column) => {
		e.preventDefault();
		
		if (!draggedItem) return;
		
		const sourceColumn = columns.find(col => col.status === draggedItem.status);
		if (!sourceColumn) return;
		
		if (sourceColumn.id === targetColumn.id) {
			setDraggedItem(null);
			return;
		}
		
		const success = await updateMaterialStatus(draggedItem.id, targetColumn.status);
		
		if (success) {
			const newColumns = [...columns];
			
			const sourceColIndex = newColumns.findIndex(col => col.id === sourceColumn.id);
			const itemIndex = newColumns[sourceColIndex].items.findIndex(i => i.id === draggedItem.id);
			newColumns[sourceColIndex].items.splice(itemIndex, 1);
			
			const updatedMaterial = { ...draggedItem, status: targetColumn.status };
			const targetColIndex = newColumns.findIndex(col => col.id === targetColumn.id);
			newColumns[targetColIndex].items.push(updatedMaterial);
			
			setColumns(newColumns);
		}
		
		setDraggedItem(null);
	};

	useEffect(() => {
		fetchMaterials();
	}, []);

	const formatDuration = (minutes: number) => {
		if (!minutes || minutes === 0) return 'Не указано';
		else return `${minutes} ч`;
	};

	const handleOpenMaterial = (link: string) => {
		if (link && link.startsWith('http')) {
			window.open(link, '_blank', 'noopener,noreferrer');
		} else if (link) {
			window.open(`https://${link}`, '_blank', 'noopener,noreferrer');
		}
	};

	if (isLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>Загрузка...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className={styles.page}>
				<div className={styles.error}>
					<p>{error}</p>
					<button onClick={fetchMaterials} className={styles.retryBtn}>
						Повторить
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<h1 className={styles.title}>Индивидуальный план развития</h1>
			</div>

			<div className={styles.content}>
				<div className={styles.kanban}>
					{columns.map((column) => (
						<div
							key={column.id}
							className={styles.column}
							onDragOver={onDragOver}
							onDrop={(e) => onDrop(e, column)}
						>
							<h3 className={styles.columnTitle}>
								{column.title}
								<span className={styles.count}>{column.items.length}</span>
							</h3>
							<div className={styles.cards}>
								{column.items.map((item) => (
									<div
										key={item.id}
										className={styles.card}
										draggable
										onDragStart={(e) => onDragStart(e, item, column.id)}
									>
										<div className={styles.cardContent}>
											<h4>{item.name}</h4>
											<p>Тип: {item.type}</p>
											<p>Длительность: {formatDuration(item.duration)}</p>
											{item.bossShortFio && (
												<p className={styles.boss}>Назначил: {item.bossShortFio}</p>
											)}
											{item.link && (
												<button
													onClick={() => handleOpenMaterial(item.link)}
													className={styles.materialLink}
												>
													Перейти к материалу
												</button>
											)}
										</div>
									</div>
								))}
								{column.items.length === 0 && (
									<div className={styles.emptyColumn}>
										<p>Нет материалов</p>
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default IprPage;