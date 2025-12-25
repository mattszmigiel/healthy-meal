# Testing Documentation

This project uses a comprehensive testing setup with multiple testing tools for different purposes.

## Testing Stack

- **Vitest** - Unit and integration testing
- **React Testing Library** - React component testing
- **Playwright** - End-to-end (E2E) testing
- **Supertest** - HTTP API testing
- **MSW (Mock Service Worker)** - Mocking external services

## Running Tests

### Unit and Component Tests (Vitest)

```bash
# Run tests in watch mode (development)
npm test

# Run tests once (CI/production)
npm run test:run

# Run tests with UI mode
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate E2E tests using codegen
npm run test:e2e:codegen
```

## Test Organization

```
healthy-meal/
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── __tests__/
│   │           └── button.test.tsx          # Component tests
│   ├── lib/
│   │   └── utils/
│   │       ├── api-responses.ts
│   │       └── __tests__/
│   │           └── api-responses.test.ts    # Unit tests
│   ├── pages/
│   │   └── api/
│   │       └── __tests__/
│   │           └── api-example.test.ts      # API route tests
│   └── test/
│       ├── setup.ts                         # Vitest global setup
│       └── helpers/
│           └── api-test-helpers.ts          # Testing utilities
└── tests/
    └── e2e/
        └── homepage.spec.ts                  # E2E tests
```

## Writing Tests

### Unit Tests (Vitest)

Unit tests should be placed in `__tests__` folders next to the files they test:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Component Tests (React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### API Route Tests

```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '../api/my-route';
import { createMockAPIContext } from '@/test/helpers/api-test-helpers';

describe('GET /api/my-route', () => {
  it('should return data', async () => {
    const context = createMockAPIContext();
    const response = await GET(context);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });
});
```

### E2E Tests (Playwright)

E2E tests should be placed in the `tests/e2e` folder:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform user flow', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);
  });
});
```

## Best Practices

### Vitest

- Use `describe` blocks to group related tests
- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Use `vi.mock()` for mocking modules at the top level
- Use `vi.fn()` for creating mock functions
- Use `beforeEach`/`afterEach` for test setup and cleanup

### React Testing Library

- Query by role, label, or text (not by test IDs unless necessary)
- Use `userEvent` instead of `fireEvent` for more realistic interactions
- Use `waitFor` for async operations
- Don't test implementation details, test user behavior
- Use `screen.debug()` to inspect the rendered output during development

### Playwright

- Use browser contexts to isolate tests
- Implement Page Object Model for complex pages
- Use data-testid attributes sparingly (prefer semantic selectors)
- Take advantage of auto-waiting (don't add manual waits)
- Use `page.waitForLoadState('networkidle')` for dynamic content
- Leverage trace viewer for debugging failures

## Coverage

Coverage reports are generated in the `coverage` folder when running:

```bash
npm run test:coverage
```

View the HTML report at `coverage/index.html`.

## Debugging Tests

### Vitest

- Use `test.only()` to run a single test
- Use `test.skip()` to skip a test
- Add `debugger` statements in tests
- Run with `--reporter=verbose` for detailed output

### Playwright

- Use `--debug` flag to run in debug mode
- Use `page.pause()` to pause execution
- View traces in Trace Viewer after failures
- Use `--headed` to see the browser
- Use codegen to record user interactions

## CI/CD Integration

For CI/CD pipelines, use:

```bash
# Run all unit tests
npm run test:run

# Run E2E tests (requires running dev server)
npm run test:e2e
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
