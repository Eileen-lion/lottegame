#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js를 찾을 수 없습니다. Node.js가 설치된 터미널에서 npm start로 실행해주세요."
  read -r -p "엔터를 누르면 창을 닫습니다."
  exit 1
fi
node server.mjs --open
result=$?
if [ "$result" -ne 0 ]; then
  read -r -p "위 오류를 확인해주세요. 엔터를 누르면 창을 닫습니다."
fi
exit "$result"
