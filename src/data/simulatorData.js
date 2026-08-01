// 백엔드 연결 전까지 쓰는 기본(mock) 데이터.
// 실제 서비스에서는 이 배열이 api/reviewPrediction.js 응답으로 대체됨.
export const simulatorPanels = [
  {
    id: 'method',
    label: '4. Method',
    kicker: 'Section 4 · Method',
    before: '본 연구는 규칙 엔진과 검색 기반 자연어 처리를 결합한 하이브리드 구조를 제안한다. ',
    struck: '수치로 계산 가능한 조건은 규칙 엔진이 처리하고, 예외 조건은 별도 모듈이 처리한다.',
    inserted: '수치 조건은 규칙 엔진이, 자연어 예외 조건은 검색 기반 모듈이 처리하며 두 결과를 신뢰도 가중합으로 결합한다.',
    after: ' 이를 통해 일반적인 생성형 응답 대비 오류를 줄이고자 한다.',
    notes: [
      { tone: 'amber', who: 'REVIEWER 2 · CLARITY', txt: "두 모듈을 '결합'한다는 게 구체적으로 어떤 방식인가요?" },
      { tone: 'red', who: 'REVIEWER 1 · NOVELTY', txt: '규칙+검색 결합은 선행 연구와 어떻게 다른지 비교가 없습니다.' },
    ],
  },
  {
    id: 'related',
    label: '3. Related Work',
    kicker: 'Section 3 · Related Work',
    before: '',
    struck: '관련 연구들은 사용자 프로필 기반 추천을 주로 다루었다.',
    inserted: '관련 연구들은 대부분 정적인 사용자 프로필에 의존했으며, 실시간 맥락 신호를 반영한 사례는 소수에 그친다.',
    after: ' 본 논문은 위치라는 실시간 신호를 명시적으로 다룬다는 점에서 차별화된다.',
    notes: [
      { tone: 'amber', who: 'REVIEWER 2 · SCOPE', txt: "'정적 프로필'과 무엇이 다른지 한 문장으로 더 선명하게 대비해주세요." },
      { tone: 'green', who: 'REVIEWER 3 · POSITIONING', txt: '실시간 신호에 초점을 맞춘 포지셔닝은 명확하고 좋습니다.' },
    ],
  },
  {
    id: 'exp',
    label: '5. Experiments',
    kicker: 'Section 5 · Experiments',
    before: '',
    struck: '제안 방식의 사례를 세 가지 시나리오로 정성 평가하였다.',
    inserted: '제안 방식과 규칙 기반 단독 baseline을 비교하는 소규모 사용자 실험을 추가로 진행하였다.',
    after: ' 평가 결과는 표 2에 정리되어 있다.',
    notes: [
      { tone: 'red', who: 'REVIEWER 1 · EVALUATION', txt: '정량 지표 없이 사례만 제시되어 재현성을 판단하기 어렵습니다.' },
      { tone: 'amber', who: 'REVIEWER 2 · BASELINE', txt: '최소한 규칙 기반 단독 방식과의 비교는 있어야 합니다.' },
    ],
  },
];