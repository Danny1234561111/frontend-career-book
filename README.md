# [Todo List](https://tsa-web07-id.ie.corp:4008/)

Это простое приложение "Todo List", разработанное с использованием React, TypeScript и Redux Toolkit для управления состоянием. В проекте используются современные подходы, включая асинхронные экшены с `createAsyncThunk` для имитации API-запросов, Material UI для оформления, а также кастомные хуки для оптимизации бизнес-логики. Кроме того, настроены инструменты для линтинга и форматирования кода (ESLint, Prettier, Stylelint), что способствует поддержанию высокого качества разработки.

## Оглавление

- [Особенности](#особенности)
- [Технологии](#технологии)
- [Структура проекта](#Структура-проекта)
- [Установка и запуск](#установка-и-запуск)
- [Контакты](#контакты)
- [Скрипты проекта](#скрипты-проекта)

## Особенности

- **Добавление задачи:** Возможность создавать новые задачи через удобный интерфейс.
- **Переключение статуса:** Отмечайте задачи как выполненные или невыполненные с помощью чекбоксов.
- **Удаление задачи:** Легко удаляйте задачи из списка.
- **Асинхронные запросы:** Использование API-заглушек с createAsyncThunk для имитации работы с сервером, что упрощает дальнейшую интеграцию с реальным API.
- **Material UI:** Применение готовых компонентов для создания адаптивного и современного интерфейса.
- **Кастомные хуки:** Реализация пользовательских хуков (например, useForm) для оптимизации работы с формами и управлением состоянием.
- **Инструменты разработки:** Настроены ESLint, Prettier и Stylelint для обеспечения единого стиля кода и улучшения качества разработки.

## Технологии

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Redux Toolkit (RTK)](https://redux-toolkit.js.org/)
- [Material UI](https://mui.com/)
- [Webpack](https://webpack.js.org/) (при использовании представленной сборки)
- ESLint, Prettier, Stylelint

## Структура проекта

```bash
Frontend/
├── .husky/ # Git хуки для автоматизации проверок перед коммитом
├── public/ # Статические файлы и index.html
├── src/│
│ 	├── app/ # Главные компоненты приложения
│ 	│ 	└── index.tsx
│ 	├── component/ # Компоненты пользовательского интерфейса
│ 	│ 	├── index.ts
│ 	│ 	└── todo-list/ # Компонент списка задач
│ 	│ 		└── todo-list.tsx
│ 	├── hook/ # Пользовательские хуки (например, useForm.tsx)
│ 	├── pages/ # Страницы приложения
│ 	│ 	└── main/
│ 	├── store/ # Redux-хранилище и слайсы
│ 	│ 	├── todos/ # Слайс для работы с задачами (todoSlice.ts)
│ 	│		└── index.ts # Конфигурация Redux-хранилища
│ 	├── types/ # Общие типы и интерфейсы
│ 	├── index.tsx # Точка входа в приложение
│ 	└── styles.css # Глобальные стили
├── webpack/ # Конфигурация сборщика (Webpack)
├── package.json # Зависимости и скрипты проекта
├── README.md # Документация проекта
└── ...
```

## Установка и запуск

**Предварительные требования**

- Node.js (рекомендуется версия 16.20.2 или выше)
- npm

### Клонирование репозитория

Клонируйте репозиторий на локальную машину:

```bash
git clone https://azure.enplus.group/Development%20Web-Solutions/Template%20Frontend%20-%20Backend/_git/Frontend

cd Frontend
```

### Установка зависимостей

С использованием npm:

```bash
  npm install
```

### Запуск приложения в режиме разработки

Запустите приложение командой:

```bash
  npm start
```

После успешного запуска приложение будет доступно по адресу: [localhost:8080](http://localhost:8080/)

### Сборка для продакшена

Для создания оптимизированной сборки выполните:

```bash
  npm run build
```

Собранные файлы будут находиться в директории `dist`.

## Контакты

Если у вас есть вопросы, предложения или замечания, вы можете связаться со мной по электронной почте: `konstantinovai@enplus.digital` или создать issue в репозитории.

## Скрипты проекта (описание)

Ниже приведён пример раздела "scripts" из файла package.json с описанием того, что выполняет каждый скрипт:

```bash
"scripts": {
	"build": "cross-env NODE_ENV=production webpack --config webpack/webpack.config.js --env env=prod",
	"start": "webpack serve --config webpack/webpack.config.js --env env=dev",
	"stylelint": "stylelint \"src/**/*.css\"",
	"stylelint:fix": "stylelint \"src/**/*.css\" --fix",
	"lint": "eslint --fix \"./src/**/*.{js,jsx,ts,tsx,json}\"",
	"format": "prettier --write \"./src/**/*.{js,jsx,ts,tsx,json,css,scss,md}\" --ignore-path ./.prettierignore",
	"test": "npm run stylelint:fix && npm run lint && npm run format",
	"prepare": "husky install",
	"commit": "npm run test && cz"
}
```

**Описание скриптов:**

- `npm run start` Запускает приложение в режиме разработки. Обычно использует react-scripts start (или аналогичный инструмент сборки), который поднимает сервер и открывает приложение по адресу http://localhost:8080/.
- `npm run build` Создаёт оптимизированную сборку приложения для продакшена. Скрипт компилирует TypeScript, минифицирует код и формирует финальные файлы, готовые для развертывания, обычно в папке build.
- `npm run stylelint:fix` Запускает Stylelint для проверки кода на соответствие заданным стандартам качества и стилям. Aнализирует файлы в папке src с расширениями css, scss.
- `npm run lint` Запускает ESLint для проверки кода на соответствие заданным стандартам качества и стилям. Aнализирует файлы в папке src с расширениями js, jsx, ts, tsx.
- `npm run format` Запускает Prettier для автоматического форматирования кода в файлах с указанными расширениями (js, jsx, ts, tsx, css, md) согласно заданным настройкам.
- `npm run test` Выводит ошибки которые допущены при оформление кода, **рекумендуется испльзовать перед комитом**

```bash
C:\project\Frontend\src\component\todo-list\todo-list.tsx
  1:21  error  'useState' is defined but never used  @typescript-eslint/no-unused-vars

C:\project\Frontend\src\custom.d.ts
  10:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  14:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  18:17  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 4 problems (1 error, 3 warnings)
```
