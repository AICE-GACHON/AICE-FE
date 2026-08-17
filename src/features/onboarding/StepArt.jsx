const ART_COPY = {
  1: {
    tag: '왜 물어보나요?',
    title: '지금은 프로필로만 쓰여요',
    body: '역할·전공 분야를 미리 알아두면, 이후에 맞춤 기능을 만들 때 활용할 수 있어요. 지금 결과 화면은 모든 분께 동일하게 보여드려요.',
  },
  2: {
    tag: '왜 물어보나요?',
    title: '고르신 기준이 검색에 바로 반영돼요',
    body: '최신·인용 선호는 후보 논문을 찾는 검색 순위에, 눈여겨볼 면은 그 후보들의 본문을 대조해 최종 논문을 고르는 단계에 반영돼요. 분석이 끝나면 어떤 기준으로 골랐는지 결과 화면에 적어 드려요.',
  },
  3: {
    tag: '왜 물어보나요?',
    title: '목표 학회 논문이 검색에 조금 더 유리해요',
    body: '완전히 그 학회 논문만 찾아드리는 건 아니지만, 유사도가 비슷하다면 목표 학회 논문이 검색 결과에 뽑힐 확률이 살짝 더 높아져요.',
  },
};

export default function StepArt({ step }) {
  const copy = ART_COPY[step];
  if (!copy) return null;

  return (
    <div className="onboard-art-card float-panel">
      <div className="tag">{copy.tag}</div>
      <div className="headline">{copy.title}</div>
      <p className="quote">{copy.body}</p>
    </div>
  );
}
