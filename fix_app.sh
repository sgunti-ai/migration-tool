#!/bin/bash
# Adding some dark mode transition settings to body in index.css as well to make it smooth globally
echo -e "\nbody {\n  @apply transition-colors duration-200;\n}" >> src/index.css
