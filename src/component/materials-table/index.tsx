import React, { useState } from 'react';
import styles from './materials-table.module.scss';

interface Material {
	id: string;
	name: string;
	type: string;
	competencies: string[];
	link: string;
	duration: number;
	status?: string;
	createdAt?: string;
}

interface MaterialsTableProps {
	adminMode?: boolean;
	selectable?: boolean;
	selectedMaterials?: string[];
	onSelectionChange?: (selectedIds: string[]) => void;
	filterStatus?: 'all' | 'moderation';
	filterCompetency?: string;
	onMaterialSelect?: (material: Material) => void;
	onMaterialEdit?: (material: Material) => void;
	onMaterialDelete?: (materialId: string) => void;
	onMaterialApprove?: (materialId: string) => void;
	materials?: Material[];
}

const MaterialsTable: React.FC<MaterialsTableProps> = ({
	adminMode = false,
	selectable = false,
	selectedMaterials = [],
	onSelectionChange,
	filterStatus = 'all',
	filterCompetency = 'all',
	onMaterialSelect,
	onMaterialEdit,
	onMaterialDelete,
	onMaterialApprove,
	materials = [],
}) => {
	const [searchQuery, setSearchQuery] = useState('');

	const handleCheckboxChange = (materialId: string, checked: boolean) => {
		if (!onSelectionChange) return;

		const newSelection = checked
			? [...selectedMaterials, materialId]
			: selectedMaterials.filter((id) => id !== materialId);

		onSelectionChange(newSelection);
	};

	const handleSelectAll = (checked: boolean) => {
		if (!onSelectionChange) return;

		const allIds = filteredMaterials.map((m) => m.id);
		onSelectionChange(checked ? allIds : []);
	};

	const getTypeIcon = (type: string) => {
		const icons: Record<string, string> = {
			video: '🎥',
			article: '📄',
			book: '📚',
			course: '🎓',
			webinar: '🎥',
		};
		return icons[type?.toLowerCase()] || '📁';
	};

	const getTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			video: 'Видео',
			article: 'Статья',
			book: 'Книга',
			course: 'Курс',
			webinar: 'Вебинар',
		};
		return labels[type?.toLowerCase()] || type;
	};

	const filteredMaterials = materials.filter((material) => {
		if (filterStatus !== 'all' && material.status !== filterStatus) return false;
		if (
			filterCompetency !== 'all' &&
			!material.competencies?.includes(filterCompetency)
		) return false;
		if (searchQuery) {
			const searchLower = searchQuery.toLowerCase();
			const matchesTitle = material.name?.toLowerCase().includes(searchLower);
			if (!matchesTitle) return false;
		}
		return true;
	});

	const allSelected =
		filteredMaterials.length > 0 &&
		filteredMaterials.every((m) => selectedMaterials.includes(m.id));
	const someSelected = filteredMaterials.some((m) =>
		selectedMaterials.includes(m.id)
	);

	const formatDate = (dateString?: string) => {
		if (!dateString) return '—';
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU');
	};

	const formatDuration = (minutes: number) => {
		if (!minutes || minutes === 0) return '—';
		if (minutes < 60) return `${minutes} ч`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (mins === 0) return `${hours} ч`;
		return `${hours} ч ${mins} мин`;
	};

	return (
		<div className={styles.container}>
			<div className={styles.toolbar}>
				<div className={styles.searchWrapper}>
					<input
						type='text'
						placeholder='Поиск по названию...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className={styles.searchInput}
					/>
					<span className={styles.searchIcon}>🔍</span>
				</div>

				{selectable && filteredMaterials.length > 0 && (
					<label className={styles.selectAllLabel}>
						<input
							type='checkbox'
							checked={allSelected}
							ref={(input) => {
								if (input) input.indeterminate = someSelected && !allSelected;
							}}
							onChange={(e) => handleSelectAll(e.target.checked)}
						/>
						Выбрать все ({filteredMaterials.length})
					</label>
				)}
			</div>

			<div className={styles.tableWrapper}>
				<table className={styles.table}>
					<thead>
							<th style={{ width: selectable ? '40px' : '0px' }}>
								{selectable && <span> </span>}
							</th>
							<th style={{ width: '10%' }}>Тип</th>
							<th style={{ width: '50%' }}>Название</th>
							<th style={{ width: '15%' }}>Длительность</th>
							<th style={{ width: '15%' }}>Дата</th>
							{adminMode && <th style={{ width: '10%' }}>Действия</th>}
						</thead>
						<tbody>
							{filteredMaterials.map((material) => (
								<tr key={material.id} onClick={() => onMaterialSelect?.(material)} className={onMaterialSelect ? styles.clickable : ''}>
									{selectable && (
										<td onClick={(e) => e.stopPropagation()}>
											<input
												type='checkbox'
												checked={selectedMaterials.includes(material.id)}
												onChange={(e) => handleCheckboxChange(material.id, e.target.checked)}
											/>
										</td>
									)}
									<td></td>
									<td className={styles.typeCell}>
										<span className={styles.typeIcon}>{getTypeIcon(material.type)}</span>
										<span className={styles.typeLabel}>{getTypeLabel(material.type)}</span>
									</td>
									<td className={styles.titleCell}>
										{material.link ? (
											<a href={material.link} target='_blank' rel='noopener noreferrer' onClick={(e) => e.stopPropagation()}>
												{material.name}
											</a>
										) : (
											material.name
										)}
									</td>
									<td className={styles.durationCell}>{formatDuration(material.duration)}</td>
									<td className={styles.dateCell}>{formatDate(material.createdAt)}</td>
									{adminMode && (
										<td className={styles.actionsCell}>
											{material.status === 'moderation' && (
												<button
													className={`${styles.iconBtn} ${styles.approve}`}
													onClick={(e) => {
														e.stopPropagation();
														onMaterialApprove?.(material.id);
													}}
													title='Одобрить'>
													✓
												</button>
											)}
											<button
												className={`${styles.iconBtn} ${styles.edit}`}
												onClick={(e) => {
													e.stopPropagation();
													onMaterialEdit?.(material);
												}}
												title='Редактировать'>
												✏️
											</button>
											<button
												className={`${styles.iconBtn} ${styles.delete}`}
												onClick={(e) => {
													e.stopPropagation();
													onMaterialDelete?.(material.id);
												}}
												title='Удалить'>
												🗑️
											</button>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>

				{filteredMaterials.length === 0 && (
					<div className={styles.emptyState}>
						<p>Материалы не найдены</p>
						{searchQuery && (
							<p className={styles.searchHint}>
								Попробуйте изменить поисковый запрос
							</p>
						)}
					</div>
				)}
			</div>

			{selectable && filteredMaterials.length > 0 && (
				<div className={styles.selectionInfo}>
					Выбрано: <strong>{selectedMaterials.length}</strong> из{' '}
					{filteredMaterials.length}
				</div>
			)}
		</div>
	);
};

export default MaterialsTable;