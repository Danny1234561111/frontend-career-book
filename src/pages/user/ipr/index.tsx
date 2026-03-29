import React, { useState, useEffect } from 'react';
import styles from './ipr.module.scss';

interface MaterialTask {
	id: string;
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

	const fetchMaterials = async () => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) {
				setError('Нет токена доступа');
				setIsLoading(false);
				return;
			}

			const response = await fetch('http://localhost:5217/api/material-task?withDeleted=false', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'accept': 'text/plain',
				},
			});

			if (response.ok) {
				const data = await response.json();
				console.log('Materials for IPR:', data);
				
				const newColumns = [...columns];
				newColumns.forEach(col => {
					col.items = [];
				});
				
				data.forEach((item: any) => {
					if (item.material) {
						const materialItem: MaterialTask = {
							id: item.id,
							name: item.material.name || 'Без названия',
							type: item.material.type?.name || 'Без типа',
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
				});
				
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

	const updateMaterialStatus = async (materialId: string, newStatus: number) => {
		try {
			const token = localStorage.getItem('accessToken');
			if (!token) return false;

			const response = await fetch(`http://localhost:5217/api/material-task/${materialId}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				console.log(`Material ${materialId} status updated to ${newStatus}`);
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
		if (minutes < 60) return `${minutes} ч`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (mins === 0) return `${hours} ч`;
		return `${hours} ч ${mins} мин`;
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