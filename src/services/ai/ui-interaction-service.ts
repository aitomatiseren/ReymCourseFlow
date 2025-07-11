import { AIResponse } from './types';

export interface UIAction {
  type: 'click' | 'type' | 'select' | 'navigate' | 'filter' | 'search';
  description: string;
  selector?: string;
  value?: string;
  path?: string;
  requiresConfirmation: boolean;
}

export interface PageState {
  currentPage: string;
  visibleElements: string[];
  availableActions: string[];
  formFields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
  }>;
  tableData?: {
    headers: string[];
    rowCount: number;
    hasFilters: boolean;
    hasPagination: boolean;
  };
}

export class UIInteractionService {
  private static instance: UIInteractionService;
  
  public static getInstance(): UIInteractionService {
    if (!UIInteractionService.instance) {
      UIInteractionService.instance = new UIInteractionService();
    }
    return UIInteractionService.instance;
  }

  // Read current page state to understand what actions are possible
  readPageState(): PageState {
    const currentPath = window.location.pathname;
    const pageState: PageState = {
      currentPage: currentPath,
      visibleElements: [],
      availableActions: [],
      formFields: []
    };

    try {
      // Detect common UI elements
      const buttons = document.querySelectorAll('button:not([disabled])');
      const links = document.querySelectorAll('a[href]');
      const inputs = document.querySelectorAll('input, textarea, select');
      const tables = document.querySelectorAll('table');
      
      // Catalog visible interactive elements
      buttons.forEach(btn => {
        const text = btn.textContent?.trim();
        if (text && text.length < 50) {
          pageState.visibleElements.push(`Button: "${text}"`);
          pageState.availableActions.push(`click button "${text}"`);
        }
      });

      links.forEach(link => {
        const text = link.textContent?.trim();
        const href = link.getAttribute('href');
        if (text && text.length < 50 && href) {
          pageState.visibleElements.push(`Link: "${text}" (${href})`);
          pageState.availableActions.push(`navigate to "${text}"`);
        }
      });

      // Catalog form fields
      inputs.forEach(input => {
        const label = this.getFieldLabel(input);
        const type = input.getAttribute('type') || input.tagName.toLowerCase();
        const name = input.getAttribute('name') || input.getAttribute('id') || '';
        const required = input.hasAttribute('required');
        
        if (label) {
          pageState.formFields.push({
            name,
            type,
            label,
            required
          });
          pageState.availableActions.push(`fill "${label}" field`);
        }
      });

      // Detect tables with data
      if (tables.length > 0) {
        const firstTable = tables[0];
        const headers = Array.from(firstTable.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        const rows = firstTable.querySelectorAll('tbody tr');
        
        pageState.tableData = {
          headers,
          rowCount: rows.length,
          hasFilters: document.querySelectorAll('[data-filter], .filter').length > 0,
          hasPagination: document.querySelectorAll('.pagination, [data-pagination]').length > 0
        };
        
        pageState.availableActions.push('filter table data', 'sort table', 'export data');
      }

      // Detect common search functionality
      const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i]');
      if (searchInputs.length > 0) {
        pageState.availableActions.push('search data');
      }

      console.log('📋 Page state detected:', pageState);
      
    } catch (error) {
      console.error('Error reading page state:', error);
    }

    return pageState;
  }

  private getFieldLabel(element: Element): string {
    // Try to find associated label
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label && label.textContent) {
        return label.textContent.trim();
      }
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel && parentLabel.textContent) {
      return parentLabel.textContent.trim();
    }

    // Try placeholder or aria-label
    const placeholder = element.getAttribute('placeholder');
    const ariaLabel = element.getAttribute('aria-label');
    
    return placeholder || ariaLabel || 'Unknown field';
  }

  // Simulate clicking an element
  async clickElement(description: string, selector?: string): Promise<AIResponse> {
    try {
      let element: Element | null = null;
      
      if (selector) {
        element = document.querySelector(selector);
      } else {
        // Try to find element by description
        element = this.findElementByDescription(description);
      }

      if (!element) {
        return {
          content: `I couldn't find the element "${description}" on the current page. The page might have changed or the element might not be visible.`,
          suggestions: ['Refresh page', 'Check current page', 'Try different search terms']
        };
      }

      // Simulate click
      if (element instanceof HTMLElement) {
        element.click();
        
        // Wait a moment for any page changes
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          content: `Successfully clicked "${description}".`,
          suggestions: ['Continue with next step', 'Check page changes', 'Go back if needed']
        };
      } else {
        return {
          content: `Found "${description}" but it's not clickable.`,
          suggestions: ['Try a different element', 'Check page structure', 'Use navigation instead']
        };
      }
    } catch (error) {
      console.error('Error clicking element:', error);
      return {
        content: `Error clicking "${description}": ${error}`,
        suggestions: ['Try again', 'Use manual navigation', 'Refresh page']
      };
    }
  }

  // Fill a form field
  async fillField(fieldDescription: string, value: string, selector?: string): Promise<AIResponse> {
    try {
      let element: Element | null = null;
      
      if (selector) {
        element = document.querySelector(selector);
      } else {
        element = this.findFieldByDescription(fieldDescription);
      }

      if (!element) {
        return {
          content: `I couldn't find the field "${fieldDescription}" on the current page.`,
          suggestions: ['Check field name', 'Refresh page', 'Navigate to correct form']
        };
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        // Clear existing value
        element.value = '';
        element.focus();
        
        // Type the value
        element.value = value;
        
        // Trigger events that React forms typically listen for
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        return {
          content: `Successfully filled "${fieldDescription}" with "${value}".`,
          suggestions: ['Fill next field', 'Submit form', 'Review entries']
        };
      } else if (element instanceof HTMLSelectElement) {
        // Handle select elements
        element.value = value;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        return {
          content: `Successfully selected "${value}" in "${fieldDescription}".`,
          suggestions: ['Fill next field', 'Submit form', 'Review selection']
        };
      } else {
        return {
          content: `Found "${fieldDescription}" but it's not a fillable field.`,
          suggestions: ['Check field type', 'Try different field', 'Use manual input']
        };
      }
    } catch (error) {
      console.error('Error filling field:', error);
      return {
        content: `Error filling "${fieldDescription}": ${error}`,
        suggestions: ['Try again', 'Use manual input', 'Check field accessibility']
      };
    }
  }

  private findElementByDescription(description: string): Element | null {
    // Convert description to lowercase for case-insensitive matching
    const desc = description.toLowerCase();
    
    // Try to find by button text
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const button of buttons) {
      const text = button.textContent?.toLowerCase().trim();
      if (text && (text.includes(desc) || desc.includes(text))) {
        return button;
      }
    }
    
    // Try to find by link text
    const links = Array.from(document.querySelectorAll('a'));
    for (const link of links) {
      const text = link.textContent?.toLowerCase().trim();
      if (text && (text.includes(desc) || desc.includes(text))) {
        return link;
      }
    }
    
    // Try aria-label and title attributes
    const elements = Array.from(document.querySelectorAll('[aria-label], [title]'));
    for (const element of elements) {
      const ariaLabel = element.getAttribute('aria-label')?.toLowerCase();
      const title = element.getAttribute('title')?.toLowerCase();
      
      if ((ariaLabel && ariaLabel.includes(desc)) || (title && title.includes(desc))) {
        return element;
      }
    }
    
    return null;
  }

  private findFieldByDescription(description: string): Element | null {
    const desc = description.toLowerCase();
    
    // Try to find by label text
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      const text = label.textContent?.toLowerCase().trim();
      if (text && (text.includes(desc) || desc.includes(text))) {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
          return document.getElementById(forAttr);
        }
        // Check for input inside label
        const input = label.querySelector('input, textarea, select');
        if (input) return input;
      }
    }
    
    // Try to find by placeholder
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    for (const input of inputs) {
      const placeholder = input.getAttribute('placeholder')?.toLowerCase();
      const ariaLabel = input.getAttribute('aria-label')?.toLowerCase();
      
      if ((placeholder && placeholder.includes(desc)) || (ariaLabel && ariaLabel.includes(desc))) {
        return input;
      }
    }
    
    return null;
  }

  // Apply filters to data tables
  async applyFilter(filterType: string, value: string): Promise<AIResponse> {
    // This would implement table filtering logic
    return {
      content: `Filter functionality for "${filterType}" with value "${value}" is being implemented.`,
      suggestions: ['Apply additional filters', 'Clear filters', 'Export filtered data']
    };
  }

  // Perform search operations
  async performSearch(query: string): Promise<AIResponse> {
    try {
      console.log('🔍 Looking for search input...');
      
      // Look for search inputs with various patterns
      const searchInputs = document.querySelectorAll(`
        input[type="search"], 
        input[placeholder*="search" i], 
        input[placeholder*="Search" i],
        input[placeholder*="name" i],
        input[placeholder*="employee" i]
      `);
      
      console.log('📋 Found search inputs:', searchInputs.length);
      
      if (searchInputs.length === 0) {
        return {
          content: 'No search functionality found on the current page.',
          suggestions: ['Navigate to searchable page', 'Use global search', 'Try different page']
        };
      }
      
      const searchInput = searchInputs[0] as HTMLInputElement;
      console.log('🎯 Using search input with placeholder:', searchInput.placeholder);
      
      // Clear existing value and set new one
      searchInput.value = '';
      searchInput.focus();
      searchInput.value = query;
      
      // Trigger React events
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Wait for search to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Search completed for:', query);
      
      return {
        content: `Successfully searched for "${query}". The results should now be filtered on the page.`,
        suggestions: ['View search results', 'Click on an employee', 'Refine search']
      };
    } catch (error) {
      console.error('Error performing search:', error);
      return {
        content: `Error performing search: ${error}`,
        suggestions: ['Try manual search', 'Check search functionality', 'Refresh page']
      };
    }
  }

  // Get available actions for current page
  getAvailableActions(): string[] {
    const pageState = this.readPageState();
    return pageState.availableActions;
  }
}