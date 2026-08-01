const ART_COPY = {
  1: {
    tag: '왜 물어보나요',
    title: '입장에 따라 설명 난이도를 바꿔요',
    body: '처음 투고하는 분에게는 리뷰 용어를 쉽게 풀어드리고, 투고 경험이 많은 분에게는 근거 논문과 리뷰 원문을 더 강조해서 보여드려요.',
    example: {
      label: '재현성 부족',
      before: '다른 연구자가 같은 실험을 반복할 수 있도록 데이터와 실험 설정을 더 자세히 작성해야 한다는 의미예요.',
      after: '근거: 유사 논문 8편 중 5편에서 동일한 리뷰 지적 발생',
    },
  },
  2: {
    tag: '왜 물어보나요',
    title: '선택한 목적을 결과 화면 맨 위로 올려요',
    body: '기능을 숨기지 않고, 선택하신 목적에 맞는 카드를 결과 화면 상단에 먼저 배치해요.',
    example: null,
  },
  3: {
    tag: '왜 물어보나요',
    title: '분야·학회에 맞춰 검색 가중치를 조정해요',
    body: '목표 학회를 정했더라도 그 학회 논문만 보여주면 결과가 너무 좁아지기 때문에, 관련 학회 논문도 함께 참고해서 보여드려요.',
    example: null,
  },
};

export default function StepArt({ step }) {
  const copy = ART_COPY[step];
  if (!copy) return null;

  return (
    <div className="onboard-art-card float-panel">
      <div className="tag"><span className="dot2" />{copy.tag}</div>
      <div className="headline">{copy.title}</div>
      <p className="quote">{copy.body}</p>

      {copy.example && (
        <div className="onboard-art-example">
          <div className="onboard-art-example-label">{copy.example.label}</div>
          <p className="onboard-art-example-before">{copy.example.before}</p>
          <p className="onboard-art-example-after">{copy.example.after}</p>
        </div>
      )}
    </div>
  );
}
