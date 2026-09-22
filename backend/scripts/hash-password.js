// ============================================================
// 관리자 비밀번호 해시 생성기
//
// 사용법:
//   cd backend
//   npm run hash-password -- <원하는 비밀번호>
//
// 출력된 해시 값을 backend/.env 파일의 ADMIN_PASSWORD_HASH= 뒤에 붙여넣으세요.
// 비밀번호 원문은 어디에도 저장되지 않고, 이 해시만 저장/비교에 사용됩니다.
// ============================================================
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('사용법: npm run hash-password -- <원하는 비밀번호>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('아래 값을 backend/.env 의 ADMIN_PASSWORD_HASH= 뒤에 붙여넣으세요:');
console.log(hash);
