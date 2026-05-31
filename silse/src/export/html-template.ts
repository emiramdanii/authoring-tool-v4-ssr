export function buildHtmlTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 0; }
    .cover-block { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .cover-icon { font-size: 4rem; }
    .page { padding: 2rem; }
    .icon { margin-right: 0.5rem; }
    .heading-icon { margin-right: 0.25rem; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
