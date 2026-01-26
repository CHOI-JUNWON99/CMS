
import { Stock } from './types';

export const CHINA_STOCKS: Stock[] = [
  {
    id: '002050',
    ticker: '002050.SZ',
    name: 'Sanhua',
    nameKr: '삼화',
    sector: '자동차 부품',
    keywords: ['전기차', '열관리', '냉공조', '부품'],
    investmentPoints: ['전기차 열관리 시스템 글로벌 선도', '전자 팽창 밸브 독보적 기술력', '가전에서 전장으로 사업 영역 확대'],
    marketCap: '43조 5,892억원',
    marketCapValue: 435892,
    price: 25.40,
    change: 1.25,
    returnRate: 15.4,
    description: '에어컨 및 냉장고용 밸브, 펌프 등 가전 부품뿐만 아니라 전기차의 열관리 시스템에 필수적인 전자 팽창 밸브와 같은 자동차 부품을 개발하고 전 세계에 공급하는 제조업체입니다.',
    businessSegments: [
      { name: 'Automotive Thermal', nameKr: '자동차 열관리 시스템', value: 45, color: 'bg-red-500' },
      { name: 'Home Appliance', nameKr: '가전 부품(밸브/펌프)', value: 40, color: 'bg-blue-500' },
      { name: 'Micro-channel', nameKr: '마이크로 채널 열교환기', value: 15, color: 'bg-slate-500' }
    ]
  },
  {
    id: '002407',
    ticker: '002407.SZ',
    name: 'Do-Fluoride',
    nameKr: '다불다',
    sector: '화학',
    keywords: ['LiPF', '전해질', '불소', '이차전지 소재'],
    investmentPoints: ['글로벌 리튬이온 배터리 전해질 핵심 공급사', '육불화인산리튬(LiPF6) 고부가가치 신소재 생산', '불소 화합물 연구 기반 독보적 경쟁력'],
    marketCap: '8조 6,455억원',
    marketCapValue: 86455,
    price: 15.20,
    change: -0.45,
    returnRate: -8.2,
    description: '알루미늄 전기분해에 쓰이는 빙정석 등 무기 불소 화합물 연구를 기반으로, 리튬이온 배터리의 핵심 전해질인 육불화인산리튬과 같은 고부가가치 신소재를 생산하는 정밀 화학 기업입니다.',
    businessSegments: [
      { name: 'New Materials', nameKr: '리튬이온 전해질 신소재', value: 65, color: 'bg-emerald-500' },
      { name: 'Fluoride Chemicals', nameKr: '무기 불소 화합물', value: 25, color: 'bg-teal-600' },
      { name: 'Aluminum Chemicals', nameKr: '알루미늄 화학 제품', value: 10, color: 'bg-gray-400' }
    ]
  },
  {
    id: '002475',
    ticker: '002475.SZ',
    name: 'Luxshare',
    nameKr: '입신정밀',
    sector: '전자부품',
    keywords: ['애플_핵심공급사', '정밀_커넥터', '가전_OEM'],
    investmentPoints: ['애플 공급망 내 핵심 조립 파트너', '정밀 커넥터 및 케이블 글로벌 경쟁력', '전기차 전장 부품 신성장 동력 확보'],
    marketCap: '88조 5,017억원',
    marketCapValue: 885017,
    price: 38.15,
    change: 2.10,
    returnRate: 22.5,
    description: '컴퓨터, 통신 장비, 가전제품 및 자동차 전자장치에 들어가는 정밀 커넥터와 케이블 등 핵심 상호 연결 부품을 연구 개발하고 제조하여 글로벌 시장에 공급하는 IT 부품 전문 기업입니다.',
    businessSegments: [
      { name: 'Consumer Electronics', nameKr: '소비자 가전(스마트폰 등)', value: 80, color: 'bg-blue-600' },
      { name: 'Communication', nameKr: '통신 및 데이터 센터', value: 10, color: 'bg-indigo-500' },
      { name: 'Automotive', nameKr: '자동차 전자 장치', value: 10, color: 'bg-slate-600' }
    ]
  },
  {
    id: '002709',
    ticker: '002709.SZ',
    name: 'Tinci Materials',
    nameKr: '천사첨단신소재',
    sector: '화학',
    keywords: ['배터리_전해액', '리튬이온_소재', '기초_화학'],
    investmentPoints: ['리튬이온 배터리 전해액 세계 시장 점유율 1위', '수직 계열화를 통한 원가 경쟁력 확보', '일상 화학 소재에서 첨단 소재까지 포트폴리오 다각화'],
    marketCap: '20조 2,803억원',
    marketCapValue: 202803,
    price: 21.45,
    change: 0.85,
    returnRate: 12.4,
    description: '샴푸나 세제에 들어가는 계면활성제 및 실리콘 오일 같은 일상 화학 소재부터 리튬이온 배터리용 전해액과 같은 첨단 기능성 화학 소재까지 아우르는 정밀 화학 제품을 연구하고 생산합니다.',
    businessSegments: [
      { name: 'Lithium Battery Materials', nameKr: '리튬이온 배터리 소재', value: 90, color: 'bg-emerald-600' },
      { name: 'Daily Chemicals', nameKr: '퍼스널 케어(계면활성제 등)', value: 10, color: 'bg-blue-400' }
    ]
  },
  {
    id: '0700',
    ticker: '0700.HK',
    name: 'Tencent',
    nameKr: '텐센트',
    sector: '인터넷',
    keywords: ['위챗_SNS', '게임_퍼블리싱', '핀테크_클라우드'],
    investmentPoints: ['중국 최대 소셜 플랫폼 위챗의 강력한 지배력', '글로벌 게임 시장 매출 1위 기업', '핀테크 및 클라우드 부문의 안정적인 성장'],
    marketCap: '1,059조 1,514억원',
    marketCapValue: 10591514,
    price: 412.00,
    change: 1.55,
    returnRate: 35.8,
    description: '중국 최대의 모바일 메신저 위챗을 기반으로 소셜 네트워크, 온라인 게임, 디지털 콘텐츠 유통, 핀테크 결제 솔루션 및 클라우드 비즈니스 서비스를 제공하는 종합 인터넷 플랫폼 기업입니다.',
    businessSegments: [
      { name: 'Value Added Services', nameKr: 'VAS (게임 및 소셜)', value: 55, color: 'bg-blue-600' },
      { name: 'FinTech & Business', nameKr: '핀테크 및 클라우드', value: 30, color: 'bg-cyan-500' },
      { name: 'Online Advertising', nameKr: '온라인 광고', value: 15, color: 'bg-indigo-400' }
    ]
  },
  {
    id: '2269',
    ticker: '2269.HK',
    name: 'WuXi Biologics',
    nameKr: '야오밍바이오',
    sector: '바이오',
    keywords: ['바이오_CRDMO', '의약품_위탁생산', '신약_개발플랫폼'],
    investmentPoints: ['글로벌 바이오 CRDMO 톱티어 입지', 'ADC 및 다중 항체 등 차세대 플랫폼 보유', '풍부한 수주 잔고를 통한 중장기 실적 가시성'],
    marketCap: '25조 7,321억원',
    marketCapValue: 257321,
    price: 18.20,
    change: -1.20,
    returnRate: -15.4,
    description: '글로벌 제약바이오 기업을 대상으로 항체 의약품 및 항체-약물 접합체(ADC)의 발굴부터 임상 개발, 상업용 대량 생산에 이르는 전 과정을 원스톱으로 지원하는 위탁개발생산(CRDMO) 전문 기업입니다.',
    businessSegments: [
      { name: 'Development', nameKr: '공정 개발 서비스', value: 45, color: 'bg-purple-600' },
      { name: 'Manufacturing', nameKr: '상업용 위탁 생산', value: 40, color: 'bg-pink-500' },
      { name: 'Discovery', nameKr: '초기 발굴 연구', value: 15, color: 'bg-slate-500' }
    ]
  },
  {
    id: '601012',
    ticker: '601012.SS',
    name: 'LONGi',
    nameKr: '용기실리콘자재',
    sector: '태양광',
    keywords: ['태양광_웨이퍼', '단결정_모듈', '수소_에너지'],
    investmentPoints: ['세계 최대 단결정 실리콘 웨이퍼 생산 업체', '모듈 기술 고도화로 발전 효율 극대화', '그린 수소 사업 등 친환경 에너지 리딩'],
    marketCap: '29조 830억원',
    marketCapValue: 290830,
    price: 19.45,
    change: 0.55,
    returnRate: -12.4,
    description: '태양광 발전의 핵심 소재인 단결정 실리콘 웨이퍼와 모듈을 대량 생산하고, 이를 바탕으로 분산형 및 대규모 태양광 발전소가 직접 건설되고 운영되는 글로벌 신재생 에너지 기업입니다.',
    businessSegments: [
      { name: 'Solar Modules', nameKr: '태양광 모듈 생산', value: 65, color: 'bg-orange-500' },
      { name: 'Silicon Wafers', nameKr: '단결정 실리콘 웨이퍼', value: 30, color: 'bg-yellow-400' },
      { name: 'EPC & Services', nameKr: '발전소 건설 및 수소', value: 5, color: 'bg-emerald-500' }
    ]
  },
  {
    id: '601138',
    ticker: '601138.SS',
    name: 'Foxconn',
    nameKr: '부사강산업인터넷',
    sector: '통신장비',
    keywords: ['스마트_팩토리', '산업용_인터넷', '서버_장비'],
    investmentPoints: ['글로벌 AI 서버 제조 점유율 1위', '엔비디아 블랙웰 플랫폼 주요 생산 파트너', '폭스콘 그룹의 스마트 제조 및 AI 인프라 핵심'],
    marketCap: '262조 4,580억원',
    marketCapValue: 2624580,
    price: 26.50,
    change: 3.20,
    returnRate: 48.2,
    description: '스마트폰 및 통신 네트워크 장비, 클라우드 데이터센터용 서버, 정밀 공구 및 스마트 제조를 위한 산업용 로봇 등을 연구 개발하고 제조하는 세계적인 전자 기기 및 산업용 인터넷 기업입니다.',
    businessSegments: [
      { name: 'Cloud Service', nameKr: 'AI 서버 및 클라우드 장비', value: 50, color: 'bg-blue-600' },
      { name: 'Network Gear', nameKr: '통신 네트워크 장비', value: 35, color: 'bg-cyan-500' },
      { name: 'Industrial Robots', nameKr: '산업용 로봇 및 정밀 공구', value: 15, color: 'bg-slate-600' }
    ]
  },
  {
    id: '601899',
    ticker: '601899.SH',
    name: 'Zijin Mining',
    nameKr: '자금광업 Class A',
    sector: '비철금속',
    keywords: ['금_구리_채굴', '광물_자원', '리튬_개발'],
    investmentPoints: ['중국 최대 금 및 구리 생산 기업', '전기차 소재 핵심인 리튬 광산 자원 공격적 확보', '글로벌 광산 자원 포트폴리오 다변화로 수익성 제고'],
    marketCap: '151조 4,114억원',
    marketCapValue: 1514114,
    price: 18.25,
    change: 0.95,
    returnRate: 28.4,
    description: '금, 구리, 아연 등 비철금속 광산 자원 탐사 및 개발을 주력으로 하며, 최근 리튬 등 에너지 광물 자원 개발로 영역을 확장하고 있는 중국 최대의 광업 기업입니다.',
    businessSegments: [
      { name: 'Copper', nameKr: '구리 생산 및 판매', value: 45, color: 'bg-orange-600' },
      { name: 'Gold', nameKr: '금 생산 및 판매', value: 35, color: 'bg-yellow-500' },
      { name: 'Zinc & Battery', nameKr: '아연 및 배터리 광물', value: 20, color: 'bg-slate-500' }
    ]
  },
  {
    id: '9988',
    ticker: '9988.HK',
    name: 'Alibaba',
    nameKr: '알리바바',
    sector: '이커머스',
    keywords: ['전자상거래', '알리바바_클라우드', '디지털_경제'],
    investmentPoints: ['중국 내 압도적인 이커머스 생태계 점유율', 'AI 및 클라우드 사업의 수익 구조 개선 본격화', '강력한 자사주 매입 및 배당 등 주주 환원 강화'],
    marketCap: '542조 4,068억원',
    marketCapValue: 5424068,
    price: 92.40,
    change: 1.45,
    returnRate: 5.4,
    description: '타오바오와 티몰을 통한 중국 내 전자상거래, 알리익스프레스 등의 글로벌 커머스, 차이냐오 물류 네트워크, 그리고 알리바바 클라우드와 디지털 미디어 엔터테인먼트 사업을 운영하는 거대 기술 생태계 기업입니다.',
    issues: [
      { date: '25/01/08', title: 'NDR 핵심 목표 명시 및 AI 로봇 MOU', content: '(1/8) NDR에서 26년 Taobao Flash(淘宝闪购)의 핵심 목표 명시; 업계 1위 달성을 위한 투자 확대를 지속할 계획. 이외, 산하 Ali Cloud가 Leju Robot(乐聚机器人)과 MOU 체결; 휴머노이드 로봇 훈련 센터 관련 협력 계획(자사 연산 역량, AI 플랫폼, Qwen 모델을 기반)', keywords: ['NDR', 'TaobaoFlash', 'AI로봇'] },
      { date: '25/01/07', title: '라이브커머스 및 온라인 거래 플랫폼 감독 방안', content: '(1/7) SAMR 및 CAC(국가인터넷정보판공실), <라이브커머스 감독 방안> 및 <온라인 거래 플랫폼 규칙 감독관리 방안>을 발표. ‘반품 없이 환불’, ‘온라인 최저가’ 등 과장 광고와 라이브커머스 분야의 불량 상품, 허위 광고 등을 집중 단속할 것', keywords: ['규제', '라이브커머스', '단속'] },
      { date: '24/12/23', title: '차세대 음성 모델 Fun-Audio-Chat 발표', content: '(12/23) Qwen(通义) 모델 차세대 End-To-End 음성 모델 Fun-Audio-Chat 발표; 추론, 코딩, Function Call 등 지원', keywords: ['AI', 'Qwen', '음성모델'] },
      { date: '24/12/22', title: '이미지 생성 모델 Qwen-Image-Layered 출시', content: '(12/22) 오픈소스형 이미지 생성 모델 ‘Qwen-Image-Layered’ 출시; Photoshop 수준 도면층 이해와 생성 가능', keywords: ['이미지생성', '오픈소스'] },
      { date: '24/12/21', title: 'DingDing AI H/W 개발 프로젝트 추진', content: '(12/21) 산하 오피스 플랫폼 ‘DingDing(钉钉)’이 일명 ‘D 비밀 프로젝트’를 추진 중; ‘Doubao(豆包) AI 폰’과 유사한 AI H/W 개발 프로젝트로 추정', keywords: ['비밀프로젝트', 'AI_HW'] },
      { date: '24/12/16', title: '영상 생성 모델 WanX 2.6 공개 및 앱 리브랜딩', content: '(12/16) 영상 생성 모델 WanX(万相) 2.6 시리즈 공개; 국내 최초로 롤플레이잉 기능을 지원하는 등 전문 제작 기능 강화. 이외, 산하 AntGroup(蚂蚁集团)이 AI 헬스케어 앱 ‘AQ’를 ‘Ant AFu(蚂蚁阿福)’로 리브랜딩; MAU 1,500만명 돌파', keywords: ['영상생성', 'WanX', 'AntGroup'] },
      { date: '24/12/15', title: '[CMS증권] H주 인터넷 애널리스트 NDR 후기', content: '(12/15)[CMS증권] H주 인터넷 애널리스트 NDR 후기\n- AI-클라우드 사업의 직접적인 수혜를 예상; 4Q25 클라우스 사업 매출액 YoY 증가율이 3Q25 34%→36~37%로 가속화되며 일부 하우스는 26년 40%까지 회복될 것으로 추정\n> 다만, 주가는 4Q25부터 이커머스 사업의 매출액 증가율 둔화(Teens→MSD~HSD)를 반영', keywords: ['NDR후기', 'AI클라우드', '수익성'] },
      { date: '24/12/11', title: 'Quark AI 안경 생산라인 증설', content: '(12/11) 춘절 소비 성수기를 타겟으로 ‘Quark’ AI 안경 출하량 확대 위해 Luxshare Precision (002475.SZ) 생산공장에 1개의 신규 생산라인 증설, 차주 가동 추정', keywords: ['AI안경', '공급망', 'Luxshare'] },
      { date: '24/12/10', title: 'Qwen App MAU 3,000만 돌파', content: '(12/10) 산하 ‘Qwen(千问)’ App 출시 23일 만에 MAU 3,000만명 돌파; AI PPT/Writing 등 기능 최초 공개', keywords: ['QwenApp', '성장세'] },
      { date: '24/12/09', title: 'Qwen B2C 사업부 신설 및 슈퍼앱 육성', content: '(12/9) ‘스마트 정보’ 및 ‘스마트 커넥트’ 사업부를 통합하여 Qwen(千问) B2C 사업부 신설; ‘Qwen’ App, Quark, AI H/W 등 사업을 주관하며 ‘Qwen’ App의 슈퍼앱 육성이 최우선 과제가 될 것으로 업계 추정', keywords: ['조직개편', 'B2C'] },
      { date: '24/11/26', title: '[CMS증권] H주 애널리스트 3Q25 실적 코멘트', content: '(11/26)[CMS증권] H주 애널리스트 3Q25 실적 코멘트\n - 3Q25 매출액 2,478억위안(YoY +5%)으로 예상 부합. 오프라인 리테일 사업(Sun Art Retail/Intime Department) 제외 시 YoY +15%로 컨센서스 1% 상회\n-퀵커머스 투자 확대 여파로 순이익 105억위안(YoY -71%), 컨센서스 -22%. 조정 EBITA 91억위안(YoY -78%)\n-국내 이커머스: 매출 YoY +16%, CMR +10%, 퀵커머스 +60%. 조정 EBITA YoY -76%(마진율 8%)\n-해외 이커머스: 매출 YoY +10% 둔화, 조정 EBITA YoY 흑자 전환\n-클라우드: 매출 YoY +35%(2Q +26%), 컨센서스 +5%, EBITA YoY +35%, 마진 개선\n-CAPEX 315억위안(YoY +80%), 글로벌 AI 서버·메모리 수급 타이트 영향. Tencent 흐름과 유사.\n-ADR 실적 발표 전 상승, 콜 후 -2.3% 하락 마감. 경영진 스탠스 평이, AI 투자 언급 제한적\n-4Q25 CMR high-base 부담 언급, 성장 톤 다소 보수적. 클라우드도 “high level of growth 유지” 수준의 가이던스, 경영진, 향후 3년 AI 수요 지속 전망은 유지하나 뉘앙스 중립적.\n-11/27 Quark AI Glasses 신제품 발표 예정\n-Alibaba의 퀵커머스 투자가 축소되고 향후 CAPEX가 AI·클라우드로 이동함에 따라, Meituan은 단기 경쟁 부담 완화와 약 70%의 시장 점유 유지, 중장기 모멘텀 회복 기대', keywords: ['3Q25실적', '클라우드성장', 'CAPEX'] },
      { date: '24/11/25', title: 'AISG 프로젝트 모델 Qwen 전환', content: '(11/25) AI 싱가포르(AISG)가 최신 동남아 LLM 프로젝트 모델을 Meta에서 동사 Qwen으로 전환', keywords: ['AISG', '글로벌채택'] },
      { date: '24/11/24', title: 'Qwen App 다운로드 1,000만 돌파', content: '(11/24) ‘Qwen’ App 출시 일주일 만에 1,000만 다운로드 돌파, H주 주가 +4.67% 급등', keywords: ['성장지표', '주가반응'] },
      { date: '24/11/19', title: 'Qwen App 스토어 2위 및 AntGroup Agent 출시', content: '(11/19) ‘Qwen(千问)’ App이 Apple App Store 무료앱 2위 기록; 이외 산하 Ant Group의 AI Agent ‘Lingguang(灵광)’ App 출시 하루 만에 20만 다운로드', keywords: ['앱순위', 'AntGroup'] },
      { date: '24/11/19', title: '[CMS증권] H주 애널리스트 Qwen App 출시 코멘트', content: '(11/19)[CMS증권] H주 애널리스트 ‘Qwen(千问)’ App 출시 코멘트 및 투자의견 업데이트 \n- AI Agent인 ‘Qwen(千问)’ App을 출시(11/17)하며 B2C 시장으로의 본격적인 진출을 시사 \n> 자사 최고 AI 모델 기반으로 기존 ‘Tongyi(通义)’ App과 Quark(夸크) AI 등 동사 B2C 제품을 결합; 대화형 질의 응답과 더불어 스마트 문서 작성 및 멀티모달 카메라 등 기능을 지원\n- 향후 순차적으로 ‘Qwen’ App에 Taobao(淘宝), Amap (高덕) 등 자사 플랫폼 기반의 Agentic AI 기능을 추가할 계획 \n- 제3자 프로그램과 연결된 ChatGPT 대비, 자체 생태계 내 플랫폼과의 연결 및 무료 전략으로 경쟁 우위를 확보; 향후 DAU 증가세 주목 필요\n- 투자의견 Buy, TP: 204달러(FY26~28 P/E: 23.3x/ 16.3x/13.7x) 유지', keywords: ['투자전략', '투자의견Buy', 'AI_B2C'] },
      { date: '24/11/10', title: '광군절 프로모션 투명도 제고 조치', content: '(11/10) 시장감독관리총국, 주요 이커머스 기업에 <‘광군절 쇼핑축제’ 기간 합법적 프로모션 진행 안내>를 송부; 쿠폰의 사용 조건, 유효기간 명시 등 프로모션 투명도 제고, 광고 내용 심의 강화 등 6대 조치가 포함', keywords: ['광군절', '규제준수'] },
      { date: '24/11/07', title: '초대형 AI 인프라 구축 계획 발표', content: '(11/7) 우융밍(吴泳铭) CEO가 ‘World Internet Conference 2025(11/6~9)’에서 초대형 AI 인프라를 구축 중이라 밝힘', keywords: ['인프라', 'CEO메시지'] },
      { date: '24/11/04', title: 'Ele.me 리브랜딩 및 Robotaxi 진출 소식', content: '(11/4) 산하 \'Ele.me(饿了么)\' 모바일앱의 최신 베타 테스트 버전(12.0.1) 명칭이 \'Taobao Flash Shopping\'\'로 변경\n(11/4) 산하 Amap(高덕)이 Xpeng (NYSE: XPEV, 9868.HK)과 협력하여 Robotaxi 시장에 진출 예정이라는 소식 확산\n(11/4) 산하 Qwen3-Max 모델이 22.3%의 수익률로 ‘Alpha Arena’ 우승', keywords: ['리브랜딩', 'Robotaxi', 'Qwen3'] },
      { date: '24/10/31', title: 'Taobao Flash 온라인 편의점 진출', content: '(10/31) 산하 \'Taobao Flash Shopping(淘宝闪购)\'이 온라인 편의점 사업에 진출, 11/1부터 서비스 개시', keywords: ['온라인편의점', '신규사업'] },
      { date: '24/10/24', title: 'Quark AI Glasses 예약 판매 개시', content: '(10/24) 금일부터 자사 AI 소프트웨어를 탑재한 스마트 안경 ‘Quark AI Glasses’를 3,699~3,999위안에 예약 판매 개시; JD.com ·Douyin·Tmall 등 주요 플랫폼에서 판매되며 12월부터 순차 배송', keywords: ['신제품출시', 'AI안경'] },
      { date: '24/10/22', title: 'Cainiao 1시간 배송 서비스 개시', content: '(10/22) 산하 물류 사업부 Cainiao(菜鸟)가 Taobao Flash(淘宝闪购)에 1시간 내 배송 서비스 제공 개시, 상하이/항저우/난징 등 도시에서 시범 운영 후 전국으로 확대 예정', keywords: ['물류혁신', '1시간배송'] }
    ],
    businessSegments: [
      { name: 'Commerce', nameKr: '전자상거래(국내/해외)', value: 70, color: 'bg-red-500' },
      { name: 'Cloud & AI', nameKr: '클라우드 및 AI 비즈니스', value: 15, color: 'bg-blue-600' },
      { name: 'Logistics', nameKr: '차이냐오 물류 서비스', value: 10, color: 'bg-orange-500' },
      { name: 'Entertainment', nameKr: '디지털 미디어 및 엔터', value: 5, color: 'bg-purple-500' }
    ]
  }
];
