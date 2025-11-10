#!/bin/bash
# Git Hooks Manager - Manage custom git hooks

HOOKS_DIR=".git/hooks"

show_status() {
    echo "Git Hooks Status:"
    echo "=================="
    echo ""

    for hook in pre-commit pre-push commit-msg post-commit; do
        if [ -f "$HOOKS_DIR/$hook" ] && [ -x "$HOOKS_DIR/$hook" ]; then
            echo "✓ $hook - ACTIVE"
        else
            echo "✗ $hook - INACTIVE"
        fi
    done

    echo ""
    if [ -f ".git/claude-issue.txt" ]; then
        echo "📋 Claude issue file exists: .git/claude-issue.txt"
        echo "   Use: cat .git/claude-issue.txt"
    fi

    if [ -f ".git/last-commit-stats.txt" ]; then
        echo "📊 Last commit stats: .git/last-commit-stats.txt"
        echo "   Use: cat .git/last-commit-stats.txt"
    fi
    echo ""
}

disable_hook() {
    hook=$1
    if [ -f "$HOOKS_DIR/$hook" ]; then
        mv "$HOOKS_DIR/$hook" "$HOOKS_DIR/$hook.disabled"
        echo "Disabled $hook hook"
    else
        echo "Hook $hook not found"
    fi
}

enable_hook() {
    hook=$1
    if [ -f "$HOOKS_DIR/$hook.disabled" ]; then
        mv "$HOOKS_DIR/$hook.disabled" "$HOOKS_DIR/$hook"
        chmod +x "$HOOKS_DIR/$hook"
        echo "Enabled $hook hook"
    else
        echo "Hook $hook.disabled not found"
    fi
}

disable_all() {
    for hook in pre-commit pre-push commit-msg post-commit; do
        disable_hook $hook
    done
    echo "All hooks disabled"
}

enable_all() {
    for hook in pre-commit pre-push commit-msg post-commit; do
        if [ -f "$HOOKS_DIR/$hook.disabled" ]; then
            enable_hook $hook
        fi
    done
    echo "All hooks enabled"
}

test_hooks() {
    echo "Testing git hooks..."
    echo ""

    # Test pre-commit
    if [ -f "$HOOKS_DIR/pre-commit" ] && [ -x "$HOOKS_DIR/pre-commit" ]; then
        echo "Testing pre-commit hook..."
        bash "$HOOKS_DIR/pre-commit" && echo "✓ pre-commit works" || echo "✗ pre-commit failed"
        echo ""
    fi

    # Test commit-msg
    if [ -f "$HOOKS_DIR/commit-msg" ] && [ -x "$HOOKS_DIR/commit-msg" ]; then
        echo "Testing commit-msg hook..."
        echo "test: sample commit message" > /tmp/test-commit-msg
        bash "$HOOKS_DIR/commit-msg" /tmp/test-commit-msg && echo "✓ commit-msg works" || echo "✗ commit-msg failed"
        rm /tmp/test-commit-msg
        echo ""
    fi

    echo "Hook testing complete!"
}

case "$1" in
    status)
        show_status
        ;;
    disable)
        if [ -z "$2" ]; then
            disable_all
        else
            disable_hook "$2"
        fi
        ;;
    enable)
        if [ -z "$2" ]; then
            enable_all
        else
            enable_hook "$2"
        fi
        ;;
    test)
        test_hooks
        ;;
    *)
        echo "Git Hooks Manager"
        echo ""
        echo "Usage:"
        echo "  $0 status              - Show hooks status"
        echo "  $0 enable [hook]       - Enable hook(s)"
        echo "  $0 disable [hook]      - Disable hook(s)"
        echo "  $0 test                - Test hooks"
        echo ""
        echo "Available hooks:"
        echo "  pre-commit    - Checks before committing"
        echo "  pre-push      - Checks before pushing"
        echo "  commit-msg    - Validates commit messages"
        echo "  post-commit   - Analyzes commits after they're made"
        echo ""
        echo "Examples:"
        echo "  $0 status"
        echo "  $0 disable pre-commit"
        echo "  $0 enable"
        echo ""
        ;;
esac
