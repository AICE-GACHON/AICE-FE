// 화면 전환은 전부 routes.jsx가 맡는다. 여기 남은 건 앱 전체가 쓰는 CSS 묶음뿐이다.
import AppRoutes from './routes';
import './onboarding/onboarding.css';
import './auth/auth.css';
import './workspace/workspace.css';

export default function App() {
  return <AppRoutes />;
}
