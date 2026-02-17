import i18next from "eslint-plugin-i18next";
import tsParser from "@typescript-eslint/parser";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      i18next,
    },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          markupOnly: true,
          ignoreAttribute: [
            "class",
            "style",
            "type",
            "id",
            "name",
            "key",
            "data-*",
            "aria-*",
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    plugins: {
      svelte: sveltePlugin,
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "SvelteElement SvelteText[value=/[A-Za-z]{2,}/]",
          message:
            "Hardcoded template text is not allowed. Use i18n translation keys.",
        },
        {
          selector:
            "SvelteElement > SvelteStartTag > SvelteAttribute[key.name=/^(placeholder|alt|aria-label|value|title)$/][value.length=1] > SvelteLiteral[value=/\\S/]",
          message:
            "Hardcoded attribute text is not allowed. Use i18n translation keys.",
        },
      ],
    },
  },
];
