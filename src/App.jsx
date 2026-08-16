// 화면 전환은 전부 routes/index.jsx가 맡는다. 여기 남은 건 앱 전체가 쓰는 CSS 묶음뿐이다.
import AppRoutes from '@/routes/index';
import '@/features/onboarding/onboarding.css';
import '@/features/auth/auth.css';
import '@/features/legal/legal.css';
import '@/features/workspace/workspace.css';

export default function App() {
  return <AppRoutes />;
}
