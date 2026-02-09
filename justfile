set quiet
set windows-shell := ["cmd.exe", "/c"]

# Justfile for simdive Docker management
export NODE_VERSION := if os() == "windows" { `type .nvmrc` } else { `cat .nvmrc` }
DOCKER_EXEC := "docker exec"
DOCKER_COMPOSE := "docker compose"
APP_NAME := "simdive"

# Default recipe: show available commands
default:
    @just --list

# Pull images
pull:
    {{DOCKER_COMPOSE}} pull --ignore-buildable

# Start the Docker container in detached mode
run:
    {{DOCKER_COMPOSE}} up -d {{APP_NAME}}

# Start the Docker container with logs attached
run-attached:
    {{DOCKER_COMPOSE}} up {{APP_NAME}}

# Stop the Docker container
stop:
    {{DOCKER_COMPOSE}} down {{APP_NAME}}

# Restart the Docker container
restart:
    {{DOCKER_COMPOSE}} restart {{APP_NAME}}

# Show container logs
logs:
    {{DOCKER_COMPOSE}} logs -f {{APP_NAME}}

# Open a shell in the running container
shell:
    {{DOCKER_EXEC}} -it {{APP_NAME}} sh

# Check container status
status:
    {{DOCKER_COMPOSE}} ps {{APP_NAME}}
