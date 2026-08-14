const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app', 'mandal-admin', 'poojas');

function replaceInFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // Imports
    content = content.replace(
        'import { fetchMyPoojas, deleteMyPooja, togglePoojaStatus, fetchPoojaCategories } from "@/api/templeAdminController";',
        'import { fetchPoojaCategories } from "@/api/templeAdminController";\nimport { fetchMyMandalPoojas, deleteMandalPooja, toggleMandalPoojaStatus } from "@/api/mandalAdminController";'
    );
    content = content.replace(
        'import { fetchMyPoojas, updateMyPooja, fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";',
        'import { fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";\nimport { fetchMyMandalPoojas, updateMandalPooja } from "@/api/mandalAdminController";'
    );
    content = content.replace(
        'import { createMyPooja, fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";',
        'import { fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";\nimport { createMandalPooja } from "@/api/mandalAdminController";'
    );
    content = content.replace(
        'import { fetchMyPoojas } from "@/api/templeAdminController";',
        'import { fetchMyMandalPoojas } from "@/api/mandalAdminController";'
    );
    content = content.replace(
        'import { createMyPooja } from "@/api/templeAdminController";',
        'import { createMandalPooja } from "@/api/mandalAdminController";'
    );
    
    // API calls
    content = content.replaceAll('fetchMyPoojas()', 'fetchMyMandalPoojas()');
    content = content.replaceAll('deleteMyPooja(', 'deleteMandalPooja(');
    content = content.replaceAll('togglePoojaStatus(', 'toggleMandalPoojaStatus(');
    content = content.replaceAll('createMyPooja(', 'createMandalPooja(');
    content = content.replaceAll('updateMyPooja(', 'updateMandalPooja(');
    
    // Routes
    content = content.replaceAll('/temples/dashboard/poojas', '/mandal-admin/poojas');
    
    // Component Names
    content = content.replace('TemplePoojasListPage', 'MandalPoojasListPage');
    content = content.replace('TempleCreatePoojaPage', 'MandalCreatePoojaPage');
    content = content.replace('TempleEditPoojaPage', 'MandalEditPoojaPage');
    content = content.replace('TempleViewPoojaPage', 'MandalViewPoojaPage');

    fs.writeFileSync(filepath, content, 'utf-8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(baseDir);
console.log("All replacements done!");
