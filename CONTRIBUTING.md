# 贡献指南

## 本地开发

```bash
npm install
npm run dev
```

## 质量检查

```bash
npm run lint
npm run build
npm run format:check
```

## 提交流程

- `husky` 会在每次提交时执行 `lint-staged`。
- 已暂存的 `ts/vue/js/cjs` 文件会被 ESLint 自动修复。
- 提交信息会由 `commitlint` 校验（Conventional Commits 规范）。
- 推荐使用交互式提交助手：

```bash
npm run commit
```

## Changeset 流程

当一次 Pull Request 涉及行为变更或用户可感知输出时，请新增 changeset：

```bash
npm run changeset
```

将生成的 `.changeset/*.md` 文件和代码改动一起提交。
