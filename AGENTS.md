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

To validate changes, run `just ci`. This will, in order:
1. Start the docker container
2. Run linter
3. Run format checker
4. Run unit tests

If errors occur, use `just lint fix` or `just format` to auto-fix.

> For arbitrary commands inside the container, use `just exec <command>` (e.g. `just exec npm install`).

