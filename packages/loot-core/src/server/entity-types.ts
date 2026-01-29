/**
 * Register entity types for the white-label application
 * This file registers all entity types so they can be used with the rules system
 */

import { entityTypeRegistry } from '../types/rules-entity';

export function registerEntityTypes() {
  // Register Products entity type
  entityTypeRegistry.register({
    id: 'product',
    displayName: 'Product',
    defaultFields: {
      date: true, // created_date
      notes: true, // description
      amount: false,
    },
    fields: {
      name: {
        type: 'string',
        required: true,
        displayName: 'Name',
      },
      description: {
        type: 'string',
        displayName: 'Description',
      },
      price: {
        type: 'number',
        displayName: 'Price',
      },
      category: {
        type: 'string',
        displayName: 'Category',
      },
    },
  });

  // Register Notes entity type
  entityTypeRegistry.register({
    id: 'note',
    displayName: 'Note',
    defaultFields: {
      date: true, // created_date
      notes: true, // content
      amount: false,
    },
    fields: {
      title: {
        type: 'string',
        required: true,
        displayName: 'Title',
      },
      content: {
        type: 'string',
        displayName: 'Content',
      },
      priority: {
        type: 'string',
        displayName: 'Priority',
      },
      status: {
        type: 'string',
        displayName: 'Status',
      },
    },
  });
}
