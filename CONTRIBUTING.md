# Contributing

Thank you for improving Freiburg–Konstanz. Contributions should keep the game deterministic,
accessible, responsive, and easy to verify.

## Development setup

Use Node.js 24 and install exactly the dependency versions in the lockfile:

```bash
npm ci
npm run dev
```

Do not commit generated output, dependency directories, local environment files, or credentials.

## Working agreement

1. Create a focused branch from the current default branch.
2. Keep gameplay rules in pure domain code and browser behavior behind adapters.
3. Add or update automated coverage for every behavior change and bug fix.
4. Preserve keyboard and touch parity, visible focus, reduced-motion behavior, and usable layouts at
   supported viewport sizes.
5. Avoid refresh-rate-dependent scoring or timing. Random behavior must be reproducible with an
   injected seed in tests.
6. Document any new asset according to [ASSETS.md](ASSETS.md).
7. Keep commits small and describe the intent, not only the edited files.

Conventional commit prefixes such as `feat:`, `fix:`, `test:`, `docs:`, and `chore:` are encouraged.

## Before opening a pull request

Run the same primary gates as CI:

```bash
npm run check
npm run build
```

Then verify the affected flow manually in at least one desktop and one mobile viewport. Gameplay
changes should also be checked after a tab switch or window blur to confirm that held inputs reset
safely.

## Pull request checklist

- [ ] The change has one clear purpose.
- [ ] Tests cover the relevant success and failure paths.
- [ ] Keyboard and touch behavior remain equivalent.
- [ ] Accessibility and reduced-motion behavior were considered.
- [ ] No secrets, generated output, or unlicensed assets were added.
- [ ] Documentation reflects user-visible or architectural changes.
- [ ] `npm run check` and `npm run build` pass locally.

Security vulnerabilities must follow [SECURITY.md](SECURITY.md) instead of the public issue or
pull-request process.
