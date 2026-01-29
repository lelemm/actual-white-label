import { v4 as uuidv4 } from 'uuid';

import * as fs from '../../platform/server/fs';
import { handlers } from '../main';

export async function uniqueFileName(
  initialName: string = 'My Finances',
): Promise<string> {
  const budgets = await handlers['get-files']();
  let idx = 1;

  // If there is a conflict, keep appending an index until there is no
  // conflict and we have a unique name
  let newName = initialName;
  while (budgets.find(file => file.name === newName)) {
    newName = `${initialName} ${idx}`;
    idx++;
  }

  return newName;
}

export async function validateFileName(
  name: string,
): Promise<{ valid: boolean; message?: string }> {
  const trimmedName = name.trim();
  const uniqueName = await uniqueFileName(trimmedName);
  let message: string | null = null;

  if (trimmedName === '') message = 'Budget name cannot be blank';
  if (trimmedName.length > 100) {
    message = 'Budget name is too long (max length 100)';
  }
  if (uniqueName !== trimmedName) {
    message = `"${name}" already exists, try "${uniqueName}" instead`;
  }

  return message ? { valid: false, message } : { valid: true };
}

export async function idFromFileName(name: string): Promise<string> {
  let id = name.replace(/( |[^A-Za-z0-9])/g, '-') + '-' + uuidv4().slice(0, 7);

  // Make sure the id is unique. There's a chance one could already
  // exist (although very unlikely now that we append unique
  // characters onto the id)
  let index = 0;

  let fileDir = fs.getFileDir(id);
  while (await fs.exists(fileDir)) {
    index++;
    fileDir = fs.getFileDir(id + index.toString());
  }

  // If a suffix was added, update the id
  if (index > 0) {
    id = id + index.toString();
  }

  return id;
}
