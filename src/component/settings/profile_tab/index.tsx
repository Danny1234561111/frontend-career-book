import React from 'react';
import styles from './profile_tab.module.scss';

// Липовые данные строго по ТЗ
const mockUser = {
  id: 'f50b6d32-30e9-5599-a5ab-80110cb28681',
  fullName: 'Иванов Иван Иванович',
  account: 'IvanovII',
  email: 'Ivanov@enplus.digital',
  organization: 'ЭН+ ДИДЖИТАЛ ООО',
  department: 'Отдел развития веб-решений',
  currentPosition: 'Ведущий специалист по разработке'
};

const ProfileTab: React.FC = () => {
  const user = mockUser;

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Профиль пользователя</h2>
      
      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <h3>{user.fullName}</h3>
            <p>{user.email}</p>
          </div>
        </div>

        <div className={styles.infoSections}>
          <div className={styles.infoSection}>
            <h4>Учетная информация</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>ФИО:</span>
                <span className={styles.value}>{user.fullName}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Логин (Account):</span>
                <span className={styles.value}>{user.account}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{user.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>ID Сотрудника:</span>
                <span className={styles.value}>{user.id}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h4>Организационная информация</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Организация:</span>
                <span className={styles.value}>{user.organization}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Подразделение:</span>
                <span className={styles.value}>{user.department}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Текущая должность:</span>
                <span className={styles.value}>{user.currentPosition}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h4>Информация о системе</h4>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Версия сборки:</span>
                <span className={styles.value}>1.6.0</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Техническая поддержка:</span>
                <a 
                  href="mailto:support@enplus.digital" 
                  className={styles.link}
                >
                  support@enplus.digital
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.note}>
          <p>Данные загружены из корпоративной системы RIMS и не могут быть изменены.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;