## Contributing Guide

Thank you for contributing to SWEmaxx!

This document outlines the workflow, commit guidelines, and PR expectations.

## Branching Strategy

Use the following branch types:

main — Production-ready code only

dev — Integration branch for all features

feature/<name> — Individual features

fix/<name> — Bug fixes

experiment/<name> — Throwaway testing


### Examples
feature/interview-flow
feature/profile-page
fix/navbar-overflow

## Commit Messages (Conventional Commits)

Follow the conventional commit format:
feat: add interview scoring UI
fix: correct auth redirect bug
chore: update dependencies
refactor: reorganize utils folder
docs: update roadmap

Prefixes:
- feat
- fix
- refactor
- chore
- docs
- test
- perf

### Pull Request Requirements

Every PR must include:

Clear title following Conventional Commits

Brief summary of the change

Screenshot or GIF for UI changes

Preview link from Vercel

Must pass:

- Lint

- Type check

- Build

- Deploy preview

- PRs into main require all checks to pass.