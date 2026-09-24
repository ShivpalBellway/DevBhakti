const fs = require('fs');

const b64Path = 'C:/Users/admin/Downloads/DevBhakti-master/DevBhakti-master/devbhakti-frontend/src/assets/logo_b64.txt';
const b64Data = fs.readFileSync(b64Path, 'utf8').trim();

const targetFiles = [
  'C:/Users/admin/Downloads/DevBhakti-master/DevBhakti-master/devbhakti-frontend/src/utils/mandalReceiptTemplate.ts',
  'C:/Users/admin/Downloads/DevBhakti-master/DevBhakti-master/devbhakti-backend/src/utils/mandalReceiptTemplate.ts'
];

targetFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Insert DEVBHAKTI_LOGO_BASE64 if not present
  if (!content.includes('DEVBHAKTI_LOGO_BASE64')) {
    content = `const DEVBHAKTI_LOGO_BASE64 = "${b64Data}";\n` + content;
  }

  // Replace powered by block
  const targetSnippet = `<div class="powered-by-box">
              <div class="powered-by-text">Powered by</div>
              <div class="brand-logo-text">DevBhakti</div>
            </div>`;

  const newSnippet = `<div class="powered-by-box" style="display: flex; align-items: center; gap: 10px; border-left: 2px solid #e2d7c9; padding-left: 14px; margin-left: 14px;">
              <img src="\${DEVBHAKTI_LOGO_BASE64}" style="height: 42px; width: auto; object-fit: contain; display: block;" alt="DevBhakti Logo" />
              <div style="text-align: left;">
                <div style="font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px;">Powered by</div>
                <div style="font-family: 'Cinzel', 'Georgia', serif; font-size: 16px; font-weight: 800; color: #582b0c; line-height: 1.1;">DevBhakti</div>
                <div style="font-size: 9px; color: #78716c; font-weight: 500; letter-spacing: 0.2px;">Connecting Devotion</div>
              </div>
            </div>`;

  if (content.includes(targetSnippet)) {
    content = content.replace(targetSnippet, newSnippet);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated:', file);
  } else {
    // Try simple powered-by regex replacement for backend
    const simpleTarget = `<div style="text-align: right;">
              <div class="powered-by-text">Powered by</div>
              <div class="brand-logo-text">DevBhakti</div>
            </div>`;
    if (content.includes(simpleTarget)) {
      content = content.replace(simpleTarget, newSnippet);
      fs.writeFileSync(file, content, 'utf8');
      console.log('Successfully updated (backend style):', file);
    } else {
      console.log('Snippet not found in:', file);
    }
  }
});
