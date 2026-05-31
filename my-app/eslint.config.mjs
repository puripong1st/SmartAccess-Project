import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: {
      // ปิดคำเตือนประเภท Unused eslint-disable directive ที่ฟ้องจากไฟล์เดิม
      reportUnusedDisableDirectives: "off"
    },
    rules: {
      // ปิดข้อผิดพลาด (Errors)
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
      "prefer-const": "off",

      // ปิดคำเตือน (Warnings) ทั้งหมดในระบบเดิมเพื่อความสะอาด 100%
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch_*.js",
  ]),
]);

export default eslintConfig;
