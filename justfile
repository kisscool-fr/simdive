set quiet
set windows-shell := ["cmd.exe", "/c"]

# Justfile for simdive Docker management
export NODE_VERSION := if os() == "windows" { `type .nvmrc` } else { `cat .nvmrc` }
DOCKER_EXEC := "docker exec"
DOCKER_COMPOSE := "docker compose"
APP_NAME := "simdive"

[doc("Show available commands")]
default:
    @just --list

[doc("Pull docker images")]
pull:
    {{DOCKER_COMPOSE}} pull --ignore-buildable

[doc("Start the docker container in detached mode")]
run:
    {{DOCKER_COMPOSE}} up -d {{APP_NAME}}

[doc("Start the docker container with logs attached")]
run-attached:
    {{DOCKER_COMPOSE}} up {{APP_NAME}}

[doc("Stop the docker container")]
stop:
    {{DOCKER_COMPOSE}} down {{APP_NAME}}

[doc("Restart the docker container")]
restart:
    {{DOCKER_COMPOSE}} restart {{APP_NAME}}

[doc("Show container logs")]
logs:
    {{DOCKER_COMPOSE}} logs -f {{APP_NAME}}

[doc("Open a shell in the running container")]
shell:
    {{DOCKER_EXEC}} -it {{APP_NAME}} sh

[doc("Check container status")]
status:
    {{DOCKER_COMPOSE}} ps {{APP_NAME}}

[doc("Run an arbitrary command in the container")]
exec +ARGS:
    {{DOCKER_EXEC}} {{APP_NAME}} {{ARGS}}

[doc("Run linter (`just lint fix` for automatic fix)")]
lint *ACTION:
    {{DOCKER_EXEC}} {{APP_NAME}} npm run {{ if ACTION == "fix" { "lint:fix" } else { "lint" } }}

[doc("Run formatter (`just format check` to check only)")]
format *ACTION:
    {{DOCKER_EXEC}} {{APP_NAME}} npm run {{ if ACTION == "check" { "format:check" } else { "format" } }}

alias tests := test
[doc("Run unit tests without watch mode")]
test:
    {{DOCKER_EXEC}} {{APP_NAME}} npm run test:run

[doc("Run syntax check: lint and format check")]
check: run lint (format "check")

[doc("Run full validation: lint, format check, and tests")]
ci: run lint (format "check") test
