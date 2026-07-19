#!/bin/sh
# Gate de estilo (regras E01/E02 de .rules/anti-ai-style.md).
# Roda como hook PostToolUse apos Write/Edit: bloqueia travessao (U+2014),
# meia-risca (U+2013) e aspas curvas (U+201C/U+201D) no arquivo editado.
# O padrao e montado por bytes hex para este script nao conter os glifos.

file=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

pat=$(printf '\xe2\x80\x94|\xe2\x80\x93|\xe2\x80\x9c|\xe2\x80\x9d')

if grep -nE "$pat" "$file" >/dev/null 2>&1; then
  echo "Gate de estilo: travessao, meia-risca ou aspas curvas encontrados em $file. Substitua por hifen e aspas retas (ver .rules/anti-ai-style.md, criterios E01 e E02)." >&2
  exit 2
fi
exit 0
