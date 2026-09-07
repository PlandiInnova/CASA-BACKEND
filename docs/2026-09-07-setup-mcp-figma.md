# Setup MCP de Figma

Fecha: 2026-09-07

## Que cambio
Se agrego `.mcp.json` en los tres directorios de trabajo del equipo:
- `CASA-BACKEND/.mcp.json`
- `casa-launcher/.mcp.json`
- `casa-web/.mcp.json`

Cada uno declara dos servidores MCP:
- `figma`: servidor remoto oficial `https://mcp.figma.com/mcp` (HTTP + OAuth).
- `figma-desktop`: servidor local de Figma Desktop en `http://127.0.0.1:3845/mcp`.

## Por que
No existia ninguna configuracion MCP (ni global en `~/.claude.json` ni por proyecto).
`.mcp.json` es el scope de proyecto versionable, asi que la configuracion queda
compartida para todo el equipo al hacer commit.

## Problemas que surgieron
- Figma Desktop estaba abierto pero el puerto 3845 no escuchaba: el servidor MCP
  local viene desactivado. Hay que activarlo en Figma: menu Figma > Preferences >
  Enable local MCP server (requiere asiento Dev o Full).
- Por eso se dejo tambien el servidor remoto, que no depende de ese toggle.

## Resultado

**Funcionando.** Pasos que hubo que hacer a mano:

1. Reiniciar la sesion de Claude Code para que cargue `.mcp.json` (pide aprobar los
   servidores del proyecto la primera vez).
2. `/mcp` -> autenticar `figma` por OAuth en el navegador.

`figma-desktop` sigue en `ConnectionRefused` y no se activo: el remoto cubrio todo el
trabajo del cambio de arte de casa-launcher (lectura de nodos, colores, tipografias y
exportacion de assets). El local solo aportaria leer la seleccion activa del editor.

Se uso para extraer, nodo por nodo, las medidas y colores del arte nuevo, y para
exportar las 8 portadas y los 18 iconos de recurso de la entrega al admin. Detalle en
[casa-launcher/docs/arte/](../../casa-launcher/docs/arte/00-INDICE.md).

**Ojo:** las URLs de assets que devuelve el MCP **caducan a los 7 dias**. Todo lo que
se necesite hay que bajarlo y commitearlo en el momento.

## Archivos tocados
- `CASA-BACKEND/.mcp.json` (nuevo)
- `casa-launcher/.mcp.json` (nuevo)
- `casa-web/.mcp.json` (nuevo)
- `CASA-BACKEND/docs/2026-09-07-setup-mcp-figma.md` (nuevo)
