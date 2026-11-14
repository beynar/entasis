#!/bin/sh
# Runs a test command in one of a few machine-wide slots, so parallel checkouts and agents never
# start more than ENTASIS_TEST_SLOTS (default 2) browser-heavy runs at once. Used by `test:unit`
# and `test:e2e`:
#
#   sh scripts/test-slot.sh vitest --run
#
# A slot is a directory made with `mkdir` (atomic) holding its owner's pid; a slot whose owner is
# gone is reclaimed. Waiting runs poll every 2 s. No effect in CI, with ENTASIS_TEST_SLOT=off, or
# when an outer command already holds a slot (`npm test` runs both suites in one slot each).
#   ENTASIS_TEST_SLOTS     how many runs may hold a slot (default 2)
#   ENTASIS_TEST_SLOT_DIR  where slots live (default $TMPDIR/entasis-test-slots)
set -u

if [ "$#" -eq 0 ]; then
	echo "usage: sh scripts/test-slot.sh <command> [args...]" >&2
	exit 64
fi

if [ -n "${CI:-}" ] || [ "${ENTASIS_TEST_SLOT:-}" = "off" ] || [ -n "${ENTASIS_TEST_SLOT_HELD:-}" ]; then
	exec "$@"
fi

slots="${ENTASIS_TEST_SLOTS:-2}"
base="${ENTASIS_TEST_SLOT_DIR:-${TMPDIR:-/tmp}/entasis-test-slots}"
base="${base%/}"
mkdir -p "$base" || exit 1

held=""
release() {
	if [ -n "$held" ]; then
		rm -rf "$held"
		held=""
	fi
}

# A slot is stale when its owner pid is dead, or when it has had no owner file for a whole poll
# (the owner died between `mkdir` and writing it).
reclaim() {
	slot="$1"
	owner="$(cat "$slot/owner" 2>/dev/null || true)"
	if [ -z "$owner" ]; then
		if [ -e "$slot/.seen-empty" ]; then
			rm -rf "$slot"
		else
			: >"$slot/.seen-empty" 2>/dev/null || true
		fi
	elif ! kill -0 "$owner" 2>/dev/null; then
		# Rename first: of two runs reclaiming the same slot, one wins the rename.
		if mv "$slot" "$slot.stale.$$" 2>/dev/null; then
			rm -rf "$slot.stale.$$"
			echo "test-slot: reclaimed $(basename "$slot") from exited pid $owner" >&2
		fi
	fi
}

waiting=0
while [ -z "$held" ]; do
	i=1
	while [ "$i" -le "$slots" ]; do
		slot="$base/slot-$i"
		if mkdir "$slot" 2>/dev/null || { reclaim "$slot" && mkdir "$slot" 2>/dev/null; }; then
			echo "$$" >"$slot/owner"
			held="$slot"
			break
		fi
		i=$((i + 1))
	done
	if [ -z "$held" ]; then
		if [ "$waiting" -eq 0 ]; then
			owners="$(cat "$base"/slot-*/owner 2>/dev/null | tr '\n' ' ')"
			echo "test-slot: all $slots test slots busy (pids: ${owners:-?}); waiting. ENTASIS_TEST_SLOT=off skips the queue." >&2
			waiting=1
		fi
		sleep 2
	fi
done

trap 'release' EXIT
trap 'release; exit 130' INT
trap 'release; exit 143' TERM
trap 'release; exit 129' HUP

ENTASIS_TEST_SLOT_HELD="$held" "$@"
status=$?
release
exit "$status"
