import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "public/**",
      "scripts/**",
      ".claude/**",
      ".next/**",
      "node_modules/**",
    ],
  },
];

export default eslintConfig;
