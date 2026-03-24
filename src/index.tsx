import { createRoot } from 'react-dom/client';
import { App } from './app';
import './styles.css';
import { Provider } from 'react-redux';
import { store } from './store/strore';
import { BrowserRouter } from 'react-router-dom';

const domNode = document.getElementById('root') as HTMLDivElement;
const root = createRoot(domNode);
root.render(
	<BrowserRouter>
		<Provider store={store}>
			<App />
		</Provider>
	</BrowserRouter>
);
