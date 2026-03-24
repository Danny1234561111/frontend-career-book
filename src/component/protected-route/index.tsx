import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/strore';

const Protected = ({
	onlyUnAuth = false,
	component,
}: {
	onlyUnAuth?: boolean;
	resetPasswor?: boolean;
	component: React.ReactNode;
}) => {
	const location = useLocation();
	const acessToken = useAppSelector((state) => state.auth.isAuth);

	if (!onlyUnAuth && !acessToken) {
		return <Navigate to='/auth' state={{ from: location }} />;
	}

	if (onlyUnAuth && acessToken) {
		const { from } = location.state ?? { from: { pathname: '/' } };
		return <Navigate to={from} />;
	}

	return component;
};

export const OnlyAuth = Protected;
export const OnlyUnAuth = ({ component }: { component: React.ReactNode }) => (
	<Protected onlyUnAuth={true} component={component} />
);
