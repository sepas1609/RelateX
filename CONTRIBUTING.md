# Contributing to RelateX

Thank you for your interest in contributing to **RelateX**! We welcome contributions from the community to make database modeling and schema optimization better for everyone.

---

## Code of Conduct

Please be respectful, constructive, and welcoming in all interactions within this project.

---

## How Can I Contribute?

### Reporting Bugs
1. Check the [Issues tab](https://github.com/sepas1609/RelateX/issues) to ensure the bug hasn't already been reported.
2. Open a new issue using our **Bug Report Template**.
3. Include clear steps to reproduce, sample DDL SQL snippets, and screenshots if applicable.

### Suggesting Enhancements
1. Open a new issue using the **Feature Request Template**.
2. Clearly explain the rationale, target SQL dialects, and UI/UX expectations.

### Submitting Pull Requests
1. **Fork the repository** and clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/RelateX.git
   cd RelateX
   ```
2. **Create a topic branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Make your changes** and verify type safety:
   ```bash
   npm run lint
   npm run build
   ```
5. **Commit your changes** using conventional commit messages:
   ```bash
   git commit -m "feat(canvas): add interactive auto-layout grouping"
   ```
6. **Push to your fork** and submit a Pull Request targeting `main`.

---

## Development Guidelines

- **TypeScript**: Strict type checking is enabled. Avoid `any` types wherever possible.
- **Styling**: Use Tailwind CSS utilities with dark-mode aesthetic consistency.
- **Deterministic Fallbacks**: All Gemini AI endpoints should maintain deterministic fallback heuristics so the application works smoothly offline or without API keys.
- **Code Quality**: Ensure `npm run lint` and `npm run build` pass before submitting PRs.

---

## Commit Message Convention

We follow conventional commits:
- `feat:` A new user-facing feature
- `fix:` A bug fix
- `docs:` Documentation improvements
- `style:` Formatting, missing semicolons, etc.
- `refactor:` Code refactoring without behavioral changes
- `perf:` Performance optimizations
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates

---

## License

By contributing to RelateX, you agree that your contributions will be licensed under the [MIT License](LICENSE).
