// materials-table.module.tsx
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
		status?: string;
	}>;
	filterStatus?: string;
	onMaterialEdit?: (material: any) => void;
	onMaterialDelete?: (id: string) => void;
	onMaterialApprove?: (id: string) => void;
}

const MaterialsTable: React.FC<MaterialsTableProps> = ({
	adminMode = false,
	materials,
	filterStatus = 'all',
	onMaterialEdit,
	onMaterialDelete,
	onMaterialApprove,
}) => {
	const formatDate = (dateString?: string) => {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU');
	};

	const getTypeIcon = (type: string) => {
		const icons: Record<string, string> = {
			video: '🎥',
			article: '📄',
			book: '📚',
			course: '🎓',
		};
		return icons[type.toLowerCase()] || '📁';
	};

	const getTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			video: 'Видео',
			article: 'Статья',
			book: 'Книга',
			course: 'Курс',
		};
		return labels[type.toLowerCase()] || type;
	};

	const filteredMaterials = materials.filter(material => {
		if (filterStatus === 'moderation') {
			return material.status === 'moderation';
		}
		return true;
	});

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
							<th>Дата создания</th>
							{adminMode && <th>Действия</th>}
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
								<td>
									<a href={material.link} target='_blank' rel='noopener noreferrer'>
										{material.link.length > 50 ? material.link.substring(0, 50) + '...' : material.link}
									</a>
								</td>
								<td className={styles.durationCell}>
									{material.duration ? `${material.duration} ч` : '—'}
								</td>
								<td className={styles.dateCell}>
									{formatDate(material.createdAt)}
								</td>
								{adminMode && (
									<td className={styles.actionsCell}>
										{onMaterialApprove && material.status === 'moderation' && (
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