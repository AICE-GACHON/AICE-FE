// 로그인 회원의 홈 — 리서치 콘솔 레이아웃의 가운데 칸.
//   · 왼쪽 딥그린 레일(분석 이력·검색·사용자)은 ConsoleLayout이 그린다.
//     /app 화면들과 같은 껍데기라, 결과를 읽다가 바로 다른 분석으로 갈아탈 수 있다.
//   · 여기가 채우는 건 가운데: 상태 띠 + 새로운 논문 분석하기(UploadPage를
//     embedded로 얹어 바로 PDF 업로드)
// 업로드→분석 상태는 AppRoutes의 AnalysisProvider가 들고 있어, 분석이 끝나면
// analyze()가 /app/report로 옮겨 같은 결과를 그대로 보여준다.
import ConsoleLayout from '@/layouts/ConsoleLayout';
import ConsoleStrip from './ConsoleStrip';
import UploadPage from './UploadPage';

export default function HomeDashboard() {
  return (
    <ConsoleLayout>
      {/* 띠는 메인 영역 폭 전체를 쓴다 — 가운데 정렬된 폼(620px)에 묶으면
          "화면의 상태"가 아니라 "카드의 머리말"처럼 읽힌다. */}
      <ConsoleStrip />
      <div className="home-main-scroll">
        <div className="home-main-inner">
          <h1 className="home-greeting">어떤 논문을 분석해 볼까요?</h1>
          <p className="home-greeting-sub">
            PDF를 올리면 비슷한 논문들이 실제로 어떤 리뷰를 받았는지 모아서 보여드려요.
          </p>
          {/* embedded — 바로 위 인사 문구가 이미 제목 역할을 해서, 폼 안의
              "논문 분석" 제목·설명과 자체 상태 띠는 그리지 않는다. */}
          <UploadPage embedded />
        </div>
      </div>
    </ConsoleLayout>
  );
}
