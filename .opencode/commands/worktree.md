---
description: Crea un git worktree en .worktree/<nombre> usando el argumento recibido.
---

Ejecuta solo este comando, sin cambiar de directorio y sin hacer nada adicional. Convierte el argumento en un nombre simple y aceptable para el worktree: reemplaza secuencias de caracteres no alfanumericos por `-`. Si el argumento es muy largo simplificalo a un nombre significativo antes de ejecutar el comando.

```bash
git worktree add ".worktree/$(printf %s "$ARGUMENTS" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' '-')"
```
