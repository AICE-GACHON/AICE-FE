// 랜딩(/). App.jsx가 화면 분기를 들고 있을 때는 이 조각들이 App의 return문에
// 그대로 널려 있었다. 이제 App은 라우터만 들고 있으므로 한 화면으로 묶는다.
//
// "시작하기"·"로그인" 이동은 콜백 prop 대신 각 컴포넌트 안의 <Link>가 맡는다 —
// 랜딩은 이 페이지가 어디로 가는지 알 필요가 없다.
import Header from './components/Header';
import Hero from './components/Hero';
import GalleryCards from './components/GalleryCards';
import ScopeStrip from './components/ScopeStrip';
import ProblemCompare from './components/ProblemCompare';
import ReviewSimulator from './components/ReviewSimulator';
import ProcessSteps from './components/ProcessSteps';
import Features from './components/Features';
import CtaBand from './components/CtaBand';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <GalleryCards />
      <ScopeStrip />
      <ProblemCompare />
      <ReviewSimulator />
      <ProcessSteps />
      <Features />
      <CtaBand />
      <Footer />
    </>
  );
}
