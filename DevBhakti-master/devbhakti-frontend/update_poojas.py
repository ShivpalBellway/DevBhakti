import os
import re

base_dir = r"c:\Users\admin\Downloads\DevBhakti-master\DevBhakti-master\devbhakti-frontend\src\app\mandal-admin\poojas"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Imports
    content = content.replace(
        'import { fetchMyPoojas, deleteMyPooja, togglePoojaStatus, fetchPoojaCategories } from "@/api/templeAdminController";',
        'import { fetchPoojaCategories } from "@/api/templeAdminController";\nimport { fetchMyMandalPoojas, deleteMandalPooja, toggleMandalPoojaStatus } from "@/api/mandalAdminController";'
    )
    content = content.replace(
        'import { fetchMyPoojas, updateMyPooja, fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";',
        'import { fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";\nimport { fetchMyMandalPoojas, updateMandalPooja } from "@/api/mandalAdminController";'
    )
    content = content.replace(
        'import { createMyPooja, fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";',
        'import { fetchPoojaCategories, suggestPoojaCategory } from "@/api/templeAdminController";\nimport { createMandalPooja } from "@/api/mandalAdminController";'
    )
    content = content.replace(
        'import { fetchMyPoojas } from "@/api/templeAdminController";',
        'import { fetchMyMandalPoojas } from "@/api/mandalAdminController";'
    )
    
    # API calls
    content = content.replace('fetchMyPoojas()', 'fetchMyMandalPoojas()')
    content = content.replace('deleteMyPooja(', 'deleteMandalPooja(')
    content = content.replace('togglePoojaStatus(', 'toggleMandalPoojaStatus(')
    content = content.replace('createMyPooja(', 'createMandalPooja(')
    content = content.replace('updateMyPooja(', 'updateMandalPooja(')
    
    # Routes
    content = content.replace('/temples/dashboard/poojas', '/mandal-admin/poojas')
    
    # Component Names (Optional but good)
    content = content.replace('TemplePoojasListPage', 'MandalPoojasListPage')
    content = content.replace('TempleCreatePoojaPage', 'MandalCreatePoojaPage')
    content = content.replace('TempleEditPoojaPage', 'MandalEditPoojaPage')
    content = content.replace('TempleViewPoojaPage', 'MandalViewPoojaPage')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))

print("All replacements done!")
