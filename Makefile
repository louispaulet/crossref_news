ROOT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
FRONTEND_DIR := $(ROOT_DIR)crossref_news_frontend
WORKER_DIR := $(ROOT_DIR)backend/crossref-worker
STATE_DIR := $(ROOT_DIR).make
FRONTEND_PID := $(STATE_DIR)/frontend.pid
BACKEND_PID := $(STATE_DIR)/backend.pid
FRONTEND_LOG := $(STATE_DIR)/frontend.log
BACKEND_LOG := $(STATE_DIR)/backend.log

VITE_BASE_PATH ?= /
VITE_API_BASE_URL ?=

.PHONY: up kill deploy

up:
	@mkdir -p "$(STATE_DIR)"
	@sh -c 'set -e; \
		npm --prefix "$(FRONTEND_DIR)" run dev:host >"$(FRONTEND_LOG)" 2>&1 & \
		FRONTEND_PID=$$!; \
		cd "$(WORKER_DIR)" && npx --yes wrangler dev --port 8787 >"$(BACKEND_LOG)" 2>&1 & \
		BACKEND_PID=$$!; \
		printf "%s\n" "$$FRONTEND_PID" >"$(FRONTEND_PID)"; \
		printf "%s\n" "$$BACKEND_PID" >"$(BACKEND_PID)"; \
		echo "Frontend running at http://127.0.0.1:5173"; \
		echo "Backend running at http://127.0.0.1:8787"; \
		echo "Logs: $(FRONTEND_LOG) and $(BACKEND_LOG)"; \
		trap '\''kill $$FRONTEND_PID $$BACKEND_PID 2>/dev/null || true'\'' INT TERM EXIT; \
		set +e; \
		wait $$FRONTEND_PID $$BACKEND_PID; \
		status=$$?; \
		case $$status in \
			130|143) exit 0 ;; \
			*) exit $$status ;; \
		esac'

kill:
	@sh -c 'set -e; \
		for pidfile in "$(FRONTEND_PID)" "$(BACKEND_PID)"; do \
			if [ -f "$$pidfile" ]; then \
				pid=$$(cat "$$pidfile"); \
				kill "$$pid" 2>/dev/null || true; \
				rm -f "$$pidfile"; \
			fi; \
		done; \
		echo "Stopped frontend and backend processes if they were running."'

deploy:
	@test -n "$(VITE_API_BASE_URL)" || (echo "Set VITE_API_BASE_URL to the deployed Worker URL before running make deploy." && exit 1)
	@VITE_BASE_PATH="$(VITE_BASE_PATH)" VITE_API_BASE_URL="$(VITE_API_BASE_URL)" npm --prefix "$(FRONTEND_DIR)" run build
	@npm --prefix "$(FRONTEND_DIR)" run deploy
	@cd "$(WORKER_DIR)" && npx --yes wrangler deploy
