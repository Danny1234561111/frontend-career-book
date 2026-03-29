import { useAppSelector } from '../../../store/strore';
import styles from './profile.module.scss';

const ProfilePage = () => {
	const user = useAppSelector((state) => state.auth.user);

	return (
		<div className={styles.profilePage}>
			<div className={styles.container}>
				{/* Шапка профиля */}
				<div className={styles.profileHeader}>
					<div className={styles.avatarSection}>
						<div className={styles.avatar}>
							<span className={styles.avatarPlaceholder}>
								{user?.name?.charAt(0) || 'П'}
							</span>
						</div>
						<div className={styles.userInfo}>
							<h1 className={styles.userName}>
								{user?.name || 'Пользователь'}
							</h1>
							<p className={styles.userEmail}>
								{user?.email || 'email@example.com'}
							</p>
							<p className={styles.userPosition}>
								{user?.position || 'Сотрудник'}
							</p>
							<p className={styles.userDepartment}>
								{user?.department || 'Отдел разработки'}
							</p>
						</div>
					</div>

					<button className={styles.editButton}>Редактировать профиль</button>
				</div>

				{/* Детальная информация */}
				<div className={styles.profileInfo}>
					<div className={styles.infoSection}>
						<h2>Контактная информация</h2>
						<div className={styles.infoGrid}>
							<div className={styles.infoItem}>
								<span className={styles.label}>Телефон:</span>
								<span className={styles.value}>
									{user?.phone || '+7 (999) 123-45-67'}
								</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.label}>Telegram:</span>
								<span className={styles.value}>
									{user?.telegram || '@username'}
								</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.label}>Дата рождения:</span>
								<span className={styles.value}>
									{user?.birthDate || '01.01.1990'}
								</span>
							</div>
							<div className={styles.infoItem}>
								<span className={styles.label}>Дата начала работы:</span>
								<span className={styles.value}>
									{user?.startDate || '01.01.2023'}
								</span>
							</div>
						</div>
					</div>

					<div className={styles.infoSection}>
						<h2>О себе</h2>
						<p className={styles.bio}>
							{user?.bio ||
								'Разработчик с опытом работы в веб-технологиях. Постоянно развиваюсь и изучаю новые инструменты.'}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfilePage;
