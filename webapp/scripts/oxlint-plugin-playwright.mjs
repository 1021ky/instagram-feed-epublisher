/**
 * @file Custom Oxlint JS plugin for enforcing Playwright Best Practices and Page Object Model (POM) architecture.
 *
 * Enforces official guidelines from:
 * - https://playwright.dev/docs/best-practices
 * - https://playwright.dev/docs/pom
 */

const ACTION_METHODS = new Set([
  "click",
  "dblclick",
  "tap",
  "fill",
  "check",
  "uncheck",
  "setChecked",
  "hover",
  "selectOption",
  "press",
  "dragTo",
]);

const ELEMENT_HANDLE_METHODS = new Set([
  "$",
  "$$",
  "$eval",
  "$$eval",
  "elementHandle",
  "elementHandles",
]);

const MANUAL_STATE_METHODS_TO_WEB_FIRST = new Map([
  ["isVisible", "toBeVisible()"],
  ["isHidden", "toBeHidden()"],
  ["isEnabled", "toBeEnabled()"],
  ["isDisabled", "toBeDisabled()"],
  ["isChecked", "toBeChecked()"],
  ["isEditable", "toBeEditable()"],
  ["textContent", "toHaveText()"],
  ["innerText", "toHaveText()"],
  ["inputValue", "toHaveValue()"],
  ["getAttribute", "toHaveAttribute()"],
  ["count", "toHaveCount()"],
  ["title", "toHaveTitle()"],
]);

const ASYNC_PLAYWRIGHT_MATCHERS = new Set([
  "toBeAttached",
  "toBeChecked",
  "toBeDisabled",
  "toBeEditable",
  "toBeEmpty",
  "toBeEnabled",
  "toBeFocused",
  "toBeHidden",
  "toBeInViewport",
  "toBeOK",
  "toBeVisible",
  "toContainClass",
  "toContainText",
  "toHaveAccessibleDescription",
  "toHaveAccessibleErrorMessage",
  "toHaveAccessibleName",
  "toHaveAttribute",
  "toHaveClass",
  "toHaveCount",
  "toHaveCSS",
  "toHaveId",
  "toHaveJSProperty",
  "toHaveRole",
  "toHaveScreenshot",
  "toHaveText",
  "toHaveTitle",
  "toHaveURL",
  "toHaveValue",
  "toHaveValues",
  "toMatchAriaSnapshot",
  "toPass",
]);

const DIRECT_PAGE_METHODS_FORBIDDEN_IN_SPEC = new Set([
  "locator",
  "getByRole",
  "getByText",
  "getByLabel",
  "getByPlaceholder",
  "getByAltText",
  "getByTitle",
  "getByTestId",
  "frameLocator",
  "goto",
]);

/**
 * Checks whether an expression is an `expect(...)` or `expect.soft(...)` / `expect.poll(...)` call chain.
 */
function isExpectChain(node) {
  let current = node;
  while (current) {
    if (current.type === "CallExpression") {
      const { callee } = current;
      if (callee.type === "Identifier" && callee.name === "expect") {
        return true;
      }
      if (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.object.type === "Identifier" &&
        callee.object.name === "expect" &&
        (callee.property.name === "soft" || callee.property.name === "poll")
      ) {
        return true;
      }
      current = callee;
    } else if (current.type === "MemberExpression") {
      current = current.object;
    } else {
      break;
    }
  }
  return false;
}

/**
 * Checks if a CallExpression is properly awaited or returned.
 */
function isAwaitedOrReturned(node) {
  let current = node;
  while (current && current.parent) {
    const parent = current.parent;
    if (
      parent.type === "AwaitExpression" ||
      parent.type === "ReturnStatement" ||
      parent.type === "YieldExpression"
    ) {
      return true;
    }
    if (parent.type === "ArrowFunctionExpression" && parent.body === current) {
      return true;
    }
    if (
      parent.type === "ArrayExpression" &&
      parent.parent &&
      parent.parent.type === "CallExpression"
    ) {
      // e.g. await Promise.all([expect(...).toBeVisible()])
      return true;
    }
    if (
      parent.type === "ChainExpression" ||
      parent.type === "ParenthesizedExpression" ||
      parent.type === "TSAsExpression" ||
      parent.type === "TSNonNullExpression"
    ) {
      current = parent;
      continue;
    }
    break;
  }
  return false;
}

/**
 * Checks if a raw selector string in `.locator(selector)` is fragile (CSS class, ID, XPath, deep combinator).
 * Allows semantic exceptions such as `datalist#...` or `option` where ARIA roles are not applicable.
 */
function isFragileRawSelector(selector) {
  const trimmed = selector.trim();
  if (!trimmed) return false;

  // XPath selectors
  if (trimmed.startsWith("//") || trimmed.startsWith("..") || /^xpath\s*=/i.test(trimmed)) {
    return true;
  }

  // Pure class or ID selectors (e.g. ".btn", "#submit") or selectors containing CSS class tokens
  if (trimmed.startsWith(".") || trimmed.startsWith("#")) {
    return true;
  }

  // Allow semantic datalist/option selectors inside Page Objects (since HTML <datalist> options lack accessible role queries in Chromium)
  if (/^datalist(#[a-zA-Z0-9_-]+)?(\s+option)?$/.test(trimmed) || trimmed === "option") {
    return false;
  }

  // Flag selectors containing class names like `div.card` or `button.primary`
  if (/\.[a-zA-Z_-][a-zA-Z0-9_-]*/.test(trimmed)) {
    return true;
  }

  return false;
}

export const rules = {
  "no-wait-for-timeout": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow `waitForTimeout()` hardcoded sleeps in Playwright tests and Page Objects.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.type === "MemberExpression" &&
            !node.callee.computed &&
            node.callee.property.name === "waitForTimeout"
          ) {
            context.report({
              node,
              message:
                "Hardcoded sleep `waitForTimeout()` is forbidden by Playwright best practices. Use auto-retrying Web-First Assertions or explicit state waits instead.",
            });
          }
        },
      };
    },
  },

  "no-force-option": {
    meta: {
      type: "problem",
      docs: {
        description: "Disallow `{ force: true }` in Playwright actions.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.type !== "MemberExpression" ||
            node.callee.computed ||
            !ACTION_METHODS.has(node.callee.property.name)
          ) {
            return;
          }

          for (const arg of node.arguments) {
            if (arg.type !== "ObjectExpression") continue;
            for (const prop of arg.properties) {
              if (
                prop.type === "Property" &&
                !prop.computed &&
                ((prop.key.type === "Identifier" && prop.key.name === "force") ||
                  (prop.key.type === "Literal" && prop.key.value === "force")) &&
                prop.value.type === "Literal" &&
                prop.value.value === true
              ) {
                context.report({
                  node: prop,
                  message: `Bypassing actionability checks with \`{ force: true }\` in \`.${node.callee.property.name}()\` is forbidden. Interact with visible, enabled elements as a real user would.`,
                });
              }
            }
          }
        },
      };
    },
  },

  "no-element-handle": {
    meta: {
      type: "problem",
      docs: {
        description: "Disallow legacy ElementHandle APIs ($, $$, $eval, $$eval, elementHandle).",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.type === "MemberExpression" &&
            !node.callee.computed &&
            ELEMENT_HANDLE_METHODS.has(node.callee.property.name)
          ) {
            context.report({
              node,
              message: `Legacy ElementHandle API \`.${node.callee.property.name}()\` is forbidden. Use Playwright Locators (\`getByRole\`, \`getByLabel\`, etc.) instead.`,
            });
          }
        },
      };
    },
  },

  "no-page-pause": {
    meta: {
      type: "problem",
      docs: {
        description: "Disallow `page.pause()` debugging calls.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.type === "MemberExpression" &&
            !node.callee.computed &&
            node.callee.property.name === "pause"
          ) {
            context.report({
              node,
              message: "Debugging call `.pause()` must not be committed.",
            });
          }
        },
      };
    },
  },

  "prefer-web-first-assertions": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Enforce auto-retrying Web-First Assertions instead of manual await inside expect().",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          const isDirectExpect =
            node.callee.type === "Identifier" &&
            node.callee.name === "expect" &&
            node.arguments.length > 0;
          const isSoftExpect =
            node.callee.type === "MemberExpression" &&
            !node.callee.computed &&
            node.callee.object.type === "Identifier" &&
            node.callee.object.name === "expect" &&
            node.callee.property.name === "soft" &&
            node.arguments.length > 0;

          if (!isDirectExpect && !isSoftExpect) {
            return;
          }

          const firstArg = node.arguments[0];
          if (!firstArg) return;

          if (
            firstArg.type === "AwaitExpression" &&
            firstArg.argument.type === "CallExpression" &&
            firstArg.argument.callee.type === "MemberExpression" &&
            !firstArg.argument.callee.computed
          ) {
            const methodName = firstArg.argument.callee.property.name;
            const replacement = MANUAL_STATE_METHODS_TO_WEB_FIRST.get(methodName);
            if (replacement) {
              context.report({
                node: firstArg,
                message: `Do not manually \`await .${methodName}()\` inside \`expect()\`. Use Playwright's auto-retrying Web-First Assertion \`await expect(locator).${replacement}\` instead.`,
              });
            }
          }

          if (
            firstArg.type === "CallExpression" &&
            firstArg.callee.type === "MemberExpression" &&
            !firstArg.callee.computed &&
            firstArg.callee.property.name === "url"
          ) {
            context.report({
              node: firstArg,
              message:
                "Do not pass `page.url()` to `expect()`. Use Playwright's Web-First Assertion `await expect(page).toHaveURL(...)` instead.",
            });
          }
        },
      };
    },
  },

  "missing-playwright-await": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Require `await` (or `return`) before async Playwright `expect(...)` matchers.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type !== "MemberExpression" || node.callee.computed) {
            return;
          }
          const matcherName = node.callee.property.name;
          if (!ASYNC_PLAYWRIGHT_MATCHERS.has(matcherName)) {
            return;
          }
          if (!isExpectChain(node.callee.object)) {
            return;
          }
          if (!isAwaitedOrReturned(node)) {
            context.report({
              node,
              message: `Async Playwright assertion \`.${matcherName}()\` must be awaited or returned.`,
            });
          }
        },
      };
    },
  },

  "no-direct-locators-in-spec": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow calling `page.locator()`, `page.getBy*()`, or `page.goto()` directly inside `.spec.ts` files (enforce POM).",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type !== "MemberExpression" || node.callee.computed) {
            return;
          }
          const methodName = node.callee.property.name;
          if (!DIRECT_PAGE_METHODS_FORBIDDEN_IN_SPEC.has(methodName)) {
            return;
          }
          if (
            methodName === "goto" &&
            !(node.callee.object.type === "Identifier" && node.callee.object.name === "page")
          ) {
            return;
          }
          context.report({
            node,
            message: `Direct call to \`.${methodName}()\` is forbidden in \`.spec.ts\` files. Encapsulate locators and navigation in a Page Object class under \`e2e/pages/\`.`,
          });
        },
      };
    },
  },

  "require-custom-fixture-import": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Require `.spec.ts` files to import `{ test, expect }` from `./fixtures/test` instead of `@playwright/test`.",
      },
    },
    create(context) {
      return {
        ImportDeclaration(node) {
          if (node.source.value !== "@playwright/test") {
            return;
          }
          if (node.importKind === "type") {
            return;
          }
          const hasValueSpecifier = node.specifiers.some((spec) => spec.importKind !== "type");
          if (hasValueSpecifier) {
            context.report({
              node,
              message:
                "In `.spec.ts` files, import `{ test, expect }` from `./fixtures/test` (custom POM fixtures) instead of `@playwright/test`.",
            });
          }
        },
      };
    },
  },

  "no-assertions-in-pom": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow `expect()` assertions inside Page Object classes (`e2e/pages/`). Keep assertions in `.spec.ts` files.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          const isDirectExpect = node.callee.type === "Identifier" && node.callee.name === "expect";
          const isMemberExpect =
            node.callee.type === "MemberExpression" &&
            !node.callee.computed &&
            node.callee.object.type === "Identifier" &&
            node.callee.object.name === "expect";

          if (isDirectExpect || isMemberExpect) {
            context.report({
              node,
              message:
                "Assertions (`expect()`) are forbidden inside Page Object classes (`e2e/pages/`). Expose locators or state getters and place assertions in `.spec.ts` files.",
            });
          }
        },
      };
    },
  },

  "prefer-user-facing-locators": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Disallow fragile CSS class/ID/XPath selectors in `.locator()` calls inside Page Objects.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (
            node.callee.type !== "MemberExpression" ||
            node.callee.computed ||
            node.callee.property.name !== "locator" ||
            node.arguments.length === 0
          ) {
            return;
          }
          const firstArg = node.arguments[0];
          if (firstArg && firstArg.type === "Literal" && typeof firstArg.value === "string") {
            if (isFragileRawSelector(firstArg.value)) {
              context.report({
                node: firstArg,
                message: `Fragile selector "${firstArg.value}" in \`.locator()\` is forbidden. Use user-facing locators (\`getByRole\`, \`getByLabel\`, \`getByPlaceholder\`, \`getByText\`) instead.`,
              });
            }
          }
        },
      };
    },
  },
};

export default {
  meta: {
    name: "playwright-best-practices",
  },
  rules,
};
