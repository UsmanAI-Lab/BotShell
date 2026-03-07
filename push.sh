#!/bin/bash
cd /home/openclaw/.openclaw/workspace/BotShell
git init
git config user.name "Marvin"
git config user.email "marvinbotai0@gmail.com"
git remote add origin https://x-access-token:${GITHUB_PAT}@github.com/UsmanAI-Lab/BotShell.git 2>/dev/null || git remote set-url origin https://x-access-token:${GITHUB_PAT}@github.com/UsmanAI-Lab/BotShell.git
git add -A
git status
git commit -m "Initial BotShell template - personality-agnostic bot scaffolding"
git branch -M main
git push -u origin main --force
