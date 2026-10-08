#!/bin/bash
sed -i 's/import { Moon, Sun, Search, /import { /' src/components/dashboard/MigrationToolDashboard.tsx
sed -i 's/import {/import { Moon, Sun, /' src/components/dashboard/MigrationToolDashboard.tsx
