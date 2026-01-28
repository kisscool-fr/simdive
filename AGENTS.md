## Instructions

### Environment

- `justfile` contains recipes for achieving a few different tasks within this project.
- The project runs on node
  - Node version is defined in .nvmrc
  - You should never call node command (like `npm`, etc ...) directly, as node is not system installed
  - You should always call `node` command through docker. To achieve this:
    - `just run`: start docker container
    - `just shell`: start an interactive shell into docker container
    - Then you can call regular `node` or `npm` command

### Commit

- Use conventional commits to commit anything within project.

### Validation

To validate changes, always run:
1. `just run`
  - Start docker container
2. `just shell`
  - Log into an interative shell into docker container
3. `npm run lint`
  - Run linter
    - If errors occurs, run `npm run lint:fix` for automatic fix
4. `npm run format:check`
  - Run format checker
    - If errors occurs, run `npm run format` for automatic formater
5. `npm run test:run`
  - Run unit test without watch mode

