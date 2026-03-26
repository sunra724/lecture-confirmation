# Lecture Confirmation

`강의확인서_BUILD.md`를 바탕으로 재구축 중인 Next.js 프로젝트입니다.

## 로컬 실행

1. WSL 대신 Windows 터미널이나 PowerShell에서 이 프로젝트 폴더로 이동합니다.
2. `.env.example`을 복사해 `.env.local`을 만듭니다.
3. 아래 명령을 실행합니다.

```bash
npm install
npm run dev
```

기본 접속 경로:

- `/`
- `/admin/login`
- `/admin`

현재는 첫 접속 시 예시 강의 세션 1건을 자동으로 생성합니다.

현재 포함된 범위:

- 관리자 로그인
- SQLite 세션 스키마 초기화
- 관리자 제출현황 목록
- 상태 필터
- 새 강의세션 생성 다이얼로그
- 링크 발송 이메일
- 세션 상세 화면 골격
- 세션 삭제 API와 UI
- 토큰 기반 공개 제출 폼
- 제출 API와 파일 저장
- 제출 완료 이메일 알림

다음 단계:

- PDF 출력 복원
- 문자 / 알림톡 연동
- 목록/상세 새로고침 없이 상태 갱신 UX 다듬기
