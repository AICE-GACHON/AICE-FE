import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import './index.css';

// BrowserRouter가 AuthProvider보다 바깥이어야 한다 — 가드가 <Navigate>로 화면을
// 돌려보내려면 라우터 컨텍스트가 이미 있어야 하기 때문이다.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
