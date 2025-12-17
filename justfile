# Justfile for simdive Docker management

# Default recipe: show available commands
default:
    @just --list

# Build the Docker container
build:
    docker compose build

# Start the Docker container in detached mode
run:
    docker compose up -d

# Start the Docker container with logs attached
run-attached:
    docker compose up

# Stop the Docker container
stop:
    docker compose down

# Restart the Docker container
restart:
    docker compose restart

# Show container logs
logs:
    docker compose logs -f simdive

# Open a shell in the running container
shell:
    docker exec -it simdive sh

# Check container status
status:
    docker compose ps

