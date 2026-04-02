// materials-table.tsx
import React from 'react';
import styles from './materials-table.module.scss';

interface MaterialsTableProps {
	adminMode?: boolean;
	materials: Array<{
		id: string;
		name: string;
		type: string;
		link: string;
		duration?: number;
		createdAt?: string;
		status?: number;
		statusLabel?: string;
		employeeName?: string;
		competencyName?: string; // Добавляем поле для компетенции
	}>;
	filterStatus?: string;
	showEmployeeColumn?: boolean;
	showStatusColumn?: boolean;
	showCompetencyColumn?: boolean; // Добавляем флаг для показа колонки компетенций
	onMaterialEdit?: (material: any) => void;
	onMaterialDelete?: (id: string) => void;
	onMaterialApprove?: (id: string) => void;
}

const MaterialsTable: React.FC<MaterialsTableProps> = ({
	adminMode = false,
	materials,
	filterStatus = 'all',
	showEmployeeColumn = false,
	showStatusColumn = false,
	showCompetencyColumn = false,
	onMaterialEdit,
	onMaterialDelete,
	onMaterialApprove,
}) => {
	const formatDate = (dateString?: string) => {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU');
	};

	const getTypeIcon = (type: string) => {
		const typeName = typeof type === 'string' ? type.toLowerCase() : 'unknown';
		const icons: Record<string, string> = {
			video: '🎥',
			article: '📄',
			book: '📚',
			course: '🎓',
			presentation: '📊',
			test: '📝',
		};
		return icons[typeName] || '📁';
	};

	const getTypeLabel = (type: string) => {
		const typeName = typeof type === 'string' ? type.toLowerCase() : 'unknown';
		const labels: Record<string, string> = {
			video: 'Видео',
			article: 'Статья',
			book: 'Книга',
			course: 'Курс',
			presentation: 'Презентация',
			test: 'Тест',
		};
		return labels[typeName] || type;
	};

	const getStatusBadge = (status?: number, statusLabel?: string) => {
		if (statusLabel) {
			const statusClass = statusLabel === 'Изучено' ? 'statusCompleted' 
				: statusLabel === 'В процессе' ? 'statusInProgress' 
				: 'statusToStudy';
			return (
				<span className={`${styles.statusBadge} ${styles[statusClass]}`}>
					{statusLabel}
				</span>
			);
		}
		
		if (status === undefined && status !== 0) {
			return <span className={styles.statusBadge}>—</span>;
		}
		
		const statusConfig: { [key: number]: { label: string; className: string } } = {
			0: { label: 'К изучению', className: styles.statusToStudy },
			1: { label: 'В процессе', className: styles.statusInProgress },
			2: { label: 'Изучено', className: styles.statusCompleted },
		};
		
		const config = statusConfig[status];
		if (!config) return <span className={styles.statusBadge}>—</span>;
		
		return (
			<span className={`${styles.statusBadge} ${config.className}`}>
				{config.label}
			</span>
		);
	};

	const filteredMaterials = materials.filter(material => {
		if (filterStatus === 'moderation') {
			return material.status === 0;
		}
		return true;
	});

	// Определяем, сколько колонок будет в таблице для правильного отображения emptyState
	const columnCount = 4 + // Название, Тип, Ссылка, Длительность
		(showEmployeeColumn ? 1 : 0) +
		(showStatusColumn ? 1 : 0) +
		(showCompetencyColumn ? 1 : 0) +
		(adminMode ? 1 : 0) +
		(!adminMode && !showEmployeeColumn && !showStatusColumn && !showCompetencyColumn ? 1 : 0);

	return (
		<div className={styles.container}>
			<div className={styles.tableWrapper}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Название</th>
							<th>Тип</th>
							<th>Ссылка</th>
							<th>Длительность</th>
							{showCompetencyColumn && <th>Компетенция</th>}
							{showEmployeeColumn && <th>Сотрудник</th>}
							{showStatusColumn && <th>Статус</th>}
							{adminMode && <th>Действия</th>}
							{!adminMode && !showEmployeeColumn && !showStatusColumn && !showCompetencyColumn && <th>Дата создания</th>}
						</tr>
					</thead>
					<tbody>
						{filteredMaterials.map((material) => (
							<tr key={material.id}>
								<td className={styles.titleCell}>
									<a href={material.link} target='_blank' rel='noopener noreferrer'>
										{material.name}
									</a>
								</td>
								<td className={styles.typeCell}>
									<span className={styles.typeIcon}>
										{getTypeIcon(material.type)}
									</span>
									<span className={styles.typeLabel}>
										{getTypeLabel(material.type)}
									</span>
								</td>
								<td className={styles.linkCell}>
									<a href={material.link} target='_blank' rel='noopener noreferrer' className={styles.link}>
										{material.link.length > 50 ? material.link.substring(0, 50) + '...' : material.link}
									</a>
								</td>
								<td className={styles.durationCell}>
									{material.duration ? `${material.duration} мин` : '—'}
								</td>
								{showCompetencyColumn && (
									<td className={styles.competencyCell}>
										{material.competencyName ? (
											<span className={styles.competencyBadge}>
												{material.competencyName}
											</span>
										) : '—'}
									</td>
								)}
								{showEmployeeColumn && (
									<td className={styles.employeeCell}>
										{material.employeeName || '—'}
									</td>
								)}
								{showStatusColumn && (
									<td className={styles.statusCell}>
										{getStatusBadge(material.status, material.statusLabel)}
									</td>
								)}
								{adminMode && (
									<td className={styles.actionsCell}>
										{onMaterialApprove && material.status === 0 && (
											<button
												className={`${styles.iconBtn} ${styles.approve}`}
												onClick={() => onMaterialApprove?.(material.id)}
												title='Одобрить'>
												✓
											</button>
										)}
										<button
											className={`${styles.iconBtn} ${styles.edit}`}
											onClick={() => onMaterialEdit?.(material)}
											title='Редактировать'>
											✎
										</button>
										<button
											className={`${styles.iconBtn} ${styles.delete}`}
											onClick={() => onMaterialDelete?.(material.id)}
											title='Удалить'>
											🗑️
										</button>
									</td>
								)}
								{!adminMode && !showEmployeeColumn && !showStatusColumn && !showCompetencyColumn && (
									<td className={styles.dateCell}>
										{formatDate(material.createdAt)}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
				{filteredMaterials.length === 0 && (
					<div className={styles.emptyState}>
						<p>Нет материалов для отображения</p>
						{filterStatus === 'moderation' && (
							<p className={styles.searchHint}>Нет материалов на модерации</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default MaterialsTable;