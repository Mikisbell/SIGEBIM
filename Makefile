# =============================================================================
# SIGEBIM Makefile - Unified Development Commands
# =============================================================================
# Usage:
#   make dev      - Start development environment
#   make stop     - Stop all services
#   make restart  - Rebuild and restart
#   make logs     - View all logs
#   make clean    - Clean all containers and volumes
# =============================================================================

.PHONY: dev stop restart logs clean build shell-frontend shell-backend db-push

# Default target
.DEFAULT_GOAL := dev

# ---------------------------------------------------------------------------
# Development Commands
# ---------------------------------------------------------------------------

## Start development environment 🚀
dev:
	@echo "🚀 Starting SIGEBIM development environment..."
	docker compose up

## Start in background (detached)
dev-bg:
	@echo "🚀 Starting SIGEBIM in background..."
	docker compose up -d
	@echo "✅ Services running. Use 'make logs' to view output."

## Stop all services
stop:
	@echo "🛑 Stopping SIGEBIM..."
	docker compose down

## Rebuild and restart
restart:
	@echo "🔄 Rebuilding and restarting..."
	docker compose down
	docker compose up --build

## View logs
logs:
	docker compose logs -f

## View frontend logs only
logs-frontend:
	docker compose logs -f frontend

## View backend logs only
logs-backend:
	docker compose logs -f backend

# ---------------------------------------------------------------------------
# Build Commands
# ---------------------------------------------------------------------------

## Build all images
build:
	docker compose build

## Build with no cache
build-fresh:
	docker compose build --no-cache

# ---------------------------------------------------------------------------
# Shell Access
# ---------------------------------------------------------------------------

## Open shell in frontend container
shell-frontend:
	docker compose exec frontend sh

## Open shell in backend container
shell-backend:
	docker compose exec backend bash

# ---------------------------------------------------------------------------
# Database Commands
# ---------------------------------------------------------------------------

## Push migrations to Supabase Cloud
db-push:
	@echo "📤 Pushing migrations to Supabase..."
	cd supabase && npx supabase db push

## Generate new migration
db-migration:
	@read -p "Migration name: " name; \
	cd supabase && npx supabase migration new $$name

# ---------------------------------------------------------------------------
# Cleanup Commands
# ---------------------------------------------------------------------------

## Clean everything
clean:
	@echo "🧹 Cleaning up..."
	docker compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete."

## Remove node_modules and rebuild
clean-frontend:
	rm -rf frontend/node_modules frontend/.next
	docker compose build frontend

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

## Show this help
help:
	@echo "SIGEBIM Development Commands:"
	@echo ""
	@grep -E '^##' Makefile | sed 's/## /  /'
	@echo ""
	@echo "Usage: make <target>"
